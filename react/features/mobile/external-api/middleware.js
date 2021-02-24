// @flow

import debounce from 'lodash/debounce';
import { NativeEventEmitter, NativeModules } from 'react-native';

import { ENDPOINT_TEXT_MESSAGE_NAME } from '../../../../modules/API/constants';
import { appNavigate } from '../../app/actions';
import { APP_WILL_MOUNT } from '../../base/app/actionTypes';
import {
    CONFERENCE_FAILED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_WILL_JOIN,
    JITSI_CONFERENCE_URL_KEY,
    SET_ROOM,
    forEachConference,
    getCurrentConference,
    isRoomValid
} from '../../base/conference';
import { LOAD_CONFIG_ERROR } from '../../base/config';
import {
    CONNECTION_DISCONNECTED,
    CONNECTION_FAILED,
    JITSI_CONNECTION_CONFERENCE_KEY,
    JITSI_CONNECTION_URL_KEY,
    getURLWithoutParams
} from '../../base/connection';
import { JitsiConferenceEvents } from '../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../base/media';
import { SET_AUDIO_MUTED } from '../../base/media/actionTypes';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT, getParticipants, getParticipantById } from '../../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../../base/redux';
import { toggleScreensharing } from '../../base/tracks';
import { OPEN_CHAT, CLOSE_CHAT } from '../../chat';
import { openChat } from '../../chat/actions';
import { sendMessage, setPrivateMessageRecipient, closeChat } from '../../chat/actions.any';
import { muteLocal } from '../../remote-video-menu/actions';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture';

import { setParticipantsWithScreenShare } from './actions';
import { sendEvent } from './functions';
import logger from './logger';

/**
 * Event which will be emitted on the native side when a chat message is received
 * through the channel.
 */
const CHAT_MESSAGE_RECEIVED = 'CHAT_MESSAGE_RECEIVED';

/**
 * Event which will be emitted on the native side when the chat dialog is displayed/closed.
 */
const CHAT_TOGGLED = 'CHAT_TOGGLED';

/**
 * Event which will be emitted on the native side to indicate the conference
 * has ended either by user request or because an error was produced.
 */
const CONFERENCE_TERMINATED = 'CONFERENCE_TERMINATED';

/**
 * Event which will be emitted on the native side to indicate a message was received
 * through the channel.
 */
const ENDPOINT_TEXT_MESSAGE_RECEIVED = 'ENDPOINT_TEXT_MESSAGE_RECEIVED';

/**
 * Event which will be emitted on the native side to indicate a participant togggles
 * the screen share.
 */
const SCREEN_SHARE_TOGGLED = 'SCREEN_SHARE_TOGGLED';

/**
 * Event which will be emitted on the native side with the participant info array.
 */
const PARTICIPANTS_INFO_RETRIEVED = 'PARTICIPANTS_INFO_RETRIEVED';

