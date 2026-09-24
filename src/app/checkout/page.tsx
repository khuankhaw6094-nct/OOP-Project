"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { MockQr } from "@/components/MockQr";
import { resizeImage } from "@/lib/image";
import { formatBaht } from "@/lib/format";

type PayMethod = "cash" | "qr";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, checkout } = useStore();
  const [name, setName] = useState("");
  const [method, setMethod] = useState<PayMethod>("cash");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // สลิปโอนเงิน — บีบอัดเป็น data URL เล็ก ๆ แล้วเก็บกับใบเสร็จ (บันทึกถาวรใน localStorage)
  const [slipData, setSlipData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  // เคลียร์ timer ยืนยันคำสั่งซื้อเมื่อออกจากหน้า ป้องกันออเดอร์หลุดจากที่กดไปแล้ว
  useEffect(() => {
    return () => {
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  function selectMethod(next: PayMethod) {
    if (next === "cash" && slipData) {
      setSlipData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setMethod(next);
  }

  async function handleSlipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพสำหรับสลิปเท่านั้น");
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 480);
      setSlipData(dataUrl);
      setError("");
    } catch {
      setError("อ่านรูปสลิปไม่สำเร็จ ลองเลือกไฟล์ใหม่");
    }
  }

  const handleRemoveSlip = () => {
    setSlipData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const total = cart.getTotal();
  const needsSlip = method === "qr";
  const canSubmit =
    name.trim().length > 0 &&
    cart.getLineCount() > 0 &&
    !processing &&
    (!needsSlip || !!slipData);

  function handleSubmit() {
    if (!name.trim()) {
      setError("กรุณากรอกชื่อลูกค้าก่อนสั่ง");
      return;
    }
    if (needsSlip && !slipData) {
      setError("กรุณาแนบสลิปโอนเงินก่อนยืนยัน");
      return;
    }
    setProcessing(true);
    setError("");
    submitTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const receipt = await checkout(name.trim(), method, slipData ?? undefined);
          router.push(`/receipt/${receipt.orderId}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองใหม่");
          setProcessing(false);
        }
      })();
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
                disabled={processing}
                onClick={() => selectMethod("cash")}
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
                disabled={processing}
                onClick={() => selectMethod("qr")}
              >
                <span className="emoji">📱</span>
                <span>
                  <div className="title">พร้อมเพย์ / QR สแกนจ่าย</div>
                  <div className="hint">สแกน QR เพื่อจ่าย</div>
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
                สแกน QR เพื่อชำระ · กรณีกดยืนยันถือว่าจ่ายสำเร็จ
              </p>

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  border: "1px dashed var(--border)",
                  borderRadius: 12,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>
                  แนบสลิปโอนเงิน (ไฟล์รูปภาพเท่านั้น)
                </div>

                {slipData ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slipData}
                      alt="สลิปโอนเงิน"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 240,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                    <div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleRemoveSlip}
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📎 เลือกรูปสลิป
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleSlipChange(e)}
                  style={{ display: "none" }}
                />
              </div>
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