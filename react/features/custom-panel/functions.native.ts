import { IReduxState } from '../app/types';

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
 * Returns the width consumed by the custom panel in layout calculations.
 * Always 0 on native: the custom panel is a full-screen navigation route, not an
 * inline side panel, so it never takes up space alongside chat/participants-pane.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number}
 */
export function getCustomPanelWidth(state: IReduxState): number {
    return 0;
}

/**
 * Returns the configured advisor URL, or undefined.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string | undefined}
 */
export function getCustomPanelUrl(state: IReduxState): string | undefined {
    return state['features/base/config'].enableCustomPanel?.url;
}

/**
 * Builds the advisor URL with token + meeting query params. Pure function.
 * Mirrors the web iframe contract: `?token=<jwt>&meeting=<meetingId>`.
 *
 * @param {string} [url] - The base advisor URL.
 * @param {string} [jwt] - The meeting JWT.
 * @param {string} [meetingId] - The meeting unique id.
 * @returns {string} The full URI, or '' when no url is provided.
 */
export function buildCustomPanelUri(url?: string, jwt?: string, meetingId?: string): string {
    if (!url) {
        return '';
    }

    const params: string[] = [];

    if (jwt) {
        params.push(`token=${encodeURIComponent(jwt)}`);
    }
    if (meetingId) {
        params.push(`meeting=${encodeURIComponent(meetingId)}`);
    }

    if (!params.length) {
        return url;
    }

    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}${params.join('&')}`;
}
