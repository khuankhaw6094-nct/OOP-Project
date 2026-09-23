"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { markHydrated, useHydrated } from "@/lib/hydration";
import { Order } from "@/lib/models/Order";
import { CashPayment } from "@/lib/models/CashPayment";
import { QRPayment } from "@/lib/models/QRPayment";
import { QueueCounter } from "@/lib/models/QueueCounter";
import { MenuItem } from "@/lib/models/MenuItem";
import type { DrinkOptions, MenuDraft, PaymentReceipt } from "@/lib/models/types";
import { createId } from "@/lib/models/id";
import { makeMenuItem, persistMenu, loadMenu } from "./catalogStore";

const CART_KEY = "grindco_cart";
const ORDERS_KEY = "grindco_orders";
const ADMIN_KEY = "grindco_admin";
const ADMIN_PASSWORD = "grind123";

interface CartLineData {
  itemId: string;
  options: DrinkOptions | null;
  quantity: number;
}

interface StoreContextValue {
  menu: MenuItem[];
  cart: Order;
  receipts: PaymentReceipt[];

  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;

  addToCart: (itemId: string, options?: DrinkOptions, quantity?: number) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;

  getMenuItemById: (id: string) => MenuItem | undefined;

  checkout: (customerName: string, method: "cash" | "qr") => PaymentReceipt;

  toggleOrderCompleted: (orderId: string) => void;

  addMenuItem: (draft: MenuDraft) => void;
  updateMenuItem: (oldId: string, draft: MenuDraft) => void;
  deleteMenuItem: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function cloneOrder(order: Order): Order {
  const clone = new Order(order.getCustomerName());
  for (const line of order.getLines()) {
    const added = clone.addLine(
      line.getMenuItem(),
      line.getSelectedOptions() ?? undefined,
      line.getId()
    );
    added.setQuantity(line.getQuantity());
  }
  return clone;
}

function loadCartLines(): CartLineData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLineData[]) : [];
  } catch {
    return [];
  }
}

function restoreCart(menu: MenuItem[]): Order {
  const order = new Order();
  for (const line of loadCartLines()) {
    const item = menu.find((entry) => entry.getId() === line.itemId);
    if (!item) continue;
    const added = order.addLine(item, line.options ?? undefined);
    added.setQuantity(line.quantity);
  }
  return order;
}

function persistCart(order: Order): void {
  if (typeof window === "undefined") return;
  const lines: CartLineData[] = order.getLines().map((line) => ({
    itemId: line.getMenuItem().getId(),
    options: line.getSelectedOptions(),
    quantity: line.getQuantity(),
  }));
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    // localStorage เต็มหรือไม่พร้อมใช้งาน — ใช้ state ในความจำแทน, ไม่บล็อกการใช้งาน
  }
}

function loadReceipts(): PaymentReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as PaymentReceipt[]) : [];
  } catch {
    return [];
  }
}

function persistOrders(receipts: PaymentReceipt[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(receipts));
  } catch {
    // localStorage เต็มหรือไม่พร้อมใช้งาน
  }
}

function loadAdminState(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}

function persistAdminState(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_KEY, active ? "1" : "0");
  } catch {
    // localStorage ไม่พร้อมใช้งาน
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(() => loadMenu());
  const [cart, setCart] = useState<Order>(() => restoreCart(loadMenu()));
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() =>
    loadReceipts()
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadAdminState());
  const hydrated = useHydrated();

  useEffect(() => {
    markHydrated();
  }, []);

  const loginAdmin = useCallback((password: string): boolean => {
    if (password !== ADMIN_PASSWORD) {
      return false;
    }
    persistAdminState(true);
    setIsAdmin(true);
    return true;
  }, []);

  const logoutAdmin = useCallback(() => {
    persistAdminState(false);
    setIsAdmin(false);
  }, []);

  const addToCart = useCallback(
    (itemId: string, options?: DrinkOptions, quantity = 1) => {
      setCart((prev) => {
        const item = menu.find((entry) => entry.getId() === itemId);
        if (!item) return prev;
        const next = cloneOrder(prev);
        const added = next.addLine(item, options);
        added.setQuantity(quantity);
        persistCart(next);
        return next;
      });
    },
    [menu]
  );

  const removeLine = useCallback((lineId: string) => {
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.removeLine(lineId);
      persistCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.updateQuantity(lineId, quantity);
      persistCart(next);
      return next;
    });
  }, []);

  const getMenuItemById = useCallback(
    (id: string) => menu.find((entry) => entry.getId() === id),
    [menu]
  );

  const checkout = useCallback(
    (customerName: string, method: "cash" | "qr"): PaymentReceipt => {
      if (cart.getLineCount() === 0) {
        throw new Error("ตะกร้าว่างเปล่า");
      }
      cart.setCustomerName(customerName);
      const payment =
        method === "cash"
          ? new CashPayment(QueueCounter.getInstance())
          : new QRPayment(QueueCounter.getInstance());
      const receipt = cart.checkout(payment);
      const next = [...receipts, receipt];
      persistOrders(next);
      setReceipts(next);
      setCart(new Order());
      persistCart(new Order());
      return receipt;
    },
    [cart, receipts]
  );

  const toggleOrderCompleted = useCallback((orderId: string) => {
    setReceipts((prev) => {
      const next = prev.map((receipt) =>
        receipt.orderId === orderId
          ? { ...receipt, completed: !receipt.completed }
          : receipt
      );
      persistOrders(next);
      return next;
    });
  }, []);

  const addMenuItem = useCallback((draft: MenuDraft) => {
    setMenu((prev) => {
      const item = makeMenuItem({ ...draft, id: createId("mi") });
      const next = [...prev, item];
      persistMenu(next);
      return next;
    });
  }, []);

  const updateMenuItem = useCallback((oldId: string, draft: MenuDraft) => {
    setMenu((prev) => {
      const next = prev.map((item) =>
        item.getId() === oldId ? makeMenuItem({ ...draft, id: oldId }) : item
      );
      persistMenu(next);
      return next;
    });
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenu((prev) => {
      const next = prev.filter((item) => item.getId() !== id);
      persistMenu(next);
      return next;
    });
  }, []);

  const value: StoreContextValue = {
    menu,
    cart,
    receipts,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addToCart,
    removeLine,
    updateQuantity,
    getMenuItemById,
    checkout,
    toggleOrderCompleted,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  };

  if (!hydrated) {
    return (
      <div className="app-loading" aria-label="กำลังโหลด">
        <div className="app-loading-inner">
          <span className="emoji">☕</span>
          <span>กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore ต้องใช้ภายใน <StoreProvider>");
  }
  return ctx;
}