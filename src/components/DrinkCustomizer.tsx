"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drink, DRINK_TOPPINGS } from "@/lib/models/Drink";
import type { DrinkOptions, Size, Temperature, ToppingId } from "@/lib/models/types";
import { useStore } from "@/lib/store/StoreProvider";
import { formatBaht } from "@/lib/format";

const SIZES: { value: Size; label: string; delta: number }[] = [
  { value: "S", label: "S", delta: 0 },
  { value: "M", label: "M", delta: 15 },
  { value: "L", label: "L", delta: 30 },
];

const TEMPERATURES: { value: Temperature; label: string; emoji: string }[] = [
  { value: "hot", label: "ร้อน", emoji: "🔥" },
  { value: "cold", label: "เย็น", emoji: "🧊" },
];

const SWEETNESS: number[] = [0, 25, 50, 75, 100];

export function DrinkCustomizer({ item }: { item: Drink }) {
  const router = useRouter();
  const { addToCart } = useStore();

  const [options, setOptions] = useState<DrinkOptions>(() =>
    item.getDefaultOptions()
  );
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);

  function setSize(size: Size) {
    setOptions((prev) => ({ ...prev, size }));
  }

  function setTemperature(temperature: Temperature) {
    setOptions((prev) => ({ ...prev, temperature }));
  }

  function setSweetness(sweetnessPercent: number) {
    setOptions((prev) => ({ ...prev, sweetnessPercent }));
  }

  function toggleTopping(id: ToppingId) {
    setOptions((prev) => {
      const has = prev.toppings.includes(id);
      return {
        ...prev,
        toppings: has
          ? prev.toppings.filter((t) => t !== id)
          : [...prev.toppings, id],
      };
    });
  }

  const price = item.getPrice(options);

  function handleAdd() {
    addToCart(item.getId(), options, quantity);
    setShowToast(true);
    window.setTimeout(() => {
      router.push("/cart");
    }, 450);
  }

  return (
    <div>
      <div className="card customizer-options">
        <div className="option-group">
          <div className="option-group-title">ขนาด (เลือก 1 อย่าง)</div>
          <div className="chips">
            {SIZES.map((size) => (
              <button
                key={size.value}
                className={`chip ${options.size === size.value ? "active" : ""}`}
                onClick={() => setSize(size.value)}
              >
                {size.label}
                <span className="sub"> (+{size.delta})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-group-title">อุณหภูมิ (เลือก 1 อย่าง)</div>
          <div className="chips">
            {TEMPERATURES.map((temp) => (
              <button
                key={temp.value}
                className={`chip ${
                  options.temperature === temp.value ? "active" : ""
                }`}
                onClick={() => setTemperature(temp.value)}
              >
                {temp.emoji} {temp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-group-title">ความหวาน (เลือก 1 อย่าง)</div>
          <div className="chips">
            {SWEETNESS.map((level) => (
              <button
                key={level}
                className={`chip ${
                  options.sweetnessPercent === level ? "active" : ""
                }`}
                onClick={() => setSweetness(level)}
              >
                {level === 100 ? "ปกติ" : `${level}%`}
              </button>
            ))}
          </div>
        </div>

        <div className="option-group">
          <div className="option-group-title">ท็อปปิ้ง (เลือกได้หลายอย่าง)</div>
          <div className="chips">
            {DRINK_TOPPINGS.map((top) => {
              const selected = options.toppings.includes(top.id);
              return (
                <button
                  key={top.id}
                  className={`chip ${selected ? "active" : ""}`}
                  onClick={() => toggleTopping(top.id)}
                >
                  {top.name}
                  <span className="sub"> (+{top.price})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="option-group">
          <div className="option-group-title">จำนวน</div>
          <div className="qty-stepper">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span className="qty">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="summary">
        <div className="summary-row">
          <span>ราคาเริ่มต้น</span>
          <span>{formatBaht(item.getBasePrice())}</span>
        </div>
        <div className="summary-row">
          <span>รวมตัวเลือก</span>
          <span>{formatBaht(price - item.getBasePrice())}</span>
        </div>
        <div className="summary-row total">
          <span>รวม ({quantity} แก้ว)</span>
          <span>{formatBaht(price * quantity)}</span>
        </div>
      </div>

      <div className="sticky-cta">
        <button
          type="button"
          className="btn btn-accent btn-block"
          onClick={handleAdd}
        >
          เพิ่ม {quantity} แก้วลงตะกร้า · {formatBaht(price * quantity)}
        </button>
      </div>

      {showToast && <div className="toast">เพิ่มลงตะกร้าแล้ว ✓</div>}
    </div>
  );
}
