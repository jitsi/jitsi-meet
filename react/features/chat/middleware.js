// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import {
    CONFERENCE_JOINED,
    getCurrentConference
} from '../base/conference';
import { openDialog } from '../base/dialog';
import {
    JitsiConferenceErrors,
    JitsiConferenceEvents
} from '../base/lib-jitsi-meet';
import { setActiveModalId } from '../base/modal';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantDisplayName
} from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { showToolbox } from '../toolbox/actions';
import { isButtonEnabled } from '../toolbox/functions';

import { SEND_MESSAGE, SET_PRIVATE_MESSAGE_RECIPIENT } from './actionTypes';
import { addMessage, clearMessages, toggleChat } from './actions';
import { ChatPrivacyDialog } from './components';
import {
    CHAT_VIEW_MODAL_ID,
    INCOMING_MSG_SOUND_ID,
    MESSAGE_TYPE_ERROR,
    MESSAGE_TYPE_LOCAL,
    MESSAGE_TYPE_REMOTE
} from './constants';
import { INCOMING_MSG_SOUND_FILE } from './sounds';

declare var APP: Object;
declare var interfaceConfig : Object;

/**
 * Timeout for when to show the privacy notice after a private message was received.
 *
 * E.g. if this value is 20 secs (20000ms), then we show the privacy notice when sending a non private
 * message after we have received a private message in the last 20 seconds.
 */
const PRIVACY_NOTICE_TIMEOUT = 20 * 1000;

/**
 * Implements the middleware of the chat feature.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const { dispatch } = store;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(
                registerSound(INCOMING_MSG_SOUND_ID, INCOMING_MSG_SOUND_FILE));
        break;

    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(INCOMING_MSG_SOUND_ID));
        break;

    case CONFERENCE_JOINED:
        _addChatMsgListener(action.conference, store);
        break;

    case SEND_MESSAGE: {
        const state = store.getState();
        const { conference } = state['features/base/conference'];

        if (conference) {
            // There may be cases when we intend to send a private message but we forget to set the
            // recipient. This logic tries to mitigate this risk.
            const shouldSendPrivateMessageTo = _shouldSendPrivateMessageTo(state, action);

            if (shouldSendPrivateMessageTo) {
                dispatch(openDialog(ChatPrivacyDialog, {
                    message: action.message,
                    participantID: shouldSendPrivateMessageTo
                }));
            } else {
                // Sending the message if privacy notice doesn't need to be shown.

                const { privateMessageRecipient } = state['features/chat'];

                if (typeof APP !== 'undefined') {
                    APP.API.notifySendingChatMessage(action.message, Boolean(privateMessageRecipient));
                }

                if (privateMessageRecipient) {
                    conference.sendPrivateTextMessage(privateMessageRecipient.id, action.message);
                    _persistSentPrivateMessage(store, privateMessageRecipient.id, action.message);
                } else {
                    conference.sendTextMessage(action.message);
                }
            }
        }
        break;
    }

    case SET_PRIVATE_MESSAGE_RECIPIENT: {
        Boolean(action.participant) && dispatch(setActiveModalId(CHAT_VIEW_MODAL_ID));
        _maybeFocusField();
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
function _addChatMsgListener(conference, store) {
    if ((typeof APP !== 'undefined' && !isButtonEnabled('chat'))
        || store.getState()['features/base/config'].iAmRecorder) {
        // We don't register anything on web if the chat button is not enabled in interfaceConfig
        // or we are in iAmRecorder mode
        return;
    }

    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
        (id, message, timestamp) => {
            _handleReceivedMessage(store, {
                id,
                message,
                privateMessage: false,
                timestamp
            });
        }
    );

    conference.on(
        JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
        (id, message, timestamp) => {
            _handleReceivedMessage(store, {
                id,
                message,
                privateMessage: true,
                timestamp
            });
        }
    );

    conference.on(
        JitsiConferenceEvents.CONFERENCE_ERROR, (errorType, error) => {
            errorType === JitsiConferenceErrors.CHAT_ERROR && _handleChatError(store, error);
        });
}

/**
 * Handles a chat error received from the xmpp server.
 *
 * @param {Store} store - The Redux store.
 * @param  {string} error - The error message.
 * @returns {void}
 */
