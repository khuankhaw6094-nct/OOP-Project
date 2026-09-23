import { MenuItem } from "./MenuItem";
import type { MenuItemArgs } from "./MenuItem";
import type { DrinkOptions, Size, Temperature, Topping, ToppingId } from "./types";

const SIZE_PRICES: SizePriceLike[] = [
  { size: "S", delta: 0 },
  { size: "M", delta: 15 },
  { size: "L", delta: 30 },
];

interface SizePriceLike {
  size: Size;
  delta: number;
}

export const DRINK_TOPPINGS: Topping[] = [
  { id: "extra-shot", name: "เพิ่มช็อต", price: 20 },
  { id: "fresh-milk", name: "เพิ่มนมสด", price: 15 },
  { id: "whipped-cream", name: "วิปครีม", price: 15 },
  { id: "vanilla-syrup", name: "ไซรัปวานิลลา", price: 15 },
];

export class Drink extends MenuItem {
  constructor(args: MenuItemArgs) {
    super(args);
  }

  getDefaultOptions(): DrinkOptions {
    return {
      size: "M",
      temperature: "cold",
      sweetnessPercent: 100,
      toppings: [],
    };
  }

  override getPrice(): number;
  override getPrice(options: DrinkOptions): number;
  override getPrice(options?: DrinkOptions): number {
    const opts = options ?? this.getDefaultOptions();
    const sizeDelta =
      SIZE_PRICES.find((item) => item.size === opts.size)?.delta ?? 0;
    const toppingTotal = opts.toppings.reduce((sum, id) => {
      const topping = DRINK_TOPPINGS.find((item) => item.id === id);
      return sum + (topping ? topping.price : 0);
    }, 0);
    return this.getBasePrice() + sizeDelta + toppingTotal;
  }

  customize(size: Size): DrinkOptions;
  customize(size: Size, temperature: Temperature): DrinkOptions;
  customize(
    size: Size,
    temperature: Temperature,
    sweetnessPercent: number
  ): DrinkOptions;
  customize(
    size: Size,
    temperature: Temperature,
    sweetnessPercent: number,
    toppings: ToppingId[]
  ): DrinkOptions;
  customize(
    size: Size,
    temperature: Temperature = "cold",
    sweetnessPercent: number = 100,
    toppings: ToppingId[] = []
  ): DrinkOptions {
    return {
      size,
      temperature,
      sweetnessPercent,
      toppings: [...toppings],
    };
  }
}