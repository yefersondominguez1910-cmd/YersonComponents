import { WHATSAPP_NUMBER } from '@/js/data.js';
import { formatCOP } from '@/js/utils.js';

export const buildWhatsAppUrl = (message) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export function buildOrderMessage(summary) {
  const lines = ['Hola, quiero hacer el siguiente pedido:', ''];
  summary.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.product.name} - ${item.qty} x ${formatCOP(item.product.price)} = ${formatCOP(item.lineTotal)}`,
    );
  });
  lines.push('', `Subtotal: ${formatCOP(summary.subtotal)}`);
  if (summary.offerSavings > 0) lines.push(`Ahorro en ofertas: ${formatCOP(summary.offerSavings)}`);
  if (summary.couponCode) {
    lines.push(`Cupón ${summary.couponCode} (${summary.couponPercent}%): -${formatCOP(summary.couponDiscount)}`);
  }
  lines.push(`Total a pagar: ${formatCOP(summary.total)}`);
  return lines.join('\n');
}
