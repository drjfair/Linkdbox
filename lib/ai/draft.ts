import { generateText } from "ai";
import type { EmailThread } from "@/lib/gmail";

const SYSTEM_PROMPT = `You are drafting a reply on behalf of the inbox owner.

Guidelines:
- Write in a natural, professional but warm tone
- Be concise — match the register and length of the conversation
- Never use filler phrases like "I hope this email finds you well" or "Please let me know if you have any questions"
- Do NOT include a subject line — write only the email body
- Sign off naturally (e.g. "Thanks," or "Best,") without a name (the owner will add their name)
- Use [PLACEHOLDER] for any specific details you cannot infer from the thread
- Never fabricate facts, meeting times, prices, or commitments
- If the email asks a direct question, answer it (or use a placeholder if you don't know)
- If the email requests an action, acknowledge it and indicate next steps`;

/**
 * Generates a reply draft by reading the full thread for context.
 * Returns plain text ready to be saved as a Gmail draft.
 */
export async function generateDraftReply(thread: EmailThread): Promise<string> {
  const formattedThread = formatThreadForPrompt(thread);

  const prompt = `Read the following email thread carefully and write a reply to the most recent message.

${formattedThread}

Write the reply body now (no subject line, just the body text):`;

  const { text } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 1000,
  });

  return text.trim();
}

function formatThreadForPrompt(thread: EmailThread): string {
  const lines: string[] = [
    `Subject: ${thread.subject}`,
    `Thread has ${thread.messages.length} message(s)`,
    "─".repeat(60),
  ];

  for (const msg of thread.messages) {
    lines.push(`From: ${msg.from}`);
    lines.push(`To: ${msg.to}`);
    lines.push(`Date: ${msg.date}`);
    lines.push("");
    lines.push(msg.body.trim() || "[No body]");
    lines.push("─".repeat(60));
  }

  return lines.join("\n");
}
