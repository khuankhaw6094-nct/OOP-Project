"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { formatBaht, formatDateTime } from "@/lib/format";

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const { receipts } = useStore();
  const receipt = receipts.find((entry) => entry.orderId === params.id);

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
          <div className="shop">☕ Coffee Tale</div>
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