const { ExternalAPI } = NativeModules;
const eventEmitter = new NativeEventEmitter(ExternalAPI);

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type } = action;

    switch (type) {
    case APP_WILL_MOUNT:
        _registerForNativeEvents(store);
        break;
    case CONFERENCE_FAILED: {
        const { error, ...data } = action;

        // XXX Certain CONFERENCE_FAILED errors are recoverable i.e. they have
        // prevented the user from joining a specific conference but the app may
        // be able to eventually join the conference. For example, the app will
        // ask the user for a password upon
        // JitsiConferenceErrors.PASSWORD_REQUIRED and will retry joining the
        // conference afterwards. Such errors are to not reach the native
        // counterpart of the External API (or at least not in the
        // fatality/finality semantics attributed to
        // conferenceFailed:/onConferenceFailed).
        if (!error.recoverable) {
            _sendConferenceEvent(store, /* action */ {
                error: _toErrorString(error),
                ...data
            });
        }
        break;
    }

    case CONFERENCE_LEFT:
    case CONFERENCE_WILL_JOIN:
        _sendConferenceEvent(store, action);
        break;

    case CONFERENCE_JOINED:
        _sendConferenceEvent(store, action);
        _registerForEndpointTextMessages(store);
        break;

    case CONNECTION_DISCONNECTED: {
        // FIXME: This is a hack. See the description in the JITSI_CONNECTION_CONFERENCE_KEY constant definition.
        // Check if this connection was attached to any conference. If it wasn't, fake a CONFERENCE_TERMINATED event.
        const { connection } = action;
        const conference = connection[JITSI_CONNECTION_CONFERENCE_KEY];

        if (!conference) {
            // This action will arrive late, so the locationURL stored on the state is no longer valid.
            const locationURL = connection[JITSI_CONNECTION_URL_KEY];

            sendEvent(
                store,
                CONFERENCE_TERMINATED,
                /* data */ {
                    url: _normalizeUrl(locationURL)
                });
        }

        break;
    }

    case CONNECTION_FAILED:
        !action.error.recoverable
            && _sendConferenceFailedOnConnectionError(store, action);
        break;

    case ENTER_PICTURE_IN_PICTURE:
        sendEvent(store, type, /* data */ {});
        break;

    case LOAD_CONFIG_ERROR: {
        const { error, locationURL } = action;

        sendEvent(
            store,
            CONFERENCE_TERMINATED,
            /* data */ {
                error: _toErrorString(error),
                url: _normalizeUrl(locationURL)
            });
        break;
    }

    case OPEN_CHAT:
    case CLOSE_CHAT: {
        sendEvent(
            store,
            CHAT_TOGGLED,
            /* data */ {
                isOpen: action.type === OPEN_CHAT
            });
        break;
    }

    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT: {
        const { participant } = action;

        sendEvent(
            store,
            action.type,
            /* data */ {
                isLocal: participant.local,
                email: participant.email,
                name: participant.name,
                participantId: participant.id,
                displayName: participant.displayName,
                avatarUrl: participant.avatarURL,
                role: participant.role
            });
        break;
    }

    case SET_ROOM:
        _maybeTriggerEarlyConferenceWillJoin(store, action);
        break;

    case SET_AUDIO_MUTED:
        sendEvent(
            store,
            'AUDIO_MUTED_CHANGED',
            /* data */ {
                muted: action.muted
            });
        break;
    }

    return result;
});

/**
 * Listen for changes to the known media tracks and look
 * for updates to screen shares for emitting native events.
 * The listener is debounced to avoid state thrashing that might occur,
 * especially when switching in or out of p2p.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ debounce((tracks, store) => {
        const oldScreenShares = store.getState()['features/mobile/external-api'].screenShares || [];
        const newScreenShares = tracks
            .filter(track => track.mediaType === 'video' && track.videoType === 'desktop')
            .map(track => track.participantId);

        oldScreenShares.forEach(participantId => {
            if (!newScreenShares.includes(participantId)) {
                sendEvent(
                    store,
                    SCREEN_SHARE_TOGGLED,
                    /* data */ {
                        participantId,
                        sharing: false
                    });
            }
        });

        newScreenShares.forEach(participantId => {
            if (!oldScreenShares.includes(participantId)) {
                sendEvent(
                    store,
                    SCREEN_SHARE_TOGGLED,
                    /* data */ {
                        participantId,
                        sharing: true
                    });
            }
        });

        store.dispatch(setParticipantsWithScreenShare(newScreenShares));

    }, 100));

