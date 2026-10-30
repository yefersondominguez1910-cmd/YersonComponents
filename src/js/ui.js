import { $, $$ } from '@/js/utils.js';

const TOAST_LIFETIME_MS = 3400;
const MAX_TOASTS = 4;

export function notify(message, type = 'success') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.append(toast);
  if (container.children.length > MAX_TOASTS) container.firstElementChild.remove();
  setTimeout(() => toast.remove(), TOAST_LIFETIME_MS);
}

export function bindDismiss(dialog) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-close-dialog]')) dialog.close();
  });
}

export function initNavbar() {
  const header = $('#site-header');
  const toggle = $('#menu-toggle');
  const menu = $('#nav-menu');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenuOpen = (open) => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };

  toggle.addEventListener('click', () => setMenuOpen(!header.classList.contains('nav-open')));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });
}

export function initReveal() {
  const targets = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  targets.forEach((target) => observer.observe(target));
}
