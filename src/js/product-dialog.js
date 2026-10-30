import { getQuantityInCart } from '@/js/cart.js';
import { productArt } from '@/js/art.js';
import { ICONS } from '@/js/icons.js';
import {
  discountPercent,
  getBadges,
  getCategoryLabel,
  getPurchaseLimit,
  getStockStatus,
  hasOffer,
} from '@/js/products.js';
import { bindDismiss } from '@/js/ui.js';
import { $, escapeHtml, formatCOP } from '@/js/utils.js';

export function initProductDialog({ onAdd }) {
  const dialog = $('#product-dialog');
  bindDismiss(dialog);

  let product = null;
  let quantity = 1;

  function updateControls() {
    const limit = getPurchaseLimit(product);
    dialog.querySelector('[data-qty-value]').textContent = quantity;
    dialog.querySelector('[data-action="decrease"]').disabled = quantity <= 1;
    dialog.querySelector('[data-action="increase"]').disabled = quantity >= limit;
    dialog.querySelector('[data-total]').textContent = formatCOP(product.price * quantity);
  }

  function render() {
    const status = getStockStatus(product);
    const inCart = getQuantityInCart(product.id);
    const badges = getBadges(product)
      .map((badge) => `<span class="badge badge-${badge.type}">${escapeHtml(badge.label)}</span>`)
      .join('');
    const oldPrice = hasOffer(product) ? `<s class="price-old">${formatCOP(product.oldPrice)}</s>` : '';
    const discount = hasOffer(product) ? `<span class="discount">-${discountPercent(product)}%</span>` : '';
    const specs = product.specs
      .map(
        ([label, value]) =>
          `<div class="spec-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`,
      )
      .join('');
    const inCartNote = inCart ? ` · ${inCart} en tu carrito` : '';

    dialog.innerHTML = `
      <div class="detail">
        <button type="button" class="icon-btn detail-close" data-close-dialog aria-label="Cerrar detalle">${ICONS.close}</button>
        <div class="detail-media">${productArt(product)}</div>
        <div class="detail-body">
          <div class="badge-row">${badges}</div>
          <p class="product-brand">${escapeHtml(product.brand)} · ${escapeHtml(getCategoryLabel(product.category))}</p>
          <h2 id="product-dialog-title" class="detail-title">${escapeHtml(product.name)}</h2>
          <p class="detail-meta">Calificación ${product.rating.toFixed(1)} de 5 · ${product.sales} unidades vendidas</p>
          <p class="detail-desc">${escapeHtml(product.description)}</p>
          <h3 class="detail-subtitle">Características</h3>
          <dl class="spec-list">${specs}</dl>
          <div class="detail-buy">
            <div class="detail-price">
              <strong class="price-current">${formatCOP(product.price)}</strong>
              ${oldPrice}
              ${discount}
            </div>
            <p class="stock-note stock-${status.tone}">${status.text}${inCartNote}</p>
            <div class="detail-qty">
              <div class="stepper" role="group" aria-label="Cantidad">
                <button type="button" class="stepper-btn" data-action="decrease" aria-label="Disminuir cantidad">${ICONS.minus}</button>
                <span class="stepper-value" data-qty-value aria-live="polite">1</span>
                <button type="button" class="stepper-btn" data-action="increase" aria-label="Aumentar cantidad">${ICONS.plus}</button>
              </div>
              <p class="detail-total">Total <strong data-total></strong></p>
            </div>
            <button type="button" class="btn btn-primary btn-lg btn-block" data-action="add" ${status.tone === 'danger' ? 'disabled' : ''}>
              ${ICONS.cart}<span>Agregar al carrito</span>
            </button>
          </div>
        </div>
      </div>`;
    updateControls();
  }

  dialog.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || !product) return;
    const limit = getPurchaseLimit(product);
    if (button.dataset.action === 'increase') quantity = Math.min(quantity + 1, limit);
    if (button.dataset.action === 'decrease') quantity = Math.max(quantity - 1, 1);
    if (button.dataset.action === 'add') {
      onAdd(product.id, quantity);
      dialog.close();
      return;
    }
    updateControls();
  });

  return {
    open(selected) {
      product = selected;
      quantity = 1;
      render();
      dialog.scrollTop = 0;
      dialog.showModal();
    },
  };
}
