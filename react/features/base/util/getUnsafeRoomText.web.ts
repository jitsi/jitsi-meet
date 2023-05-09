import { translateToHTML } from '../i18n/functions';

import { SECURITY_URL } from './contants';

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warining.
 * @returns {string}
 */
export default function getUnsafeRoomText(t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const securityUrl = APP.store.getState()['features/base/config'].legalUrls?.security ?? SECURITY_URL;
    const options = {
        recommendAction: t(`security.unsafeRoomActions.${context}`),
        securityUrl
    };

    return translateToHTML(t, 'security.insecureRoomNameWarningWeb', options);
}
