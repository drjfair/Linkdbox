import { generateText, Output } from "ai";
import { z } from "zod";
import type { EmailThread } from "@/lib/gmail";

const ClassificationSchema = z.object({
  label: z.enum(["TO_RESPOND", "FYI", "NEWSLETTER", "NOISE"]),
  reasoning: z.string().describe("One sentence explaining the classification"),
  confidence: z.number().min(0).max(1),
});

export type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM_PROMPT = `You are an email classifier for a personal inbox.
Classify each email thread into exactly one category:

TO_RESPOND: The sender is a real person (not automated) who is asking a question,
requesting action, or expecting a reply. Includes colleagues, friends, family, clients,
or anyone in a genuine back-and-forth conversation. Also includes emails where YOU are
directly addressed and a reply is clearly expected.

FYI: Informational emails worth reading but requiring no reply. Shipping confirmations,
receipts, account notifications, or direct human communication that is purely informational.

NEWSLETTER: Marketing emails, promotional content, subscription newsletters,
bulk-sent announcements, any email sent to a mailing list or multiple recipients.

NOISE: Automated notifications, social media alerts, calendar invites from services,
alerts from SaaS tools, security notifications, spam, anything with no reading value.

Decision rules:
- When uncertain between TO_RESPOND and FYI, prefer FYI.
- When uncertain between NEWSLETTER and NOISE, prefer NOISE.
- Automated "Do Not Reply" emails are always NOISE.
- If the email was clearly sent to many people (newsletters, announcements), it's NEWSLETTER.`;

/**
 * Classifies an email thread into one of 4 categories.
 * Uses only subject, sender, and the first ~200 chars of each message
 * to keep classification fast and cheap.
 */
export async function classifyEmail(
  thread: EmailThread
): Promise<Classification> {
  const messageSnippets = thread.messages
    .map((msg, i) => {
      const bodySnippet = msg.body.slice(0, 200).replace(/\n+/g, " ").trim();
      return `Message ${i + 1} from ${msg.from} on ${msg.date}:\n${bodySnippet}`;
    })
    .join("\n\n");

  const prompt = `Thread subject: "${thread.subject}"
Number of messages: ${thread.messages.length}
First sender: ${thread.messages[0]?.from ?? "unknown"}

Message snippets:
${messageSnippets}

Classify this email thread.`;

  const { output } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: SYSTEM_PROMPT,
    prompt,
    output: Output.object({ schema: ClassificationSchema }),
  });

  return output;
}
