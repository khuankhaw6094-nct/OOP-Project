import { PaymentMethod } from "./PaymentMethod";
import type { PaymentResult } from "./types";

export class QRPayment extends PaymentMethod {
  confirm(): PaymentResult {
    const refCode = `QR-${Date.now().toString().slice(-8)}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    return {
      method: "qr",
      queueNumber: null,
      refCode,
      confirmedAt: Date.now(),
    };
  }

  getLabel(): string {
    return "พร้อมเพย์ / QR";
  }
}