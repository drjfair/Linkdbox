import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

export interface EmailMessage {
  messageId: string; // The RFC 2822 Message-ID header (for threading)
  gmailId: string;   // Gmail's internal message ID
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string; // plain text, decoded
}

export interface EmailThread {
  threadId: string;
  subject: string;
  messages: EmailMessage[];
}

export interface EmailSummary {
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

let _gmail: gmail_v1.Gmail | null = null;

function getGmailClient(): gmail_v1.Gmail {
  if (!_gmail) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    _gmail = google.gmail({ version: "v1", auth });
  }
  return _gmail;
}

/**
 * Returns thread IDs for emails in the inbox that don't have any of our AI labels.
 */
export async function getUnprocessedThreadIds(labelIds: {
  toRespond: string;
  fyi: string;
  newsletter: string;
  noise: string;
}): Promise<string[]> {
  const gmail = getGmailClient();
  const query = [
    "in:inbox",
    `-label:"AI Inbox/✍️ Draft Ready"`,
    `-label:"AI Inbox/📬 FYI"`,
    `-label:"AI Inbox/📢 Marketing"`,
    `-label:"AI Inbox/🤖 Bot Mail"`,
  ].join(" ");

  const threadIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const res = await gmail.users.threads.list({
      userId: "me",
      q: query,
      maxResults: 50,
      pageToken,
    });

    const threads = res.data.threads ?? [];
    threadIds.push(...threads.map((t) => t.id!).filter(Boolean));
    pageToken = res.data.nextPageToken ?? undefined;

    // Cap at 50 threads per scan run to stay within timeouts
    if (threadIds.length >= 50) break;
  } while (pageToken);

  return threadIds.slice(0, 50);
}

/**
 * Fetches all messages in a thread, sorted oldest-first.
 * Extracts plain text body, decoding from base64url.
 */
export async function getFullThread(threadId: string): Promise<EmailThread> {
  const gmail = getGmailClient();
  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = (res.data.messages ?? []).map((msg) =>
    parseMessage(msg)
  );

  // Sort oldest-first
  messages.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const subject =
    messages[0]?.subject ?? "(no subject)";

  return { threadId, subject, messages };
}

/**
 * Applies a label to a thread.
 */
export async function applyLabel(
  threadId: string,
  labelId: string
): Promise<void> {
  const gmail = getGmailClient();
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { addLabelIds: [labelId] },
  });
}

/**
 * Creates a Gmail draft as a reply to the last message in a thread.
 * Sets proper In-Reply-To / References headers so it threads correctly.
 */
export async function createDraft(
  thread: EmailThread,
  replyBody: string
): Promise<void> {
  const gmail = getGmailClient();
  const lastMessage = thread.messages[thread.messages.length - 1];

  // Build reply headers
  const subject = thread.subject.startsWith("Re:")
    ? thread.subject
    : `Re: ${thread.subject}`;

  // Collect all Message-IDs for References header
  const allMessageIds = thread.messages
    .map((m) => m.messageId)
    .filter(Boolean)
    .join(" ");

  const rawHeaders = [
    `To: ${lastMessage.from}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${lastMessage.messageId}`,
    `References: ${allMessageIds}`,
    `Content-Type: text/plain; charset=utf-8`,
    "",
    replyBody,
  ].join("\r\n");

  const encoded = Buffer.from(rawHeaders)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw: encoded,
        threadId: thread.threadId,
      },
    },
  });
}

/**
 * Lists threads with a given label, returning lightweight summaries for the dashboard.
 */
export async function listLabeledThreads(
  labelId: string,
  maxResults = 20
): Promise<EmailSummary[]> {
  const gmail = getGmailClient();

  const res = await gmail.users.threads.list({
    userId: "me",
    labelIds: [labelId],
    maxResults,
  });

  const threads = res.data.threads ?? [];
  if (threads.length === 0) return [];

  // Fetch metadata for each thread in parallel
  const summaries = await Promise.all(
    threads.map(async (t) => {
      try {
        const threadRes = await gmail.users.threads.get({
          userId: "me",
          id: t.id!,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });
        const firstMsg = threadRes.data.messages?.[0];
        const headers = firstMsg?.payload?.headers ?? [];
        const get = (name: string) =>
          headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value ?? "";

        return {
          threadId: t.id!,
          subject: get("Subject") || "(no subject)",
          from: get("From"),
          date: get("Date"),
          snippet: firstMsg?.snippet ?? "",
        } satisfies EmailSummary;
      } catch {
        return null;
      }
    })
  );

  return summaries.filter((s): s is EmailSummary => s !== null);
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function parseMessage(msg: gmail_v1.Schema$Message): EmailMessage {
  const headers = msg.payload?.headers ?? [];
  const get = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? "";

  return {
    messageId: get("Message-ID"),
    gmailId: msg.id ?? "",
    from: get("From"),
    to: get("To"),
    subject: get("Subject"),
    date: get("Date"),
    body: extractPlainText(msg.payload),
  };
}

function extractPlainText(
  payload: gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) return "";

  // Direct body (no parts)
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  // HTML fallback if no plain text at this level
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    return stripHtml(html);
  }

  // Recurse into parts — prefer text/plain over text/html
  const parts = payload.parts ?? [];
  const plainPart = parts.find((p) => p.mimeType === "text/plain");
  if (plainPart) return extractPlainText(plainPart);

  const htmlPart = parts.find((p) => p.mimeType === "text/html");
  if (htmlPart) return extractPlainText(htmlPart);

  // Recurse into multipart containers
  for (const part of parts) {
    if (part.mimeType?.startsWith("multipart/")) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}
