import PQueue from 'p-queue';

export class Queue extends PQueue {
  private peak = 0;
  private total = 0;

  constructor(options: QueueOptions) {
    super(options);
    this.on('add', () => {
      this.peak = Math.max(this.peak, this.size);
    });
    this.on('active', () => {
      this.total++;
    });
  }

  getStats() {
    return {
      peak: this.peak,
      pending: this.pending,
      size: this.size,
      total: this.total,
    };
  }
}

export interface QueueOptions {
  concurrency?: number;
  timeout?: number;
  throwOnTimeout?: boolean;
}
