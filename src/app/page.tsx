"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store/StoreProvider";
import { CATEGORY_LABEL } from "@/lib/data/menu";
import type { Category } from "@/lib/models/types";
import { MenuImage } from "@/components/MenuImage";
import { formatBaht } from "@/lib/format";

const CATEGORIES: Category[] = ["drink", "food", "bakery"];

export default function MenuPage() {
  const { menu } = useStore();
  const [active, setActive] = useState<Category>("drink");

  const items = menu.filter((item) => item.getCategory() === active);

  return (
    <div>
      <h1 className="page-title">สวัสดี สั่งง่ายสั่งได้เลย ☕</h1>
      <p className="page-subtitle">
        เลือกเมนูแล้วปรับแต่งตามใจ ไม่ต้องต่อคิว ไม่ต้องเรียกพนักงาน
      </p>

      <div className="tabs" role="tablist">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`tab-btn ${active === category ? "active" : ""}`}
            onClick={() => setActive(category)}
          >
            {CATEGORY_LABEL[category]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🍽️</span>
          ยังไม่มีเมนูในหมวดนี้
        </div>
      ) : (
        <div className="menu-grid">
          {items.map((item) => (
            <Link
              key={item.getId()}
              href={`/item/${item.getId()}`}
              className="menu-card"
            >
              <MenuImage
                src={item.getImage()}
                alt={item.getName()}
                emoji={item.getEmoji()}
                size={72}
              />
              <span className="name">{item.getName()}</span>
              <span className="desc">{item.getDescription()}</span>
              <span className="row">
                <span className="price">{formatBaht(item.getBasePrice())}</span>
                {item.getCategory() === "drink" ? (
                  <span className="badge">ปรับแต่งได้</span>
                ) : (
                  <span className="badge">+ ใส่ตะกร้า</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}