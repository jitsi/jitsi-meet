/* eslint-disable lines-around-comment */

import { debounce } from 'lodash-es';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { AnyAction } from 'redux';

// @ts-ignore
import { ENDPOINT_TEXT_MESSAGE_NAME } from '../../../../modules/API/constants';
import { appNavigate } from '../../app/actions.native';
import { IStore } from '../../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../../base/app/actionTypes';
import {
    CONFERENCE_BLURRED,
    CONFERENCE_FAILED,
    CONFERENCE_FOCUSED,
    CONFERENCE_JOINED,
    CONFERENCE_LEFT,
    CONFERENCE_UNIQUE_ID_SET,
    CONFERENCE_WILL_JOIN,
    ENDPOINT_MESSAGE_RECEIVED,
    SET_ROOM
} from '../../base/conference/actionTypes';
import { JITSI_CONFERENCE_URL_KEY } from '../../base/conference/constants';
import {
    forEachConference,
    getCurrentConference,
    isRoomValid
} from '../../base/conference/functions';
import { IJitsiConference } from '../../base/conference/reducer';
import { overwriteConfig } from '../../base/config/actions';
import { getWhitelistedJSON } from '../../base/config/functions.native';
import { CONNECTION_DISCONNECTED } from '../../base/connection/actionTypes';
import {
    JITSI_CONNECTION_CONFERENCE_KEY,
    JITSI_CONNECTION_URL_KEY
} from '../../base/connection/constants';
import { getURLWithoutParams } from '../../base/connection/utils';
import { JitsiConferenceEvents, JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { SET_AUDIO_MUTED, SET_VIDEO_MUTED } from '../../base/media/actionTypes';
import { toggleCameraFacingMode } from '../../base/media/actions';
import { MEDIA_TYPE, VIDEO_TYPE } from '../../base/media/constants';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../../base/participants/actionTypes';
import {
    getLocalParticipant,
    getParticipantById,
    getRemoteParticipants,
    isScreenShareParticipantById
} from '../../base/participants/functions';
import MiddlewareRegistry from '../../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../../base/redux/StateListenerRegistry';
import { toggleScreensharing } from '../../base/tracks/actions.native';
import { CAMERA_FACING_MODE_MESSAGE } from '../../base/tracks/constants';
import { getLocalTracks, isLocalTrackMuted } from '../../base/tracks/functions.native';
import { ITrack } from '../../base/tracks/types';
import { CLOSE_CHAT, OPEN_CHAT } from '../../chat/actionTypes';
import { closeChat, openChat, sendMessage, setPrivateMessageRecipient } from '../../chat/actions.native';
import { isEnabled as isDropboxEnabled } from '../../dropbox/functions.native';
import { hideNotification, showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../notifications/constants';
import { RECORDING_SESSION_UPDATED } from '../../recording/actionTypes';
import { RECORDING_METADATA_ID, RECORDING_TYPES } from '../../recording/constants';
import { getActiveSession } from '../../recording/functions';
import { setRequestingSubtitles } from '../../subtitles/actions.any';
import { CUSTOM_BUTTON_PRESSED } from '../../toolbox/actionTypes';
import { muteLocal } from '../../video-menu/actions.native';
import { ENTER_PICTURE_IN_PICTURE } from '../picture-in-picture/actionTypes';
// @ts-ignore
import { isExternalAPIAvailable } from '../react-native-sdk/functions';

import { READY_TO_CLOSE } from './actionTypes';
import { setParticipantsWithScreenShare } from './actions';
import { participantToParticipantInfo, sendEvent } from './functions';
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
 * Event which will be emitted on the native side to indicate a participant toggles
 * the screen share.
 */
const SCREEN_SHARE_TOGGLED = 'SCREEN_SHARE_TOGGLED';

/**
 * Event which will be emitted on the native side with the participant info array.
 */
const PARTICIPANTS_INFO_RETRIEVED = 'PARTICIPANTS_INFO_RETRIEVED';

/**
 * Event which will be emitted on the native side to indicate the recording status has changed.
 */
const RECORDING_STATUS_CHANGED = 'RECORDING_STATUS_CHANGED';

const externalAPIEnabled = isExternalAPIAvailable();

let eventEmitter: any;

const { ExternalAPI } = NativeModules;

if (externalAPIEnabled) {
    eventEmitter = new NativeEventEmitter(ExternalAPI);
}

/**
 * Middleware that captures Redux actions and uses the ExternalAPI module to
 * turn them into native events so the application knows about them.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
externalAPIEnabled && MiddlewareRegistry.register(store => next => action => {
    const oldAudioMuted = store.getState()['features/base/media'].audio.muted;
    const result = next(action);
    const { type } = action;

    switch (type) {
    case APP_WILL_MOUNT:
        _registerForNativeEvents(store);
        break;
    case APP_WILL_UNMOUNT:
        _unregisterForNativeEvents();
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
        _sendConferenceEvent(store, action);
        break;

    case CONFERENCE_JOINED:
        _sendConferenceEvent(store, action);
        _registerForEndpointTextMessages(store);
        break;

    case CONFERENCE_BLURRED:
        sendEvent(store, CONFERENCE_BLURRED, {});
        break;

    case CONFERENCE_FOCUSED:
        sendEvent(store, CONFERENCE_FOCUSED, {});
        break;

    case CONFERENCE_UNIQUE_ID_SET: {
        const { conference } = action;

        sendEvent(
            store,
            CONFERENCE_UNIQUE_ID_SET,
            /* data */ {
                sessionId: conference.getMeetingUniqueId()
            });
        break;
    }

    case CONNECTION_DISCONNECTED: {
        // FIXME: This is a hack. See the description in the JITSI_CONNECTION_CONFERENCE_KEY constant definition.
        // Check if this connection was attached to any conference.
        // If it wasn't, fake a CONFERENCE_TERMINATED event.
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

    case CUSTOM_BUTTON_PRESSED: {
        const { id, text } = action;

        sendEvent(
            store,
            CUSTOM_BUTTON_PRESSED,
            /* data */ {
                id,
                text
            });

        break;
    }

    case ENDPOINT_MESSAGE_RECEIVED: {
        const { participant, data } = action;

        if (data?.name === ENDPOINT_TEXT_MESSAGE_NAME) {
            sendEvent(
                store,
                ENDPOINT_TEXT_MESSAGE_RECEIVED,
                /* data */ {
                    message: data.text,
                    senderId: participant.getId()
                });
        }

        break;
    }

    case ENTER_PICTURE_IN_PICTURE:
        sendEvent(store, type, /* data */ {});
        break;

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
        // Skip these events while not in a conference. SDK users can still retrieve them.
        const { conference } = store.getState()['features/base/conference'];

        if (!conference) {
            break;
        }

        const { participant } = action;

        const isVirtualScreenshareParticipant = isScreenShareParticipantById(store.getState(), participant.id);

        if (isVirtualScreenshareParticipant) {
            break;
        }

        sendEvent(
            store,
            action.type,
            participantToParticipantInfo(participant) /* data */
        );
        break;
    }

    case READY_TO_CLOSE:
        sendEvent(store, type, /* data */ {});
        break;

    case RECORDING_SESSION_UPDATED: {
        const {
            error,
            id,
            initiator,
            liveStreamViewURL,
            mode,
            status,
            terminator,
            timestamp
        } = action.sessionData;

        const getId = (obj: any) => typeof obj === 'object' ? obj.getId() : obj;
        const getError = (err: any) => typeof err === 'object' ? String(err) : err;

        sendEvent(
            store,
            RECORDING_STATUS_CHANGED,
            /* data */ {
                error: getError(error),
                id,
                initiator: getId(initiator),
                liveStreamViewURL,
                mode,
                status,
                terminator: getId(terminator),
                timestamp
            });
        break;
    }

    case SET_ROOM:
        _maybeTriggerEarlyConferenceWillJoin(store, action);
        break;

    case SET_AUDIO_MUTED:
        if (action.muted !== oldAudioMuted) {
            sendEvent(
                store,
                'AUDIO_MUTED_CHANGED',
                /* data */ {
                    muted: action.muted
                });
        }
        break;

    case SET_VIDEO_MUTED:
        sendEvent(
            store,
            'VIDEO_MUTED_CHANGED',
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
externalAPIEnabled && StateListenerRegistry.register(
    /* selector */ state => state['features/base/tracks'],
    /* listener */ debounce((tracks: ITrack[], store: IStore) => {
        const oldScreenShares = store.getState()['features/mobile/external-api'].screenShares || [];
        const newScreenShares = tracks
            .filter(track => track.mediaType === MEDIA_TYPE.SCREENSHARE || track.videoType === VIDEO_TYPE.DESKTOP)
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
function _registerForNativeEvents(store: IStore) {
    const { getState, dispatch } = store;

    eventEmitter.addListener(ExternalAPI.HANG_UP, () => {
        dispatch(appNavigate(undefined));
    });

    eventEmitter.addListener(ExternalAPI.SET_AUDIO_MUTED, ({ muted }: any) => {
        dispatch(muteLocal(muted, MEDIA_TYPE.AUDIO));
    });

    eventEmitter.addListener(ExternalAPI.SET_VIDEO_MUTED, ({ muted }: any) => {
        dispatch(muteLocal(muted, MEDIA_TYPE.VIDEO));
    });

    eventEmitter.addListener(ExternalAPI.SEND_ENDPOINT_TEXT_MESSAGE, ({ to, message }: any) => {
        const conference = getCurrentConference(getState());

        try {
            conference?.sendEndpointMessage(to, {
                name: ENDPOINT_TEXT_MESSAGE_NAME,
                text: message
            });
        } catch (error) {
            logger.warn('Cannot send endpointMessage', error);
        }
    });

    eventEmitter.addListener(ExternalAPI.TOGGLE_SCREEN_SHARE, ({ enabled }: any) => {
        dispatch(toggleScreensharing(enabled));
    });

    eventEmitter.addListener(ExternalAPI.RETRIEVE_PARTICIPANTS_INFO, ({ requestId }: any) => {

        const participantsInfo = [];
        const remoteParticipants = getRemoteParticipants(store);
        const localParticipant = getLocalParticipant(store);

        localParticipant && participantsInfo.push(participantToParticipantInfo(localParticipant));
        remoteParticipants.forEach(participant => {
            if (!participant.fakeParticipant) {
                participantsInfo.push(participantToParticipantInfo(participant));
            }
        });

        sendEvent(
            store,
            PARTICIPANTS_INFO_RETRIEVED,
            /* data */ {
                participantsInfo,
                requestId
            });
    });

    eventEmitter.addListener(ExternalAPI.OPEN_CHAT, ({ to }: any) => {
        const participant = getParticipantById(store, to);

        dispatch(openChat(participant));
    });

    eventEmitter.addListener(ExternalAPI.CLOSE_CHAT, () => {
        dispatch(closeChat());
    });

    eventEmitter.addListener(ExternalAPI.SEND_CHAT_MESSAGE, ({ message, to }: any) => {
        const participant = getParticipantById(store, to);

        if (participant) {
            dispatch(setPrivateMessageRecipient(participant));
        }

        dispatch(sendMessage(message));
    });

    eventEmitter.addListener(ExternalAPI.SET_CLOSED_CAPTIONS_ENABLED,
        ({ enabled, displaySubtitles, language }: any) => {
            dispatch(setRequestingSubtitles(enabled, displaySubtitles, language));
        });

    eventEmitter.addListener(ExternalAPI.TOGGLE_CAMERA, () => {
        dispatch(toggleCameraFacingMode());
    });

    eventEmitter.addListener(ExternalAPI.SHOW_NOTIFICATION,
        ({ appearance, description, timeout, title, uid }: any) => {
            const validTypes = Object.values(NOTIFICATION_TYPE);
            const validTimeouts = Object.values(NOTIFICATION_TIMEOUT_TYPE);

            if (!validTypes.includes(appearance)) {
                logger.error(`Invalid notification type "${appearance}". Expecting one of ${validTypes}`);

                return;
            }

            if (!validTimeouts.includes(timeout)) {
                logger.error(`Invalid notification timeout "${timeout}". Expecting one of ${validTimeouts}`);

                return;
            }

            dispatch(showNotification({
                appearance,
                description,
                title,
                uid
            }, timeout));
        });

    eventEmitter.addListener(ExternalAPI.HIDE_NOTIFICATION, ({ uid }: any) => {
        dispatch(hideNotification(uid));
    });

    eventEmitter.addListener(ExternalAPI.START_RECORDING, (
            {
                mode,
                dropboxToken,
                shouldShare,
                rtmpStreamKey,
                rtmpBroadcastID,
                youtubeStreamKey,
                youtubeBroadcastID,
                extraMetadata = {},
                transcription
            }: any) => {
        const state = store.getState();
        const conference = getCurrentConference(state);

        if (!conference) {
            logger.error('Conference is not defined');

            return;
        }

        if (dropboxToken && !isDropboxEnabled(state)) {
            logger.error('Failed starting recording: dropbox is not enabled on this deployment');

            return;
        }

        if (mode === JitsiRecordingConstants.mode.STREAM && !(youtubeStreamKey || rtmpStreamKey)) {
            logger.error('Failed starting recording: missing youtube or RTMP stream key');

            return;
        }

        let recordingConfig;

        if (mode === JitsiRecordingConstants.mode.FILE) {
            const { recordingService } = state['features/base/config'];

            if (!recordingService?.enabled && !dropboxToken) {
                logger.error('Failed starting recording: the recording service is not enabled');

                return;
            }

            if (dropboxToken) {
                recordingConfig = {
                    mode: JitsiRecordingConstants.mode.FILE,
                    appData: JSON.stringify({
                        'file_recording_metadata': {
                            ...extraMetadata,
                            'upload_credentials': {
                                'service_name': RECORDING_TYPES.DROPBOX,
                                'token': dropboxToken
                            }
                        }
                    })
                };
            } else {
                recordingConfig = {
                    mode: JitsiRecordingConstants.mode.FILE,
                    appData: JSON.stringify({
                        'file_recording_metadata': {
                            ...extraMetadata,
                            'share': shouldShare
                        }
                    })
                };
            }
        } else if (mode === JitsiRecordingConstants.mode.STREAM) {
            recordingConfig = {
                broadcastId: youtubeBroadcastID || rtmpBroadcastID,
                mode: JitsiRecordingConstants.mode.STREAM,
                streamId: youtubeStreamKey || rtmpStreamKey
            };
        }

        // Start audio / video recording, if requested.
        if (typeof recordingConfig !== 'undefined') {
            conference.startRecording(recordingConfig);
        }

        if (transcription) {
            store.dispatch(setRequestingSubtitles(true, false, null));
            conference.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                isTranscribingEnabled: true
            });
        }
    });

    eventEmitter.addListener(ExternalAPI.STOP_RECORDING, ({ mode, transcription }: any) => {
        const state = store.getState();
        const conference = getCurrentConference(state);

        if (!conference) {
            logger.error('Conference is not defined');

            return;
        }

        if (transcription) {
            store.dispatch(setRequestingSubtitles(false, false, null));
            conference.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
                isTranscribingEnabled: false
            });
        }

        if (![ JitsiRecordingConstants.mode.FILE, JitsiRecordingConstants.mode.STREAM ].includes(mode)) {
            logger.error('Invalid recording mode provided!');

            return;
        }

        const activeSession = getActiveSession(state, mode);

        if (!activeSession?.id) {
            logger.error('No recording or streaming session found');

            return;
        }

        conference.stopRecording(activeSession.id);
    });

    eventEmitter.addListener(ExternalAPI.OVERWRITE_CONFIG, ({ config }: any) => {
        const whitelistedConfig = getWhitelistedJSON('config', config);

        logger.info(`Overwriting config with: ${JSON.stringify(whitelistedConfig)}`);

        dispatch(overwriteConfig(whitelistedConfig));
    });

    eventEmitter.addListener(ExternalAPI.SEND_CAMERA_FACING_MODE_MESSAGE, ({ to, facingMode }: any) => {
        const conference = getCurrentConference(getState());

        if (!to) {
            logger.warn('Participant id not set');

            return;
        }

        conference?.sendEndpointMessage(to, {
            name: CAMERA_FACING_MODE_MESSAGE,
            facingMode
        });
    });
}

