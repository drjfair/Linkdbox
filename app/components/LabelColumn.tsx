import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailRow } from "./EmailRow";
import type { EmailSummary } from "@/lib/gmail";

interface LabelColumnProps {
  title: string;
  emails: EmailSummary[];
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  badgeClassName?: string;
  emptyMessage?: string;
}

export function LabelColumn({
  title,
  emails,
  badgeVariant,
  badgeClassName,
  emptyMessage = "Nothing here",
}: LabelColumnProps) {
  return (
    <Card className="flex flex-col h-full bg-white border-gray-200 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base text-gray-900">
          <span>{title}</span>
          <Badge
            variant={badgeVariant}
            className={badgeClassName}
          >
            {emails.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-3 pb-3">
        {emails.length === 0 ? (
          <p className="text-sm text-gray-400 px-2 py-4 text-center">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-0.5">
            {emails.map((email) => (
              <EmailRow key={email.threadId} email={email} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LabelColumnSkeleton({ title }: { title: string }) {
  return (
    <Card className="flex flex-col h-full bg-white border-gray-200 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base text-gray-900">
          <span>{title}</span>
          <Skeleton className="h-5 w-6 rounded-full" />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-2 py-2 space-y-1.5">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-12" />
            </div>
            <Skeleton className="h-3.5 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
