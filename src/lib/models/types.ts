export type Category = "drink" | "food" | "bakery";

export type Size = "S" | "M" | "L";

export type Temperature = "hot" | "cold";

export type ToppingId =
  | "extra-shot"
  | "fresh-milk"
  | "whipped-cream"
  | "vanilla-syrup";

export interface DrinkOptions {
  size: Size;
  temperature: Temperature;
  sweetnessPercent: number;
  toppings: ToppingId[];
}

export interface Topping {
  id: ToppingId;
  name: string;
  price: number;
}

export interface SizePrice {
  size: Size;
  label: string;
  delta: number;
}

export interface PaymentResult {
  method: "cash" | "qr";
  queueNumber: number | null;
  refCode: string | null;
  confirmedAt: number;
}

export interface ReceiptLine {
  name: string;
  optionsLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface PaymentReceipt {
  orderId: string;
  customerName: string;
  lines: ReceiptLine[];
  total: number;
  paymentLabel: string;
  queueNumber: number | null;
  refCode: string | null;
  timestamp: number;
  completed: boolean;
  slip: string | undefined;
}

export interface MenuDraft {
  name: string;
  description: string;
  emoji: string;
  category: Category;
  basePrice: number;
  image: string;
}