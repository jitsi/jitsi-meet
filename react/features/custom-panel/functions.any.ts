import { IReduxState } from '../app/types';

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
 * Returns whether AI Assist (custom panel) is enabled via config. It needs both the
 * flag and a URL, which comes from `config.js` or from dynamic branding. There is no
 * default URL, so without one the panel stays hidden on both platforms.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].customPanel?.enabled && getCustomPanelUrl(state));
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
    const CUSTOM_PANEL_THEME = 'dark';

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
    fullUrl.searchParams.set('theme', CUSTOM_PANEL_THEME);

    return fullUrl.toString();
}
