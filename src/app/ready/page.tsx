"use client";

import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { formatDateTime } from "@/lib/format";

export default function ReadyPage() {
  const { receipts, isAdmin } = useStore();

  const waiting = receipts
    .filter((receipt) => receipt.queueNumber !== null && !receipt.completed)
    .sort((a, b) => (a.queueNumber ?? 0) - (b.queueNumber ?? 0));

  const current = waiting[0]?.queueNumber ?? null;

  return (
    <div>
      <div className="ready-board">
        <div className="ready-title">☕ Coffee Tale · จอเรียกคิว</div>
        {current !== null ? (
          <>
            <div className="ready-number">#{current}</div>
            <div className="ready-label">ถึงคิวของคุณแล้ว</div>
          </>
        ) : (
          <>
            <div className="ready-number" style={{ fontSize: 64 }}>
              —
            </div>
            <div className="ready-label">ยังไม่มีคิวที่รอรับ</div>
          </>
        )}
      </div>

      {waiting.length > 1 && (
        <div className="ready-waiting">
          <div className="ready-waiting-title">รอรับถัดไป</div>
          <div className="queue-tiles">
            {waiting.map((receipt, index) => (
              <div className="queue-tile" key={receipt.orderId}>
                <div className="queue-tile-number">
                  {index === 0 ? "คิวปัจจุบัน" : "คิวถัดไป"} #{receipt.queueNumber}
                </div>
                <div className="queue-tile-name">{receipt.customerName}</div>
                <div className="queue-tile-meta">
                  {formatDateTime(receipt.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {receipts.length === 0 && (
        <div className="empty-state">
          <span className="emoji">📭</span>
          ยังไม่มีออเดอร์ในระบบ
        </div>
      )}

      <div className="actions-row" style={{ justifyContent: "center", marginTop: 24 }}>
        <Link href="/" className="btn btn-ghost">
          ← กลับหน้าเมนู
        </Link>
        {isAdmin && (
          <Link href="/admin" className="btn btn-primary">
            🛠️ แผงแอดมิน
          </Link>
        )}
      </div>
    </div>
  );
}