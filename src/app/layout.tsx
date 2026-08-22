import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Courier_Prime } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-bodoni",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-archivo",
});

const courier = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: "thespot.lol",
  description: "rank is the money. that is the whole thing.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodoni.variable} ${archivo.variable} ${courier.variable}`}>
        {children}
        <footer className="site-footer column">
          <span>thespot.lol</span>
          <Link href="/rules">rules</Link>
          <Link href="/about">about</Link>
          <Link href="/terms">terms</Link>
          <Link href="/privacy">privacy</Link>
          <Link href="/refunds">refunds</Link>
        </footer>
      </body>
    </html>
  );
}