/**
 * Registers for events sent from the native side via NativeEventEmitter.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerForNativeEvents(store) {
    const { getState, dispatch } = store;

    eventEmitter.addListener(ExternalAPI.HANG_UP, () => {
        dispatch(appNavigate(undefined));
    });

    eventEmitter.addListener(ExternalAPI.SET_AUDIO_MUTED, ({ muted }) => {
        dispatch(muteLocal(muted === 'true', MEDIA_TYPE.AUDIO));
    });

    eventEmitter.addListener(ExternalAPI.SEND_ENDPOINT_TEXT_MESSAGE, ({ to, message }) => {
        const conference = getCurrentConference(getState());

        try {
            conference && conference.sendEndpointMessage(to, {
                name: ENDPOINT_TEXT_MESSAGE_NAME,
                text: message
            });
        } catch (error) {
            logger.warn('Cannot send endpointMessage', error);
        }
    });

    eventEmitter.addListener(ExternalAPI.TOGGLE_SCREEN_SHARE, () => {
        dispatch(toggleScreensharing());
    });

    eventEmitter.addListener(ExternalAPI.RETRIEVE_PARTICIPANTS_INFO, ({ requestId }) => {

        const participantsInfo = getParticipants(store).map(participant => {
            return {
                isLocal: participant.local,
                email: participant.email,
                name: participant.name,
                participantId: participant.id,
                displayName: participant.displayName,
                avatarUrl: participant.avatarURL,
                role: participant.role
            };
        });

        sendEvent(
            store,
            PARTICIPANTS_INFO_RETRIEVED,
            /* data */ {
                participantsInfo,
                requestId
            });
    });

    eventEmitter.addListener(ExternalAPI.OPEN_CHAT, ({ to }) => {
        const participant = getParticipantById(store, to);

        dispatch(openChat(participant));
    });

    eventEmitter.addListener(ExternalAPI.CLOSE_CHAT, () => {
        dispatch(closeChat());
    });

    eventEmitter.addListener(ExternalAPI.SEND_CHAT_MESSAGE, ({ message, to }) => {
        const participant = getParticipantById(store, to);

        if (participant) {
            dispatch(setPrivateMessageRecipient(participant));
        }

        dispatch(sendMessage(message));
    });

}

/**
 * Registers for endpoint messages sent on conference data channel.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerForEndpointTextMessages(store) {
    const conference = getCurrentConference(store.getState());

    conference && conference.on(
        JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
        (...args) => {
            if (args && args.length >= 2) {
                const [ sender, eventData ] = args;

                if (eventData.name === ENDPOINT_TEXT_MESSAGE_NAME) {
                    sendEvent(
                        store,
                        ENDPOINT_TEXT_MESSAGE_RECEIVED,
                        /* data */ {
                            message: eventData.text,
                            senderId: sender._id
                        });
                }
            }
        });

    conference.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
            (id, message, timestamp) => {
                sendEvent(
                    store,
                    CHAT_MESSAGE_RECEIVED,
                    /* data */ {
                        senderId: id,
                        message,
                        isPrivate: false,
                        timestamp
                    });
            }
    );

    conference.on(
        JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
            (id, message, timestamp) => {
                sendEvent(
                    store,
                    CHAT_MESSAGE_RECEIVED,
                    /* data */ {
                        senderId: id,
                        message,
                        isPrivate: true,
                        timestamp
                    });
            }
    );
}

/**
 * Returns a {@code String} representation of a specific error {@code Object}.
 *
 * @param {Error|Object|string} error - The error {@code Object} to return a
 * {@code String} representation of.
 * @returns {string} A {@code String} representation of the specified
 * {@code error}.
 */
function _toErrorString(
        error: Error | { message: ?string, name: ?string } | string) {
    // XXX In lib-jitsi-meet and jitsi-meet we utilize errors in the form of
    // strings, Error instances, and plain objects which resemble Error.
    return (
        error
            ? typeof error === 'string'
                ? error
                : Error.prototype.toString.apply(error)
            : '');
}

/**
 * If {@link SET_ROOM} action happens for a valid conference room this method
 * will emit an early {@link CONFERENCE_WILL_JOIN} event to let the external API
 * know that a conference is being joined. Before that happens a connection must
 * be created and only then base/conference feature would emit
 * {@link CONFERENCE_WILL_JOIN}. That is fine for the Jitsi Meet app, because
 * that's the a conference instance gets created, but it's too late for
 * the external API to learn that. The latter {@link CONFERENCE_WILL_JOIN} is
 * swallowed in {@link _swallowEvent}.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _maybeTriggerEarlyConferenceWillJoin(store, action) {
    const { locationURL } = store.getState()['features/base/connection'];
    const { room } = action;

    isRoomValid(room) && locationURL && sendEvent(
        store,
        CONFERENCE_WILL_JOIN,
        /* data */ {
            url: _normalizeUrl(locationURL)
        });
}

