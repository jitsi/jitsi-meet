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
 * @param {string} lobbyChatRoute - The route for the lobby chat.
 * @param {Object} participant - The recipient for the private chat.
 * @param {string} privateChatRoute - The route for the private chat.
 * @param {boolean} pollsDisabled - Checks if polls are disabled.
 *
 * @returns {{
 *     lobbyChatRoute: lobbyChatRoute,
 *     participant: Participant,
 *     privateChatRoute: privateChatRoute,
 *     type: OPEN_CHAT
 * }}
 */
export function openChat(lobbyChatRoute: string, participant: Object, privateChatRoute: string, pollsDisabled: boolean) {
    return {
        lobbyChatRoute: pollsDisabled
            ? screen.conference.chat
            : screen.conference.chatandpolls.main,
        participant,
        privateChatRoute: pollsDisabled
            ? navigate(screen.conference.chat, {
                privateMessageRecipient: participant
            }) : navigate(screen.conference.chatandpolls.main, {
                screen: screen.conference.chatandpolls.tab.chat,
                params: {
                    privateMessageRecipient: participant
                }
            }),
        type: OPEN_CHAT
    };
}
