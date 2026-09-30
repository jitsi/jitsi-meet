/**
 * Maximum time in milliseconds to wait for a single custom icon SVG to download. The icons are
 * hosted by the customer, so one slow or unreachable URL must not hold back the others.
 */
export const CUSTOM_ICON_FETCH_TIMEOUT = 5000;

/**
 * How long the first paint waits for the dynamic branding to be applied before giving up and showing
 * the default look. Long enough for the branding request and the icons on a normal connection, short
 * enough that a slow or failing branding endpoint does not keep the page blank.
 */
export const DYNAMIC_BRANDING_WAIT_TIMEOUT = 3000;

/**
 * Class set on the document body while the first paint is waiting for the dynamic branding. Styled
 * in css/_base.scss.
 */
export const DYNAMIC_BRANDING_PENDING_CLASS = 'dynamic-branding-pending';
