"use server";

import { runScan } from "@/lib/scan";
import type { ScanResult } from "@/lib/scan";

/**
 * Server Action called by the "Scan Now" button in the dashboard.
 * Runs the full scan pipeline directly (no HTTP round-trip to /api/scan).
 */
export async function triggerScan(accountId?: string): Promise<ScanResult> {
  return runScan(accountId);
}
