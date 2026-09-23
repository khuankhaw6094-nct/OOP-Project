"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/StoreProvider";

export function Header() {
  const router = useRouter();
  const { cart, isAdmin, logoutAdmin } = useStore();
  const itemCount = cart.getItemCount();

  function handleLogout() {
    logoutAdmin();
    router.push("/");
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span>☕</span>
          <span>Grind &amp; Co.</span>
          {isAdmin ? (
            <span className="tagline admin-tag">โหมดแอดมิน</span>
          ) : (
            <span className="tagline">Coffee Tale</span>
          )}
        </Link>

        <div className="header-actions">
          {isAdmin ? (
            <>
              <Link href="/" className="nav-link">
                👥 หน้าร้านลูกค้า
              </Link>
              <Link href="/admin" className="nav-link nav-link-active">
                🛠️ แผงแอดมิน
              </Link>
              <button type="button" className="nav-link nav-link-btn" onClick={handleLogout}>
                🚪 ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <Link href="/cart" className="nav-link">
                🧺 ตะกร้า
                <span className="cart-badge">{itemCount}</span>
              </Link>
              <Link href="/admin" className="nav-link nav-link-staff">
                🔐 สำหรับพนักงาน
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}