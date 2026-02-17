import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SYNC_QUEUE_NAME } from './sync-queue.module';

export interface SyncJobData {
  sourceId: string;
  accountId?: string;
  triggeredBy?: 'cron' | 'manual';
}

/**
 * BullMQ processor for sync jobs.
 *
 * Picks up jobs from the 'sync-jobs' queue and executes sync logic.
 * Only registered as a provider when REDIS_URL is set (via SyncQueueModule).
 *
 * Retry is handled at the queue level:
 * - 3 attempts with exponential backoff (5s base, multiplier 2)
 */
@Processor(SYNC_QUEUE_NAME)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  // Set by SyncModule.onModuleInit to avoid circular dependency
  private syncCallback: ((sourceId: string) => Promise<any>) | null = null;

  /**
   * Register the actual sync logic callback.
   * Called by SyncModule during onModuleInit.
   */
  setSyncCallback(callback: (sourceId: string) => Promise<any>) {
    this.syncCallback = callback;
  }

  async process(job: Job<SyncJobData>): Promise<any> {
    const { sourceId, triggeredBy } = job.data;

    this.logger.log(
      `Processing sync job ${job.id} for source ${sourceId} ` +
        `(attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3}, trigger: ${triggeredBy || 'unknown'})`,
    );

    if (!this.syncCallback) {
      throw new Error(
        'SyncProcessor: sync callback not registered. Ensure SyncModule has initialized.',
      );
    }

    try {
      const result = await this.syncCallback(sourceId);
      this.logger.log(
        `Sync job ${job.id} completed for source ${sourceId}: ${result.tasks_synced} tasks synced`,
      );
      return result;
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(
        `Sync job ${job.id} failed for source ${sourceId} ` +
          `(attempt ${job.attemptsMade + 1}): ${message}`,
      );
      throw error; // BullMQ will retry based on job config
    }
  }
}
