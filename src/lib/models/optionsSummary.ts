import type { DrinkOptions, ToppingId } from "./types";

const TEMPERATURE_LABEL: Record<string, string> = {
  hot: "ร้อน",
  cold: "เย็น",
};

const TOPPING_LABEL: Record<ToppingId, string> = {
  "extra-shot": "เพิ่มช็อต",
  "fresh-milk": "เพิ่มนมสด",
  "whipped-cream": "วิปครีม",
  "vanilla-syrup": "ไซรัปวานิลลา",
};

export function summarizeOptions(options: DrinkOptions): string {
  const parts: string[] = [
    `${options.size} / ${TEMPERATURE_LABEL[options.temperature] ?? options.temperature}`,
    `น้ำตาล ${options.sweetnessPercent}%`,
  ];
  if (options.toppings.length > 0) {
    parts.push(options.toppings.map((id) => TOPPING_LABEL[id] ?? id).join(", "));
  }
  return parts.join(" · ");
}