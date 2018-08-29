// @flow

import UIUtil from '../../../modules/UI/util/UIUtil';

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { getParticipantById } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { isButtonEnabled, showToolbox } from '../toolbox';

import { SEND_MESSAGE } from './actionTypes';
import { addMessage } from './actions';
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
        // Register the chat message sound on Web only because there's no chat
        // on mobile.
        typeof APP === 'undefined'
            || store.dispatch(
                registerSound(INCOMING_MSG_SOUND_ID, INCOMING_MSG_SOUND_FILE));
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

    case SEND_MESSAGE:
        if (typeof APP !== 'undefined') {
            const { conference } = store.getState()['features/base/conference'];

            if (conference) {
                const escapedMessage = UIUtil.escapeHtml(action.message);

                APP.API.notifySendingChatMessage(escapedMessage);
                conference.sendTextMessage(escapedMessage);
            }
        }
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
    if ((typeof interfaceConfig === 'object' && interfaceConfig.filmStripOnly)
        || !isButtonEnabled('chat')) {
        return;
    }

    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
        (id, message, timestamp) => {
            const state = getState();
            const { isOpen: isChatOpen } = state['features/chat'];

            if (!isChatOpen) {
                dispatch(playSound(INCOMING_MSG_SOUND_ID));
                dispatch(showToolbox(4000));
            }

            // Provide a default for for the case when a message is being
            // backfilled for a participant that has left the conference.
            const participant = getParticipantById(state, id) || {};
            const displayName = participant.name
                || `${interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME} (${id})`;
            const hasRead = participant.local || isChatOpen;

            APP.API.notifyReceivedChatMessage({
                body: message,
                id,
                nick: displayName,
                ts: timestamp
            });

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
        }
    );
}
