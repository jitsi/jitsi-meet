import { IStateful } from '../app/types';
import { isMobileBrowser } from '../environment/utils';
import { toState } from '../redux/functions';

import { SMALL_DESKTOP_WIDTH } from './constants';

/**
 * Determines if the screen is narrow with the chat panel open. If the function returns true video quality label,
 * filmstrip, etc will be hidden.
 *
 * @param {IStateful} stateful - The stateful object representing the application state.
 * @returns {boolean} - True if the screen is narrow with the chat panel open, otherwise `false`.
 */
export function isNarrowScreenWithChatOpen(stateful: IStateful) {
    const state = toState(stateful);
    const isDesktopBrowser = !isMobileBrowser();
    const { isOpen, width } = state['features/chat'];
    const { clientWidth } = state['features/base/responsive-ui'];

    return isDesktopBrowser && isOpen && (width?.current + SMALL_DESKTOP_WIDTH) > clientWidth;
}
