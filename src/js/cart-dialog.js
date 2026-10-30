import {
  addItem,
  applyCoupon,
  clearCart,
  getCartSummary,
  removeCoupon,
  removeItem,
  setQuantity,
  subscribe,
} from '@/js/cart.js';
import { productArt } from '@/js/art.js';
import { ICONS } from '@/js/icons.js';
import { getPurchaseLimit } from '@/js/products.js';
import { buildOrderMessage, buildWhatsAppUrl } from '@/js/whatsapp.js';
import { bindDismiss, notify } from '@/js/ui.js';
import { $, escapeHtml, formatCOP } from '@/js/utils.js';

export function addToCart(id, quantity = 1) {
  const result = addItem(id, quantity);
  if (!result.ok) {
    notify(
      result.reason === 'out-of-stock'
        ? 'Este producto está agotado'
        : `Ya tienes el máximo disponible (${result.limit}) de este producto`,
      'error',
    );
    return;
  }

  const button = $('#cart-toggle');
  button.classList.remove('is-bumping');
  void button.offsetWidth;
  button.classList.add('is-bumping');

  if (result.added < quantity) {
    notify(`Solo se agregaron ${result.added} unidad(es). El límite es ${result.limit}`, 'warning');
    return;
  }
  notify(`${result.product.name} agregado al carrito`);
}

function renderCartLines(items) {
  return `<ul class="cart-lines">${items
    .map(({ product, qty, lineTotal }) => {
      const limit = getPurchaseLimit(product);
      const name = escapeHtml(product.name);
      return `
      <li class="cart-line" data-id="${escapeHtml(product.id)}">
        <div class="cart-line-thumb">${productArt(product)}</div>
        <div class="cart-line-info">
          <p class="cart-line-name">${name}</p>
          <p class="cart-line-unit">${formatCOP(product.price)} c/u</p>
          <div class="stepper" role="group" aria-label="Cantidad de ${name}">
            <button type="button" class="stepper-btn" data-action="decrease" aria-label="Disminuir cantidad" ${qty <= 1 ? 'disabled' : ''}>${ICONS.minus}</button>
            <span class="stepper-value" aria-live="polite">${qty}</span>
            <button type="button" class="stepper-btn" data-action="increase" aria-label="Aumentar cantidad" ${qty >= limit ? 'disabled' : ''}>${ICONS.plus}</button>
          </div>
        </div>
        <div class="cart-line-side">
          <p class="cart-line-total">${formatCOP(lineTotal)}</p>
          <button type="button" class="icon-btn icon-btn-danger" data-action="remove" aria-label="Eliminar ${name}">${ICONS.trash}</button>
        </div>
      </li>`;
    })
    .join('')}</ul>`;
}

export function initCartDialogs() {
  const el = {
    toggle: $('#cart-toggle'),
    count: $('#cart-count'),
    cartDialog: $('#cart-dialog'),
    cartBody: $('#cart-body'),
    cartFooter: $('#cart-footer'),
    cartSubtotal: $('#cart-subtotal'),
    checkout: $('#cart-checkout'),
    clear: $('#cart-clear'),
    summaryDialog: $('#summary-dialog'),
    summaryItems: $('#summary-items'),
    sumSubtotal: $('#sum-subtotal'),
    sumOffers: $('#sum-offers'),
    sumCouponRow: $('#sum-coupon-row'),
    sumCouponLabel: $('#sum-coupon-label'),
    sumCoupon: $('#sum-coupon'),
    couponRemove: $('#coupon-remove'),
    couponForm: $('#coupon-form'),
    couponInput: $('#coupon-input'),
    couponMessage: $('#coupon-message'),
    sumTotal: $('#sum-total'),
    confirm: $('#confirm-order'),
  };

  bindDismiss(el.cartDialog);
  bindDismiss(el.summaryDialog);

  function renderCart() {
    const summary = getCartSummary();
    el.count.textContent = summary.count;
    el.count.hidden = summary.count === 0;
    el.toggle.setAttribute('aria-label', `Abrir carrito, ${summary.count} productos`);

    if (summary.items.length === 0) {
      el.cartBody.innerHTML = `
        <div class="cart-empty">
          <p>Tu carrito está vacío.</p>
          <button type="button" class="btn btn-ghost" data-close-dialog>Explorar catálogo</button>
        </div>`;
      el.cartFooter.hidden = true;
      return;
    }

    el.cartBody.innerHTML = renderCartLines(summary.items);
    el.cartSubtotal.textContent = formatCOP(summary.subtotal);
    el.cartFooter.hidden = false;
  }

  function renderSummary() {
    const summary = getCartSummary();
    el.summaryItems.innerHTML = summary.items
      .map(
        ({ product, qty, lineTotal }) => `
        <li class="summary-item">
          <span>${escapeHtml(product.name)} <span class="summary-qty">x ${qty}</span></span>
          <strong>${formatCOP(lineTotal)}</strong>
        </li>`,
      )
      .join('');
    el.sumSubtotal.textContent = formatCOP(summary.subtotal);
    el.sumOffers.textContent = summary.offerSavings > 0 ? `-${formatCOP(summary.offerSavings)}` : formatCOP(0);
    el.sumCouponRow.hidden = !summary.couponCode;
    el.sumCouponLabel.textContent = summary.couponCode ? `Cupón ${summary.couponCode} (${summary.couponPercent}%)` : '';
    el.sumCoupon.textContent = `-${formatCOP(summary.couponDiscount)}`;
    el.sumTotal.textContent = formatCOP(summary.total);
    el.confirm.disabled = summary.count === 0;
  }

  function setCouponMessage(text, tone = '') {
    el.couponMessage.textContent = text;
    el.couponMessage.className = `form-message ${tone}`.trim();
  }

  function renderAll() {
    renderCart();
    renderSummary();
  }

  el.toggle.addEventListener('click', () => {
    renderCart();
    el.cartDialog.showModal();
  });

  el.cartBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const line = button.closest('[data-id]');
    if (!line) return;
    const id = line.dataset.id;
    const current = getCartSummary().items.find((item) => item.product.id === id);
    if (!current) return;

    if (button.dataset.action === 'increase') setQuantity(id, current.qty + 1);
    if (button.dataset.action === 'decrease') setQuantity(id, current.qty - 1);
    if (button.dataset.action === 'remove') removeItem(id);
  });

  el.clear.addEventListener('click', () => {
    if (window.confirm('¿Seguro que quieres vaciar el carrito?')) clearCart();
  });

  el.checkout.addEventListener('click', () => {
    el.cartDialog.close();
    setCouponMessage('');
    renderSummary();
    el.summaryDialog.showModal();
  });

  el.couponForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = applyCoupon(el.couponInput.value);
    if (!result.ok) {
      setCouponMessage('Cupón no válido. Revisa el código e intenta de nuevo.', 'is-error');
      return;
    }
    el.couponInput.value = '';
    setCouponMessage(`Cupón ${result.code} aplicado: ${result.percent}% de descuento.`, 'is-success');
  });

  el.couponRemove.addEventListener('click', () => {
    removeCoupon();
    setCouponMessage('Cupón eliminado.');
  });

  el.confirm.addEventListener('click', () => {
    const url = buildWhatsAppUrl(buildOrderMessage(getCartSummary()));
    window.open(url, '_blank', 'noopener');
  });

  subscribe(renderAll);
  renderAll();
}
