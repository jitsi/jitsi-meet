import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import EventEmitter from 'events';

import { urlObjectToString } from '../../../react/features/base/util/uri';
import {
    PostMessageTransportBackend,
    Transport
} from '../../transport';

import {
    getAvailableDevices,
    getCurrentDevices,
    isDeviceChangeAvailable,
    isDeviceListAvailable,
    isMultipleAudioInputSupported,
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from './functions';

const ALWAYS_ON_TOP_FILENAMES = [
    'css/all.css', 'libs/alwaysontop.min.js'
];

/**
 * Maps the names of the commands expected by the API with the name of the
 * commands expected by jitsi-meet
 */
const commands = {
    avatarUrl: 'avatar-url',
    cancelPrivateChat: 'cancel-private-chat',
    displayName: 'display-name',
    e2eeKey: 'e2ee-key',
    email: 'email',
    toggleLobby: 'toggle-lobby',
    hangup: 'video-hangup',
    intiatePrivateChat: 'initiate-private-chat',
    kickParticipant: 'kick-participant',
    muteEveryone: 'mute-everyone',
    password: 'password',
    pinParticipant: 'pin-participant',
    resizeLargeVideo: 'resize-large-video',
    sendEndpointTextMessage: 'send-endpoint-text-message',
    sendTones: 'send-tones',
    setLargeVideoParticipant: 'set-large-video-participant',
    setVideoQuality: 'set-video-quality',
    startRecording: 'start-recording',
    stopRecording: 'stop-recording',
    subject: 'subject',
    submitFeedback: 'submit-feedback',
    toggleAudio: 'toggle-audio',
    toggleChat: 'toggle-chat',
    toggleFilmStrip: 'toggle-film-strip',
    toggleShareScreen: 'toggle-share-screen',
    toggleTileView: 'toggle-tile-view',
    toggleVideo: 'toggle-video'
};

/**
 * Maps the names of the events expected by the API with the name of the
 * events expected by jitsi-meet
 */
const events = {
    'avatar-changed': 'avatarChanged',
    'audio-availability-changed': 'audioAvailabilityChanged',
    'audio-mute-status-changed': 'audioMuteStatusChanged',
    'camera-error': 'cameraError',
    'chat-updated': 'chatUpdated',
    'content-sharing-participants-changed': 'contentSharingParticipantsChanged',
    'device-list-changed': 'deviceListChanged',
    'display-name-change': 'displayNameChange',
    'email-change': 'emailChange',
    'endpoint-text-message-received': 'endpointTextMessageReceived',
    'feedback-submitted': 'feedbackSubmitted',
    'feedback-prompt-displayed': 'feedbackPromptDisplayed',
    'filmstrip-display-changed': 'filmstripDisplayChanged',
    'incoming-message': 'incomingMessage',
    'log': 'log',
    'mic-error': 'micError',
    'outgoing-message': 'outgoingMessage',
    'participant-joined': 'participantJoined',
    'participant-kicked-out': 'participantKickedOut',
    'participant-left': 'participantLeft',
    'participant-role-changed': 'participantRoleChanged',
    'password-required': 'passwordRequired',
    'proxy-connection-event': 'proxyConnectionEvent',
    'raise-hand-updated': 'raiseHandUpdated',
    'video-ready-to-close': 'readyToClose',
    'video-conference-joined': 'videoConferenceJoined',
    'video-conference-left': 'videoConferenceLeft',
    'video-availability-changed': 'videoAvailabilityChanged',
    'video-mute-status-changed': 'videoMuteStatusChanged',
    'video-quality-changed': 'videoQualityChanged',
    'screen-sharing-status-changed': 'screenSharingStatusChanged',
    'dominant-speaker-changed': 'dominantSpeakerChanged',
    'subject-change': 'subjectChange',
    'suspend-detected': 'suspendDetected',
    'tile-view-changed': 'tileViewChanged'
};

/**
 * Last id of api object
 * @type {number}
 */
let id = 0;

/**
 * Adds given number to the numberOfParticipants property of given APIInstance.
 *
 * @param {JitsiMeetExternalAPI} APIInstance - The instance of the API.
 * @param {int} number - The number of participants to be added to
 * numberOfParticipants property (this parameter can be negative number if the
 * numberOfParticipants should be decreased).
 * @returns {void}
 */
function changeParticipantNumber(APIInstance, number) {
    APIInstance._numberOfParticipants += number;
}

/**
 * Generates the URL for the iframe.
 *
 * @param {string} domain - The domain name of the server that hosts the
 * conference.
 * @param {string} [options] - Another optional parameters.
 * @param {Object} [options.configOverwrite] - Object containing configuration
 * options defined in config.js to be overridden.
 * @param {Object} [options.interfaceConfigOverwrite] - Object containing
 * configuration options defined in interface_config.js to be overridden.
 * @param {string} [options.jwt] - The JWT token if needed by jitsi-meet for
 * authentication.
 * @param {string} [options.roomName] - The name of the room to join.
 * @returns {string} The URL.
 */
function generateURL(domain, options = {}) {
    return urlObjectToString({
        ...options,
        url: `https://${domain}/#jitsi_meet_external_api_id=${id}`
    });
}

/**
 * Parses the arguments passed to the constructor. If the old format is used
 * the function translates the arguments to the new format.
 *
 * @param {Array} args - The arguments to be parsed.
 * @returns {Object} JS object with properties.
 */
function parseArguments(args) {
    if (!args.length) {
        return {};
    }

    const firstArg = args[0];

    switch (typeof firstArg) {
    case 'string': // old arguments format
    case undefined: {
        // Not sure which format but we are trying to parse the old
        // format because if the new format is used everything will be undefined
        // anyway.
        const [
            roomName,
            width,
            height,
            parentNode,
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            onload
        ] = args;

        return {
            roomName,
            width,
            height,
            parentNode,
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            onload
        };
    }
    case 'object': // new arguments format
        return args[0];
    default:
        throw new Error('Can\'t parse the arguments!');
    }
}

/**
 * Compute valid values for height and width. If a number is specified it's
 * treated as pixel units. If the value is expressed in px, em, pt or
 * percentage, it's used as is.
 *
 * @param {any} value - The value to be parsed.
 * @returns {string|undefined} The parsed value that can be used for setting
 * sizes through the style property. If invalid value is passed the method
 * retuns undefined.
 */
function parseSizeParam(value) {
    let parsedValue;

    // This regex parses values of the form 100px, 100em, 100pt or 100%.
    // Values like 100 or 100px are handled outside of the regex, and
    // invalid values will be ignored and the minimum will be used.
    const re = /([0-9]*\.?[0-9]+)(em|pt|px|%)$/;

    if (typeof value === 'string' && String(value).match(re) !== null) {
        parsedValue = value;
    } else if (typeof value === 'number') {
        parsedValue = `${value}px`;
    }

    return parsedValue;
}


/**
 * The IFrame API interface class.
 */
export default class JitsiMeetExternalAPI extends EventEmitter {
    /**
     * Constructs new API instance. Creates iframe and loads Jitsi Meet in it.
     *
     * @param {string} domain - The domain name of the server that hosts the
     * conference.
     * @param {Object} [options] - Optional arguments.
     * @param {string} [options.roomName] - The name of the room to join.
     * @param {number|string} [options.width] - Width of the iframe. Check
     * parseSizeParam for format details.
     * @param {number|string} [options.height] - Height of the iframe. Check
     * parseSizeParam for format details.
     * @param {DOMElement} [options.parentNode] - The node that will contain the
     * iframe.
     * @param {Object} [options.configOverwrite] - Object containing
     * configuration options defined in config.js to be overridden.
     * @param {Object} [options.interfaceConfigOverwrite] - Object containing
     * configuration options defined in interface_config.js to be overridden.
     * @param {string} [options.jwt] - The JWT token if needed by jitsi-meet for
     * authentication.
     * @param {string} [options.onload] - The onload function that will listen
     * for iframe onload event.
     * @param {Array<Object>} [options.invitees] - Array of objects containing
     * information about new participants that will be invited in the call.
     * @param {Array<Object>} [options.devices] - Array of objects containing
     * information about the initial devices that will be used in the call.
     * @param {Object} [options.userInfo] - Object containing information about
     * the participant opening the meeting.
     * @param {string}  [options.e2eeKey] - The key used for End-to-End encryption.
     * THIS IS EXPERIMENTAL.
     */
    constructor(domain, ...args) {
        super();
        const {
            roomName = '',
            width = '100%',
            height = '100%',
            parentNode = document.body,
            configOverwrite = {},
            interfaceConfigOverwrite = {},
            jwt = undefined,
            onload = undefined,
            invitees,
            devices,
            userInfo,
            e2eeKey
        } = parseArguments(args);
        const localStorageContent = jitsiLocalStorage.getItem('jitsiLocalStorage');

        this._parentNode = parentNode;
        this._url = generateURL(domain, {
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            roomName,
            devices,
            userInfo,
            appData: {
                localStorageContent
            }
        });
        this._createIFrame(height, width, onload);
        this._transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: {
                    allowedOrigin: new URL(this._url).origin,
                    scope: `jitsi_meet_external_api_${id}`,
                    window: this._frame.contentWindow
                }
            })
        });
        if (Array.isArray(invitees) && invitees.length > 0) {
            this.invite(invitees);
        }
        this._tmpE2EEKey = e2eeKey;
        this._isLargeVideoVisible = true;
        this._numberOfParticipants = 0;
        this._participants = {};
        this._myUserID = undefined;
        this._onStageParticipant = undefined;
        this._setupListeners();
        id++;
    }

    /**
     * Creates the iframe element.
     *
     * @param {number|string} height - The height of the iframe. Check
     * parseSizeParam for format details.
     * @param {number|string} width - The with of the iframe. Check
     * parseSizeParam for format details.
     * @param {Function} onload - The function that will listen
     * for onload event.
     * @returns {void}
     *
     * @private
     */
    _createIFrame(height, width, onload) {
        const frameName = `jitsiConferenceFrame${id}`;

        this._frame = document.createElement('iframe');
        this._frame.allow = 'camera; microphone; display-capture; autoplay; clipboard-write';
        this._frame.src = this._url;
        this._frame.name = frameName;
        this._frame.id = frameName;
        this._setSize(height, width);
        this._frame.setAttribute('allowFullScreen', 'true');
        this._frame.style.border = 0;

        if (onload) {
            // waits for iframe resources to load
            // and fires event when it is done
            this._frame.onload = onload;
        }

        this._frame = this._parentNode.appendChild(this._frame);
    }

    /**
     * Returns arrays with the all resources for the always on top feature.
     *
     * @returns {Array<string>}
     */
    _getAlwaysOnTopResources() {
        const iframeWindow = this._frame.contentWindow;
        const iframeDocument = iframeWindow.document;
        let baseURL = '';
        const base = iframeDocument.querySelector('base');

        if (base && base.href) {
            baseURL = base.href;
        } else {
            const { protocol, host } = iframeWindow.location;

            baseURL = `${protocol}//${host}`;
        }

        return ALWAYS_ON_TOP_FILENAMES.map(
            filename => (new URL(filename, baseURL)).href
        );
    }

    /**
     * Returns the formatted display name of a participant.
     *
     * @param {string} participantId - The id of the participant.
     * @returns {string} The formatted display name.
     */
    _getFormattedDisplayName(participantId) {
        const { formattedDisplayName }
            = this._participants[participantId] || {};

        return formattedDisplayName;
    }

    /**
     * Returns the id of the on stage participant.
     *
     * @returns {string} - The id of the on stage participant.
     */
    _getOnStageParticipant() {
        return this._onStageParticipant;
    }


    /**
     * Getter for the large video element in Jitsi Meet.
     *
     * @returns {HTMLElement|undefined} - The large video.
     */
    _getLargeVideo() {
        const iframe = this.getIFrame();

        if (!this._isLargeVideoVisible
                || !iframe
                || !iframe.contentWindow
                || !iframe.contentWindow.document) {
            return;
        }

        return iframe.contentWindow.document.getElementById('largeVideo');
    }

    /**
     * Getter for participant specific video element in Jitsi Meet.
     *
     * @param {string|undefined} participantId - Id of participant to return the video for.
     *
     * @returns {HTMLElement|undefined} - The requested video. Will return the local video
     * by default if participantId is undefined.
     */
    _getParticipantVideo(participantId) {
        const iframe = this.getIFrame();

        if (!iframe
                || !iframe.contentWindow
                || !iframe.contentWindow.document) {
            return;
        }

        if (typeof participantId === 'undefined' || participantId === this._myUserID) {
            return iframe.contentWindow.document.getElementById('localVideo_container');
        }

        return iframe.contentWindow.document.querySelector(`#participant_${participantId} video`);
    }

    /**
     * Sets the size of the iframe element.
     *
     * @param {number|string} height - The height of the iframe.
     * @param {number|string} width - The with of the iframe.
     * @returns {void}
     *
     * @private
     */
    _setSize(height, width) {
        const parsedHeight = parseSizeParam(height);
        const parsedWidth = parseSizeParam(width);

        if (parsedHeight !== undefined) {
            this._height = height;
            this._frame.style.height = parsedHeight;
        }

        if (parsedWidth !== undefined) {
            this._width = width;
            this._frame.style.width = parsedWidth;
        }
    }

    /**
     * Setups listeners that are used internally for JitsiMeetExternalAPI.
     *
     * @returns {void}
     *
     * @private
     */
    _setupListeners() {
        this._transport.on('event', ({ name, ...data }) => {
            const userID = data.id;

            switch (name) {
            case 'video-conference-joined': {
                if (typeof this._tmpE2EEKey !== 'undefined') {
                    this.executeCommand(commands.e2eeKey, this._tmpE2EEKey);
                    this._tmpE2EEKey = undefined;
                }

                this._myUserID = userID;
                this._participants[userID] = {
                    avatarURL: data.avatarURL
                };
            }

            // eslint-disable-next-line no-fallthrough
            case 'participant-joined': {
                this._participants[userID] = this._participants[userID] || {};
                this._participants[userID].displayName = data.displayName;
                this._participants[userID].formattedDisplayName
                    = data.formattedDisplayName;
                changeParticipantNumber(this, 1);
                break;
            }
            case 'participant-left':
                changeParticipantNumber(this, -1);
                delete this._participants[userID];
                break;
            case 'display-name-change': {
                const user = this._participants[userID];

                if (user) {
                    user.displayName = data.displayname;
                    user.formattedDisplayName = data.formattedDisplayName;
                }
                break;
            }
            case 'email-change': {
                const user = this._participants[userID];

                if (user) {
                    user.email = data.email;
                }
                break;
            }
            case 'avatar-changed': {
                const user = this._participants[userID];

                if (user) {
                    user.avatarURL = data.avatarURL;
                }
                break;
            }
            case 'on-stage-participant-changed':
                this._onStageParticipant = userID;
                this.emit('largeVideoChanged');
                break;
            case 'large-video-visibility-changed':
                this._isLargeVideoVisible = data.isVisible;
                this.emit('largeVideoChanged');
                break;
            case 'video-conference-left':
                changeParticipantNumber(this, -1);
                delete this._participants[this._myUserID];
                break;
            case 'video-quality-changed':
                this._videoQuality = data.videoQuality;
                break;
            case 'local-storage-changed':
                jitsiLocalStorage.setItem('jitsiLocalStorage', data.localStorageContent);

                // Since this is internal event we don't need to emit it to the consumer of the API.
                return true;
            }

            const eventName = events[name];

            if (eventName) {
                this.emit(eventName, data);

                return true;
            }

            return false;
        });
    }

    /**
     * Adds event listener to Meet Jitsi.
     *
     * @param {string} event - The name of the event.
     * @param {Function} listener - The listener.
     * @returns {void}
     *
     * @deprecated
     * NOTE: This method is not removed for backward comatability purposes.
     */
    addEventListener(event, listener) {
        this.on(event, listener);
    }

    /**
     * Adds event listeners to Meet Jitsi.
     *
     * @param {Object} listeners - The object key should be the name of
     * the event and value - the listener.
     * Currently we support the following
     * events:
     * {@code log} - receives event notifications whenever information has
     * been logged and has a log level specified within {@code config.apiLogLevels}.
     * The listener will receive object with the following structure:
     * {{
     * logLevel: the message log level
     * arguments: an array of strings that compose the actual log message
     * }}
     * {@code chatUpdated} - receives event notifications about chat state being
     * updated. The listener will receive object with the following structure:
     * {{
     *  'unreadCount': unreadCounter, // the unread message(s) counter,
     *  'isOpen': isOpen, // whether the chat panel is open or not
     * }}
     * {@code incomingMessage} - receives event notifications about incoming
     * messages. The listener will receive object with the following structure:
     * {{
     *  'from': from,//JID of the user that sent the message
     *  'nick': nick,//the nickname of the user that sent the message
     *  'message': txt//the text of the message
     * }}
     * {@code outgoingMessage} - receives event notifications about outgoing
     * messages. The listener will receive object with the following structure:
     * {{
     *  'message': txt//the text of the message
     * }}
     * {@code displayNameChanged} - receives event notifications about display
     * name change. The listener will receive object with the following
     * structure:
     * {{
     * jid: jid,//the JID of the participant that changed his display name
     * displayname: displayName //the new display name
     * }}
     * {@code participantJoined} - receives event notifications about new
     * participant.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * {@code participantLeft} - receives event notifications about the
     * participant that left the room.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * {@code videoConferenceJoined} - receives event notifications about the
     * local user has successfully joined the video conference.
     * The listener will receive object with the following structure:
     * {{
     * roomName: room //the room name of the conference
     * }}
     * {@code videoConferenceLeft} - receives event notifications about the
     * local user has left the video conference.
     * The listener will receive object with the following structure:
     * {{
     * roomName: room //the room name of the conference
     * }}
     * {@code screenSharingStatusChanged} - receives event notifications about
     * turning on/off the local user screen sharing.
     * The listener will receive object with the following structure:
     * {{
     * on: on //whether screen sharing is on
     * }}
     * {@code dominantSpeakerChanged} - receives event notifications about
     * change in the dominant speaker.
     * The listener will receive object with the following structure:
     * {{
     * id: participantId //participantId of the new dominant speaker
     * }}
     * {@code suspendDetected} - receives event notifications about detecting suspend event in host computer.
     * {@code readyToClose} - all hangup operations are completed and Jitsi Meet
     * is ready to be disposed.
     * @returns {void}
     *
     * @deprecated
     * NOTE: This method is not removed for backward comatability purposes.
     */
    addEventListeners(listeners) {
        for (const event in listeners) { // eslint-disable-line guard-for-in
            this.addEventListener(event, listeners[event]);
        }
    }

    /**
     * Captures the screenshot of the large video.
     *
     * @returns {Promise<string>} - Resolves with a base64 encoded image data of the screenshot
     * if large video is detected, an error otherwise.
     */
    captureLargeVideoScreenshot() {
        return this._transport.sendRequest({
            name: 'capture-largevideo-screenshot'
        });
    }

    /**
     * Removes the listeners and removes the Jitsi Meet frame.
     *
     * @returns {void}
     */
    dispose() {
        this.emit('_willDispose');
        this._transport.dispose();
        this.removeAllListeners();
        if (this._frame && this._frame.parentNode) {
            this._frame.parentNode.removeChild(this._frame);
        }
    }

    /**
     * Executes command. The available commands are:
     * {@code displayName} - Sets the display name of the local participant to
     * the value passed in the arguments array.
     * {@code subject} - Sets the subject of the conference, the value passed
     * in the arguments array. Note: Available only for moderator.
     *
     * {@code toggleAudio} - Mutes / unmutes audio with no arguments.
     * {@code toggleVideo} - Mutes / unmutes video with no arguments.
     * {@code toggleFilmStrip} - Hides / shows the filmstrip with no arguments.
     *
     * If the command doesn't require any arguments the parameter should be set
     * to empty array or it may be omitted.
     *
     * @param {string} name - The name of the command.
     * @returns {void}
     */
    executeCommand(name, ...args) {
        if (!(name in commands)) {
            console.error('Not supported command name.');

            return;
        }
        this._transport.sendEvent({
            data: args,
            name: commands[name]
        });
    }

    /**
     * Executes commands. The available commands are:
     * {@code displayName} - Sets the display name of the local participant to
     * the value passed in the arguments array.
     * {@code toggleAudio} - Mutes / unmutes audio. No arguments.
     * {@code toggleVideo} - Mutes / unmutes video. No arguments.
     * {@code toggleFilmStrip} - Hides / shows the filmstrip. No arguments.
     * {@code toggleChat} - Hides / shows chat. No arguments.
     * {@code toggleShareScreen} - Starts / stops screen sharing. No arguments.
     *
     * @param {Object} commandList - The object with commands to be executed.
     * The keys of the object are the commands that will be executed and the
     * values are the arguments for the command.
     * @returns {void}
     */
    executeCommands(commandList) {
        for (const key in commandList) { // eslint-disable-line guard-for-in
            this.executeCommand(key, commandList[key]);
        }
    }

    /**
     * Returns Promise that resolves with a list of available devices.
     *
     * @returns {Promise}
     */
    getAvailableDevices() {
        return getAvailableDevices(this._transport);
    }

    /**
     * Gets a list of the currently sharing participant id's.
     *
     * @returns {Promise} - Resolves with the list of participant id's currently sharing.
     */
    getContentSharingParticipants() {
        return this._transport.sendRequest({
            name: 'get-content-sharing-participants'
        });
    }

    /**
     * Returns Promise that resolves with current selected devices.
     *
     * @returns {Promise}
     */
    getCurrentDevices() {
        return getCurrentDevices(this._transport);
    }

    /**
     * Returns the current livestream url.
     *
     * @returns {Promise} - Resolves with the current livestream URL if exists, with
     * undefined if not and rejects on failure.
     */
    getLivestreamUrl() {
        return this._transport.sendRequest({
            name: 'get-livestream-url'
        });
    }

    /**
     * Returns the conference participants information.
     *
     * @returns {Array<Object>} - Returns an array containing participants
     * information like participant id, display name, avatar URL and email.
     */
    getParticipantsInfo() {
        const participantIds = Object.keys(this._participants);
        const participantsInfo = Object.values(this._participants);

        participantsInfo.forEach((participant, idx) => {
            participant.participantId = participantIds[idx];
        });

        return participantsInfo;
    }

    /**
     * Returns the current video quality setting.
     *
     * @returns {number}
     */
    getVideoQuality() {
        return this._videoQuality;
    }

    /**
     * Check if the audio is available.
     *
     * @returns {Promise} - Resolves with true if the audio available, with
     * false if not and rejects on failure.
     */
    isAudioAvailable() {
        return this._transport.sendRequest({
            name: 'is-audio-available'
        });
    }

    /**
     * Returns Promise that resolves with true if the device change is available
     * and with false if not.
     *
     * @param {string} [deviceType] - Values - 'output', 'input' or undefined.
     * Default - 'input'.
     * @returns {Promise}
     */
    isDeviceChangeAvailable(deviceType) {
        return isDeviceChangeAvailable(this._transport, deviceType);
    }

    /**
     * Returns Promise that resolves with true if the device list is available
     * and with false if not.
     *
     * @returns {Promise}
     */
    isDeviceListAvailable() {
        return isDeviceListAvailable(this._transport);
    }

    /**
     * Returns Promise that resolves with true if multiple audio input is supported
     * and with false if not.
     *
     * @returns {Promise}
     */
    isMultipleAudioInputSupported() {
        return isMultipleAudioInputSupported(this._transport);
    }

    /**
     * Invite people to the call.
     *
     * @param {Array<Object>} invitees - The invitees.
     * @returns {Promise} - Resolves on success and rejects on failure.
     */
    invite(invitees) {
        if (!Array.isArray(invitees) || invitees.length === 0) {
            return Promise.reject(new TypeError('Invalid Argument'));
        }

        return this._transport.sendRequest({
            name: 'invite',
            invitees
        });
    }

    /**
     * Returns the audio mute status.
     *
     * @returns {Promise} - Resolves with the audio mute status and rejects on
     * failure.
     */
    isAudioMuted() {
        return this._transport.sendRequest({
            name: 'is-audio-muted'
        });
    }

    /**
     * Returns screen sharing status.
     *
     * @returns {Promise} - Resolves with screensharing status and rejects on failure.
     */
    isSharingScreen() {
        return this._transport.sendRequest({
            name: 'is-sharing-screen'
        });
    }

    /**
     * Returns the avatar URL of a participant.
     *
     * @param {string} participantId - The id of the participant.
     * @returns {string} The avatar URL.
     */
    getAvatarURL(participantId) {
        const { avatarURL } = this._participants[participantId] || {};

        return avatarURL;
    }

    /**
     * Returns the display name of a participant.
     *
     * @param {string} participantId - The id of the participant.
     * @returns {string} The display name.
     */
    getDisplayName(participantId) {
        const { displayName } = this._participants[participantId] || {};

        return displayName;
    }

    /**
     * Returns the email of a participant.
     *
     * @param {string} participantId - The id of the participant.
     * @returns {string} The email.
     */
    getEmail(participantId) {
        const { email } = this._participants[participantId] || {};

        return email;
    }

    /**
     * Returns the iframe that loads Jitsi Meet.
     *
     * @returns {HTMLElement} The iframe.
     */
    getIFrame() {
        return this._frame;
    }

    /**
     * Returns the number of participants in the conference. The local
     * participant is included.
     *
     * @returns {int} The number of participants in the conference.
     */
    getNumberOfParticipants() {
        return this._numberOfParticipants;
    }

    /**
     * Check if the video is available.
     *
     * @returns {Promise} - Resolves with true if the video available, with
     * false if not and rejects on failure.
     */
    isVideoAvailable() {
        return this._transport.sendRequest({
            name: 'is-video-available'
        });
    }

    /**
     * Returns the audio mute status.
     *
     * @returns {Promise} - Resolves with the audio mute status and rejects on
     * failure.
     */
    isVideoMuted() {
        return this._transport.sendRequest({
            name: 'is-video-muted'
        });
    }

    /**
     * Pins a participant's video on to the stage view.
     *
     * @param {string} participantId - Participant id (JID) of the participant
     * that needs to be pinned on the stage view.
     * @returns {void}
     */
    pinParticipant(participantId) {
        this.executeCommand('pinParticipant', participantId);
    }

    /**
     * Removes event listener.
     *
     * @param {string} event - The name of the event.
     * @returns {void}
     *
     * @deprecated
     * NOTE: This method is not removed for backward comatability purposes.
     */
    removeEventListener(event) {
        this.removeAllListeners(event);
    }

    /**
     * Removes event listeners.
     *
     * @param {Array<string>} eventList - Array with the names of the events.
     * @returns {void}
     *
     * @deprecated
     * NOTE: This method is not removed for backward comatability purposes.
     */
    removeEventListeners(eventList) {
        eventList.forEach(event => this.removeEventListener(event));
    }

    /**
     * Resizes the large video container as per the dimensions provided.
     *
     * @param {number} width - Width that needs to be applied on the large video container.
     * @param {number} height - Height that needs to be applied on the large video container.
     * @returns {void}
     */
    resizeLargeVideo(width, height) {
        if (width <= this._width && height <= this._height) {
            this.executeCommand('resizeLargeVideo', width, height);
        }
    }

    /**
     * Passes an event along to the local conference participant to establish
     * or update a direct peer connection. This is currently used for developing
     * wireless screensharing with room integration and it is advised against to
     * use as its api may change.
     *
     * @param {Object} event - An object with information to pass along.
     * @param {Object} event.data - The payload of the event.
     * @param {string} event.from - The jid of the sender of the event. Needed
     * when a reply is to be sent regarding the event.
     * @returns {void}
     */
    sendProxyConnectionEvent(event) {
        this._transport.sendEvent({
            data: [ event ],
            name: 'proxy-connection-event'
        });
    }

    /**
     * Sets the audio input device to the one with the label or id that is
     * passed.
     *
     * @param {string} label - The label of the new device.
     * @param {string} deviceId - The id of the new device.
     * @returns {Promise}
     */
    setAudioInputDevice(label, deviceId) {
        return setAudioInputDevice(this._transport, label, deviceId);
    }

    /**
     * Sets the audio output device to the one with the label or id that is
     * passed.
     *
     * @param {string} label - The label of the new device.
     * @param {string} deviceId - The id of the new device.
     * @returns {Promise}
     */
    setAudioOutputDevice(label, deviceId) {
        return setAudioOutputDevice(this._transport, label, deviceId);
    }

    /**
     * Displays the given participant on the large video. If no participant id is specified,
     * dominant and pinned speakers will be taken into consideration while selecting the
     * the large video participant.
     *
     * @param {string} participantId - Jid of the participant to be displayed on the large video.
     * @returns {void}
     */
    setLargeVideoParticipant(participantId) {
        this.executeCommand('setLargeVideoParticipant', participantId);
    }

    /**
     * Sets the video input device to the one with the label or id that is
     * passed.
     *
     * @param {string} label - The label of the new device.
     * @param {string} deviceId - The id of the new device.
     * @returns {Promise}
     */
    setVideoInputDevice(label, deviceId) {
        return setVideoInputDevice(this._transport, label, deviceId);
    }

    /**
     * Starts a file recording or streaming session depending on the passed on params.
     * For RTMP streams, `rtmpStreamKey` must be passed on. `rtmpBroadcastID` is optional.
     * For youtube streams, `youtubeStreamKey` must be passed on. `youtubeBroadcastID` is optional.
     * For dropbox recording, recording `mode` should be `file` and a dropbox oauth2 token must be provided.
     * For file recording, recording `mode` should be `file` and optionally `shouldShare` could be passed on.
     * No other params should be passed.
     *
     * @param {Object} options - An object with config options to pass along.
     * @param { string } options.mode - Recording mode, either `file` or `stream`.
     * @param { string } options.dropboxToken - Dropbox oauth2 token.
     * @param { boolean } options.shouldShare - Whether the recording should be shared with the participants or not.
     * Only applies to certain jitsi meet deploys.
     * @param { string } options.rtmpStreamKey - The RTMP stream key.
     * @param { string } options.rtmpBroadcastID - The RTMP broacast ID.
     * @param { string } options.youtubeStreamKey - The youtube stream key.
     * @param { string } options.youtubeBroadcastID - The youtube broacast ID.
     * @returns {void}
     */
    startRecording(options) {
        this.executeCommand('startRecording', options);
    }

    /**
     * Stops a recording or streaming session that is in progress.
     *
     * @param {string} mode - `file` or `stream`.
     * @returns {void}
     */
    stopRecording(mode) {
        this.executeCommand('startRecording', mode);
    }
}
