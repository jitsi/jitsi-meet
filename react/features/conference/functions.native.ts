import i18next from '../base/i18n/i18next';

import { IFRAME_DISABLED_TIMEOUT_MINUTES } from './constants';

export * from './functions.any';

/**
 * Creates the description of the notification which tells the user that the meeting ends soon because embedding is
 * not allowed.
 *
 * @param {string} translationKey - The key of the text.
 * @param {string} domain - The domain of the deployment, if the text mentions it.
 * @param {string} _jaasDomain - Not used on native: the text has no link.
 * @returns {string}
 */
export function getDisabledIframeDescription(translationKey: string, domain: string, _jaasDomain?: string) {
    return i18next.t(translationKey, {
        domain,
        timeout: IFRAME_DISABLED_TIMEOUT_MINUTES
    });
}
