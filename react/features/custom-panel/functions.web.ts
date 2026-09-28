import { IReduxState } from '../app/types';
import { CHAT_SIZE } from '../chat/constants';
import { getParticipantsPaneWidth } from '../participants-pane/functions';
import { VIDEO_SPACE_MIN_SIZE } from '../video-layout/constants';

import { DEFAULT_CUSTOM_PANEL_WIDTH } from './constants';
import { isCustomPanelEnabled } from './functions.any';

export * from './functions.any';

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

/**
 * Returns the width the custom panel takes from the video space. 0 when closed, disabled,
 * or on native, where the panel is a navigation route and its slice is never registered.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number}
 */
export function getCustomPanelWidth(state: IReduxState): number {
    const panel = state['features/custom-panel'];

    if (!(isCustomPanelEnabled(state)) || !getCustomPanelOpen(state)) {
        return 0;
    }

    return panel.width?.current ?? DEFAULT_CUSTOM_PANEL_WIDTH;
}
