/**
 * Single place to wire this site to your Adobe org.
 * Everything marked REPLACE must be filled in before decisions come back.
 */
export const CONFIG = {
  // Experience Platform datastream (AEP Edge + Journey Optimizer services enabled)
  datastreamId: 'REPLACE_WITH_DATASTREAM_ID',
  orgId: 'REPLACE@AdobeOrg',

  // Pinned Web SDK build. Self-host this file for production.
  alloyUrl: 'https://cdn1.adoberesources.net/alloy/2.28.0/alloy.min.js',

  currency: 'USD',

  // How long a block waits for decisions before it shows its authored fallback.
  decisionTimeoutMs: 1500,

  // Identity namespace (symbol) used when a demo email is set in the debug panel.
  identityNamespace: 'Email',

  /**
   * Placement "slots". The offer-banner block references a slot by name.
   * A slot can be fed by either (or both) of:
   *   scope   - an encoded decision scope copied from an AJO decision policy
   *             (Offer Decisioning path)
   *   surface - a page fragment, expanded to web://<host><path>#<fragment>
   *             (Code-based experience campaign path)
   * If both return something, the decision-policy scope wins.
   */
  slots: {
    hero: {
      scope: '', // REPLACE with the encoded decision scope for the hero placement
      surface: 'hero-banner',
    },
    cart: {
      scope: '', // REPLACE with a second decision scope if you want a cart-page offer
      surface: 'cart-offer',
    },
  },
};
