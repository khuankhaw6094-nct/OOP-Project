import type { Category, DrinkOptions } from "./types";

export interface MenuItemArgs {
  id: string;
  name: string;
  description: string;
  emoji: string;
  basePrice: number;
  category: Category;
  image: string;
}

export abstract class MenuItem {
  private readonly id: string;
  private readonly name: string;
  private readonly description: string;
  private readonly emoji: string;
  private readonly basePrice: number;
  private readonly category: Category;
  private readonly image: string;

  protected constructor(args: MenuItemArgs) {
    this.id = args.id;
    this.name = args.name;
    this.description = args.description;
    this.emoji = args.emoji;
    this.basePrice = args.basePrice;
    this.category = args.category;
    this.image = args.image;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getEmoji(): string {
    return this.emoji;
  }

  getImage(): string {
    return this.image;
  }

  getBasePrice(): number {
    return this.basePrice;
  }

  getCategory(): Category {
    return this.category;
  }

  abstract getPrice(options?: DrinkOptions): number;
}