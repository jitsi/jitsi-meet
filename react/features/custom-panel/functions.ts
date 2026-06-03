import { IReduxState } from '../app/types';
import { CHAT_SIZE } from '../chat/constants';
import { getParticipantsPaneWidth } from '../participants-pane/functions';
import { VIDEO_SPACE_MIN_SIZE } from '../video-layout/constants';

import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';

export * from './functions.custom';

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
 * Returns whether the custom panel is currently open.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean} Whether the custom panel is open.
 */
export function getCustomPanelOpen(state: IReduxState): boolean {
    return Boolean(state['features/custom-panel']?.isOpen);
}

/**
 * Returns the current configured width of the custom panel from Redux state.
 * Falls back to the default width if no dynamic width is set.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {number} The panel width in pixels.
 */
export function getCustomPanelConfiguredWidth(state: IReduxState): number {
    return state['features/custom-panel']?.width?.current ?? DEFAULT_CUSTOM_PANEL_WIDTH;
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

    return getCustomPanelOpen(state) ? getCustomPanelConfiguredWidth(state) : 0;
}

/**
 * Calculates the maximum width available for the custom panel based on the
 * current window size and other open UI panels.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {number} The maximum width in pixels. Returns 0 if no space is available.
 */
export function getCustomPanelMaxSize(state: IReduxState): number {
    const { clientWidth } = state['features/base/responsive-ui'];
    const { isOpen: isChatOpen, width: chatWidth } = state['features/chat'];
    const chatPanelWidth = isChatOpen ? (chatWidth?.current ?? CHAT_SIZE) : 0;

    return Math.max(clientWidth - chatPanelWidth - getParticipantsPaneWidth(state) - VIDEO_SPACE_MIN_SIZE, 0);
}
