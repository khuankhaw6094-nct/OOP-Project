import type { Metadata } from "next";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coffee Tale",
  description: "ระบบสั่งกาแฟแบบ Self-Order",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <StoreProvider>
          <Header />
          <main className="page-container">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}