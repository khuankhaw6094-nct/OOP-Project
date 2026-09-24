import { QueueCounter } from "./QueueCounter";
import type { PaymentResult } from "./types";

export abstract class PaymentMethod {
  protected constructor(protected readonly counter: QueueCounter) {}

  abstract confirm(): Promise<PaymentResult>;

  abstract getLabel(): string;
}