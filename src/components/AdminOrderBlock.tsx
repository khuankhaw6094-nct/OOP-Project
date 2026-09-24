"use client";

import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";

// แอดมินสั่งซื้อไม่ได้ — ต้องออกจากระบบแล้วใช้หน้าลูกค้าแทน
// (ตะกร้าเดิมใน localStorage ไม่ถูกล้าง ออกจากระบบแล้วจะเห็นของเดิมครบ)

export function AdminNoOrderHint() {
  return (
    <p className="admin-order-hint" role="status">
      🔒 โหมดแอดมินไม่สามารถสั่งซื้อได้ ออกจากระบบก่อนเพื่อสั่งซื้อสินค้า
    </p>
  );
}

export function CustomerOnlyNotice() {
  const { logoutAdmin } = useStore();

  return (
    <div className="empty-state">
      <span className="emoji">🔒</span>
      หน้านี้สำหรับลูกค้าเท่านั้น กรุณาออกจากระบบแอดมินก่อนสั่งซื้อสินค้า
      <div className="actions-row" style={{ justifyContent: "center", marginTop: 14 }}>
        <Link href="/admin" className="btn btn-primary">
          🛠️ กลับไปแผงแอดมิน
        </Link>
        <button type="button" className="btn btn-ghost" onClick={logoutAdmin}>
          🚪 ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
