"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

const KEY = "cartaholics-bag";

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  add: (item: CartItem) => void;
  setQty: (productId: number, size: string, qty: number) => void;
  setSize: (productId: number, from: string, to: string) => void;
  remove: (productId: number, size: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === item.productId && x.size === item.size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((productId: number, size: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.productId === productId && x.size === size ? { ...x, qty } : x))
        .filter((x) => x.qty > 0)
    );
  }, []);

  const setSize = useCallback((productId: number, from: string, to: string) => {
    setItems((prev) => {
      const moving = prev.find((x) => x.productId === productId && x.size === from);
      if (!moving) return prev;
      const rest = prev.filter((x) => !(x.productId === productId && x.size === from));
      const existing = rest.find((x) => x.productId === productId && x.size === to);
      if (existing) {
        return rest.map((x) =>
          x.productId === productId && x.size === to ? { ...x, qty: x.qty + moving.qty } : x
        );
      }
      return [...rest, { ...moving, size: to }];
    });
  }, []);

  const remove = useCallback((productId: number, size: string) => {
    setItems((prev) => prev.filter((x) => !(x.productId === productId && x.size === size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      add,
      setQty,
      setSize,
      remove,
      clear,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.priceCents * i.qty, 0),
    }),
    [items, ready, add, setQty, setSize, remove, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart needs CartProvider");
  return ctx;
}
