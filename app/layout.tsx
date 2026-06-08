import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Metas Mauá 2026",
  description: "Gestão de metas corporativas — Estaleiro Mauá",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("h-full", inter.className, "font-sans", geist.variable)}>
      <body className="min-h-full bg-surface text-text flex flex-col">
        {children}
      </body>
    </html>
  );
}
