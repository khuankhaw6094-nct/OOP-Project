import { Drink } from "@/lib/models/Drink";
import { FoodItem } from "@/lib/models/FoodItem";
import { BakeryItem } from "@/lib/models/BakeryItem";
import { MenuItem } from "@/lib/models/MenuItem";
import type { Category, MenuDraft } from "@/lib/models/types";
import { createDefaultMenu } from "@/lib/data/menu";

// v2: เปลี่ยนรูปเมนูจาก .svg เป็น .jpg และเปลี่ยน id บางเมนู — ข้อมูลใต้ key เก่า ("grindco_menu")
// ที่ค้างในเบราว์เซอร์จะถูกมองข้ามแล้วลบทิ้ง เพื่อโหลดเมนูตั้งต้นจาก menu.ts แทน
export const MENU_KEY = "grindco_menu_v2";
const LEGACY_MENU_KEY = "grindco_menu";

interface SerializedMenuItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: Category;
  basePrice: number;
  image: string;
}

function buildItem(item: SerializedMenuItem): MenuItem {
  switch (item.category) {
    case "drink":
      return new Drink(item);
    case "bakery":
      return new BakeryItem(item);
    default:
      return new FoodItem(item);
  }
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
    if (!Array.isArray(list)) return null;
    return list.map(buildItem);
  } catch {
    return null;
  }
}

export function loadMenuOverride(): MenuItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    window.localStorage.removeItem(LEGACY_MENU_KEY);
  } catch {
    // ไม่ใช่ปัญหาใหญ่ ถ้าลบ key เก่าไม่ได้
  }
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
  return buildItem(draft);
}