function _handleChatError({ dispatch }, error) {
    dispatch(addMessage({
        hasRead: true,
        messageType: MESSAGE_TYPE_ERROR,
        message: error,
        privateMessage: false,
        timestamp: Date.now()
    }));
}

/**
 * Function to handle an incoming chat message.
 *
 * @param {Store} store - The Redux store.
 * @param {Object} message - The message object.
 * @returns {void}
 */
function _handleReceivedMessage({ dispatch, getState }, { id, message, privateMessage, timestamp }) {
    // Logic for all platforms:
    const state = getState();
    const { isOpen: isChatOpen } = state['features/chat'];

    if (!isChatOpen) {
        dispatch(playSound(INCOMING_MSG_SOUND_ID));
    }

    // Provide a default for for the case when a message is being
    // backfilled for a participant that has left the conference.
    const participant = getParticipantById(state, id) || {};
    const localParticipant = getLocalParticipant(getState);
    const displayName = getParticipantDisplayName(state, id);
    const hasRead = participant.local || isChatOpen;
    const timestampToDate = timestamp ? new Date(timestamp) : new Date();
    const millisecondsTimestamp = timestampToDate.getTime();

    dispatch(addMessage({
        displayName,
        hasRead,
        id,
        messageType: participant.local ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
        message,
        privateMessage,
        recipient: getParticipantDisplayName(state, localParticipant.id),
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

/**
 * Focuses the chat text field on web after the message recipient was updated, if needed.
 *
 * @returns {void}
 */
function _maybeFocusField() {
    if (navigator.product !== 'ReactNative') {
        const textField = document.getElementById('usermsg');

        textField && textField.focus();
    }
}

/**
 * Persists the sent private messages as if they were received over the muc.
 *
 * This is required as we rely on the fact that we receive all messages from the muc that we send
 * (as they are sent to everybody), but we don't receive the private messages we send to another participant.
 * But those messages should be in the store as well, otherwise they don't appear in the chat window.
 *
 * @param {Store} store - The Redux store.
 * @param {string} recipientID - The ID of the recipient the private message was sent to.
 * @param {string} message - The sent message.
 * @returns {void}
 */
function _persistSentPrivateMessage({ dispatch, getState }, recipientID, message) {
    const localParticipant = getLocalParticipant(getState);
    const displayName = getParticipantDisplayName(getState, localParticipant.id);

    dispatch(addMessage({
        displayName,
        hasRead: true,
        id: localParticipant.id,
        messageType: MESSAGE_TYPE_LOCAL,
        message,
        privateMessage: true,
        recipient: getParticipantDisplayName(getState, recipientID),
        timestamp: Date.now()
    }));
}

/**
 * Returns the ID of the participant who we may have wanted to send the message
 * that we're about to send.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} action - The action being dispatched now.
 * @returns {string?}
 */
function _shouldSendPrivateMessageTo(state, action): ?string {
    if (action.ignorePrivacy) {
        // Shortcut: this is only true, if we already displayed the notice, so no need to show it again.
        return undefined;
    }

    const { messages, privateMessageRecipient } = state['features/chat'];

    if (privateMessageRecipient) {
        // We're already sending a private message, no need to warn about privacy.
        return undefined;
    }

    if (!messages.length) {
        // No messages yet, no need to warn for privacy.
        return undefined;
    }

    // Platforms sort messages differently
    const lastMessage = navigator.product === 'ReactNative'
        ? messages[0] : messages[messages.length - 1];

    if (lastMessage.messageType === MESSAGE_TYPE_LOCAL) {
        // The sender is probably aware of any private messages as already sent
        // a message since then. Doesn't make sense to display the notice now.
        return undefined;
    }

    if (lastMessage.privateMessage) {
        // We show the notice if the last received message was private.
        return lastMessage.id;
    }

    // But messages may come rapidly, we want to protect our users from mis-sending a message
    // even when there was a reasonable recently received private message.
    const now = Date.now();
    const recentPrivateMessages = messages.filter(
        message =>
            message.messageType !== MESSAGE_TYPE_LOCAL
            && message.privateMessage
            && message.timestamp + PRIVACY_NOTICE_TIMEOUT > now);
    const recentPrivateMessage = navigator.product === 'ReactNative'
        ? recentPrivateMessages[0] : recentPrivateMessages[recentPrivateMessages.length - 1];

    if (recentPrivateMessage) {
        return recentPrivateMessage.id;
    }

    return undefined;
}
