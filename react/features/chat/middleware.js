// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import {
    CONFERENCE_JOINED,
    getCurrentConference
} from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import {
    getParticipantById,
    getParticipantDisplayName
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { isButtonEnabled, showToolbox } from '../toolbox';

import { SEND_MESSAGE } from './actionTypes';
import { addMessage, clearMessages, toggleChat } from './actions';
import { INCOMING_MSG_SOUND_ID } from './constants';
import { INCOMING_MSG_SOUND_FILE } from './sounds';

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
        store.dispatch(
                registerSound(INCOMING_MSG_SOUND_ID, INCOMING_MSG_SOUND_FILE));
        break;

    case APP_WILL_UNMOUNT:
        store.dispatch(unregisterSound(INCOMING_MSG_SOUND_ID));
        break;

    case CONFERENCE_JOINED:
        _addChatMsgListener(action.conference, store);
        break;

    case SEND_MESSAGE: {
        const { conference } = store.getState()['features/base/conference'];

        if (conference) {
            if (typeof APP !== 'undefined') {
                APP.API.notifySendingChatMessage(action.message);
            }
            conference.sendTextMessage(action.message);
        }
        break;
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference) => {
        if (conference !== previousConference) {
            // conference changed, left or failed...

            if (getState()['features/chat'].isOpen) {
                // Closes the chat if it's left open.
                dispatch(toggleChat());
            }

            // Clear chat messages.
            dispatch(clearMessages());
        }
    });

StateListenerRegistry.register(
    state => state['features/chat'].isOpen,
    (isOpen, { dispatch }) => {
        if (typeof APP !== 'undefined' && isOpen) {
            dispatch(showToolbox());
        }
    }
);

/**
 * Registers listener for {@link JitsiConferenceEvents.MESSAGE_RECEIVED} that
 * will perform various chat related activities.
 *
 * @param {JitsiConference} conference - The conference instance on which the
 * new event listener will be registered.
 * @param {Object} store - The redux store object.
 * @private
 * @returns {void}
 */
function _addChatMsgListener(conference, { dispatch, getState }) {
    if ((typeof interfaceConfig === 'object' && interfaceConfig.filmStripOnly)
        || (typeof APP !== 'undefined' && !isButtonEnabled('chat'))
        || getState()['features/base/config'].iAmRecorder) {
        // We don't register anything on web if we're in filmStripOnly mode, or
        // the chat button is not enabled in interfaceConfig.
        // or we are in iAmRecorder mode
        return;
    }

    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
        (id, message, timestamp, nick) => {
            // Logic for all platforms:
            const state = getState();
            const { isOpen: isChatOpen } = state['features/chat'];

            if (!isChatOpen) {
                dispatch(playSound(INCOMING_MSG_SOUND_ID));
            }

            // Provide a default for for the case when a message is being
            // backfilled for a participant that has left the conference.
            const participant = getParticipantById(state, id) || {};
            const displayName = participant.name || nick || getParticipantDisplayName(state, id);
            const hasRead = participant.local || isChatOpen;
            const timestampToDate = timestamp
                ? new Date(timestamp) : new Date();
            const millisecondsTimestamp = timestampToDate.getTime();

            dispatch(addMessage({
                displayName,
                hasRead,
                id,
                messageType: participant.local ? 'local' : 'remote',
                message,
                timestamp: millisecondsTimestamp
            }));

            if (typeof APP !== 'undefined') {
                // Logic for web only:

                APP.API.notifyReceivedChatMessage({
                    body: message,
                    id,
                    nick: displayName,
                    ts: timestamp
                });

                dispatch(showToolbox(4000));
            }
        }
    );
}
