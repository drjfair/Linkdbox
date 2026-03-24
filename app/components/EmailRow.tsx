import type { EmailSummary } from "@/lib/gmail";

function parseDisplayName(from: string): string {
  // "Jane Doe <jane@example.com>" → "Jane Doe"
  // "jane@example.com" → "jane@example.com"
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split("@")[0] ?? from;
}

function relativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

interface EmailRowProps {
  email: EmailSummary;
}

export function EmailRow({ email }: EmailRowProps) {
  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${email.threadId}`;
  const displayName = parseDisplayName(email.from);
  const subject =
    email.subject.length > 60
      ? email.subject.slice(0, 60) + "…"
      : email.subject;

  return (
    <a
      href={gmailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-gray-50 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </span>
          <span className="shrink-0 text-xs text-gray-400 font-mono">
            {relativeDate(email.date)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">
          {subject}
        </p>
      </div>
    </a>
  );
}
