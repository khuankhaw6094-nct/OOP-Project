"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store/StoreProvider";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const onAdminPage = pathname.startsWith("/admin");
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
          <span>Coffee Tale</span>
          {isAdmin && <span className="tagline admin-tag">โหมดแอดมิน</span>}
        </Link>

        <div className="header-actions">
          {/* แอดมินสั่งซื้อไม่ได้ (/cart ถูกบล็อก) จึงไม่แสดงปุ่มตะกร้าในโหมดแอดมิน */}
          {!isAdmin && (
            <Link href="/cart" className="nav-link">
              🧺 ตะกร้า
              <span className="cart-badge">{itemCount}</span>
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className={`nav-link ${onAdminPage ? "nav-link-active" : ""}`}
              >
                🛠️ แผงแอดมิน
              </Link>
              <button type="button" className="nav-link nav-link-btn" onClick={handleLogout}>
                🚪 ออกจากระบบ
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}