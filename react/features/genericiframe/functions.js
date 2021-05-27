// @flow

import { i18next, DEFAULT_LANGUAGE } from '../base/i18n';
import { toState } from '../base/redux';

/**
 * Retrieves the current genericIFrame URL and replaces the placeholder with data.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {?string} - Current genericIFrame URL or undefined.
 */
export function getGenericIFrameUrl(stateful: Function | Object) {
    const state = toState(stateful);
    let { iframeUrl } = state['features/genericiframe'];
    const { room } = state['features/base/conference'];
    const lang = i18next.language || DEFAULT_LANGUAGE;

    if (!iframeUrl) {
        return undefined;
    }

    iframeUrl = iframeUrl.replace('{room}', room);
    iframeUrl = iframeUrl.replace('{lang}', lang);

    return `${iframeUrl}`;
}
