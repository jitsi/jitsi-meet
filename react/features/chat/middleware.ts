import { AnyAction } from 'redux';

import { IReduxState, IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { IJitsiConference } from '../base/conference/reducer';
import { openDialog } from '../base/dialog/actions';
import i18next from '../base/i18n/i18next';
import {
    JitsiConferenceErrors,
    JitsiConferenceEvents
} from '../base/lib-jitsi-meet';
import {
    getLocalParticipant,
    getParticipantById,
    getParticipantDisplayName
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound, registerSound, unregisterSound } from '../base/sounds/actions';
import { addGif } from '../gifs/actions';
import { GIF_PREFIX } from '../gifs/constants';
import { getGifDisplayMode, isGifMessage } from '../gifs/function.any';
import { showMessageNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { resetNbUnreadPollsMessages } from '../polls/actions';
import { ADD_REACTION_MESSAGE } from '../reactions/actionTypes';
import { pushReactions } from '../reactions/actions.any';
import { ENDPOINT_REACTION_NAME } from '../reactions/constants';
import { getReactionMessageFromBuffer, isReactionsEnabled } from '../reactions/functions.any';
import { showToolbox } from '../toolbox/actions';


import { ADD_MESSAGE, CLOSE_CHAT, OPEN_CHAT, SEND_MESSAGE, SET_IS_POLL_TAB_FOCUSED } from './actionTypes';
import { addMessage, clearMessages, closeChat } from './actions.any';
import { ChatPrivacyDialog } from './components';
import {
    INCOMING_MSG_SOUND_ID,
    LOBBY_CHAT_MESSAGE,
    MESSAGE_TYPE_ERROR,
    MESSAGE_TYPE_LOCAL,
    MESSAGE_TYPE_REMOTE
} from './constants';
import { getUnreadCount } from './functions';
import { INCOMING_MSG_SOUND_FILE } from './sounds';

/**
 * Timeout for when to show the privacy notice after a private message was received.
 *
 * E.g. If this value is 20 secs (20000ms), then we show the privacy notice when sending a non private
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
    const { dispatch, getState } = store;
    const localParticipant = getLocalParticipant(getState());
    let isOpen, unreadCount;

    switch (action.type) {
    case ADD_MESSAGE:
        unreadCount = getUnreadCount(getState());
        if (action.isReaction) {
            action.hasRead = false;
        } else {
            unreadCount = action.hasRead ? 0 : unreadCount + 1;
        }
        isOpen = getState()['features/chat'].isOpen;

        if (typeof APP !== 'undefined') {
            APP.API.notifyChatUpdated(unreadCount, isOpen);
        }
        break;

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

    case OPEN_CHAT:
        unreadCount = 0;

        if (typeof APP !== 'undefined') {
            APP.API.notifyChatUpdated(unreadCount, true);
        }
        break;

    case CLOSE_CHAT: {
        const isPollTabOpen = getState()['features/chat'].isPollsTabFocused;

        unreadCount = 0;

        if (typeof APP !== 'undefined') {
            APP.API.notifyChatUpdated(unreadCount, false);
        }

        if (isPollTabOpen) {
            dispatch(resetNbUnreadPollsMessages());
        }
        break;
    }

    case SET_IS_POLL_TAB_FOCUSED: {
        dispatch(resetNbUnreadPollsMessages());
        break;
    }

    case SEND_MESSAGE: {
        const state = store.getState();
        const conference = getCurrentConference(state);

        if (conference) {
            // There may be cases when we intend to send a private message but we forget to set the
            // recipient. This logic tries to mitigate this risk.
            const shouldSendPrivateMessageTo = _shouldSendPrivateMessageTo(state, action);

            const participantExists = shouldSendPrivateMessageTo
                && getParticipantById(state, shouldSendPrivateMessageTo);

            if (shouldSendPrivateMessageTo && participantExists) {
                dispatch(openDialog(ChatPrivacyDialog, {
                    message: action.message,
                    participantID: shouldSendPrivateMessageTo
                }));
            } else {
                // Sending the message if privacy notice doesn't need to be shown.

                const { privateMessageRecipient, isLobbyChatActive, lobbyMessageRecipient }
                    = state['features/chat'];

                if (typeof APP !== 'undefined') {
                    APP.API.notifySendingChatMessage(action.message, Boolean(privateMessageRecipient));
                }

                if (isLobbyChatActive && lobbyMessageRecipient) {
                    conference.sendLobbyMessage({
                        type: LOBBY_CHAT_MESSAGE,
                        message: action.message
                    }, lobbyMessageRecipient.id);
                    _persistSentPrivateMessage(store, lobbyMessageRecipient.id, action.message, true);
                } else if (privateMessageRecipient) {
                    conference.sendPrivateTextMessage(privateMessageRecipient.id, action.message);
                    _persistSentPrivateMessage(store, privateMessageRecipient.id, action.message);
                } else {
                    conference.sendTextMessage(action.message);
                }
            }
        }
        break;
    }

    case ADD_REACTION_MESSAGE: {
        if (localParticipant?.id) {
            _handleReceivedMessage(store, {
                id: localParticipant.id,
                message: action.message,
                privateMessage: false,
                timestamp: Date.now(),
                lobbyChat: false
            }, false, true);
        }
    }
    }

    return next(action);
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, e.g. Clear messages or close the chat modal if it's left
 * open.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference) => {
        if (conference !== previousConference) {
            // conference changed, left or failed...

            if (getState()['features/chat'].isOpen) {
                // Closes the chat if it's left open.
                dispatch(closeChat());
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
function _addChatMsgListener(conference: IJitsiConference, store: IStore) {
    if (store.getState()['features/base/config'].iAmRecorder) {
        // We don't register anything on web if we are in iAmRecorder mode
        return;
    }

    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
        // eslint-disable-next-line max-params
        (id: string, message: string, timestamp: number, displayName: string, isGuest?: boolean) => {
            _onConferenceMessageReceived(store, {
                id: id || displayName, // in case of messages coming from visitors we can have unknown id
                message,
                timestamp,
                displayName,
                isGuest,
                privateMessage: false });
        }
    );

    conference.on(
        JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
        (id: string, message: string, timestamp: number) => {
            _onConferenceMessageReceived(store, {
                id,
                message,
                timestamp,
                privateMessage: true
            });
        }
    );

    // TODO: clean this up, there should be a central place that dispatches this. -saghul
    conference.on(
        JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
        (...args: any) => {
            const state = store.getState();

            if (!isReactionsEnabled(state)) {
                return;
            }

            if (args && args.length >= 2) {
                const [ { _id }, eventData ] = args;

                if (eventData.name === ENDPOINT_REACTION_NAME) {
                    store.dispatch(pushReactions(eventData.reactions));

                    _handleReceivedMessage(store, {
                        id: _id,
                        message: getReactionMessageFromBuffer(eventData.reactions),
                        privateMessage: false,
                        lobbyChat: false,
                        timestamp: eventData.timestamp
                    }, false, true);
                }
            }
        });

    conference.on(
        JitsiConferenceEvents.CONFERENCE_ERROR, (errorType: string, error: Error) => {
            errorType === JitsiConferenceErrors.CHAT_ERROR && _handleChatError(store, error);
        });
}

/**
 * Handles a received message.
 *
 * @param {Object} store - Redux store.
 * @param {Object} message - The message object.
 * @returns {void}
 */
function _onConferenceMessageReceived(store: IStore, { displayName, id, isGuest, message, timestamp, privateMessage }: {
    displayName?: string; id: string; isGuest?: boolean;
    message: string; privateMessage: boolean; timestamp: number; }) {
    const isGif = isGifMessage(message);

    if (isGif) {
        _handleGifMessageReceived(store, id, message);
        if (getGifDisplayMode(store.getState()) === 'tile') {
            return;
        }
    }
    _handleReceivedMessage(store, {
        displayName,
        id,
        isGuest,
        message,
        privateMessage,
        lobbyChat: false,
        timestamp
    }, true, isGif);
}

/**
 * Handles a received gif message.
 *
 * @param {Object} store - Redux store.
 * @param {string} id - Id of the participant that sent the message.
 * @param {string} message - The message sent.
 * @returns {void}
 */
function _handleGifMessageReceived(store: IStore, id: string, message: string) {
    const url = message.substring(GIF_PREFIX.length, message.length - 1);

    store.dispatch(addGif(id, url));
}

/**
 * Handles a chat error received from the xmpp server.
 *
 * @param {Store} store - The Redux store.
 * @param  {string} error - The error message.
 * @returns {void}
 */
function _handleChatError({ dispatch }: IStore, error: Error) {
    dispatch(addMessage({
        hasRead: true,
        messageType: MESSAGE_TYPE_ERROR,
        message: error,
        privateMessage: false,
        timestamp: Date.now()
    }));
}

/**
 * Function to handle an incoming chat message from lobby room.
 *
 * @param {string} message - The message received.
 * @param {string} participantId - The participant id.
 * @returns {Function}
 */
export function handleLobbyMessageReceived(message: string, participantId: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        _handleReceivedMessage({ dispatch,
            getState }, { id: participantId,
            message,
            privateMessage: false,
            lobbyChat: true,
            timestamp: Date.now() });
    };
}


/**
 * Function to get lobby chat user display name.
 *
 * @param {Store} state - The Redux store.
 * @param {string} id - The knocking participant id.
 * @returns {string}
 */
function getLobbyChatDisplayName(state: IReduxState, id: string) {
    const { knockingParticipants } = state['features/lobby'];
    const { lobbyMessageRecipient } = state['features/chat'];

    if (id === lobbyMessageRecipient?.id) {
        return lobbyMessageRecipient.name;
    }

    const knockingParticipant = knockingParticipants.find(p => p.id === id);

    if (knockingParticipant) {
        return knockingParticipant.name;
    }

}


/**
 * Function to handle an incoming chat message.
 *
 * @param {Store} store - The Redux store.
 * @param {Object} message - The message object.
 * @param {boolean} shouldPlaySound - Whether to play the incoming message sound.
 * @param {boolean} isReaction - Whether the message is a reaction message.
 * @returns {void}
 */
function _handleReceivedMessage({ dispatch, getState }: IStore,
        { displayName, id, isGuest, message, privateMessage, timestamp, lobbyChat }: {
        displayName?: string; id: string; isGuest?: boolean; lobbyChat: boolean;
        message: string; privateMessage: boolean; timestamp: number; },
        shouldPlaySound = true,
        isReaction = false
) {
    // Logic for all platforms:
    const state = getState();
    const { isOpen: isChatOpen } = state['features/chat'];
    const { soundsIncomingMessage: soundEnabled, userSelectedNotifications } = state['features/base/settings'];

    if (soundEnabled && shouldPlaySound && !isChatOpen) {
        dispatch(playSound(INCOMING_MSG_SOUND_ID));
    }

    // Provide a default for the case when a message is being
    // backfilled for a participant that has left the conference.
    const participant = getParticipantById(state, id) || { local: undefined };

    const localParticipant = getLocalParticipant(getState);
    let displayNameToShow = lobbyChat
        ? getLobbyChatDisplayName(state, id)
        : displayName || getParticipantDisplayName(state, id);
    const hasRead = participant.local || isChatOpen;
    const timestampToDate = timestamp ? new Date(timestamp) : new Date();
    const millisecondsTimestamp = timestampToDate.getTime();

    // skip message notifications on join (the messages having timestamp - coming from the history)
    const shouldShowNotification = userSelectedNotifications?.['notify.chatMessages']
        && !hasRead && !isReaction && !timestamp;

    if (isGuest) {
        displayNameToShow = `${displayNameToShow} ${i18next.t('visitors.chatIndicator')}`;
    }

    dispatch(addMessage({
        displayName: displayNameToShow,
        hasRead,
        id,
        messageType: participant.local ? MESSAGE_TYPE_LOCAL : MESSAGE_TYPE_REMOTE,
        message,
        privateMessage,
        lobbyChat,
        recipient: getParticipantDisplayName(state, localParticipant?.id ?? ''),
        timestamp: millisecondsTimestamp,
        isReaction
    }));

    if (shouldShowNotification) {
        dispatch(showMessageNotification({
            title: displayNameToShow,
            description: message
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    }

    if (typeof APP !== 'undefined') {
        // Logic for web only:

        APP.API.notifyReceivedChatMessage({
            body: message,
            id,
            nick: displayNameToShow,
            privateMessage,
            ts: timestamp
        });
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
 * @param {boolean} isLobbyPrivateMessage - Is a lobby message.
 * @returns {void}
 */
function _persistSentPrivateMessage({ dispatch, getState }: IStore, recipientID: string,
        message: string, isLobbyPrivateMessage = false) {
    const state = getState();
    const localParticipant = getLocalParticipant(state);

    if (!localParticipant?.id) {
        return;
    }
    const displayName = getParticipantDisplayName(state, localParticipant.id);
    const { lobbyMessageRecipient } = state['features/chat'];

    dispatch(addMessage({
        displayName,
        hasRead: true,
        id: localParticipant.id,
        messageType: MESSAGE_TYPE_LOCAL,
        message,
        privateMessage: !isLobbyPrivateMessage,
        lobbyChat: isLobbyPrivateMessage,
        recipient: isLobbyPrivateMessage
            ? lobbyMessageRecipient?.name
            : getParticipantDisplayName(getState, recipientID),
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
function _shouldSendPrivateMessageTo(state: IReduxState, action: AnyAction) {
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
