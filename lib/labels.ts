import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";

export interface LabelIds {
  toRespond: string;
  fyi: string;
  newsletter: string;
  noise: string;
}

export const LABEL_NAMES = {
  toRespond: "AI Inbox/✍️ Draft Ready",
  fyi: "AI Inbox/📬 FYI",
  newsletter: "AI Inbox/📢 Marketing",
  noise: "AI Inbox/🤖 Bot Mail",
} as const;

const LABEL_COLORS: Record<
  keyof typeof LABEL_NAMES,
  { backgroundColor: string; textColor: string }
> = {
  toRespond: { backgroundColor: "#4a86e8", textColor: "#ffffff" }, // blue — action needed
  fyi: { backgroundColor: "#16a765", textColor: "#ffffff" },       // green — informational
  newsletter: { backgroundColor: "#ffad47", textColor: "#000000" }, // amber — marketing
  noise: { backgroundColor: "#999999", textColor: "#ffffff" },     // gray — ignore
};

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
 * Ensures all 4 AI Inbox labels exist in Gmail.
 * Creates them on first run with distinct emoji names and colors.
 * Idempotent — safe to call on every scan.
 */
export async function ensureLabelsExist(): Promise<LabelIds> {
  const gmail = getGmailClient();
  const res = await gmail.users.labels.list({ userId: "me" });
  const existing = res.data.labels ?? [];

  const labelIds: Partial<LabelIds> = {};

  for (const key of Object.keys(LABEL_NAMES) as Array<keyof typeof LABEL_NAMES>) {
    const name = LABEL_NAMES[key];
    const found = existing.find((l) => l.name === name);

    if (found?.id) {
      labelIds[key] = found.id;
    } else {
      const created = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
          color: LABEL_COLORS[key],
        },
      });
      labelIds[key] = created.data.id!;
    }
  }

  return labelIds as LabelIds;
}
