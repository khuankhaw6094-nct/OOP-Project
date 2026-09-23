const STORAGE_KEY = "grindco_queue_next";

function readNext(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number(raw) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function persistNext(value: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

export class QueueCounter {
  private static instance: QueueCounter | null = null;
  private next: number;

  private constructor() {
    this.next = readNext();
  }

  static getInstance(): QueueCounter {
    if (!QueueCounter.instance) {
      QueueCounter.instance = new QueueCounter();
    }
    return QueueCounter.instance;
  }

  nextNumber(): number {
    const value = this.next;
    this.next += 1;
    persistNext(this.next);
    return value;
  }
}