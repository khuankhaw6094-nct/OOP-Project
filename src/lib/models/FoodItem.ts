import { MenuItem } from "./MenuItem";
import type { MenuItemArgs } from "./MenuItem";

export class FoodItem extends MenuItem {
  constructor(args: MenuItemArgs) {
    super(args);
  }

  override getPrice(): number {
    return this.getBasePrice();
  }
}