import { Module, DynamicModule, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SyncProcessor } from './sync.processor';

export const SYNC_QUEUE_NAME = 'sync-jobs';

/**
 * Conditionally registers the BullMQ queue and processor for sync jobs.
 *
 * - When REDIS_URL is set: registers BullMQ root connection, the 'sync-jobs' queue,
 *   the SyncProcessor, and provides BULL_QUEUE_AVAILABLE = true.
 * - When REDIS_URL is NOT set: provides only BULL_QUEUE_AVAILABLE = false.
 *   No BullMQ infrastructure is loaded, so no Redis connection is attempted.
 */
@Module({})
export class SyncQueueModule {
  private static readonly logger = new Logger(SyncQueueModule.name);

  static register(): DynamicModule {
    const redisUrl = process.env.REDIS_URL;

    // ── No Redis: lightweight fallback ──
    if (!redisUrl) {
      SyncQueueModule.logger.warn(
        'REDIS_URL not set — BullMQ queue disabled. Sync will use direct cron execution.',
      );
      return {
        module: SyncQueueModule,
        providers: [
          { provide: 'BULL_QUEUE_AVAILABLE', useValue: false },
          // Provide a no-op stub so SyncModule can still inject SyncProcessor
          {
            provide: SyncProcessor,
            useValue: {
              setSyncCallback: () => {
                /* no-op when Bull is unavailable */
              },
            },
          },
        ],
        exports: ['BULL_QUEUE_AVAILABLE', SyncProcessor],
      };
    }

    // ── Parse Redis URL ──
    let connection: {
      host: string;
      port: number;
      password?: string;
      username?: string;
    };

    try {
      const url = new URL(redisUrl);
      connection = {
        host: url.hostname,
        port: parseInt(url.port, 10) || 6379,
        password: url.password || undefined,
        username: url.username || undefined,
      };
    } catch {
      SyncQueueModule.logger.error(
        `Invalid REDIS_URL format. BullMQ queue disabled.`,
      );
      return {
        module: SyncQueueModule,
        providers: [
          { provide: 'BULL_QUEUE_AVAILABLE', useValue: false },
          {
            provide: SyncProcessor,
            useValue: {
              setSyncCallback: () => {},
            },
          },
        ],
        exports: ['BULL_QUEUE_AVAILABLE', SyncProcessor],
      };
    }

    SyncQueueModule.logger.log(
      `REDIS_URL detected — registering BullMQ queue '${SYNC_QUEUE_NAME}'.`,
    );

    // ── Full Bull registration ──
    return {
      module: SyncQueueModule,
      imports: [
        BullModule.forRoot({ connection }),
        BullModule.registerQueue({
          name: SYNC_QUEUE_NAME,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 200 },
          },
        }),
      ],
      providers: [
        { provide: 'BULL_QUEUE_AVAILABLE', useValue: true },
        SyncProcessor,
      ],
      exports: ['BULL_QUEUE_AVAILABLE', SyncProcessor, BullModule],
    };
  }
}
