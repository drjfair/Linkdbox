export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ensureLabelsExist } from "@/lib/labels";
import { listLabeledThreads } from "@/lib/gmail";
import { LabelColumn, LabelColumnSkeleton } from "./components/LabelColumn";
import { ScanButton } from "./components/ScanButton";
import { StatsRow } from "./components/StatsRow";
import type { EmailSummary } from "@/lib/gmail";
import { RefreshCw } from "lucide-react";

interface DashboardData {
  toRespond: EmailSummary[];
  fyi: EmailSummary[];
  newsletter: EmailSummary[];
  noise: EmailSummary[];
}

async function getDashboardData(): Promise<DashboardData> {
  const labelIds = await ensureLabelsExist();

  const [toRespond, fyi, newsletter, noise] = await Promise.all([
    listLabeledThreads(labelIds.toRespond),
    listLabeledThreads(labelIds.fyi),
    listLabeledThreads(labelIds.newsletter),
    listLabeledThreads(labelIds.noise),
  ]);

  return { toRespond, fyi, newsletter, noise };
}

async function Dashboard() {
  let data: DashboardData;
  try {
    data = await getDashboardData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isCredsMissing =
      msg.includes("refresh token") || msg.includes("API key");
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <RefreshCw className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">
          {isCredsMissing ? "Gmail not connected" : "Could not load emails"}
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          {isCredsMissing
            ? "Run the auth script to connect your account:"
            : msg}
        </p>
        {isCredsMissing && (
          <code className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-mono text-gray-700">
            npx tsx scripts/auth.ts
          </code>
        )}
      </div>
    );
  }

  return (
    <>
      <StatsRow
        toRespond={data.toRespond}
        fyi={data.fyi}
        newsletter={data.newsletter}
        noise={data.noise}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LabelColumn
          title="✍️ Draft Ready"
          emails={data.toRespond}
          badgeVariant="default"
          badgeClassName="bg-blue-600 hover:bg-blue-600 text-white"
          emptyMessage="No drafts waiting"
        />
        <LabelColumn
          title="📬 FYI"
          emails={data.fyi}
          badgeVariant="default"
          badgeClassName="bg-green-600 hover:bg-green-600 text-white"
          emptyMessage="Nothing informational"
        />
        <LabelColumn
          title="📢 Marketing"
          emails={data.newsletter}
          badgeVariant="default"
          badgeClassName="bg-amber-500 hover:bg-amber-500 text-white"
          emptyMessage="No marketing emails"
        />
        <LabelColumn
          title="🤖 Bot Mail"
          emails={data.noise}
          badgeVariant="secondary"
          emptyMessage="No bot mail"
        />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-9 w-9 rounded-lg bg-gray-200" />
            </div>
            <div className="h-8 w-16 rounded bg-gray-200 mb-1" />
            <div className="h-3 w-32 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LabelColumnSkeleton title="✍️ Draft Ready" />
        <LabelColumnSkeleton title="📬 FYI" />
        <LabelColumnSkeleton title="📢 Marketing" />
        <LabelColumnSkeleton title="🤖 Bot Mail" />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              LinkBox — AI-classified inbox · drafts written automatically
            </p>
          </div>
          <ScanButton />
        </div>
      </header>

      <main className="flex-1 px-8 py-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  );
}
