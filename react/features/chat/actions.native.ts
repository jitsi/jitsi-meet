/* eslint-disable lines-around-comment, max-len */

import { navigate }
// @ts-ignore
    from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
// @ts-ignore
import { screen } from '../mobile/navigation/routes';

import { OPEN_CHAT } from './actionTypes';

export * from './actions.any';

/**
 * Displays the chat panel.
 *
 * @param {Object} participant - The recipient for the private chat.
 * @param {boolean} disablePolls - Checks if polls are disabled.
 *
 * @returns {{
 *     participant: participant,
 *     type: OPEN_CHAT
 * }}
 */
export function openChat(participant: Object, disablePolls?: boolean) {
    if (disablePolls) {
        navigate(screen.conference.chat);
    }
    navigate(screen.conference.chatandpolls.main);

    return {
        participant,
        type: OPEN_CHAT
    };
}
