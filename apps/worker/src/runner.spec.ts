import { describe, it, expect, vi } from 'vitest';
import { WorkerRunner } from './runner.js';
import type { OutboxPublisher } from './outbox-publisher.js';

describe('WorkerRunner', () => {
  it('starts and stops gracefully', async () => {
    const mockPublisher = {
      tick: vi.fn().mockResolvedValue(0),
    } as unknown as OutboxPublisher;

    const runner = new WorkerRunner(mockPublisher, { idleIntervalMs: 50 });

    expect(runner.isRunning).toBe(false);
    await runner.start();
    expect(runner.isRunning).toBe(true);

    // Allow tick to execute once
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(mockPublisher.tick).toHaveBeenCalled();

    await runner.stop();
    expect(runner.isRunning).toBe(false);
  });

  it('handles errors via onError callback without crashing runner', async () => {
    const error = new Error('Database disconnected');
    const mockPublisher = {
      tick: vi.fn().mockRejectedValueOnce(error).mockResolvedValue(0),
    } as unknown as OutboxPublisher;

    const onError = vi.fn();
    const runner = new WorkerRunner(mockPublisher, { idleIntervalMs: 20, onError });

    await runner.start();
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(onError).toHaveBeenCalledWith(error);
    await runner.stop();
  });
});
