"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { CATEGORY_LABEL } from "@/lib/data/menu";
import type { Category, MenuDraft } from "@/lib/models/types";
import { MenuImage } from "@/components/MenuImage";
import { resizeImage } from "@/lib/image";
import { formatBaht, formatDateTime } from "@/lib/format";

const CATEGORIES: Category[] = ["drink", "food", "bakery"];

type AdminTab = "menu" | "orders";

const EMPTY_DRAFT: MenuDraft = {
  name: "",
  description: "",
  emoji: "☕",
  category: "drink",
  basePrice: 50,
  image: "",
};

function AdminLogin() {
  const { loginAdmin } = useStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit() {
    const ok = loginAdmin(password);
    if (!ok) {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div>
      <h1 className="page-title">🛠️ แผงแอดมิน</h1>
      <div className="card" style={{ maxWidth: 380, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>🔒</span>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>
            เข้าสู่ระบบสำหรับพนักงาน
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            เฉพาะผู้ดูแลร้านเท่านั้น
          </div>
        </div>
        <div className="field">
          <label>รหัสผ่าน</label>
          <div className="password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="••••••••"
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈 ซ่อน" : "👁️ แสดง"}
            </button>
          </div>
        </div>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 10 }}>
            รหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง
          </div>
        )}
        <div className="actions-row" style={{ marginTop: 4 }}>
          <Link href="/" className="btn btn-ghost">
            ← กลับหน้าเมนู
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={password.length === 0}
            onClick={handleSubmit}
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const {
    menu,
    receipts,
    isAdmin,
    logoutAdmin,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>("menu");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MenuDraft>(EMPTY_DRAFT);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("เลือกได้เฉพาะไฟล์รูปภาพ");
      return;
    }
    setUploadError("");
    try {
      const dataUrl = await resizeImage(file);
      setDraft((prev) => ({ ...prev, image: dataUrl }));
    } catch {
      setUploadError("อ่านรูปไม่สำเร็จ ลองเลือกไฟล์อื่น");
    }
  }

  function startEdit(id: string) {
    const item = menu.find((entry) => entry.getId() === id);
    if (!item) return;
    setEditingId(id);
    setDraft({
      name: item.getName(),
      description: item.getDescription(),
      emoji: item.getEmoji(),
      category: item.getCategory(),
      basePrice: item.getBasePrice(),
      image: item.getImage(),
    });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function handleSubmit() {
    if (!draft.name.trim()) return;
    const payload: MenuDraft = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      basePrice: Math.max(1, Math.floor(Number(draft.basePrice) || 0)),
    };
    if (editingId) {
      updateMenuItem(editingId, payload);
    } else {
      addMenuItem(payload);
    }
    resetForm();
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div>
      <div className="admin-banner">
        <span className="title">
          🛡️ โหมดแอดมิน (เฉพาะพนักงาน)
        </span>
        <span className="note">
          ลูกค้าไม่เห็นข้อมูลนี้ — ออกจากระบบเมื่อเลิกใช้งาน
        </span>
        <button type="button" className="btn btn-sm" onClick={logoutAdmin}>
          🚪 ออกจากระบบ
        </button>
      </div>

      <h1 className="page-title" style={{ marginTop: 0 }}>
        🛠️ แผงแอดมิน
      </h1>

      <div className="tabs">
        <button
          className={`tab-btn ${tab === "menu" ? "active" : ""}`}
          onClick={() => setTab("menu")}
        >
          📋 จัดการเมนู
        </button>
        <button
          className={`tab-btn ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          🧾 ประวัติออเดอร์ ({receipts.length})
        </button>
      </div>

      {tab === "menu" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: 18 }}>
              {editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
            </h2>
            <div className="field">
              <label>ชื่อเมนู</label>
              <input
                value={draft.name}
                placeholder="เช่น Caramel Macchiato"
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="field">
                <label>Emoji (ตัวสำรอง)</label>
                <input
                  value={draft.emoji}
                  onChange={(e) => setDraft((prev) => ({ ...prev, emoji: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>ราคา (บาท)</label>
                <input
                  type="number"
                  min="1"
                  value={draft.basePrice}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, basePrice: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>ภาพสินค้า</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 อัปโหลดจากเครื่อง
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, image: "" }))
                  }
                >
                  ✕ ล้างรูป
                </button>
                <MenuImage
                  src={draft.image}
                  alt="ตัวอย่าง"
                  emoji={draft.emoji}
                  size={56}
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <input
                value={draft.image}
                placeholder="http://... หรือ /menu/รูป.svg (วาง URL ก็ได้)"
                onChange={(e) => setDraft((prev) => ({ ...prev, image: e.target.value }))}
              />
              {uploadError && (
                <div style={{ color: "var(--danger)", fontSize: 14, marginTop: 6 }}>
                  {uploadError}
                </div>
              )}
            </div>
            <div className="field">
              <label>หมวดหมู่</label>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: e.target.value as Category,
                  }))
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABEL[category]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>รายละเอียด</label>
              <textarea
                rows={2}
                value={draft.description}
                placeholder="บอกเล่าความอร่อยของเมนูนี้"
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="actions-row" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
              </button>
              {editingId && (
                <button className="btn btn-ghost" onClick={resetForm}>
                  ยกเลิก
                </button>
              )}
            </div>
          </div>

          <div className="admin-list">
            {menu.map((item) => (
              <div className="admin-row" key={item.getId()}>
                <MenuImage
                  src={item.getImage()}
                  alt={item.getName()}
                  emoji={item.getEmoji()}
                  size={42}
                />
                <div className="info">
                  <div className="name">{item.getName()}</div>
                  <div className="category">
                    {CATEGORY_LABEL[item.getCategory()]} · {formatBaht(item.getBasePrice())}
                  </div>
                </div>
                <div className="actions-row" style={{ margin: 0, flexWrap: "nowrap" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => startEdit(item.getId())}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteMenuItem(item.getId())}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <>
          {receipts.length === 0 ? (
            <div className="empty-state">
              <span className="emoji">📭</span>
              ยังไม่มีออเดอร์
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {receipts.map((receipt) => (
                <div className="order-row" key={receipt.orderId}>
                  <div className="head">
                    <div>
                      <strong>
                        {receipt.queueNumber !== null
                          ? `คิว #${receipt.queueNumber}`
                          : "จ่ายผ่าน QR"}
                      </strong>
                      <div className="meta">
                        {formatDateTime(receipt.timestamp)} · {receipt.orderId}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>{receipt.customerName}</strong>
                      <div className="meta">{receipt.paymentLabel}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    {receipt.lines.map((line, index) => (
                      <div className="receipt-line" key={index}>
                        <span>
                          {line.quantity}× {line.name}
                          {line.optionsLabel && line.optionsLabel !== "—"
                            ? ` (${line.optionsLabel})`
                            : ""}
                        </span>
                        <span>{formatBaht(line.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="receipt-footer"
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span className="meta">
                      {receipt.refCode ? `Ref: ${receipt.refCode}` : ""}
                    </span>
                    <strong>{formatBaht(receipt.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}