import type { Metadata } from "next";
import { Cormorant_Garamond, Oswald } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { Datamosh } from "@/components/Datamosh";
import { Footer, Nav } from "@/components/Nav";
import "./globals.css";

export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const sans = Oswald({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cartaholics",
  description: "The body moved on. The cloth did not. Archive 01 — shirts. Pickup in Brisbane / Meanjin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className={`${display.variable} ${sans.variable}`}>
        <div className="grain" aria-hidden="true" />
        <div className="scan" aria-hidden="true" />
        <Datamosh />
        <CartProvider>
          <div className="site">
            <Nav />
            {children}
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