/**
 * Unregister for events sent from the native side via NativeEventEmitter.
 *
 * @private
 * @returns {void}
 */
function _unregisterForNativeEvents() {
    eventEmitter.removeAllListeners(ExternalAPI.HANG_UP);
    eventEmitter.removeAllListeners(ExternalAPI.SET_AUDIO_MUTED);
    eventEmitter.removeAllListeners(ExternalAPI.SET_VIDEO_MUTED);
    eventEmitter.removeAllListeners(ExternalAPI.SEND_ENDPOINT_TEXT_MESSAGE);
    eventEmitter.removeAllListeners(ExternalAPI.TOGGLE_SCREEN_SHARE);
    eventEmitter.removeAllListeners(ExternalAPI.RETRIEVE_PARTICIPANTS_INFO);
    eventEmitter.removeAllListeners(ExternalAPI.OPEN_CHAT);
    eventEmitter.removeAllListeners(ExternalAPI.CLOSE_CHAT);
    eventEmitter.removeAllListeners(ExternalAPI.SEND_CHAT_MESSAGE);
    eventEmitter.removeAllListeners(ExternalAPI.SET_CLOSED_CAPTIONS_ENABLED);
    eventEmitter.removeAllListeners(ExternalAPI.TOGGLE_CAMERA);
    eventEmitter.removeAllListeners(ExternalAPI.SHOW_NOTIFICATION);
    eventEmitter.removeAllListeners(ExternalAPI.HIDE_NOTIFICATION);
    eventEmitter.removeAllListeners(ExternalAPI.START_RECORDING);
    eventEmitter.removeAllListeners(ExternalAPI.STOP_RECORDING);
    eventEmitter.removeAllListeners(ExternalAPI.OVERWRITE_CONFIG);
    eventEmitter.removeAllListeners(ExternalAPI.SEND_CAMERA_FACING_MODE_MESSAGE);
}

