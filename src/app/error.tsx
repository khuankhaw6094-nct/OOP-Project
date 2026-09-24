"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="emoji">⚠️</span>
      เกิดข้อผิดพลาดขึ้น
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
        {error.message}
      </div>
      <div className="actions-row" style={{ justifyContent: "center", marginTop: 14 }}>
        <button type="button" className="btn btn-primary" onClick={reset}>
          ลองใหม่อีกครั้ง
        </button>
        <Link href="/" className="btn btn-ghost">
          กลับหน้าเมนู
        </Link>
      </div>
    </div>
  );
}