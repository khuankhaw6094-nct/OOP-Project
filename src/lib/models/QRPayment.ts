import { PaymentMethod } from "./PaymentMethod";
import { QueueCounter } from "./QueueCounter";
import type { PaymentResult } from "./types";

export class QRPayment extends PaymentMethod {
  private readonly counter: QueueCounter;

  constructor(counter: QueueCounter) {
    super();
    this.counter = counter;
  }

  confirm(): PaymentResult {
    const queueNumber = this.counter.nextNumber();
    const refCode = `QR-${Date.now().toString().slice(-8)}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    return {
      method: "qr",
      queueNumber,
      refCode,
      confirmedAt: Date.now(),
    };
  }

  getLabel(): string {
    return "พร้อมเพย์ / QR";
  }
}