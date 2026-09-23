import { PaymentMethod } from "./PaymentMethod";
import { QueueCounter } from "./QueueCounter";
import type { PaymentResult } from "./types";

export class CashPayment extends PaymentMethod {
  private readonly counter: QueueCounter;

  constructor(counter: QueueCounter) {
    super();
    this.counter = counter;
  }

  confirm(): PaymentResult {
    const queueNumber = this.counter.nextNumber();
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