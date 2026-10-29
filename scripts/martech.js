import { CONFIG } from './config.js';

let configured;
const params = new URLSearchParams(window.location.search);

export const isDebug = () => {
  try {
    if (params.get('debug') === '1') localStorage.setItem('poc.debug', '1');
    if (params.get('debug') === '0') localStorage.removeItem('poc.debug');
    return localStorage.getItem('poc.debug') === '1';
  } catch { return params.get('debug') === '1'; }
};

export const getDemoEmail = () => {
  try { return localStorage.getItem('poc.email') || ''; } catch { return ''; }
};
export const setDemoEmail = (email) => {
  try {
    if (email) localStorage.setItem('poc.email', email);
    else localStorage.removeItem('poc.email');
  } catch { /* storage unavailable */ }
};

/** Everything that happens is mirrored to a log the debug panel can replay. */
export function log(type, detail = {}) {
  const entry = { type, at: new Date().toISOString(), ...detail };
  (window.__pocLog = window.__pocLog || []).push(entry);
  window.dispatchEvent(new CustomEvent('poc:log', { detail: entry }));
}

function installAlloyStub() {
  // Standard Web SDK base code: queues commands until alloy.min.js loads.
  ((n, o) => {
    o.forEach((name) => {
      if (n[name]) return;
      n.__alloyNS = n.__alloyNS || [];
      n.__alloyNS.push(name);
      n[name] = (...args) => new Promise((resolve, reject) => {
        n[name].q.push([resolve, reject, args]);
      });
      n[name].q = [];
    });
  })(window, ['alloy']);
}

export function initMartech() {
  if (configured) return configured;
  installAlloyStub();

  const script = document.createElement('script');
  script.src = CONFIG.alloyUrl;
  script.async = true;
  script.onerror = () => log('error', { message: `Could not load Web SDK from ${CONFIG.alloyUrl}` });
  document.head.append(script);

  configured = window.alloy('configure', {
    datastreamId: CONFIG.datastreamId,
    orgId: CONFIG.orgId,
    debugEnabled: isDebug(),
    defaultConsent: 'in', // POC only. Wire to your CMP before production.
    thirdPartyCookiesEnabled: false,
    clickCollectionEnabled: false,
  }).then(() => log('configured', { datastreamId: CONFIG.datastreamId }))
    .catch((e) => log('error', { message: `configure failed: ${e.message}` }));

  return configured;
}

function baseXdm() {
  const xdm = {
    web: {
      webPageDetails: { name: document.title, URL: window.location.href },
      webReferrer: { URL: document.referrer },
    },
  };
  const email = getDemoEmail();
  if (email) {
    xdm.identityMap = {
      [CONFIG.identityNamespace]: [{ id: email, authenticatedState: 'authenticated', primary: true }],
    };
  }
  return xdm;
}

/**
 * Thin wrapper around alloy('sendEvent'). Never throws: a martech failure
 * must not break the storefront. Always resolves with { propositions }.
 */
export async function sendEvent({ xdm = {}, ...rest } = {}) {
  const payload = { ...rest, xdm: { ...baseXdm(), ...xdm } };
  log('request', { eventType: xdm.eventType, payload });
  try {
    await initMartech();
    const result = await window.alloy('sendEvent', payload);
    log('response', { eventType: xdm.eventType, propositions: result?.propositions || [] });
    return { propositions: [], ...result };
  } catch (e) {
    log('error', { eventType: xdm.eventType, message: e.message });
    return { propositions: [] };
  }
}
