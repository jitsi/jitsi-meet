import { IReduxState } from '../app/types';

import { DEFAULT_CUSTOM_PANEL_URL } from './constants';

/**
 * Returns whether the Copilot (custom panel) is enabled via config.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].customPanel?.enabled);
}

/**
 * Returns the configured advisor URL, falling back to the default.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getCustomPanelUrl(state: IReduxState): string {
    return state['features/base/config'].customPanel?.url ?? DEFAULT_CUSTOM_PANEL_URL;
}

/**
 * Builds the advisor URL. Returns '' without a url or jwt (no token, no access).
 *
 * @param {string} [url] - The base advisor URL.
 * @param {string} [jwt] - The meeting JWT.
 * @param {string} [meetingId] - The meeting unique id.
 * @returns {string} The full URI, or '' when no url or no jwt is provided.
 */
export function buildCustomPanelUri(url?: string, jwt?: string, meetingId?: string): string {
    if (!url || !jwt) {
        return '';
    }

    let uri;

    try {
        uri = new URL(url);
    } catch (_) {
        return '';
    }

    uri.searchParams.set('token', jwt);

    if (meetingId) {
        uri.searchParams.set('meeting', meetingId);
    }

    return uri.toString();
}

/**
 * Returns the origin of the given URL, or '' on a parse error.
 *
 * @param {string} [url] - The URL to parse.
 * @returns {string}
 */
export function getCustomPanelOrigin(url?: string): string {
    if (!url) {
        return '';
    }

    try {
        return new URL(url).origin;
    } catch (_) {
        return '';
    }
}
