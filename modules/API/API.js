// @flow

import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import {
    createApiEvent,
    sendAnalytics
} from '../../react/features/analytics';
import { parseJWTFromURLParams } from '../../react/features/base/jwt';
import { invite } from '../../react/features/invite';
import { getJitsiMeetTransport } from '../transport';

import { API_ID } from './constants';

const logger = require('jitsi-meet-logger').getLogger(__filename);

declare var APP: Object;

/**
 * List of the available commands.
 */
let commands = {};

/**
 * The state of screen sharing(started/stopped) before the screen sharing is
 * enabled and initialized.
 * NOTE: This flag help us to cache the state and use it if toggle-share-screen
 * was received before the initialization.
 */
let initialScreenSharingState = false;

/**
 * The transport instance used for communication with external apps.
 *
 * @type {Transport}
 */
const transport = getJitsiMeetTransport();

/**
 * The current audio availability.
 *
 * @type {boolean}
 */
let audioAvailable = true;

/**
 * The current video availability.
 *
 * @type {boolean}
 */
let videoAvailable = true;

/**
 * Initializes supported commands.
 *
 * @returns {void}
 */
function initCommands() {
    commands = {
        'display-name': displayName => {
            sendAnalytics(createApiEvent('display.name.changed'));
            APP.conference.changeLocalDisplayName(displayName);
        },
        'submit-feedback': feedback => {
            sendAnalytics(createApiEvent('submit.feedback'));
            APP.conference.submitFeedback(feedback.score, feedback.message);
        },
        'toggle-audio': () => {
            sendAnalytics(createApiEvent('toggle-audio'));
            logger.log('Audio toggle: API command received');
            APP.conference.toggleAudioMuted(false /* no UI */);
        },
        'toggle-video': () => {
            sendAnalytics(createApiEvent('toggle-video'));
            logger.log('Video toggle: API command received');
            APP.conference.toggleVideoMuted(false /* no UI */);
        },
        'toggle-film-strip': () => {
            sendAnalytics(createApiEvent('film.strip.toggled'));
            APP.UI.toggleFilmstrip();
        },
        'toggle-chat': () => {
            sendAnalytics(createApiEvent('chat.toggled'));
            APP.UI.toggleChat();
        },
        'toggle-share-screen': () => {
            sendAnalytics(createApiEvent('screen.sharing.toggled'));
            toggleScreenSharing();
        },
        'video-hangup': () => {
            sendAnalytics(createApiEvent('video.hangup'));
            APP.conference.hangup(true);
        },
        'email': email => {
            sendAnalytics(createApiEvent('email.changed'));
            APP.conference.changeLocalEmail(email);
        },
        'avatar-url': avatarUrl => {
            sendAnalytics(createApiEvent('avatar.url.changed'));
            APP.conference.changeLocalAvatarUrl(avatarUrl);
        }
    };
    transport.on('event', ({ data, name }) => {
        if (name && commands[name]) {
            commands[name](...data);

            return true;
        }

        return false;
    });
    transport.on('request', (request, callback) => {
        const { name } = request;

        switch (name) {
        case 'invite': // eslint-disable-line no-case-declarations
            const { invitees } = request;

            if (!Array.isArray(invitees) || invitees.length === 0) {
                callback({
                    error: new Error('Unexpected format of invitees')
                });

                break;
            }

            // The store should be already available because API.init is called
            // on appWillMount action.
            APP.store.dispatch(
                invite(invitees, true))
                .then(failedInvitees => {
                    let error;
                    let result;

                    if (failedInvitees.length) {
                        error = new Error('One or more invites failed!');
                    } else {
                        result = true;
                    }

                    callback({
                        error,
                        result
                    });
                });
            break;
        case 'is-audio-muted':
            callback(APP.conference.isLocalAudioMuted());
            break;
        case 'is-video-muted':
            callback(APP.conference.isLocalVideoMuted());
            break;
        case 'is-audio-available':
            callback(audioAvailable);
            break;
        case 'is-video-available':
            callback(videoAvailable);
            break;
        default:
            return false;
        }

        return true;
    });
}

