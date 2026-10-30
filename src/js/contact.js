import { CONTACT_EMAIL } from '@/js/data.js';
import { notify } from '@/js/ui.js';
import { buildWhatsAppUrl } from '@/js/whatsapp.js';
import { $ } from '@/js/utils.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RULES = {
  name: { check: (value) => value.length >= 2, message: 'Escribe tu nombre (mínimo 2 letras).' },
  email: { check: (value) => EMAIL_PATTERN.test(value), message: `Escribe un correo válido, por ejemplo ${CONTACT_EMAIL}.` },
  message: { check: (value) => value.length >= 10, message: 'Cuéntanos un poco más (mínimo 10 caracteres).' },
};

export function initContactForm() {
  const form = $('#contact-form');
  form.noValidate = true;

  const setError = (field, message) => {
    const input = form.elements[field];
    const error = form.querySelector(`[data-error-for="${field}"]`);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message ?? '';
  };

  form.addEventListener('input', (event) => {
    const field = event.target.name;
    if (RULES[field]) setError(field, null);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(
      Object.keys(RULES).map((field) => [field, form.elements[field].value.trim()]),
    );

    let firstInvalid = null;
    Object.entries(RULES).forEach(([field, rule]) => {
      const valid = rule.check(values[field]);
      setError(field, valid ? null : rule.message);
      if (!valid && !firstInvalid) firstInvalid = form.elements[field];
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const message = `Hola, soy ${values.name} (${values.email}).\n\n${values.message}`;
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener');
    notify('Abrimos WhatsApp con tu mensaje');
    form.reset();
  });
}
