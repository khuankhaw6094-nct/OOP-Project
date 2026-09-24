"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { markHydrated, useHydrated } from "@/lib/hydration";
import { Order } from "@/lib/models/Order";
import { CashPayment } from "@/lib/models/CashPayment";
import { QRPayment } from "@/lib/models/QRPayment";
import { QueueCounter } from "@/lib/models/QueueCounter";
import { Drink } from "@/lib/models/Drink";
import { MenuItem } from "@/lib/models/MenuItem";
import type { DrinkOptions, MenuDraft, PaymentReceipt } from "@/lib/models/types";
import { createId } from "@/lib/models/id";
import { makeMenuItem, persistMenu, loadMenu, MENU_KEY } from "./catalogStore";

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
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;

  getMenuItemById: (id: string) => MenuItem | undefined;

  checkout: (
    customerName: string,
    method: "cash" | "qr",
    slip?: string
  ) => Promise<PaymentReceipt>;

  toggleOrderCompleted: (orderId: string) => void;

  addMenuItem: (draft: MenuDraft) => void;
  updateMenuItem: (oldId: string, draft: MenuDraft) => void;
  deleteMenuItem: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function cloneOrder(order: Order): Order {
  const clone = new Order(order.getCustomerName());
  for (const line of order.getLines()) {
    clone.addLine(
      line.getMenuItem(),
      line.getSelectedOptions() ?? undefined,
      line.getQuantity(),
      line.getId(),
      false
    );
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
    order.addLine(item, line.options ?? undefined, line.quantity);
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

function parseReceipts(raw: string | null): PaymentReceipt[] {
  try {
    const parsed = JSON.parse(raw ?? "null");
    if (!Array.isArray(parsed)) return [];
    const result: PaymentReceipt[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const r = entry as Record<string, unknown>;
      result.push({
        orderId: String(r.orderId ?? ""),
        customerName: String(r.customerName ?? ""),
        lines: Array.isArray(r.lines) ? (r.lines as PaymentReceipt["lines"]) : [],
        total: Number(r.total) || 0,
        paymentLabel: String(r.paymentLabel ?? ""),
        queueNumber: typeof r.queueNumber === "number" ? r.queueNumber : null,
        refCode: typeof r.refCode === "string" ? r.refCode : null,
        timestamp: Number(r.timestamp) || 0,
        completed: !!r.completed,
        slip: typeof r.slip === "string" ? r.slip : undefined,
      });
    }
    return result;
  } catch {
    return [];
  }
}

function loadReceipts(): PaymentReceipt[] {
  if (typeof window === "undefined") return [];
  return parseReceipts(window.localStorage.getItem(ORDERS_KEY));
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

  // ซิงค์ข้อมูลระหว่างแท็บ: ถ้าอีกแท็บแก้เมนู/ออเดอร์/สถานะแอดมิน แท็บนี้จะโหลดใหม่ทันที
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === MENU_KEY) {
        setMenu(loadMenu());
        // แก้ราคา/ชื่อเมนูไม่ทำให้ JSON ตะกร้าเปลี่ยน (ไม่มี event ของ CART_KEY) — ต้องผูกตะกร้ากับเมนูใหม่เอง
        setCart(restoreCart(loadMenu()));
      }
      if (event.key === CART_KEY) setCart(restoreCart(loadMenu()));
      if (event.key === ORDERS_KEY) setReceipts(loadReceipts());
      if (event.key === ADMIN_KEY) setIsAdmin(loadAdminState());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
        next.addLine(item, options, quantity);
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

  const incrementLine = useCallback((lineId: string) => {
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.incrementLineQuantity(lineId);
      persistCart(next);
      return next;
    });
  }, []);

  const decrementLine = useCallback((lineId: string) => {
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.decrementLineQuantity(lineId);
      persistCart(next);
      return next;
    });
  }, []);

  const getMenuItemById = useCallback(
    (id: string) => menu.find((entry) => entry.getId() === id),
    [menu]
  );

  const checkout = useCallback(
    async (customerName: string, method: "cash" | "qr", slip?: string) => {
      if (cart.getLineCount() === 0) {
        throw new Error("ตะกร้าว่างเปล่า");
      }
      const active = cloneOrder(cart);
      active.setCustomerName(customerName);
      const payment =
        method === "cash"
          ? new CashPayment(QueueCounter.getInstance())
          : new QRPayment(QueueCounter.getInstance());
      const receipt = await active.checkout(payment);
      const final = { ...receipt, slip: slip || undefined };
      const next = [...receipts, final];
      persistOrders(next);
      setReceipts(next);
      setCart(new Order());
      persistCart(new Order());
      return final;
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
    // สร้าง id นอก updater — React StrictMode (dev) เรียก updater 2 รอบ ถ้าสร้างข้างในจะได้ id
    // ไม่ตรงกันระหว่าง state กับที่บันทึกลง localStorage
    const id = createId("mi");
    setMenu((prev) => {
      const item = makeMenuItem({ ...draft, id });
      const next = [...prev, item];
      persistMenu(next);
      return next;
    });
  }, []);

  const updateMenuItem = useCallback((oldId: string, draft: MenuDraft) => {
    const newItem = makeMenuItem({ ...draft, id: oldId });
    const clearOptions = !(newItem instanceof Drink);
    setMenu((prev) => {
      const next = prev.map((item) =>
        item.getId() === oldId ? newItem : item
      );
      persistMenu(next);
      return next;
    });
    // ปรับรายการในตะกร้าที่อ้างถึงเมนูนี้ให้ตรงกับเมนูใหม่ด้วย
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.replaceMenuItemReferences(oldId, newItem, clearOptions);
      persistCart(next);
      return next;
    });
  }, []);

  const deleteMenuItem = useCallback((id: string) => {
    setMenu((prev) => {
      const next = prev.filter((item) => item.getId() !== id);
      persistMenu(next);
      return next;
    });
    setCart((prev) => {
      const next = cloneOrder(prev);
      next.removeLinesByItemId(id);
      persistCart(next);
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
    incrementLine,
    decrementLine,
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