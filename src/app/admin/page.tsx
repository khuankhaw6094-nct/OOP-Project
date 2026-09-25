"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store/StoreProvider";
import { CATEGORY_LABEL } from "@/lib/data/menu";
import type { Category, MenuDraft, PaymentReceipt } from "@/lib/models/types";
import { MenuImage } from "@/components/MenuImage";
import { resizeImage } from "@/lib/image";
import { formatBaht, formatDateTime } from "@/lib/format";

const CATEGORIES: Category[] = ["drink", "food", "bakery"];

type AdminTab = "menu" | "orders";

const TOGGLE_COOLDOWN_MS = 700;

// ออเดอร์ที่ยังไม่เสร็จอยู่บนสุด (ใหม่ก่อน), ออเดอร์ที่เสร็จแล้วอยู่ล่างสุด
function sortReceiptIds(receipts: PaymentReceipt[]): string[] {
  return [...receipts]
    .sort((a, b) => {
      const aDone = !!a.completed;
      const bDone = !!b.completed;
      if (aDone !== bDone) return aDone ? 1 : -1;
      return b.timestamp - a.timestamp;
    })
    .map((receipt) => receipt.orderId);
}

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
  const router = useRouter();
  const {
    menu,
    receipts,
    isAdmin,
    logoutAdmin,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleOrderCompleted,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>("menu");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MenuDraft>(EMPTY_DRAFT);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastToggleRef = useRef({ orderId: "", at: 0 });

  // ลำดับการ์ดออเดอร์ถูก "แช่" ไว้ — กดเสร็จ/ยังไม่ได้ทำแล้วการ์ดอยู่ที่เดิม เปลี่ยนแค่สี
  // (เดิมเรียงใหม่ทันทีที่กด การ์ดถัดไปเลื่อนขึ้นมาใต้เมาส์ คลิกซ้ำจึงไปโดนออเดอร์อื่นโดยไม่ตั้งใจ)
  // จะเรียงใหม่ก็ต่อเมื่อเปิดแท็บประวัติออเดอร์ หรือมีออเดอร์เข้า/ออก
  const receiptIdsKey = receipts.map((receipt) => receipt.orderId).join("|");
  const [sortedForKey, setSortedForKey] = useState<string | null>(null);
  const [orderSequence, setOrderSequence] = useState<string[]>([]);
  if (sortedForKey !== receiptIdsKey) {
    setSortedForKey(receiptIdsKey);
    setOrderSequence(sortReceiptIds(receipts));
  }

  function openOrdersTab() {
    setOrderSequence(sortReceiptIds(receipts));
    setTab("orders");
  }

  // กันดับเบิลคลิกปุ่มเดิม (จะสลับ 2 รอบจนเหมือนไม่ได้กด) — ออเดอร์อื่นกดต่อกันได้ทันที
  function handleToggleCompleted(orderId: string, clickedAt: number) {
    const last = lastToggleRef.current;
    if (last.orderId === orderId && clickedAt - last.at < TOGGLE_COOLDOWN_MS) return;
    lastToggleRef.current = { orderId, at: clickedAt };
    toggleOrderCompleted(orderId);
  }

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
    setFormError("");
    setUploadError("");
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
    setFormError("");
    setUploadError("");
  }

  function handleDelete(id: string, name: string) {
    // กด "ยกเลิก" — ไม่ลบอะไรเลย
    if (!window.confirm(`ยืนยันลบเมนู "${name}" ใช่หรือไม่?`)) return;
    deleteMenuItem(id);
    // ลบเมนูที่กำลังแก้ไขอยู่ — ออกจากโหมดแก้ไข ไม่ให้ฟอร์มค้างข้อมูลของเมนูที่ไม่มีแล้ว
    if (editingId === id) resetForm();
  }

  function handleSubmit() {
    if (!draft.name.trim()) {
      setFormError("กรุณาใส่ชื่อเมนู");
      return;
    }
    const price = Math.floor(Number(draft.basePrice));
    if (!Number.isFinite(price) || price < 1) {
      setFormError("ราคาต้องเป็นตัวเลขตั้งแต่ 1 บาทขึ้นไป");
      return;
    }
    const payload: MenuDraft = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      basePrice: price,
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

  const receiptById = new Map(receipts.map((receipt) => [receipt.orderId, receipt]));
  const sortedReceipts = orderSequence
    .map((orderId) => receiptById.get(orderId))
    .filter((receipt): receipt is PaymentReceipt => receipt !== undefined);

  return (
    <div>
      <div className="admin-banner">
        <span className="title">
          🛡️ โหมดแอดมิน (เฉพาะพนักงาน)
        </span>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            logoutAdmin();
            router.push("/");
          }}
        >
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
          onClick={openOrdersTab}
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
                placeholder="http://... หรือ /menu/รูป.jpg (วาง URL ก็ได้)"
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
            {formError && (
              <div style={{ color: "var(--danger)", fontSize: 14, marginBottom: 8 }}>
                {formError}
              </div>
            )}
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
                    onClick={() => handleDelete(item.getId(), item.getName())}
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
              {sortedReceipts.map((receipt) => {
                const isDone = !!receipt.completed;
                return (
                  <div
                    className={`order-card ${
                      isDone ? "order-card--done" : "order-card--pending"
                    }`}
                    key={receipt.orderId}
                  >
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
                    {receipt.slip && (
                      <div style={{ marginTop: 8 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={receipt.slip}
                          alt="สลิปโอนเงิน"
                          className="slip-thumb"
                        />
                      </div>
                    )}
                    <div
                      className="receipt-footer"
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span className="meta">
                        {receipt.refCode ? `Ref: ${receipt.refCode}` : ""}
                      </span>
                      <strong>{formatBaht(receipt.total)}</strong>
                    </div>
                    <div style={{ marginTop: 10, textDecoration: "none" }}>
                      <button
                        type="button"
                        className={isDone ? "btn btn-ghost btn-sm" : "btn btn-primary btn-sm"}
                        onClick={(e) => handleToggleCompleted(receipt.orderId, e.timeStamp)}
                        aria-pressed={isDone}
                        title={
                          isDone
                            ? "กดเพื่อเปลี่ยนกลับเป็นยังไม่ได้ทำ"
                            : "กดเพื่อเปลี่ยนเป็นเสร็จเรียบร้อยแล้ว"
                        }
                      >
                        {/* ข้อความบอก "สถานะปัจจุบัน" ไม่ใช่สิ่งที่จะเกิดเมื่อกด */}
                        {isDone ? "✅ เสร็จเรียบร้อยแล้ว" : "ยังไม่ได้ทำ"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}