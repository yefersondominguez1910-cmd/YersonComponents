import { addToCart, initCartDialogs } from '@/js/cart-dialog.js';
import { initCatalog } from '@/js/catalog.js';
import { PRODUCTS } from '@/js/data.js';
import { productArt } from '@/js/art.js';
import { initContactForm } from '@/js/contact.js';
import { ICONS } from '@/js/icons.js';
import { initProductDialog } from '@/js/product-dialog.js';
import { findProduct } from '@/js/products.js';
import { initNavbar, initReveal } from '@/js/ui.js';
import { $, $$ } from '@/js/utils.js';

const FEATURED_PRODUCT_ID = 'msi-infinite';

function hydrateIcons() {
  $$('[data-icon]').forEach((element) => {
    element.innerHTML = ICONS[element.dataset.icon];
  });
}

function renderHero() {
  const featured = findProduct(FEATURED_PRODUCT_ID);
  if (featured) $('#hero-art').innerHTML = productArt(featured);
  $('#stat-products').textContent = PRODUCTS.length;
}

function init() {
  hydrateIcons();
  renderHero();
  initNavbar();
  initReveal();
  initCartDialogs();
  initContactForm();

  const productDialog = initProductDialog({ onAdd: addToCart });
  const catalog = initCatalog({
    onAdd: addToCart,
    onOpenDetail: (product) => productDialog.open(product),
  });

  $('#nav-offers').addEventListener('click', catalog.showOffers);
  $('#hero-offers').addEventListener('click', catalog.showOffers);
}

init();
