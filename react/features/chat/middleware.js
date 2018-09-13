// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { INCOMING_MSG_SOUND_ID } from './constants';
import { INCOMING_MSG_SOUND_FILE } from './sounds';
import { addMessage } from '../chat/actions';
import { isSidePanelOpen } from '../side-panel/functions';
import { showToolbox } from '../toolbox/actions.web';
import { isButtonEnabled } from '../toolbox/functions.web';

declare var APP: Object;
declare var interfaceConfig : Object;

/**
 * Implements the middleware of the chat feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case APP_WILL_MOUNT:
        // Register the chat message sound on Web only because there's no chat
        // on mobile.
        typeof APP === 'undefined'
                || store.dispatch(
                    registerSound(
                        INCOMING_MSG_SOUND_ID,
                        INCOMING_MSG_SOUND_FILE
                    )
                );
        break;

    case APP_WILL_UNMOUNT:
        // Unregister the chat message sound on Web because it's registered
        // there only.
        typeof APP === 'undefined'
                || store.dispatch(unregisterSound(INCOMING_MSG_SOUND_ID));
        break;

    case CONFERENCE_JOINED:
        typeof APP === 'undefined'
                || _addChatMsgListener(action.conference, store);
        break;
    }

    return next(action);
});

/**
 * Registers listener for {@link JitsiConferenceEvents.MESSAGE_RECEIVED} which
 * will play a sound on the event, given that the chat is not currently visible.
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Object} store - The redux store object.
 * @private
 * @returns {void}
 */
function _addChatMsgListener(conference, { dispatch, getState }) {
    if (!interfaceConfig.filmStripOnly && isButtonEnabled('chat')) {
        // Message Received Events
        conference.on(
            JitsiConferenceEvents.MESSAGE_RECEIVED,
            (id, message, timestamp) => {

                const state = getState();

                if (!isSidePanelOpen(state)) {
                    dispatch(playSound(INCOMING_MSG_SOUND_ID));
                }

                if (!isSidePanelOpen(state)) {
                    dispatch(showToolbox(4000));
                }

                let timeStampReceived;

                if (timestamp) {
                    timeStampReceived = timestamp;
                } else {
                    timeStampReceived = getCurrentTime();
                }

                const username
                    = APP.conference.getParticipantDisplayName(id)
                    || `${interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME} (${id})`;

                const markAsRead = APP.conference.isLocalId(id);

                APP.API.notifyReceivedChatMessage({
                    id,
                    username,
                    message,
                    timeStampReceived
                });

                dispatch(addMessage(username, message,
                    timeStampReceived, markAsRead));
            }
        );
    }
}

/**
 * Format or get a timestamp in the readable format.
 *
 * @param {string} timestamp - The timestamp param.
 * @returns {string} Formatted timestamp.
 */
export function getCurrentTime() {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    if (hour.toString().length === 1) {
        hour = `0${hour}`;
    }
    if (minute.toString().length === 1) {
        minute = `0${minute}`;
    }
    if (second.toString().length === 1) {
        second = `0${second}`;
    }

    return `${hour}:${minute}:${second}`;
}
