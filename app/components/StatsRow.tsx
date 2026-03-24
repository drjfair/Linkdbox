import { PenLine, Info, Megaphone, Bot } from "lucide-react";
import type { EmailSummary } from "@/lib/gmail";

interface StatsRowProps {
  toRespond: EmailSummary[];
  fyi: EmailSummary[];
  newsletter: EmailSummary[];
  noise: EmailSummary[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}

export function StatsRow({ toRespond, fyi, newsletter, noise }: StatsRowProps) {
  const total = toRespond.length + fyi.length + newsletter.length + noise.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Draft Ready"
        value={toRespond.length}
        icon={PenLine}
        color="bg-blue-500"
        description="Emails awaiting your reply"
      />
      <StatCard
        label="FYI"
        value={fyi.length}
        icon={Info}
        color="bg-green-500"
        description="Informational, no reply needed"
      />
      <StatCard
        label="Marketing"
        value={newsletter.length}
        icon={Megaphone}
        color="bg-amber-500"
        description="Newsletters & promotions"
      />
      <StatCard
        label="Bot Mail"
        value={noise.length}
        icon={Bot}
        color="bg-gray-400"
        description="Automated & low-value mail"
      />
    </div>
  );
}
