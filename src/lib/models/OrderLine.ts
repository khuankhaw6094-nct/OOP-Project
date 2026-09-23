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

export class OrderLine {
  private readonly id: string;
  private readonly menuItem: MenuItem;
  private readonly selectedOptions: DrinkOptions | null;
  private quantity: number;

  constructor(menuItem: MenuItem, options: DrinkOptions | null = null, quantity = 1) {
    this.id = createId("line");
    this.menuItem = menuItem;
    this.selectedOptions = options ? cloneOptions(options) : null;
    this.quantity = Math.max(1, quantity);
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
    this.quantity += 1;
  }

  decrementQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  setQuantity(quantity: number): void {
    this.quantity = Math.max(1, quantity);
  }
}