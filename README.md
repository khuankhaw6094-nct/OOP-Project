# Grind & Co. — Coffee Tale

โปรเจกต์วิชา OOP : ระบบสั่งกาแฟแบบ self-order (web application) สร้างด้วย **Next.js 16 + TypeScript**

## ฟีเจอร์หลัก

- หน้าเมนู แบ่งหมวด (เครื่องดื่ม / อาหาร / ขนมเบเกอรี่)
- ปรับแต่งเครื่องดื่มได้ (ขนาด, น้ำตาล, ความเข้มข้น, ท็อปปิ้ง) — คำนวณราคาแบบ dynamic ผ่าน OOP polymorphism
- ตะกร้าสินค้า + เช็คเอาท์ จ่ายเงินสด (ได้คิวออเดอร์) หรือจ่ายผ่าน QR (พร้อมแนบสลิปโอนเงินแบบรูปภาพ ตรวจชนิดไฟล์แล้วเก็บกับใบเสร็จ)
- ประวัติออเดอร์ + ใบเสร็จ (หน้า `/receipt/[id]`) พร้อมหน้า 404 / error ที่เป็นภาษาไทย
- หน้าแอดมิน `/admin` (รหัส `grind123`) — เพิ่ม / แก้ไข / ลบเมนู, เปลี่ยนรูปสินค้าได้ทั้งจาก URL หรืออัปโหลดจากเครื่อง, ดูประวัติออเดอร์ และทำเครื่องหมายออเดอร์เสร็จ
- ข้อมูลทั้งหมดเก็บใน browser (localStorage) — ไม่ต้องใช้ server

## แนวคิด OOP ที่ใช้

- **Encapsulation** — ฟิลด์ทุกตัวเป็น private, เรียกผ่าน getter
- **Inheritance** — `MenuItem` > `Drink` / `FoodItem` > `BakeryItem`
- **Polymorphism** — `getPrice()` (Drink คิดราคาตามตัวเลือกขนาด/ท็อปปิ้ง, FoodItem คืนราคาฐาน) และ `confirm()` (CashPayment / QRPayment) overridden ในคลาสลูก
- **Composition** — `OrderLine` สร้างสำเนา options ของตัวเอง (ห้าม mutate ข้อมูลต้นทาง)
- **Singleton** — `QueueCounter` สำหรับเลขคิว (กันเลขซ้ำข้ามแท็บด้วย Web Locks API)
- **Interface + Abstract class** — `PaymentMethod` (CashPayment / QRPayment)

## วิธีรัน

```
npm install
npm run dev -- -p 3000
```

หรือเปิด `start.bat` (Windows) — จะรัน dev server แล้วเปิดเบราว์เซอร์ให้อัตโนมัติ

- หน้าแรก: http://localhost:3000
- หน้าแอดมิน: http://localhost:3000/admin (รหัส `grind123`)

## คำสั่งที่ใช้ตรวจสอบคุณภาพ

```
npm run typecheck   # ตรวจ types
npm run lint        # ตรวจ lint
npm run build       # build พร้อมใช้งานจริง
```

## โครงสร้างไฟล์หลัก

```
src/lib/models/        # คลาส OOP ทั้งหมด (MenuItem, Drink, FoodItem, Order, ...)
src/lib/store/         # StoreProvider (React context) + catalogStore (localStorage)
src/lib/data/menu.ts   # เมนูเริ่มต้น
src/app/               # หน้าเว็บ (เมนู, รายละเอียด, ตะกร้า, ใบเสร็จ, แอดมิน)
src/components/        # คอมโพเนนต์ (Header, MenuImage, DrinkCustomizer, ...)
public/menu/           # รูปภาพเริ่มต้นของเมนู
```