/**
 * Listens for desktop/screen sharing enabled events and toggles the screen
 * sharing if needed.
 *
 * @param {boolean} enabled - Current screen sharing enabled status.
 * @returns {void}
 */
function onDesktopSharingEnabledChanged(enabled = false) {
    if (enabled && initialScreenSharingState) {
        toggleScreenSharing();
    }
}

/**
 * Check whether the API should be enabled or not.
 *
 * @returns {boolean}
 */
function shouldBeEnabled() {
    return (
        typeof API_ID === 'number'

            // XXX Enable the API when a JSON Web Token (JWT) is specified in
            // the location/URL because then it is very likely that the Jitsi
            // Meet (Web) app is being used by an external/wrapping (Web) app
            // and, consequently, the latter will need to communicate with the
            // former. (The described logic is merely a heuristic though.)
            || parseJWTFromURLParams());
}

/**
 * Executes on toggle-share-screen command.
 *
 * @returns {void}
 */
function toggleScreenSharing() {
    if (APP.conference.isDesktopSharingEnabled) {

        // eslint-disable-next-line no-empty-function
        APP.conference.toggleScreenSharing().catch(() => {});
    } else {
        initialScreenSharingState = !initialScreenSharingState;
    }
}

/**
 * Implements API class that communicates with external API class and provides
 * interface to access Jitsi Meet features by external applications that embed
 * Jitsi Meet.
 */
class API {
    _enabled: boolean;

    /**
     * Initializes the API. Setups message event listeners that will receive
     * information from external applications that embed Jitsi Meet. It also
     * sends a message to the external application that API is initialized.
     *
     * @param {Object} options - Optional parameters.
     * @returns {void}
     */
    init() {
        if (!shouldBeEnabled()) {
            return;
        }

        /**
         * Current status (enabled/disabled) of API.
         *
         * @private
         * @type {boolean}
         */
        this._enabled = true;

        APP.conference.addListener(
            JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
            onDesktopSharingEnabledChanged);

        initCommands();
    }

    /**
     * Notify external application (if API is enabled) that the large video
     * visibility changed.
     *
     * @param {boolean} isHidden - True if the large video is hidden and false
     * otherwise.
     * @returns {void}
     */
    notifyLargeVideoVisibilityChanged(isHidden: boolean) {
        this._sendEvent({
            name: 'large-video-visibility-changed',
            isVisible: !isHidden
        });
    }

    /**
     * Sends event to the external application.
     *
     * @param {Object} event - The event to be sent.
     * @returns {void}
     */
    _sendEvent(event: Object = {}) {
        if (this._enabled) {
            transport.sendEvent(event);
        }
    }

    /**
     * Notify external application (if API is enabled) that message was sent.
     *
     * @param {string} message - Message body.
     * @returns {void}
     */
    notifySendingChatMessage(message: string) {
        this._sendEvent({
            name: 'outgoing-message',
            message
        });
    }

    /**
     * Notify external application (if API is enabled) that message was
     * received.
     *
     * @param {Object} options - Object with the message properties.
     * @returns {void}
     */
    notifyReceivedChatMessage(
            { body, id, nick, ts }: {
                body: *, id: string, nick: string, ts: *
            } = {}) {
        if (APP.conference.isLocalId(id)) {
            return;
        }

        this._sendEvent({
            name: 'incoming-message',
            from: id,
            message: body,
            nick,
            stamp: ts
        });
    }

    /**
     * Notify external application (if API is enabled) that user joined the
     * conference.
     *
     * @param {string} id - User id.
     * @param {Object} props - The display name of the user.
     * @returns {void}
     */
    notifyUserJoined(id: string, props: Object) {
        this._sendEvent({
            name: 'participant-joined',
            id,
            ...props
        });
    }

