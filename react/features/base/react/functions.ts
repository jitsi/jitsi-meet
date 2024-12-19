import punycode from 'punycode';

import { IStateful } from '../app/types';
import { toState } from '../redux/functions';

/**
 * Returns the field value in a platform generic way.
 *
 * @param {Object | string} fieldParameter - The parameter passed through the change event function.
 * @returns {string}
 */
export function getFieldValue(fieldParameter: { target: { value: string; }; } | string) {
    return typeof fieldParameter === 'string' ? fieldParameter : fieldParameter?.target?.value;
}

/**
 * Formats the URL text for react-linkify.
 *
 * @param {string} text - The URL text.
 * @returns {string} - The formatted text.
 */
export function formatURLText(text = '') {
    let result;

    // In order to prevent homograph attacks we need to use punycode. Reference
    // https://github.com/tasti/react-linkify/issues/84. In the same time it seems PunycodeJS will treat the URL
    // as an email when there is '@' and will erase parts of it. This is problematic if there is a URL like
    // https://example.com/@test@@@123/test@test, punycode will truncate this to https://example.com/@test which
    // is security issue because parts of the URL are actually missing from the text that we display. That's why
    // we use punycode on valid URLs(that don't have '@' as part of the host) only for the host part of the URL.
    try {
        const url = new URL(text);
        const { host } = url;

        if (host) {
            url.host = punycode.toASCII(host);
            result = url.toString();
        }
    } catch (e) {
        // Not a valid URL
    }

    if (!result) {
        // This will be the case for invalid URLs or URLs without a host (emails for example). In this case due to
        // the issue with PunycodeJS that truncates parts of the text when there is '@' we split the text by '@'
        // and use punycode for every separate part to prevent homograph attacks.
        result = text.split('@').map(punycode.toASCII)
            .join('@');
    }

    return result;
}

/**
 * Returns the configured support URL.
 *
 * @param {IStateful} stateful - The redux state.
 * @returns {string|undefined} - The configured support link.
 */
export function getSupportUrl(stateful: IStateful) {

    // TODO: Once overwriting through interface config is completely gone we should think of a way to be able to set
    // the value in the branding and not return the default value from interface config.
    return toState(stateful)['features/dynamic-branding'].supportUrl || interfaceConfig?.SUPPORT_URL;
}
