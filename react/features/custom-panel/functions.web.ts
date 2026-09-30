import { IReduxState } from '../app/types';
import { CHAT_SIZE } from '../chat/constants';
import { getParticipantsPaneWidth } from '../participants-pane/functions';
import { VIDEO_SPACE_MIN_SIZE } from '../video-layout/constants';

export * from './functions.any';

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
