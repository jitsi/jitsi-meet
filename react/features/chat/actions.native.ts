import { IStore } from '../app/types';
import { IParticipant } from '../base/participants/types';
import { navigate } from '../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';

import { OPEN_CHAT } from './actionTypes';
import { setFocusedTab } from './actions.any';
import { ChatTabs } from './constants';

export * from './actions.any';

/**
 * Displays the chat panel with the CHAT tab active.
 *
 * @param {Object} participant - The recipient for the private chat.
 * @param {boolean} disablePolls - Checks if polls are disabled.
 *
 * @returns {Function}
 */
export function openChat(participant?: IParticipant | undefined | Object, disablePolls?: boolean) {
    return (dispatch: IStore['dispatch']) => {
        if (disablePolls) {
            navigate(screen.conference.chat);
        } else {
            navigate(screen.conference.chatandpolls.main);
        }

        dispatch(setFocusedTab(ChatTabs.CHAT));
        dispatch({
            participant,
            type: OPEN_CHAT
        });
    };
}
