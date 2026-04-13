/**
 * store/cartStore.js — Zustand Cart UI Store
 * Source of truth is always the server response.
 * itemCount is computed from items array.
 */

import { create } from 'zustand';

export const useCartStore = create((set) => ({
  items:     [],
  itemCount: 0,
  subtotal:  0,
  shipping:  0,
  total:     0,
  isOpen:    false,

  // Sync from server response: { items, subtotal, shipping, total }
  setCart: (cart) =>
    set({
      items:     cart?.items    ?? [],
      itemCount: (cart?.items   ?? []).reduce((n, i) => n + (i.quantity ?? 1), 0),
      subtotal:  cart?.subtotal ?? 0,
      shipping:  cart?.shipping ?? 0,
      total:     cart?.total    ?? 0,
    }),

  clearCart: () => set({ items: [], itemCount: 0, subtotal: 0, shipping: 0, total: 0 }),

  openCart:   () => set({ isOpen: true }),
  closeCart:  () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}));
