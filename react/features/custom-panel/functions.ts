import { IReduxState } from '../app/types';

import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';

/**
 * Returns whether the custom panel is enabled based on Redux state.
 * The feature is disabled by default and can be enabled dynamically via console.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} Whether the custom panel is enabled.
 */
export function isCustomPanelEnabled(state: IReduxState): boolean {
    return Boolean(state['features/custom-panel']?.enabled);
}

/**
 * Returns the custom panel URL.
 * Override to provide the actual URL.
 *
 * @returns {string} The custom panel URL.
 */
export function getCustomPanelUrl(): string {
    return '';
}

/**
 * Returns the custom panel button icon.
 * Override to provide the actual icon.
 *
 * @returns {Function | undefined} The icon component.
 */
export function getCustomPanelIcon(): Function | undefined {
    return undefined;
}

/**
 * Returns the configured panel width.
 *
 * @returns {number} The panel width in pixels.
 */
export function getCustomPanelConfiguredWidth(): number {
    return DEFAULT_CUSTOM_PANEL_WIDTH;
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
 * Returns the current panel width (0 if closed or disabled).
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {number} The panel width in pixels.
 */
export function getCustomPanelWidth(state: IReduxState): number {
    if (!isCustomPanelEnabled(state)) {
        return 0;
    }

    return getCustomPanelOpen(state) ? getCustomPanelConfiguredWidth() : 0;
}
