"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

export function Nav() {
  const path = usePathname();
  const { count } = useCart();
  const hide = path.startsWith("/order/") || path.startsWith("/desk") || path.startsWith("/dispatch");
  if (hide) return null;
  return (
    <header className="nav no-print">
      <Link href="/" className="wordmark">
        Cartaholics
      </Link>
      <nav className="nav-links">
        <Link href="/archive" aria-current={path.startsWith("/archive") ? "page" : undefined}>
          Archive
        </Link>
        <Link href="/shipping" aria-current={path.startsWith("/shipping") ? "page" : undefined}>
          Ship
        </Link>
        <Link href="/bag" aria-current={path.startsWith("/bag") ? "page" : undefined}>
          Bag{count > 0 ? <span className="bag-count">{count}</span> : null}
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  const path = usePathname();
  const hide = path.startsWith("/order/");
  if (hide) return null;
  return (
    <footer className="footer no-print">
      <span>01 shirts</span>
      <span>meanjin</span>
      <span className="ornament">/</span>
    </footer>
  );
}
