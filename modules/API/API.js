import * as JitsiMeetConferenceEvents from '../../ConferenceEvents';
import { transport } from '../transport';

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
    Object.keys(commands).forEach(
        key => transport.on(key, args => commands[key](...args)));
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
    return typeof API_ID === 'number';
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
     * @param {boolean} options.forceEnable - True to forcefully enable the
     * module.
     * @returns {void}
     */
    init(options = {}) {
        if (!shouldBeEnabled() && !options.forceEnable) {
            return;
        }

        /**
         * Current status (enabled/disabled) of API.
         */
        this.enabled = true;

        APP.conference.addListener(
            JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
            onDesktopSharingEnabledChanged);

        initCommands();
    }

    /**
     * Sends message to the external application.
     *
     * @param {string} name - The name of the event.
     * @param {Object} data - The data to be sent.
     * @returns {void}
     */
    _sendEvent(name, data) {
        if (this.enabled) {
            transport.sendEvent(name, data);
        }
    }

    /**
     * Notify external application (if API is enabled) that message was sent.
     *
     * @param {string} message - Message body.
     * @returns {void}
     */
    notifySendingChatMessage(message) {
        this._sendEvent('outgoing-message', { message });
    }

    /**
     * Notify external application (if API is enabled) that message was
     * received.
     *
     * @param {Object} options - Object with the message properties.
     * @returns {void}
     */
    notifyReceivedChatMessage(options = {}) {
        const { id, nick, body, ts } = options;

        if (APP.conference.isLocalId(id)) {
            return;
        }

        this._sendEvent('incoming-message', {
            from: id,
            nick,
            message: body,
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
        this._sendEvent('participant-joined', { id });
    }

    /**
     * Notify external application (if API is enabled) that user left the
     * conference.
     *
     * @param {string} id - User id.
     * @returns {void}
     */
    notifyUserLeft(id) {
        this._sendEvent('participant-left', { id });
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
        this._sendEvent('display-name-change', {
            id,
            displayname
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
        this._sendEvent('video-conference-joined', { roomName });
    }

    /**
     * Notify external application (if API is enabled) that user changed their
     * nickname.
     *
     * @param {string} roomName - User id.
     * @returns {void}
     */
    notifyConferenceLeft(roomName) {
        this._sendEvent('video-conference-left', { roomName });
    }

    /**
     * Notify external application (if API is enabled) that we are ready to be
     * closed.
     *
     * @returns {void}
     */
    notifyReadyToClose() {
        this._sendEvent('video-ready-to-close', {});
    }

    /**
     * Disposes the allocated resources.
     *
     * @returns {void}
     */
    dispose() {
        if (this.enabled) {
            this.enabled = false;
            APP.conference.removeListener(
                JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
                onDesktopSharingEnabledChanged);
        }
    }
}

export default new API();
