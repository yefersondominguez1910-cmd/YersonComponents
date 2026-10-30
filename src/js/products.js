import { CATEGORIES, MAX_QTY_PER_ITEM, PRODUCTS } from '@/js/data.js';

const DAY_MS = 86_400_000;
const NEW_WINDOW_DAYS = 60;
const BESTSELLER_COUNT = 3;

const bestsellerIds = new Set(
  PRODUCTS.filter((product) => product.sales > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, BESTSELLER_COUNT)
    .map((product) => product.id),
);

export const findProduct = (id) => PRODUCTS.find((product) => product.id === id) ?? null;

export const getCategoryLabel = (id) => CATEGORIES.find((category) => category.id === id)?.label ?? '';

export const hasOffer = (product) => typeof product.oldPrice === 'number' && product.oldPrice > product.price;

export const discountPercent = (product) =>
  hasOffer(product) ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

export const getPurchaseLimit = (product) => Math.min(product.stock, MAX_QTY_PER_ITEM);

export function getBadges(product, now = Date.now()) {
  const badges = [];
  if (bestsellerIds.has(product.id)) badges.push({ type: 'bestseller', label: 'Más vendido' });
  const age = now - Date.parse(product.releasedAt);
  if (age >= 0 && age <= NEW_WINDOW_DAYS * DAY_MS) badges.push({ type: 'new', label: 'Nuevo' });
  if (hasOffer(product)) badges.push({ type: 'offer', label: `Oferta -${discountPercent(product)}%` });
  return badges;
}

export function getStockStatus(product) {
  if (product.stock < 1) return { tone: 'danger', text: 'Agotado' };
  if (product.stock === 1) return { tone: 'warning', text: 'Última unidad' };
  if (product.stock <= 3) return { tone: 'warning', text: `Últimas ${product.stock} unidades` };
  return { tone: 'success', text: 'Disponible' };
}
