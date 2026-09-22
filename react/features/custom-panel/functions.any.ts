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
 * Returns whether the Copilot (custom panel) is enabled via config. It needs both the
 * flag and a URL, which comes from `config.js` or from dynamic branding. There is no
 * default URL, so without one the panel stays hidden on both platforms.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].customPanel?.enabled && getCustomPanelUrl(state));
}
