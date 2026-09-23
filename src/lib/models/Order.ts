import { OrderLine } from "./OrderLine";
import { PaymentMethod } from "./PaymentMethod";
import { MenuItem } from "./MenuItem";
import type { DrinkOptions, PaymentReceipt } from "./types";
import { createId } from "./id";
import { summarizeOptions } from "./optionsSummary";

export type OrderStatus = "cart" | "paid";

export class Order {
  private readonly id: string;
  private readonly orderLines: OrderLine[];
  private customerName: string;
  private status: OrderStatus;
  private queueNumber: number | null;
  private readonly timestamp: number;

  constructor(customerName = "") {
    this.id = createId("ord");
    this.orderLines = [];
    this.customerName = customerName.trim();
    this.status = "cart";
    this.queueNumber = null;
    this.timestamp = Date.now();
  }

  getId(): string {
    return this.id;
  }

  getCustomerName(): string {
    return this.customerName;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getQueueNumber(): number | null {
    return this.queueNumber;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  setCustomerName(name: string): void {
    this.customerName = name.trim();
  }

  getLines(): OrderLine[] {
    return [...this.orderLines];
  }

  getLineCount(): number {
    return this.orderLines.length;
  }

  getItemCount(): number {
    return this.orderLines.reduce((sum, line) => sum + line.getQuantity(), 0);
  }

  addLine(menuItem: MenuItem, options?: DrinkOptions, lineId?: string): OrderLine {
    if (this.status !== "cart") {
      throw new Error("ไม่สามารถแก้ไขออเดอร์ที่ชำระแล้วได้");
    }
    const line = new OrderLine(menuItem, options, 1, lineId);
    this.orderLines.push(line);
    return line;
  }

  removeLine(lineId: string): void {
    if (this.status !== "cart") {
      throw new Error("ไม่สามารถแก้ไขออเดอร์ที่ชำระแล้วได้");
    }
    const index = this.orderLines.findIndex((line) => line.getId() === lineId);
    if (index !== -1) {
      this.orderLines.splice(index, 1);
    }
  }

  updateQuantity(lineId: string, quantity: number): void {
    if (this.status !== "cart") {
      throw new Error("ไม่สามารถแก้ไขออเดอร์ที่ชำระแล้วได้");
    }
    const line = this.orderLines.find((item) => item.getId() === lineId);
    if (line) {
      line.setQuantity(quantity);
    }
  }

  getTotal(): number {
    return this.orderLines.reduce((sum, line) => sum + line.getLineTotal(), 0);
  }

  checkout(payment: PaymentMethod): PaymentReceipt {
    if (this.status !== "cart") {
      throw new Error("ออเดอร์นี้ชำระเงินแล้ว");
    }
    if (this.orderLines.length === 0) {
      throw new Error("ตะกร้าว่างเปล่า");
    }
    if (!this.customerName) {
      throw new Error("กรุณากรอกชื่อลูกค้า");
    }

    const result = payment.confirm();
    this.status = "paid";
    this.queueNumber = result.queueNumber;

    const lines = this.orderLines.map((line) => {
      const options = line.getSelectedOptions();
      return {
        name: line.getMenuItem().getName(),
        optionsLabel: options ? summarizeOptions(options) : "—",
        unitPrice: line.getMenuItem().getPrice(options ?? undefined),
        quantity: line.getQuantity(),
        lineTotal: line.getLineTotal(),
      };
    });

    return {
      orderId: this.id,
      customerName: this.customerName,
      lines,
      total: this.getTotal(),
      paymentLabel: payment.getLabel(),
      queueNumber: result.queueNumber,
      refCode: result.refCode,
      timestamp: result.confirmedAt,
      completed: false,
    };
  }
}