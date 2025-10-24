import { IFRAME_EMBED_ALLOWED_LOCATIONS as ADDITIONAL_LOCATIONS } from './extraConstants';

/**
 * Timeout of the conference when iframe is disabled in minutes.
 */
export const IFRAME_DISABLED_TIMEOUT_MINUTES = 5;

/**
 * A list of allowed location to embed iframe.
 */
/* eslint-disable-next-line no-extra-parens */
export const IFRAME_EMBED_ALLOWED_LOCATIONS = ([] as string[]).concat(ADDITIONAL_LOCATIONS);
