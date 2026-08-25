"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/types";

export type CartLine = {
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  formats: string[];
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  hydrated: boolean;
  add: (product: Product | CartLine) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "oneupgaming-cart-v1";

/** Cart lines of 3 or more take 10% off — the server re-applies this on checkout. */
const BULK_DISCOUNT_THRESHOLD = 3;
const BULK_DISCOUNT_RATE = 0.1;

function toLine(input: Product | CartLine): CartLine {
  return {
    slug: input.slug,
    name: input.name,
    category: input.category,
    price: input.price,
    image: input.image,
    formats: input.formats ?? [],
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount rather than during render, so server and client HTML match.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(parsed.filter((l): l is CartLine => typeof l?.slug === "string"));
        }
      }
    } catch {
      /* malformed storage — start with an empty cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* quota or private mode — the cart just won't persist */
    }
  }, [lines, hydrated]);

  const add = useCallback((product: Product | CartLine) => {
    const line = toLine(product);
    setLines((prev) => (prev.some((l) => l.slug === line.slug) ? prev : [...prev, line]));
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + l.price, 0);
    const discount =
      lines.length >= BULK_DISCOUNT_THRESHOLD
        ? Math.round(subtotal * BULK_DISCOUNT_RATE * 100) / 100
        : 0;
    return {
      lines,
      count: lines.length,
      subtotal,
      discount,
      total: Math.round((subtotal - discount) * 100) / 100,
      hydrated,
      add,
      remove,
      clear,
      has: (slug: string) => lines.some((l) => l.slug === slug),
    };
  }, [lines, hydrated, add, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
