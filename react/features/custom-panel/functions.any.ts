import { IReduxState } from '../app/types';

import { DEFAULT_CUSTOM_PANEL_THEME, DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';

/**
 * Returns the configured custom panel URL, or undefined when none is configured.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {string | undefined} The URL to load in the custom panel iframe.
 */
export function getCustomPanelUrl(state: IReduxState): string | undefined {
    return state['features/base/config'].customPanel?.url;
}

/**
 * Returns whether AI Assist (custom panel) is enabled. It needs the config flag, a URL
 * (from `config.js` or dynamic branding), a JWT and an advisor deployed for this meeting.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].customPanel?.enabled
        && getCustomPanelUrl(state)
        && state['features/base/jwt'].jwt
        && state['features/custom-panel']?.isAdvisorAvailable);
}

/**
 * Builds the advisor URL. Returns '' without a base URL or JWT (no token, no access).
 *
 * @param {string} [baseUrl] - The configured advisor URL.
 * @param {string} [jwt] - The meeting JWT.
 * @param {string} [meetingId] - The meeting unique id.
 * @returns {string} The full URL, or '' when no base URL or JWT is provided.
 */
export function buildCustomPanelUrl(baseUrl?: string, jwt?: string, meetingId?: string): string {
    if (!baseUrl || !jwt) {
        return '';
    }

    let fullUrl;

    try {
        fullUrl = new URL(baseUrl);
    } catch (_) {
        return '';
    }

    fullUrl.searchParams.set('token', jwt);

    if (meetingId) {
        fullUrl.searchParams.set('meeting', meetingId);
    }
    fullUrl.searchParams.set('theme', DEFAULT_CUSTOM_PANEL_THEME);

    return fullUrl.toString();
}

/**
 * Returns whether the custom panel is currently open.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} Whether the custom panel is open.
 */
export function getCustomPanelOpen(state: IReduxState): boolean {
    return Boolean(state['features/custom-panel']?.isOpen);
}

/**
 * Returns the width the custom panel takes from the video space. 0 when closed, disabled,
 * or on native, where the panel is a navigation route and never sets `isOpen`.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number}
 */
export function getCustomPanelWidth(state: IReduxState): number {
    const panel = state['features/custom-panel'];

    if (!isCustomPanelEnabled(state) || !getCustomPanelOpen(state)) {
        return 0;
    }

    return panel.width?.current ?? DEFAULT_CUSTOM_PANEL_WIDTH;
}
