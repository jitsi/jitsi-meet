import { getLegalUrls } from '../config/functions.any';
import { translateToHTML } from '../i18n/functions.web';

declare const APP: any;

/**
 * Gets the unsafe room text for the given context.
 *
 * @param {Function} t - The translation function.
 * @param {'meeting'|'prejoin'|'welcome'} context - The given context of the warning.
 * @returns {string}
 */
export default function getUnsafeRoomText(t: Function, context: 'meeting' | 'prejoin' | 'welcome') {
    const securityUrl = getLegalUrls(APP.store.getState()).security;
    const options = {
        recommendAction: t(`security.unsafeRoomActions.${context}`),
        securityUrl
    };

    return translateToHTML(t, 'security.insecureRoomNameWarningWeb', options);
}
