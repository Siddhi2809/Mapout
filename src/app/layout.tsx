import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Sunyash & MapOut24 ERP | OBD Cables Manufacturing System",
  description: "Complete Inventory, BOM, Production Assembly, CRM & ERP System for Sunyash Multi Trading Pvt Ltd / MapOut24.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
