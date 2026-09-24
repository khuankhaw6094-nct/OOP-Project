import { FoodItem } from "./FoodItem";
import type { MenuItemArgs } from "./MenuItem";

export class BakeryItem extends FoodItem {
  constructor(args: MenuItemArgs) {
    super(args);
  }
}