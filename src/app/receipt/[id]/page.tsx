"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { formatBaht, formatDateTime } from "@/lib/format";

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const { receipts } = useStore();
  const receipt = receipts.find((entry) => entry.orderId === params.id);

  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // เคลียร์ object URL เก่าทิ้งทุกครั้งที่มีการเปลี่ยนรูป หรือตอนออกจากหน้า
  useEffect(() => {
    return () => {
      if (slipPreview) {
        URL.revokeObjectURL(slipPreview);
      }
    };
  }, [slipPreview]);

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (slipPreview) {
      URL.revokeObjectURL(slipPreview);
    }
    setSlipPreview(URL.createObjectURL(file));
  };

  const handleRemoveSlip = () => {
    if (slipPreview) {
      URL.revokeObjectURL(slipPreview);
    }
    setSlipPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!receipt) {
    return (
      <div className="empty-state">
        <span className="emoji">🧾</span>
        ไม่พบใบเสร็จนี้
        <div style={{ marginTop: 14 }}>
          <Link href="/" className="btn btn-primary">
            กลับไปหน้าเมนู
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="receipt"
        style={{
          border:
            receipt.queueNumber !== null
              ? "2px solid var(--accent)"
              : "1px solid var(--border)",
        }}
      >
        <div className="receipt-header">
          <div className="shop">☕ Grind &amp; Co.</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            ใบเสร็จ · {formatDateTime(receipt.timestamp)}
          </div>
        </div>

        {receipt.queueNumber !== null ? (
          <>
            <div className="queue-number">#{receipt.queueNumber}</div>
            <div className="queue-label">
              รอรับสินค้าที่เคาน์เตอร์ ⏳ ใช้ชื่อลูกค้าในการเรียก
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", margin: "8px 0 12px" }}>
            <div className="queue-number" style={{ fontSize: 20 }}>
              ✅ ชำระเงินสำเร็จ
            </div>
            <div className="queue-label">Ref: {receipt.refCode}</div>

            {/* แนบสลิปโอนเงิน — แสดงตัวอย่างชั่วคราวในเครื่องเท่านั้น ไม่บันทึกถาวร */}
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
                แนบสลิปโอนเงิน
              </div>

              {slipPreview ? (
                <div>
                  <img
                    src={slipPreview}
                    alt="สลิปโอนเงิน"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 260,
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
                onChange={handleSlipChange}
                style={{ display: "none" }}
              />
            </div>
          </div>
        )}

        <div style={{ fontSize: 14, marginBottom: 6 }}>
          ลูกค้า: <strong>{receipt.customerName}</strong>
        </div>
        <div style={{ fontSize: 14, marginBottom: 10 }}>
          วิธีจ่าย: <strong>{receipt.paymentLabel}</strong>
        </div>

        {receipt.lines.map((line, index) => (
          <div key={index}>
            <div className="receipt-line">
              <span>
                {line.quantity}× {line.name}
              </span>
              <span>{formatBaht(line.lineTotal)}</span>
            </div>
            {line.optionsLabel && line.optionsLabel !== "—" && (
              <div className="receipt-line" style={{ justifyContent: "flex-start" }}>
                <span className="opts">{line.optionsLabel}</span>
              </div>
            )}
          </div>
        ))}

        <div className="receipt-footer">
          <div className="receipt-line">
            <span>รวมทั้งหมด</span>
            <span style={{ fontWeight: 800 }}>{formatBaht(receipt.total)}</span>
          </div>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: "var(--ink-soft)" }}>
            ขอบคุณที่ใช้บริการ ☕
          </div>
        </div>
      </div>

      <div className="actions-row" style={{ justifyContent: "center" }}>
        <Link href="/" className="btn btn-primary">
          กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  );
}