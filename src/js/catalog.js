import { CATEGORIES, PRODUCTS } from '@/js/data.js';
import { productArt } from '@/js/art.js';
import { discountPercent, getBadges, getStockStatus, hasOffer } from '@/js/products.js';
import { $, escapeHtml, formatCOP } from '@/js/utils.js';

const PRICE_RANGES = {
  all: { label: 'Todos los precios', test: () => true },
  under1m: { label: 'Menos de $1.000.000', test: (price) => price < 1_000_000 },
  between: { label: '$1.000.000 a $3.000.000', test: (price) => price >= 1_000_000 && price <= 3_000_000 },
  over3m: { label: 'Más de $3.000.000', test: (price) => price > 3_000_000 },
};

const SORTERS = {
  popular: { label: 'Más populares', compare: (a, b) => b.sales - a.sales },
  'price-asc': { label: 'Precio: menor a mayor', compare: (a, b) => a.price - b.price },
  'price-desc': { label: 'Precio: mayor a menor', compare: (a, b) => b.price - a.price },
  newest: { label: 'Novedades', compare: (a, b) => Date.parse(b.releasedAt) - Date.parse(a.releasedAt) },
};

const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  price: 'all',
  onlyAvailable: false,
  onlyOffers: false,
  sort: 'popular',
};

const normalizeText = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function filterProducts(products, filters) {
  const query = normalizeText(filters.query);
  return products
    .filter((product) => {
      if (filters.category !== 'all' && product.category !== filters.category) return false;
      if (!PRICE_RANGES[filters.price].test(product.price)) return false;
      if (filters.onlyAvailable && product.stock < 1) return false;
      if (filters.onlyOffers && !hasOffer(product)) return false;
      if (!query) return true;
      const categoryLabel = CATEGORIES.find((category) => category.id === product.category)?.label ?? '';
      return normalizeText(`${product.name} ${product.brand} ${product.chip} ${product.summary} ${categoryLabel}`).includes(
        query,
      );
    })
    .sort(SORTERS[filters.sort].compare);
}

function fillSelect(select, options) {
  select.innerHTML = Object.entries(options)
    .map(([value, { label }]) => `<option value="${value}">${escapeHtml(label)}</option>`)
    .join('');
}

function renderCard(product, index) {
  const badges = getBadges(product)
    .map((badge) => `<span class="badge badge-${badge.type}">${escapeHtml(badge.label)}</span>`)
    .join('');
  const soldOut = product.stock < 1;
  const stock = getStockStatus(product);
  const oldPrice = hasOffer(product) ? `<s class="price-old">${formatCOP(product.oldPrice)}</s>` : '';
  const discount = hasOffer(product) ? `<span class="discount">-${discountPercent(product)}%</span>` : '';

  return `
    <article class="product-card" style="--i: ${Math.min(index, 8)}">
      <div class="product-media" data-action="details" data-id="${escapeHtml(product.id)}">
        ${productArt(product)}
        <div class="badge-stack">${badges}</div>
      </div>
      <div class="product-body">
        <p class="product-brand">${escapeHtml(product.brand)}</p>
        <h3 class="product-title">
          <button type="button" class="product-title-btn" data-action="details" data-id="${escapeHtml(product.id)}">${escapeHtml(product.name)}</button>
        </h3>
        <p class="product-summary">${escapeHtml(product.summary)}</p>
        <div class="product-price">
          <strong class="price-current">${formatCOP(product.price)}</strong>
          ${oldPrice}
          ${discount}
        </div>
        <p class="stock-note stock-${stock.tone}">${stock.text}</p>
        <div class="product-actions">
          <button type="button" class="btn btn-ghost" data-action="details" data-id="${escapeHtml(product.id)}">Ver detalles</button>
          <button type="button" class="btn btn-primary" data-action="add" data-id="${escapeHtml(product.id)}" ${soldOut ? 'disabled' : ''}>
            ${soldOut ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>`;
}

export function initCatalog({ onAdd, onOpenDetail }) {
  const filters = { ...DEFAULT_FILTERS };
  const el = {
    search: $('#search-input'),
    chips: $('#category-chips'),
    price: $('#price-filter'),
    sort: $('#sort-select'),
    available: $('#filter-available'),
    offers: $('#filter-offers'),
    grid: $('#product-grid'),
    count: $('#results-count'),
    reset: $('#reset-filters'),
    filtersToggle: $('#filters-toggle'),
    filtersBody: $('#filters-body'),
  };

  fillSelect(el.price, PRICE_RANGES);
  fillSelect(el.sort, SORTERS);

  function renderChips() {
    const base = filterProducts(PRODUCTS, { ...filters, category: 'all' });
    const options = [
      { id: 'all', label: 'Todas', count: base.length },
      ...CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        count: base.filter((product) => product.category === category.id).length,
      })),
    ];
    el.chips.innerHTML = options
      .map(
        (option) => `
        <button type="button" class="chip" aria-pressed="${filters.category === option.id}" data-category="${option.id}">
          ${escapeHtml(option.label)} <span class="chip-count">${option.count}</span>
        </button>`,
      )
      .join('');
  }

  function renderGrid() {
    const list = filterProducts(PRODUCTS, filters);
    el.count.textContent = `Mostrando ${list.length} de ${PRODUCTS.length} productos`;
    el.grid.innerHTML = list.length
      ? list.map(renderCard).join('')
      : `<div class="empty-state glass">
          <p>No encontramos productos con esos filtros.</p>
          <button type="button" class="btn btn-ghost" data-action="reset">Limpiar filtros</button>
        </div>`;
  }

  function render() {
    renderChips();
    renderGrid();
  }

  function syncInputs() {
    el.search.value = filters.query;
    el.price.value = filters.price;
    el.sort.value = filters.sort;
    el.available.checked = filters.onlyAvailable;
    el.offers.checked = filters.onlyOffers;
  }

  function resetFilters() {
    Object.assign(filters, DEFAULT_FILTERS);
    syncInputs();
    render();
  }

  el.search.addEventListener('input', () => {
    filters.query = el.search.value;
    render();
  });

  el.chips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category]');
    if (!chip) return;
    filters.category = chip.dataset.category;
    render();
  });

  el.price.addEventListener('change', () => {
    filters.price = el.price.value;
    render();
  });

  el.sort.addEventListener('change', () => {
    filters.sort = el.sort.value;
    render();
  });

  el.available.addEventListener('change', () => {
    filters.onlyAvailable = el.available.checked;
    render();
  });

  el.offers.addEventListener('change', () => {
    filters.onlyOffers = el.offers.checked;
    render();
  });

  el.reset.addEventListener('click', resetFilters);

  el.filtersToggle.addEventListener('click', () => {
    const open = el.filtersBody.classList.toggle('is-open');
    el.filtersToggle.setAttribute('aria-expanded', String(open));
    el.filtersToggle.textContent = open ? 'Ocultar filtros' : 'Mostrar filtros';
  });

  el.grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    if (trigger.dataset.action === 'reset') {
      resetFilters();
      return;
    }
    const product = PRODUCTS.find((item) => item.id === trigger.dataset.id);
    if (!product) return;
    if (trigger.dataset.action === 'add') onAdd(product.id);
    if (trigger.dataset.action === 'details') onOpenDetail(product);
  });

  render();

  return {
    showOffers() {
      filters.onlyOffers = true;
      syncInputs();
      render();
    },
  };
}
