/**
 * The prefix of the {@code localStorage} key into which {@link storeConfig}
 * stores and from which {@link restoreConfig} restores.
 *
 * @protected
 * @type string
 */
export const _CONFIG_STORE_PREFIX = 'config.js';

/**
 * The toolbar buttons to show on premeeting screens.
 */
export const PREMEETING_BUTTONS = [ 'microphone', 'camera', 'select-background', 'invite', 'settings' ];

/**
  * The toolbar buttons to show on 3rdParty prejoin screen.
  */
export const THIRD_PARTY_PREJOIN_BUTTONS = [ 'microphone', 'camera', 'select-background' ];

/**
 * The set of feature flags.
 *
 * @enum {string}
 */

export const FEATURE_FLAGS = {
    SSRC_REWRITING: 'ssrcRewritingEnabled'
};

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
export const DEFAULT_TERMS_URL = 'https://jitsi.org/meet/terms';

/**
 * The URL at which the privacy policy is available to the user.
 */
export const DEFAULT_PRIVACY_URL = 'https://jitsi.org/meet/privacy';

/**
 * The URL at which the help centre is available to the user.
 */
export const DEFAULT_HELP_CENTRE_URL = 'https://web-cdn.jitsi.net/faq/meet-faq.html';
