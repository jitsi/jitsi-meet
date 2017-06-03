import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import { parseJWTFromURLParams } from '../../react/features/jwt';
import { getJitsiMeetTransport } from '../transport';

import { API_ID } from './constants';

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
 * Initializes supported commands.
 *
 * @returns {void}
 */
function initCommands() {
    commands = {
        'display-name':
            APP.conference.changeLocalDisplayName.bind(APP.conference),
        'toggle-audio': () => APP.conference.toggleAudioMuted(true),
        'toggle-video': () => APP.conference.toggleVideoMuted(true),
        'toggle-film-strip': APP.UI.toggleFilmstrip,
        'toggle-chat': APP.UI.toggleChat,
        'toggle-contact-list': APP.UI.toggleContactList,
        'toggle-share-screen': toggleScreenSharing,
        'video-hangup': () => APP.conference.hangup(),
        'email': APP.conference.changeLocalEmail,
        'avatar-url': APP.conference.changeLocalAvatarUrl
    };
    transport.on('event', ({ data, name }) => {
        if (name && commands[name]) {
            commands[name](...data);

            return true;
        }

        return false;
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
        APP.conference.toggleScreenSharing();
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
     * Sends event to the external application.
     *
     * @param {Object} event - The event to be sent.
     * @returns {void}
     */
    _sendEvent(event = {}) {
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
    notifySendingChatMessage(message) {
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
    notifyReceivedChatMessage({ body, id, nick, ts } = {}) {
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
     * @returns {void}
     */
    notifyUserJoined(id) {
        this._sendEvent({
            name: 'participant-joined',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user left the
     * conference.
     *
     * @param {string} id - User id.
     * @returns {void}
     */
    notifyUserLeft(id) {
        this._sendEvent({
            name: 'participant-left',
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} id - User id.
     * @param {string} displayname - User nickname.
     * @returns {void}
     */
    notifyDisplayNameChanged(id, displayname) {
        this._sendEvent({
            name: 'display-name-change',
            displayname,
            id
        });
    }

    /**
     * Notify external application (if API is enabled) that the conference has
     * been joined.
     *
     * @param {string} roomName - The room name.
     * @returns {void}
     */
    notifyConferenceJoined(roomName) {
        this._sendEvent({
            name: 'video-conference-joined',
            roomName
        });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} roomName - User id.
     * @returns {void}
     */
    notifyConferenceLeft(roomName) {
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
