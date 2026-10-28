import CONFIG from './config.js';
import { sendEvent } from './martech.js';

let productsPromise;
/** In production this URL is an EDS spreadsheet (/products.json). */
export function getProducts() {
  productsPromise ||= fetch('/data/products.json')
    .then((r) => r.json())
    .then((j) => (j.data || j).map((p) => ({ ...p, price: Number(p.price) })));
  return productsPromise;
}

export const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: CONFIG.currency }).format(n);

/** Generated placeholder art so the POC needs no image assets. */
export function art(p) {
  const shapes = {
    brewers: '<path d="M60 150h120l-14 60H74z" fill="#14232b"/><path d="M82 80h76v70H82z" fill="#f4f7f6" opacity=".9"/>',
    grinders: '<rect x="80" y="60" width="80" height="50" rx="6" fill="#f4f7f6" opacity=".9"/><rect x="70" y="110" width="100" height="100" rx="8" fill="#14232b"/>',
    kettles: '<path d="M70 110c0-40 100-40 100 0v90H70z" fill="#14232b"/><path d="M170 130c30 0 30 40 0 40" stroke="#f4f7f6" stroke-width="10" fill="none"/>',
    beans: '<ellipse cx="105" cy="120" rx="38" ry="56" fill="#14232b" transform="rotate(-25 105 120)"/><ellipse cx="145" cy="150" rx="30" ry="46" fill="#f4f7f6" opacity=".9" transform="rotate(20 145 150)"/>',
    accessories: '<circle cx="120" cy="130" r="62" fill="#14232b"/><circle cx="120" cy="130" r="30" fill="#f4f7f6" opacity=".9"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="${p?.color || '#0e5a57'}"/>${shapes[p?.category] || shapes.accessories}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ---- cart (localStorage, per browser) ---- */
const KEY = 'poc.cart';
export const readCart = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};
export function writeCart(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('poc:cart'));
}

/* ---- commerce XDM ---- */
export const listItems = (items) => items.map((i) => ({
  SKU: i.sku,
  name: i.name,
  quantity: i.qty || 1,
  priceTotal: Number(i.price) * (i.qty || 1),
  currencyCode: CONFIG.currency,
}));

export function trackCommerce(eventType, items, extraCommerce = {}) {
  const key = eventType.split('.')[1]; // commerce.productViews -> productViews
  return sendEvent({
    xdm: {
      eventType,
      commerce: { [key]: { value: 1 }, ...extraCommerce },
      productListItems: listItems(items),
    },
  });
}

export function addToCart(product, qty = 1) {
  const cart = readCart();
  const existing = cart.find((i) => i.sku === product.sku);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      sku: product.sku, name: product.name, price: product.price, qty,
    });
  }
  writeCart(cart);
  trackCommerce('commerce.productListAdds', [{ ...product, qty }]);
}

export function purchase(cart) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const purchaseID = `POC-${Date.now().toString(36).toUpperCase()}`;
  trackCommerce('commerce.purchases', cart, {
    order: { purchaseID, currencyCode: CONFIG.currency, priceTotal: total },
  });
  return { purchaseID, total };
}