/**
 * Normalizes the given URL for presentation over the external API.
 *
 * @param {URL} url -The URL to normalize.
 * @returns {string} - The normalized URL as a string.
 */
function _normalizeUrl(url: URL) {
    return getURLWithoutParams(url).href;
}

/**
 * Sends an event to the native counterpart of the External API for a specific
 * conference-related redux action.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _sendConferenceEvent(
        store: Object,
        action: {
            conference: Object,
            type: string,
            url: ?string
        }) {
    const { conference, type, ...data } = action;

    // For these (redux) actions, conference identifies a JitsiConference
    // instance. The external API cannot transport such an object so we have to
    // transport an "equivalent".
    if (conference) {
        data.url = _normalizeUrl(conference[JITSI_CONFERENCE_URL_KEY]);
    }

    if (_swallowEvent(store, action, data)) {
        return;
    }

    let type_;

    switch (type) {
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        type_ = CONFERENCE_TERMINATED;
        break;
    default:
        type_ = type;
        break;
    }

    sendEvent(store, type_, data);
}

/**
 * Sends {@link CONFERENCE_TERMINATED} event when the {@link CONNECTION_FAILED}
 * occurs. It should be done only if the connection fails before the conference
 * instance is created. Otherwise the eventual failure event is supposed to be
 * emitted by the base/conference feature.
 *
 * @param {Store} store - The redux store.
 * @param {Action} action - The redux action.
 * @returns {void}
 */
function _sendConferenceFailedOnConnectionError(store, action) {
    const { locationURL } = store.getState()['features/base/connection'];
    const { connection } = action;

    locationURL
        && forEachConference(
            store,

            // If there's any conference in the  base/conference state then the
            // base/conference feature is supposed to emit a failure.
            conference => conference.getConnection() !== connection)
        && sendEvent(
        store,
        CONFERENCE_TERMINATED,
        /* data */ {
            url: _normalizeUrl(locationURL),
            error: action.error.name
        });
}

/**
 * Determines whether to not send a {@code CONFERENCE_LEFT} event to the native
 * counterpart of the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowConferenceLeft({ getState }, action, { url }) {
    // XXX Internally, we work with JitsiConference instances. Externally
    // though, we deal with URL strings. The relation between the two is many to
    // one so it's technically and practically possible (by externally loading
    // the same URL string multiple times) to try to send CONFERENCE_LEFT
    // externally for a URL string which identifies a JitsiConference that the
    // app is internally legitimately working with.
    let swallowConferenceLeft = false;

    url
        && forEachConference(getState, (conference, conferenceURL) => {
            if (conferenceURL && conferenceURL.toString() === url) {
                swallowConferenceLeft = true;
            }

            return !swallowConferenceLeft;
        });

    return swallowConferenceLeft;
}

/**
 * Determines whether to not send a specific event to the native counterpart of
 * the External API.
 *
 * @param {Object} store - The redux store.
 * @param {Action} action - The redux action which is causing the sending of the
 * event.
 * @param {Object} data - The details/specifics of the event to send determined
 * by/associated with the specified {@code action}.
 * @returns {boolean} If the specified event is to not be sent, {@code true};
 * otherwise, {@code false}.
 */
function _swallowEvent(store, action, data) {
    switch (action.type) {
    case CONFERENCE_LEFT:
        return _swallowConferenceLeft(store, action, data);
    case CONFERENCE_WILL_JOIN:
        // CONFERENCE_WILL_JOIN is dispatched to the external API on SET_ROOM,
        // before the connection is created, so we need to swallow the original
        // one emitted by base/conference.
        return true;

    default:
        return false;
    }
}
