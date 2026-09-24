import { PaymentMethod } from "./PaymentMethod";
import { QueueCounter } from "./QueueCounter";
import type { PaymentResult } from "./types";

export class CashPayment extends PaymentMethod {
  constructor(counter: QueueCounter) {
    super(counter);
  }

  async confirm(): Promise<PaymentResult> {
    const queueNumber = await this.counter.nextNumber();
    return {
      method: "cash",
      queueNumber,
      refCode: null,
      confirmedAt: Date.now(),
    };
  }

  getLabel(): string {
    return "เงินสด";
  }
}