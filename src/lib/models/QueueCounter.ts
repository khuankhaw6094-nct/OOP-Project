const STORAGE_KEY = "grindco_queue_next";
const LOCK_NAME = "grindco_queue_lock";

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

  private constructor() {}

  static getInstance(): QueueCounter {
    if (!QueueCounter.instance) {
      QueueCounter.instance = new QueueCounter();
    }
    return QueueCounter.instance;
  }

  private async withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    if (typeof navigator !== "undefined" && navigator.locks) {
      return navigator.locks.request(LOCK_NAME, async () => fn());
    }
    return fn();
  }

  async nextNumber(): Promise<number> {
    // อ่านค่าใหม่จาก localStorage ภายใต้ cross-tab lock กันเลขคิวซ้ำกันเมื่อเปิดหลายแท็บ
    return this.withLock(() => {
      const next = readNext();
      persistNext(next + 1);
      return next;
    });
  }
}