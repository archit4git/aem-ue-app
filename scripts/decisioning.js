import { CONFIG } from './config.js';
import { sendEvent } from './martech.js';

const state = { pending: null };
const displayed = new Set();

/** web://host/path#fragment, matching how an AJO code-based surface is defined. */
export const surfaceFor = (fragment, loc = window.location) => `web://${loc.host}${loc.pathname}#${fragment}`;

/** Read the slot name from an (undecorated) offer-banner block: row "slot | hero". */
export function slotOfBlock(block) {
  const match = [...block.querySelectorAll(':scope > div')]
    .map((row) => {
      const [k, v] = [...row.children].map((c) => c.textContent.trim());
      return { key: k?.toLowerCase(), value: v };
    })
    .find(({ key }) => key === 'slot');
  return match ? match.value : null;
}

export const collectSlots = (root) => [...root.querySelectorAll('.offer-banner')]
  .map(slotOfBlock)
  .filter(Boolean);

/**
 * One request per page: the page-view event carries every decision scope and
 * surface the page needs. Call early (loadEager) and do NOT await it.
 */
export function startPage(slotNames, loc = window.location) {
  const scopes = new Set();
  const surfaces = new Set();
  slotNames.forEach((name) => {
    const slot = CONFIG.slots[name];
    if (!slot) return;
    if (slot.scope) scopes.add(slot.scope);
    if (slot.surface) surfaces.add(surfaceFor(slot.surface, loc));
  });

  const personalization = { defaultPersonalizationEnabled: false };
  if (scopes.size) personalization.decisionScopes = [...scopes];
  if (surfaces.size) personalization.surfaces = [...surfaces];

  state.pending = sendEvent({
    xdm: {
      eventType: 'web.webpagedetails.pageViews',
      web: { webPageDetails: { pageViews: { value: 1 } } },
    },
    personalization,
  }).then((r) => r.propositions || []);
  return state.pending;
}

/** Turn a raw Web SDK item into something a block can render. */
export function normalizeItem(item) {
  if (!item) return null;
  let content = item.data?.content;
  const schema = item.schema || '';
  if (schema.includes('html-content-item')) return { kind: 'html', content: String(content ?? '') };
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { return { kind: 'html', content }; }
  }
  return { kind: 'json', content: content || {} };
}

const slotMatches = (proposition, slotName) => {
  const slot = CONFIG.slots[slotName];
  if (!slot) return null;
  if (slot.scope && proposition.scope === slot.scope) return 'scope';
  if (slot.surface && proposition.scope?.endsWith(`#${slot.surface}`)) return 'surface';
  return null;
};

/**
 * Resolve the winning proposition for a slot, or null (no offer),
 * or { timedOut: true }. Decision-policy scope beats surface.
 */
export async function getOffer(slotName) {
  if (!state.pending) return null;
  const timeout = new Promise((resolve) => { setTimeout(() => resolve('timeout'), CONFIG.decisionTimeoutMs); });
  const props = await Promise.race([state.pending, timeout]);
  if (props === 'timeout') return { timedOut: true };

  const hits = props
    .map((p) => ({ p, via: slotMatches(p, slotName) }))
    .filter((h) => h.via && h.p.items?.length);
  hits.sort((a, b) => (a.via === 'scope' ? -1 : 1) - (b.via === 'scope' ? -1 : 1));
  if (!hits.length) return null;

  const { p, via } = hits[0];
  const item = p.items[0];
  return {
    proposition: p, item, via, ...normalizeItem(item),
  };
}

const ref = (p) => ({ id: p.id, scope: p.scope, scopeDetails: p.scopeDetails });

export const buildDisplayXdm = (proposition) => ({
  eventType: 'decisioning.propositionDisplay',
  _experience: {
    decisioning: { propositions: [ref(proposition)], propositionEventType: { display: 1 } },
  },
});

export const buildInteractXdm = (proposition, item, label = 'cta') => ({
  eventType: 'decisioning.propositionInteract',
  _experience: {
    decisioning: {
      propositions: [{ ...ref(proposition), items: [{ id: item.id }] }],
      propositionEventType: { interact: 1 },
      propositionAction: { id: label, label },
    },
  },
});

/** Send the display notification once per proposition per page view. */
export function trackDisplay(proposition) {
  if (displayed.has(proposition.id)) return;
  displayed.add(proposition.id);
  sendEvent({ xdm: buildDisplayXdm(proposition) });
}

export function trackInteract(proposition, item, label) {
  // documentUnloading lets the beacon survive the navigation the click triggers.
  sendEvent({ xdm: buildInteractXdm(proposition, item, label), documentUnloading: true });
}
