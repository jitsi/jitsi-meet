import { translateToHTML } from '../i18n/functions';

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warining.
 * @returns {string}
 */
export default function getUnsafeRoomText(t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const defaultSecurityUrl = 'https://jitsi.org/security/';
    const securityUrl = typeof APP === 'undefined'
        ? defaultSecurityUrl
        : APP.store.getState()['features/base/config'].legalUrls?.security ?? defaultSecurityUrl;

    const options = {
        recommendAction: t(`security.unsafeRoomActions.${context}`),
        securityUrl
    };

    return translateToHTML(t, 'security.insecureRoomNameWarningWeb', options);
}
