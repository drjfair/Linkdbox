import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import type { Account } from "./accounts";

export interface EmailMessage {
  messageId: string;
  gmailId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
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
  accountId?: string;
}

// Cache Gmail clients per account
const _clients = new Map<string, gmail_v1.Gmail>();

function getGmailClient(account?: Account): gmail_v1.Gmail {
  const key = account?.id ?? "env-default";

  if (!_clients.has(key)) {
    const clientId = account?.clientId ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret = account?.clientSecret ?? process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = account?.refreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) throw new Error("No refresh token — run the auth script");

    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });
    _clients.set(key, google.gmail({ version: "v1", auth }));
  }

  return _clients.get(key)!;
}

export async function getUnprocessedThreadIds(
  labelIds: { toRespond: string; fyi: string; newsletter: string; noise: string },
  account?: Account
): Promise<string[]> {
  const gmail = getGmailClient(account);
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

    if (threadIds.length >= 50) break;
  } while (pageToken);

  return threadIds.slice(0, 50);
}

export async function getFullThread(
  threadId: string,
  account?: Account
): Promise<EmailThread> {
  const gmail = getGmailClient(account);
  const res = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages = (res.data.messages ?? []).map((msg) => parseMessage(msg));
  messages.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const subject = messages[0]?.subject ?? "(no subject)";
  return { threadId, subject, messages };
}

export async function applyLabel(
  threadId: string,
  labelId: string,
  account?: Account
): Promise<void> {
  const gmail = getGmailClient(account);
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { addLabelIds: [labelId] },
  });
}

export async function createDraft(
  thread: EmailThread,
  replyBody: string,
  account?: Account
): Promise<void> {
  const gmail = getGmailClient(account);
  const lastMessage = thread.messages[thread.messages.length - 1];

  const subject = thread.subject.startsWith("Re:")
    ? thread.subject
    : `Re: ${thread.subject}`;

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
      message: { raw: encoded, threadId: thread.threadId },
    },
  });
}

export async function listLabeledThreads(
  labelId: string,
  account?: Account,
  maxResults = 20
): Promise<EmailSummary[]> {
  const gmail = getGmailClient(account);

  const res = await gmail.users.threads.list({
    userId: "me",
    labelIds: [labelId],
    maxResults,
  });

  const threads = res.data.threads ?? [];
  if (threads.length === 0) return [];

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
          accountId: account?.id ?? "env-default",
        } satisfies EmailSummary;
      } catch {
        return null;
      }
    })
  );

  return summaries.filter((s): s is EmailSummary => s !== null);
}

export async function getAccountEmail(account?: Account): Promise<string> {
  const gmail = getGmailClient(account);
  const res = await gmail.users.getProfile({ userId: "me" });
  return res.data.emailAddress ?? "";
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

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64url").toString("utf-8");
    return stripHtml(html);
  }

  const parts = payload.parts ?? [];
  const plainPart = parts.find((p) => p.mimeType === "text/plain");
  if (plainPart) return extractPlainText(plainPart);

  const htmlPart = parts.find((p) => p.mimeType === "text/html");
  if (htmlPart) return extractPlainText(htmlPart);

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
