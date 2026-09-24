import { MenuItem } from "./MenuItem";
import type { DrinkOptions } from "./types";
import { createId } from "./id";

function cloneOptions(options: DrinkOptions): DrinkOptions {
  return {
    size: options.size,
    temperature: options.temperature,
    sweetnessPercent: options.sweetnessPercent,
    toppings: [...options.toppings],
  };
}

// กันจำนวนติด NaN/Infinity/ค่าที่ไม่ใช่ตัวเลข (เช่นถ้าวันหลังมีช่องให้พิมพ์จำนวนเอง)
function sanitizeQuantity(value: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, value);
}

export class OrderLine {
  private readonly id: string;
  private menuItem: MenuItem;
  private selectedOptions: DrinkOptions | null;
  private quantity: number;

  constructor(menuItem: MenuItem, options: DrinkOptions | null = null, quantity = 1, id?: string) {
    this.id = id ?? createId("line");
    this.menuItem = menuItem;
    this.selectedOptions = options ? cloneOptions(options) : null;
    this.quantity = sanitizeQuantity(quantity);
  }

  getId(): string {
    return this.id;
  }

  getMenuItem(): MenuItem {
    return this.menuItem;
  }

  getSelectedOptions(): DrinkOptions | null {
    return this.selectedOptions ? cloneOptions(this.selectedOptions) : null;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getLineTotal(): number {
    return this.menuItem.getPrice(this.selectedOptions ?? undefined) * this.quantity;
  }

  incrementQuantity(): void {
    this.quantity = sanitizeQuantity(this.quantity + 1);
  }

  decrementQuantity(): void {
    this.quantity = sanitizeQuantity(this.quantity - 1);
  }

  setQuantity(quantity: number): void {
    this.quantity = sanitizeQuantity(quantity);
  }

  setMenuItem(menuItem: MenuItem, clearOptions: boolean): void {
    this.menuItem = menuItem;
    if (clearOptions) {
      this.selectedOptions = null;
    }
  }
}