"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { MockQr } from "@/components/MockQr";
import { formatBaht } from "@/lib/format";

type PayMethod = "cash" | "qr";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, checkout } = useStore();
  const [name, setName] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const total = cart.getTotal();
  const canSubmit =
    name.trim().length > 0 && cart.getLineCount() > 0 && !processing;

  function handleSubmit() {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อลูกค้าก่อนสั่ง");
      return;
    }
    setProcessing(true);
    setError("");
    window.setTimeout(() => {
      try {
        const receipt = checkout(name.trim(), method);
        router.push(`/receipt/${receipt.orderId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองใหม่");
        setProcessing(false);
      }
    }, 600);
  }

  return (
    <div>
      <h1 className="page-title">💳 ชำระเงิน</h1>

      {cart.getLineCount() === 0 ? (
        <div className="empty-state">
          <span className="emoji">🛒</span>
          ตะกร้าว่างเปล่า ไปเลือกเมนูก่อนนะ
          <div style={{ marginTop: 14 }}>
            <Link href="/" className="btn btn-primary">
              กลับไปเลือกเมนู
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <div className="field">
              <label>ชื่อลูกค้า (จำเป็น)</label>
              <input
                type="text"
                value={name}
                placeholder="เช่น สมชาย ใจดี"
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </div>
          </div>

          <div className="card">
            <div className="option-group-title">เลือกวิธีจ่ายเงิน</div>
            <div style={{ display: "grid", gap: 10 }}>
              <button
                type="button"
                className={`payment-option ${method === "cash" ? "active" : ""}`}
                onClick={() => setMethod("cash")}
              >
                <span className="emoji">💵</span>
                <span>
                  <div className="title">เงินสด</div>
                  <div className="hint">จ่ายที่เคาน์เตอร์ รับเลขคิวทันที</div>
                </span>
              </button>
              <button
                type="button"
                className={`payment-option ${method === "qr" ? "active" : ""}`}
                onClick={() => setMethod("qr")}
              >
                <span className="emoji">📱</span>
                <span>
                  <div className="title">พร้อมเพย์ / QR สแกนจ่าย</div>
                  <div className="hint">สแกน QR เพื่อจ่าย (จำลองการยืนยัน)</div>
                </span>
              </button>
            </div>
          </div>

          {method === "qr" && (
            <div className="qr-box">
              <MockQr />
              <p style={{ marginTop: 10 }}>
                <strong>{formatBaht(total)}</strong>
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                สแกน QR เพื่อชำระ · กรณีกดยืนยันถือว่าจ่ายสำเร็จ (จำลอง)
              </p>
            </div>
          )}

          <div className="summary">
            <div className="summary-row">
              <span>ลูกค้า</span>
              <span>{name.trim() || "—"}</span>
            </div>
            <div className="summary-row">
              <span>วิธีจ่าย</span>
              <span>{method === "cash" ? "เงินสด" : "พร้อมเพย์ / QR"}</span>
            </div>
            <div className="summary-row total">
              <span>ยอดรวม</span>
              <span>{formatBaht(total)}</span>
            </div>
            {error && (
              <div style={{ color: "var(--danger)", fontSize: 14, marginTop: 8 }}>
                {error}
              </div>
            )}
            <div className="actions-row">
              <Link href="/cart" className="btn btn-ghost">
                ← กลับไปตะกร้า
              </Link>
              <button
                type="button"
                className="btn btn-accent"
                style={{ flex: 1 }}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {processing ? "กำลังยืนยัน..." : "ยืนยันคำสั่งซื้อ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}