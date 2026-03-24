"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { triggerScan } from "@/app/actions";
import type { ScanResult } from "@/lib/scan";

export function ScanButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ScanResult | null>(null);
  const router = useRouter();

  function handleScan() {
    setResult(null);
    startTransition(async () => {
      const scanResult = await triggerScan();
      setResult(scanResult);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-muted-foreground">
          {result.processed === 0
            ? "Inbox up to date"
            : `${result.processed} processed · ${result.draftsCreated} draft${result.draftsCreated !== 1 ? "s" : ""} created`}
          {result.errors.length > 0 && (
            <span className="text-destructive ml-2">
              · {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
      )}
      <Button
        onClick={handleScan}
        disabled={isPending}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isPending ? (
          <>
            <span className="mr-2 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            Scanning…
          </>
        ) : (
          "Scan Now"
        )}
      </Button>
    </div>
  );
}
