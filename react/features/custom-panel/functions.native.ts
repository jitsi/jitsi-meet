import { IReduxState } from '../app/types';

import { DEFAULT_CUSTOM_PANEL_URL } from './constants';

/**
 * Returns whether the Copilot (custom panel) is enabled via config.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].enableCustomPanel?.enabled);
}

/**
 * Returns the configured advisor URL, falling back to the default.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string}
 */
export function getCustomPanelUrl(state: IReduxState): string {
    return state['features/base/config'].enableCustomPanel?.url ?? DEFAULT_CUSTOM_PANEL_URL;
}

/**
 * Builds the advisor URL. Returns '' without a url or jwt (no token, no access).
 *
 * @param {string} [url] - The base advisor URL.
 * @param {string} [jwt] - The meeting JWT.
 * @param {string} [meetingId] - The meeting unique id.
 * @param {string} [theme] - The color scheme to render ('dark' or 'light').
 * @returns {string} The full URI, or '' when no url or no jwt is provided.
 */
export function buildCustomPanelUri(url?: string, jwt?: string, meetingId?: string, theme?: string): string {
    if (!url || !jwt) {
        return '';
    }

    const params: string[] = [ `token=${encodeURIComponent(jwt)}` ];

    if (meetingId) {
        params.push(`meeting=${encodeURIComponent(meetingId)}`);
    }
    if (theme) {
        params.push(`theme=${encodeURIComponent(theme)}`);
    }

    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}${params.join('&')}`;
}
