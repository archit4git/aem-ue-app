/**
 * Single place to wire this site to your Adobe org.
 * Everything marked REPLACE must be filled in before decisions come back.
 */
const CONFIG = {
  // Experience Platform datastream (AEP Edge + Journey Optimizer services enabled)
  datastreamId: 'e01294ec-f74a-43bb-93d6-2a2382c1ac34',
  orgId: 'D15D15F354F647770A4C98A4@AdobeOrg',

  // Pinned Web SDK build. Self-host this file for production.
  alloyUrl: 'https://cdn1.adoberesources.net/alloy/2.36.1/alloy.min.js',

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
    offer: {
      scope: '', // REPLACE with the encoded decision scope for the hero placement
      surface: 'offer-zone-1',
    }
  },
};

export default CONFIG;
