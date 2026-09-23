import type { PaymentResult } from "./types";

export abstract class PaymentMethod {
  abstract confirm(): PaymentResult;

  abstract getLabel(): string;
}