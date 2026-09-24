"use client";

import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { summarizeOptions } from "@/lib/models";
import { MenuImage } from "@/components/MenuImage";
import { formatBaht } from "@/lib/format";

export default function CartPage() {
  const { cart, removeLine, incrementLine, decrementLine } = useStore();
  const lines = cart.getLines();
  const total = cart.getTotal();

  return (
    <div>
      <h1 className="page-title">🧺 ตะกร้าของฉัน</h1>

      {lines.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🥤</span>
          ตะกร้ายังว่างเปล่า ลองสั่งอะไรสักอย่างสิ
          <div style={{ marginTop: 14 }}>
            <Link href="/" className="btn btn-primary">
              กลับไปเลือกเมนู
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {lines.map((line) => {
              const item = line.getMenuItem();
              const options = line.getSelectedOptions();
              const unitPrice = item.getPrice(options ?? undefined);
              return (
                <div className="cart-line" key={line.getId()}>
                  <MenuImage
                    src={item.getImage()}
                    alt={item.getName()}
                    emoji={item.getEmoji()}
                    size={44}
                  />
                  <div className="info">
                    <div className="name">{item.getName()}</div>
                    <div className="opts">
                      {options ? summarizeOptions(options) : "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      ราคาต่อหน่วย {formatBaht(unitPrice)}
                    </div>
                  </div>
<div className="qty-stepper">
                      <button
                        type="button"
                        onClick={() => decrementLine(line.getId())}
                      >
                        −
                      </button>
                      <span className="qty">{line.getQuantity()}</span>
                      <button
                        type="button"
                        onClick={() => incrementLine(line.getId())}
                      >
                        +
                      </button>
                    </div>
                  <div className="line-total">{formatBaht(line.getLineTotal())}</div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeLine(line.getId())}
                  >
                    ลบ
                  </button>
                </div>
              );
            })}
          </div>

          <div className="summary">
            <div className="summary-row">
              <span>จำนวนรายการ</span>
              <span>{cart.getLineCount()} รายการ ({cart.getItemCount()} ชิ้น)</span>
            </div>
            <div className="summary-row total">
              <span>ยอดรวม</span>
              <span>{formatBaht(total)}</span>
            </div>
            <div className="actions-row">
              <Link href="/" className="btn btn-ghost">
                ← เพิ่มเมนู
              </Link>
              <Link href="/checkout" className="btn btn-accent" style={{ flex: 1 }}>
                ดำเนินการชำระเงิน →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}