    /**
     * Notify external application (if API is enabled) that user left the
     * conference.
     *
     * @param {string} id - User id.
     * @returns {void}
     */
    notifyUserLeft(id: string) {
        this._sendEvent({
            name: 'participant-left',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * avatar.
     *
     * @param {string} id - User id.
     * @param {string} avatarURL - The new avatar URL of the participant.
     * @returns {void}
     */
    notifyAvatarChanged(id: string, avatarURL: string) {
        this._sendEvent({
            name: 'avatar-changed',
            avatarURL,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} id - User id.
     * @param {string} displayname - User nickname.
     * @param {string} formattedDisplayName - The display name shown in Jitsi
     * meet's UI for the user.
     * @returns {void}
     */
    notifyDisplayNameChanged(
            id: string,
            { displayName, formattedDisplayName }: Object) {
        this._sendEvent({
            name: 'display-name-change',
            displayname: displayName,
            formattedDisplayName,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * email.
     *
     * @param {string} id - User id.
     * @param {string} email - The new email of the participant.
     * @returns {void}
     */
    notifyEmailChanged(
            id: string,
            { email }: Object) {
        this._sendEvent({
            name: 'email-change',
            email,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the conference has
     * been joined.
     *
     * @param {string} roomName - The room name.
     * @param {string} id - The id of the local user.
     * @param {Object} props - The display name and avatar URL of the local
     * user.
     * @returns {void}
     */
    notifyConferenceJoined(roomName: string, id: string, props: Object) {
        this._sendEvent({
            name: 'video-conference-joined',
            roomName,
            id,
            ...props
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} roomName - User id.
     * @returns {void}
     */
    notifyConferenceLeft(roomName: string) {
        this._sendEvent({
            name: 'video-conference-left',
            roomName
        });
    }

    /**
     * Notify external application (if API is enabled) that we are ready to be
     * closed.
     *
     * @returns {void}
     */
    notifyReadyToClose() {
        this._sendEvent({ name: 'video-ready-to-close' });
    }

    /**
     * Notify external application (if API is enabled) for audio muted status
     * changed.
     *
     * @param {boolean} muted - The new muted status.
     * @returns {void}
     */
    notifyAudioMutedStatusChanged(muted: boolean) {
        this._sendEvent({
            name: 'audio-mute-status-changed',
            muted
        });
    }

    /**
     * Notify external application (if API is enabled) for video muted status
     * changed.
     *
     * @param {boolean} muted - The new muted status.
     * @returns {void}
     */
    notifyVideoMutedStatusChanged(muted: boolean) {
        this._sendEvent({
            name: 'video-mute-status-changed',
            muted
        });
    }

    /**
     * Notify external application (if API is enabled) for audio availability
     * changed.
     *
     * @param {boolean} available - True if available and false otherwise.
     * @returns {void}
     */
    notifyAudioAvailabilityChanged(available: boolean) {
        audioAvailable = available;
        this._sendEvent({
            name: 'audio-availability-changed',
            available
        });
    }

    /**
     * Notify external application (if API is enabled) for video available
     * status changed.
     *
     * @param {boolean} available - True if available and false otherwise.
     * @returns {void}
     */
    notifyVideoAvailabilityChanged(available: boolean) {
        videoAvailable = available;
        this._sendEvent({
            name: 'video-availability-changed',
            available
        });
    }

    /**
     * Notify external application (if API is enabled) that the on stage
     * participant has changed.
     *
     * @param {string} id - User id of the new on stage participant.
     * @returns {void}
     */
    notifyOnStageParticipantChanged(id: string) {
        this._sendEvent({
            name: 'on-stage-participant-changed',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that conference feedback
     * has been submitted. Intended to be used in conjunction with the
     * submit-feedback command to get notified if feedback was submitted.
     *
     * @returns {void}
     */
    notifyFeedbackSubmitted() {
        this._sendEvent({ name: 'feedback-submitted' });
    }

    /**
     * Notify external application (if API is enabled) that the screen sharing
     * has been turned on/off.
     *
     * @param {boolean} on - True if screen sharing is enabled.
     * @returns {void}
     */
    notifyScreenSharingStatusChanged(on: boolean) {
        this._sendEvent({
            name: 'screen-sharing-status-changed',
            on
        });
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        if (this._enabled) {
            this._enabled = false;
            APP.conference.removeListener(
                JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
                onDesktopSharingEnabledChanged);
        }
    }
}

export default new API();
