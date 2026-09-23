import { Drink } from "@/lib/models/Drink";
import { FoodItem } from "@/lib/models/FoodItem";
import { MenuItem } from "@/lib/models/MenuItem";
import type { Category, MenuDraft } from "@/lib/models/types";
import { createDefaultMenu } from "@/lib/data/menu";

const MENU_KEY = "grindco_menu";

interface SerializedMenuItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: Category;
  basePrice: number;
  image: string;
}

function serializeMenu(items: MenuItem[]): SerializedMenuItem[] {
  return items.map((item) => ({
    id: item.getId(),
    name: item.getName(),
    description: item.getDescription(),
    emoji: item.getEmoji(),
    category: item.getCategory(),
    basePrice: item.getBasePrice(),
    image: item.getImage(),
  }));
}

function deserializeMenu(raw: string | null): MenuItem[] | null {
  if (!raw) return null;
  try {
    const list: SerializedMenuItem[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map((item) =>
      item.category === "drink" ? new Drink(item) : new FoodItem(item)
    );
  } catch {
    return null;
  }
}

export function loadMenuOverride(): MenuItem[] | null {
  if (typeof window === "undefined") return null;
  return deserializeMenu(window.localStorage.getItem(MENU_KEY));
}

export function loadMenu(): MenuItem[] {
  return loadMenuOverride() ?? createDefaultMenu();
}

export function persistMenu(items: MenuItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MENU_KEY, JSON.stringify(serializeMenu(items)));
  } catch {
    const slim = serializeMenu(items).map((item) => ({
      ...item,
      image: item.image.startsWith("data:") ? "" : item.image,
    }));
    window.localStorage.setItem(MENU_KEY, JSON.stringify(slim));
  }
}

export function makeMenuItem(draft: MenuDraft & { id: string }): MenuItem {
  return draft.category === "drink" ? new Drink(draft) : new FoodItem(draft);
}