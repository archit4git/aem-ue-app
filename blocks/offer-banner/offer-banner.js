import {
  getOffer, trackDisplay, trackInteract,
} from '../../scripts/decisioning.js';
import { art, getProducts } from '../../scripts/commerce.js';

/** Authored rows: slot, headline, subhead, cta, link, badge (all but slot optional). */
function readAuthored(block) {
  const cfg = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [k, v] = row.children;
    if (!k || !v) return;
    const key = k.textContent.trim().toLowerCase();
    cfg[key] = key === 'link' ? (v.querySelector('a')?.href || v.textContent.trim()) : v.textContent.trim();
  });
  return cfg;
}

/** AJO content is authored by marketers, but still strip active content. */
function sanitize(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('script,iframe,object,embed').forEach((n) => n.remove());
  tpl.content.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name);
    });
  });
  return tpl.content;
}

async function render(block, copy, product) {
  const text = document.createElement('div');
  text.className = 'offer-banner-text';

  if (copy.badge) {
    const badge = document.createElement('p');
    badge.className = 'offer-banner-badge';
    badge.textContent = copy.badge;
    text.append(badge);
  }
  const h = document.createElement('h2');
  h.textContent = copy.headline || '';
  text.append(h);
  if (copy.subhead) {
    const p = document.createElement('p');
    p.className = 'offer-banner-subhead';
    p.textContent = copy.subhead;
    text.append(p);
  }
  let cta;
  if (copy.ctaLabel) {
    cta = document.createElement('a');
    cta.className = 'poc-button';
    cta.textContent = copy.ctaLabel;
    cta.href = copy.ctaUrl || (copy.sku ? `/product?sku=${encodeURIComponent(copy.sku)}` : '/');
    text.append(cta);
  }

  const figure = document.createElement('div');
  figure.className = 'offer-banner-art';
  const img = document.createElement('img');
  img.alt = '';
  img.width = 240;
  img.height = 240;
  img.src = art(product);
  figure.append(img);

  block.replaceChildren(text, figure);
  return cta;
}

export default async function decorate(block) {
  const authored = readAuthored(block);
  const { slot } = authored;
  block.dataset.slot = slot;
  block.classList.add('is-loading');
  block.replaceChildren();

  const fallback = {
    headline: authored.headline,
    subhead: authored.subhead,
    ctaLabel: authored.cta,
    ctaUrl: authored.link,
    badge: authored.badge,
  };

  const [offer, products] = await Promise.all([getOffer(slot), getProducts().catch(() => [])]);
  const usable = offer && offer.kind === 'json' && offer.content?.headline;

  if (usable) {
    const c = offer.content;
    const copy = {
      headline: c.headline,
      subhead: c.subhead,
      ctaLabel: c.ctaLabel || c.cta,
      ctaUrl: c.ctaUrl,
      badge: c.badge,
      sku: c.sku,
    };
    const product = products.find((p) => p.sku === c.sku) || products[0];
    const cta = await render(block, copy, product);
    block.dataset.source = `AJO via ${offer.via}`;
    block.dataset.propositionId = offer.proposition.id;

    // Display notification once the banner is actually seen.
    new IntersectionObserver((entries, io) => {
      if (entries.some((e) => e.isIntersecting)) {
        trackDisplay(offer.proposition);
        io.disconnect();
      }
    }, { threshold: 0.5 }).observe(block);

    cta?.addEventListener('click', () => trackInteract(offer.proposition, offer.item, 'cta'));
  } else if (offer?.kind === 'html' && offer.content) {
    block.append(sanitize(offer.content));
    block.dataset.source = `AJO via ${offer.via} (html)`;
    block.dataset.propositionId = offer.proposition.id;
    new IntersectionObserver((entries, io) => {
      if (entries.some((e) => e.isIntersecting)) {
        trackDisplay(offer.proposition);
        io.disconnect();
      }
    }, { threshold: 0.5 }).observe(block);
    block.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => trackInteract(offer.proposition, offer.item, 'link')));
  } else {
    await render(block, fallback, products[0]);
    block.dataset.source = offer?.timedOut ? 'fallback (timeout)' : 'fallback (no offer)';
  }
  block.classList.remove('is-loading');
}
