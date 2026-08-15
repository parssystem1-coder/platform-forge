import type { OutboxPublisher } from './outbox-publisher.js';

export interface WorkerRunnerOptions {
  idleIntervalMs?: number;
  onError?: (err: unknown) => void;
}

export class WorkerRunner {
  private running = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly idleIntervalMs: number;

  constructor(
    private readonly publisher: OutboxPublisher,
    private readonly opts: WorkerRunnerOptions = {},
  ) {
    this.idleIntervalMs = opts.idleIntervalMs ?? 1000;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.scheduleNext(0);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  private scheduleNext(delayMs: number): void {
    if (!this.running) return;
    this.timer = setTimeout(async () => {
      await this.loop();
    }, delayMs);
  }

  private async loop(): Promise<void> {
    if (!this.running) return;

    try {
      const processed = await this.publisher.tick();
      // If events were processed, immediately check next batch; otherwise wait idleIntervalMs
      const nextDelay = processed > 0 ? 50 : this.idleIntervalMs;
      this.scheduleNext(nextDelay);
    } catch (err) {
      if (this.opts.onError) {
        this.opts.onError(err);
      } else {
        console.error('Error in worker loop:', err);
      }
      this.scheduleNext(this.idleIntervalMs * 2);
    }
  }
}
