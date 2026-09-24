import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="emoji">🔍</span>
      ไม่พบหน้านี้ (404)
      <div style={{ marginTop: 14 }}>
        <Link href="/" className="btn btn-primary">
          กลับหน้าเมนู
        </Link>
      </div>
    </div>
  );
}