/**
 * Registers for endpoint messages sent on conference data channel.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _registerForEndpointTextMessages(store: IStore) {
    const conference = getCurrentConference(store.getState());

    conference?.on(
        JitsiConferenceEvents.MESSAGE_RECEIVED,
            (id: string, message: string, timestamp: number) => {
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

    conference?.on(
        JitsiConferenceEvents.PRIVATE_MESSAGE_RECEIVED,
        (id: string, message: string, timestamp: number) => {
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
        error: Error | { message?: string; name?: string; } | string) {
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
function _maybeTriggerEarlyConferenceWillJoin(store: IStore, action: AnyAction) {
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
        store: IStore,
        action: {
            conference: IJitsiConference;
            isAudioMuted?: boolean;
            type: string;
            url?: string;
        }) {
    const { conference, type, ...data } = action;

    // For these (redux) actions, conference identifies a JitsiConference
    // instance. The external API cannot transport such an object so we have to
    // transport an "equivalent".
    if (conference) { // @ts-ignore
        data.url = _normalizeUrl(conference[JITSI_CONFERENCE_URL_KEY]);

        const localTracks = getLocalTracks(store.getState()['features/base/tracks']);
        const isAudioMuted = isLocalTrackMuted(localTracks, MEDIA_TYPE.AUDIO);

        data.isAudioMuted = isAudioMuted;
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
function _swallowConferenceLeft({ getState }: IStore, action: AnyAction, { url }: { url: string; }) {
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
function _swallowEvent(store: IStore, action: AnyAction, data: any) {
    switch (action.type) {
    case CONFERENCE_LEFT:
        return _swallowConferenceLeft(store, action, data);

    default:
        return false;
    }
}
