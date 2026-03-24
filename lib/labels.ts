import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import type { Account } from "./accounts";

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
  toRespond: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
  fyi: { backgroundColor: "#16a765", textColor: "#ffffff" },
  newsletter: { backgroundColor: "#ffad47", textColor: "#000000" },
  noise: { backgroundColor: "#999999", textColor: "#ffffff" },
};

const _clients = new Map<string, gmail_v1.Gmail>();

function getGmailClient(account?: Account): gmail_v1.Gmail {
  const key = account?.id ?? "env-default";
  if (!_clients.has(key)) {
    const auth = new google.auth.OAuth2(
      account?.clientId ?? process.env.GOOGLE_CLIENT_ID,
      account?.clientSecret ?? process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      refresh_token: account?.refreshToken ?? process.env.GOOGLE_REFRESH_TOKEN,
    });
    _clients.set(key, google.gmail({ version: "v1", auth }));
  }
  return _clients.get(key)!;
}

export async function ensureLabelsExist(account?: Account): Promise<LabelIds> {
  const gmail = getGmailClient(account);
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
