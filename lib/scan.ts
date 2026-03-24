import { ensureLabelsExist } from "@/lib/labels";
import {
  getUnprocessedThreadIds,
  getFullThread,
  applyLabel,
  createDraft,
} from "@/lib/gmail";
import { classifyEmail } from "@/lib/ai/classify";
import { generateDraftReply } from "@/lib/ai/draft";
import { getAccount, type Account } from "@/lib/accounts";

export interface ScanResult {
  processed: number;
  draftsCreated: number;
  labelCounts: Record<string, number>;
  errors: Array<{ threadId: string; error: string }>;
  durationMs: number;
}

/**
 * Core scan orchestration. Called by both the Vercel Cron endpoint and
 * the "Scan Now" Server Action.
 *
 * For each unprocessed inbox thread:
 *   1. Fetch the full thread
 *   2. Classify it with AI
 *   3. Apply the label immediately (prevents reprocessing even if draft fails)
 *   4. If TO_RESPOND, generate a draft reply and save it to Gmail Drafts
 */
export async function runScan(accountId?: string): Promise<ScanResult> {
  const startTime = Date.now();
  const account: Account | undefined = accountId ? getAccount(accountId) : undefined;
  const errors: Array<{ threadId: string; error: string }> = [];
  const labelCounts: Record<string, number> = {
    TO_RESPOND: 0,
    FYI: 0,
    NEWSLETTER: 0,
    NOISE: 0,
  };
  let processed = 0;
  let draftsCreated = 0;

  // Ensure our 4 AI labels exist in Gmail (creates them on first run)
  const labelIds = await ensureLabelsExist(account);

  // Find emails that haven't been processed yet
  const threadIds = await getUnprocessedThreadIds(labelIds, account);

  for (const threadId of threadIds) {
    try {
      const thread = await getFullThread(threadId, account);
      const classification = await classifyEmail(thread);

      // Map classification label to Gmail label ID
      const labelIdMap: Record<string, string> = {
        TO_RESPOND: labelIds.toRespond,
        FYI: labelIds.fyi,
        NEWSLETTER: labelIds.newsletter,
        NOISE: labelIds.noise,
      };
      const gmailLabelId = labelIdMap[classification.label];

      // Apply label immediately — if draft generation fails below,
      // the email still has a label and won't be reprocessed
      await applyLabel(threadId, gmailLabelId, account);
      labelCounts[classification.label]++;
      processed++;

      // Generate and save a draft reply for TO_RESPOND emails
      if (classification.label === "TO_RESPOND") {
        const draftBody = await generateDraftReply(thread);
        await createDraft(thread, draftBody, account);
        draftsCreated++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ threadId, error: message });
    }
  }

  return {
    processed,
    draftsCreated,
    labelCounts,
    errors,
    durationMs: Date.now() - startTime,
  };
}
