import { COUPONS } from '@/js/data.js';
import { findProduct, getPurchaseLimit } from '@/js/products.js';

const STORAGE_KEY = 'nexus-gamer-cart';
const listeners = new Set();

const emptyState = () => ({ items: [], coupon: null });

function sanitizeItem(raw) {
  const product = findProduct(raw?.id);
  const qty = Number(raw?.qty);
  if (!product || !Number.isInteger(qty)) return [];
  const limit = getPurchaseLimit(product);
  if (limit < 1) return [];
  return [{ id: product.id, qty: Math.min(Math.max(qty, 1), limit) }];
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return emptyState();
    return {
      items: Array.isArray(saved.items) ? saved.items.flatMap(sanitizeItem) : [],
      coupon: Object.hasOwn(COUPONS, saved.coupon) ? saved.coupon : null,
    };
  } catch {
    return emptyState();
  }
}

let state = loadState();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota); the cart still works for this session.
  }
}

function commit(nextState) {
  state = nextState;
  persist();
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
}

export function getQuantityInCart(id) {
  return state.items.find((item) => item.id === id)?.qty ?? 0;
}

export function addItem(id, quantity = 1) {
  const product = findProduct(id);
  if (!product || product.stock < 1) return { ok: false, reason: 'out-of-stock' };

  const limit = getPurchaseLimit(product);
  const current = getQuantityInCart(id);
  if (current >= limit) return { ok: false, reason: 'limit', limit };

  const nextQty = Math.min(current + quantity, limit);
  const items = state.items.some((item) => item.id === id)
    ? state.items.map((item) => (item.id === id ? { ...item, qty: nextQty } : item))
    : [...state.items, { id, qty: nextQty }];
  commit({ ...state, items });
  return { ok: true, product, added: nextQty - current, limit };
}

export function setQuantity(id, quantity) {
  const product = findProduct(id);
  const qty = Number(quantity);
  if (!product || !Number.isInteger(qty)) return;
  const clamped = Math.min(Math.max(qty, 1), getPurchaseLimit(product));
  commit({
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, qty: clamped } : item)),
  });
}

export function removeItem(id) {
  commit({ ...state, items: state.items.filter((item) => item.id !== id) });
}

export function clearCart() {
  commit(emptyState());
}

export function applyCoupon(code) {
  const normalized = String(code ?? '').trim().toUpperCase();
  if (!Object.hasOwn(COUPONS, normalized)) return { ok: false };
  commit({ ...state, coupon: normalized });
  return { ok: true, code: normalized, percent: COUPONS[normalized].percent };
}

export function removeCoupon() {
  commit({ ...state, coupon: null });
}

export function getCartSummary() {
  const items = state.items
    .map(({ id, qty }) => {
      const product = findProduct(id);
      return {
        product,
        qty,
        lineTotal: product.price * qty,
        lineListTotal: (product.oldPrice ?? product.price) * qty,
      };
    });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const listTotal = items.reduce((sum, item) => sum + item.lineListTotal, 0);
  const couponPercent = state.coupon ? COUPONS[state.coupon].percent : 0;
  const couponDiscount = Math.round((subtotal * couponPercent) / 100);

  return {
    items,
    count: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal,
    offerSavings: listTotal - subtotal,
    couponCode: state.coupon,
    couponPercent,
    couponDiscount,
    total: subtotal - couponDiscount,
  };
}
