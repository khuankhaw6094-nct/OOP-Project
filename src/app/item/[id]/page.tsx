"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Drink } from "@/lib/models/Drink";
import { useStore } from "@/lib/store/StoreProvider";
import { DrinkCustomizer } from "@/components/DrinkCustomizer";
import { MenuImage } from "@/components/MenuImage";
import { AdminNoOrderHint } from "@/components/AdminOrderBlock";
import { formatBaht } from "@/lib/format";

export default function ItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getMenuItemById, addToCart, isAdmin } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  // กันกดซ้ำระหว่างรอพาไปหน้าตะกร้า (ไม่งั้นดับเบิลคลิกจะได้ 2 รายการ)
  const addingRef = useRef(false);

  const item = getMenuItemById(params.id);

  if (!item) {
    return (
      <div className="empty-state">
        <span className="emoji">🤔</span>
        ไม่พบเมนูนี้ หรือเมนูถูกถอดออกจากร้านแล้ว
        <div>
          <Link href="/" className="btn btn-primary">
            กลับไปหน้าเมนู
          </Link>
        </div>
      </div>
    );
  }

  const safeItem = item;
  const isDrink = item instanceof Drink;

  function handleAddFood() {
    if (isAdmin || addingRef.current) return;
    addingRef.current = true;
    addToCart(safeItem.getId(), undefined, quantity);
    setShowToast(true);
    window.setTimeout(() => router.push("/cart"), 450);
  }

  return (
    <div>
      <Link href="/" className="btn btn-ghost">
        ← กลับเมนู
      </Link>

      <div className="card" style={{ marginTop: 8 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <MenuImage
            src={item.getImage()}
            alt={item.getName()}
            emoji={item.getEmoji()}
            size={88}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              {item.getName()}
            </h1>
            <p style={{ color: "var(--ink-soft)", margin: "4px 0 0" }}>
              {item.getDescription()}
            </p>
            <p className="price">
              เริ่มต้น {formatBaht(item.getBasePrice())}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {isDrink ? (
          <DrinkCustomizer item={item} />
        ) : (
          <div className="card">
            <div className="option-group">
              <div className="option-group-title">จำนวน</div>
              <div className="qty-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="qty">{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-accent btn-block"
              disabled={showToast || isAdmin}
              onClick={handleAddFood}
            >
              เพิ่มลงตะกร้า · {formatBaht(item.getPrice() * quantity)}
            </button>
            {isAdmin && <AdminNoOrderHint />}
            {showToast && <div className="toast">เพิ่มลงตะกร้าแล้ว ✓</div>}
          </div>
        )}
      </div>
    </div>
  );
}