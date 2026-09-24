import { OrderLine } from "./OrderLine";
import { PaymentMethod } from "./PaymentMethod";
import { MenuItem } from "./MenuItem";
import type { DrinkOptions, PaymentReceipt } from "./types";
import { createId } from "./id";
import { summarizeOptions } from "./optionsSummary";

export type OrderStatus = "cart" | "paid";

function sameOptions(
  a: DrinkOptions | null,
  b: DrinkOptions | null
): boolean {
  if (!a || !b) return a === b;
  if (
    a.size !== b.size ||
    a.temperature !== b.temperature ||
    a.sweetnessPercent !== b.sweetnessPercent
  ) {
    return false;
  }
  if (a.toppings.length !== b.toppings.length) return false;
  const set = new Set(b.toppings);
  return a.toppings.every((id) => set.has(id));
}

export class Order {
  private readonly id: string;
  private orderLines: OrderLine[];
  private customerName: string;
  private status: OrderStatus;
  private queueNumber: number | null;
  private readonly timestamp: number;
  private completed: boolean;

  constructor(customerName = "") {
    this.id = createId("ord");
    this.orderLines = [];
    this.customerName = customerName.trim();
    this.status = "cart";
    this.queueNumber = null;
    this.timestamp = Date.now();
    this.completed = false;
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

  isCompleted(): boolean {
    return this.completed;
  }

  setCompleted(completed: boolean): void {
    this.completed = completed;
  }

  setCustomerName(name: string): void {
    this.customerName = name.trim();
  }

  private assertEditable(): void {
    if (this.getStatus() !== "cart") {
      throw new Error("ไม่สามารถแก้ไขออเดอร์ที่ชำระแล้วได้");
    }
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

  addLine(
    menuItem: MenuItem,
    options?: DrinkOptions,
    addQuantity = 1,
    lineId?: string,
    merge = true
  ): OrderLine {
    this.assertEditable();
    if (merge) {
      const existing = this.orderLines.find(
        (line) =>
          line.getMenuItem().getId() === menuItem.getId() &&
          sameOptions(line.getSelectedOptions(), options ?? null)
      );
      if (existing) {
        existing.setQuantity(existing.getQuantity() + addQuantity);
        return existing;
      }
    }
    const line = new OrderLine(menuItem, options, addQuantity, lineId);
    this.orderLines.push(line);
    return line;
  }

  removeLine(lineId: string): void {
    this.assertEditable();
    const index = this.orderLines.findIndex((line) => line.getId() === lineId);
    if (index !== -1) {
      this.orderLines.splice(index, 1);
    }
  }

  removeLinesByItemId(itemId: string): void {
    this.assertEditable();
    this.orderLines = this.orderLines.filter(
      (line) => line.getMenuItem().getId() !== itemId
    );
  }

  replaceMenuItemReferences(
    itemId: string,
    newItem: MenuItem,
    clearOptions: boolean
  ): void {
    this.assertEditable();
    this.orderLines = this.orderLines.map((line) => {
      if (line.getMenuItem().getId() === itemId) {
        line.setMenuItem(newItem, clearOptions);
      }
      return line;
    });
  }

  incrementLineQuantity(lineId: string): void {
    this.assertEditable();
    const line = this.orderLines.find((item) => item.getId() === lineId);
    if (line) {
      line.incrementQuantity();
    }
  }

  decrementLineQuantity(lineId: string): void {
    this.assertEditable();
    const line = this.orderLines.find((item) => item.getId() === lineId);
    if (line) {
      line.decrementQuantity();
    }
  }

  getTotal(): number {
    return this.orderLines.reduce((sum, line) => sum + line.getLineTotal(), 0);
  }

  async checkout(payment: PaymentMethod): Promise<PaymentReceipt> {
    if (this.getStatus() !== "cart") {
      throw new Error("ออเดอร์นี้ชำระเงินแล้ว");
    }
    if (this.orderLines.length === 0) {
      throw new Error("ตะกร้าว่างเปล่า");
    }
    if (!this.customerName) {
      throw new Error("กรุณากรอกชื่อลูกค้า");
    }

    this.setCompleted(false);
    const result = await payment.confirm();
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
      queueNumber: this.getQueueNumber(),
      refCode: result.refCode,
      timestamp: this.getTimestamp(),
      completed: this.isCompleted(),
      slip: undefined,
    };
  }
}