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
 * commands expected by jitsi-meet.
 */
const commands = {
    addBreakoutRoom: 'add-breakout-room',
    answerKnockingParticipant: 'answer-knocking-participant',
    approveVideo: 'approve-video',
    askToUnmute: 'ask-to-unmute',
    autoAssignToBreakoutRooms: 'auto-assign-to-breakout-rooms',
    avatarUrl: 'avatar-url',
    cancelPrivateChat: 'cancel-private-chat',
    closeBreakoutRoom: 'close-breakout-room',
    displayName: 'display-name',
    endConference: 'end-conference',
    email: 'email',
    grantModerator: 'grant-moderator',
    hangup: 'video-hangup',
    hideNotification: 'hide-notification',
    initiatePrivateChat: 'initiate-private-chat',
    joinBreakoutRoom: 'join-breakout-room',
    localSubject: 'local-subject',
    kickParticipant: 'kick-participant',
    muteEveryone: 'mute-everyone',
    overwriteConfig: 'overwrite-config',
    overwriteNames: 'overwrite-names',
    password: 'password',
    pinParticipant: 'pin-participant',
    rejectParticipant: 'reject-participant',
    removeBreakoutRoom: 'remove-breakout-room',
    resizeFilmStrip: 'resize-film-strip',
    resizeLargeVideo: 'resize-large-video',
    sendCameraFacingMode: 'send-camera-facing-mode-message',
    sendChatMessage: 'send-chat-message',
    sendEndpointTextMessage: 'send-endpoint-text-message',
    sendParticipantToRoom: 'send-participant-to-room',
    sendTones: 'send-tones',
    setAudioOnly: 'set-audio-only',
    setAssumedBandwidthBps: 'set-assumed-bandwidth-bps',
    setBlurredBackground: 'set-blurred-background',
    setFollowMe: 'set-follow-me',
    setLargeVideoParticipant: 'set-large-video-participant',
    setMediaEncryptionKey: 'set-media-encryption-key',
    setNoiseSuppressionEnabled: 'set-noise-suppression-enabled',
    setParticipantVolume: 'set-participant-volume',
    setSubtitles: 'set-subtitles',
    setTileView: 'set-tile-view',
    setVideoQuality: 'set-video-quality',
    setVirtualBackground: 'set-virtual-background',
    showNotification: 'show-notification',
    startRecording: 'start-recording',
    startShareVideo: 'start-share-video',
    stopRecording: 'stop-recording',
    stopShareVideo: 'stop-share-video',
    subject: 'subject',
    submitFeedback: 'submit-feedback',
    toggleAudio: 'toggle-audio',
    toggleCamera: 'toggle-camera',
    toggleCameraMirror: 'toggle-camera-mirror',
    toggleChat: 'toggle-chat',
    toggleE2EE: 'toggle-e2ee',
    toggleFilmStrip: 'toggle-film-strip',
    toggleLobby: 'toggle-lobby',
    toggleModeration: 'toggle-moderation',
    toggleNoiseSuppression: 'toggle-noise-suppression',
    toggleParticipantsPane: 'toggle-participants-pane',
    toggleRaiseHand: 'toggle-raise-hand',
    toggleShareScreen: 'toggle-share-screen',
    toggleSubtitles: 'toggle-subtitles',
    toggleTileView: 'toggle-tile-view',
    toggleVirtualBackgroundDialog: 'toggle-virtual-background',
    toggleVideo: 'toggle-video',
    toggleWhiteboard: 'toggle-whiteboard'
};

/**
 * Maps the names of the events expected by the API with the name of the
 * events expected by jitsi-meet.
 */
const events = {
    'avatar-changed': 'avatarChanged',
    'audio-availability-changed': 'audioAvailabilityChanged',
    'audio-mute-status-changed': 'audioMuteStatusChanged',
    'audio-only-changed': 'audioOnlyChanged',
    'audio-or-video-sharing-toggled': 'audioOrVideoSharingToggled',
    'breakout-rooms-updated': 'breakoutRoomsUpdated',
    'browser-support': 'browserSupport',
    'camera-error': 'cameraError',
    'chat-updated': 'chatUpdated',
    'compute-pressure-changed': 'computePressureChanged',
    'conference-created-timestamp': 'conferenceCreatedTimestamp',
    'content-sharing-participants-changed': 'contentSharingParticipantsChanged',
    'data-channel-closed': 'dataChannelClosed',
    'data-channel-opened': 'dataChannelOpened',
    'device-list-changed': 'deviceListChanged',
    'display-name-change': 'displayNameChange',
    'dominant-speaker-changed': 'dominantSpeakerChanged',
    'email-change': 'emailChange',
    'error-occurred': 'errorOccurred',
    'endpoint-text-message-received': 'endpointTextMessageReceived',
    'face-landmark-detected': 'faceLandmarkDetected',
    'feedback-submitted': 'feedbackSubmitted',
    'feedback-prompt-displayed': 'feedbackPromptDisplayed',
    'filmstrip-display-changed': 'filmstripDisplayChanged',
    'incoming-message': 'incomingMessage',
    'knocking-participant': 'knockingParticipant',
    'log': 'log',
    'mic-error': 'micError',
    'moderation-participant-approved': 'moderationParticipantApproved',
    'moderation-participant-rejected': 'moderationParticipantRejected',
    'moderation-status-changed': 'moderationStatusChanged',
    'mouse-enter': 'mouseEnter',
    'mouse-leave': 'mouseLeave',
    'mouse-move': 'mouseMove',
    'non-participant-message-received': 'nonParticipantMessageReceived',
    'notification-triggered': 'notificationTriggered',
    'outgoing-message': 'outgoingMessage',
    'p2p-status-changed': 'p2pStatusChanged',
    'participant-joined': 'participantJoined',
    'participant-kicked-out': 'participantKickedOut',
    'participant-left': 'participantLeft',
    'participant-role-changed': 'participantRoleChanged',
    'participants-pane-toggled': 'participantsPaneToggled',
    'password-required': 'passwordRequired',
    'peer-connection-failure': 'peerConnectionFailure',
    'prejoin-screen-loaded': 'prejoinScreenLoaded',
    'proxy-connection-event': 'proxyConnectionEvent',
    'raise-hand-updated': 'raiseHandUpdated',
    'ready': 'ready',
    'recording-link-available': 'recordingLinkAvailable',
    'recording-status-changed': 'recordingStatusChanged',
    'participant-menu-button-clicked': 'participantMenuButtonClick',
    'video-ready-to-close': 'readyToClose',
    'video-conference-joined': 'videoConferenceJoined',
    'video-conference-left': 'videoConferenceLeft',
    'video-availability-changed': 'videoAvailabilityChanged',
    'video-mute-status-changed': 'videoMuteStatusChanged',
    'video-quality-changed': 'videoQualityChanged',
    'screen-sharing-status-changed': 'screenSharingStatusChanged',
    'subject-change': 'subjectChange',
    'suspend-detected': 'suspendDetected',
    'tile-view-changed': 'tileViewChanged',
    'toolbar-button-clicked': 'toolbarButtonClicked',
    'transcribing-status-changed': 'transcribingStatusChanged',
    'transcription-chunk-received': 'transcriptionChunkReceived',
    'whiteboard-status-changed': 'whiteboardStatusChanged'
};

const requests = {
    '_request-desktop-sources': '_requestDesktopSources'
};

/**
 * Last id of api object.
 *
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
 * @param {string} [options.lang] - The meeting's default language.
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
    case 'undefined': {
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
            onload,
            lang
        ] = args;

        return {
            roomName,
            width,
            height,
            parentNode,
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            onload,
            lang
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
 * returns undefined.
 */
function parseSizeParam(value) {
    let parsedValue;

    // This regex parses values of the form 100px, 100em, 100pt, 100vh, 100vw or 100%.
    // Values like 100 or 100px are handled outside of the regex, and
    // invalid values will be ignored and the minimum will be used.
    const re = /([0-9]*\.?[0-9]+)(em|pt|px|((d|l|s)?v)(h|w)|%)$/;

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
     * @param {IIceServers} [options.iceServers] - Object with rules that will be used to modify/remove the existing
     * ice server configuration.
     * NOTE: This property is currently experimental and may be removed in the future!
     * @param {string} [options.jwt] - The JWT token if needed by jitsi-meet for
     * authentication.
     * @param {string} [options.lang] - The meeting's default language.
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
     * @param {string}  [options.release] - The key used for specifying release if enabled on the backend.
     * @param {string} [options.sandbox] - Sandbox directive for the created iframe, if desired.
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
            lang = undefined,
            onload = undefined,
            invitees,
            iceServers,
            devices,
            userInfo,
            e2eeKey,
            release,
            sandbox = ''
        } = parseArguments(args);
        const localStorageContent = jitsiLocalStorage.getItem('jitsiLocalStorage');

        this._parentNode = parentNode;
        this._url = generateURL(domain, {
            configOverwrite,
            iceServers,
            interfaceConfigOverwrite,
            jwt,
            lang,
            roomName,
            devices,
            userInfo,
            appData: {
                localStorageContent
            },
            release
        });

        this._createIFrame(height, width, sandbox);

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

        this._onload = onload;
        this._tmpE2EEKey = e2eeKey;
        this._isLargeVideoVisible = false;
        this._isPrejoinVideoVisible = false;
        this._numberOfParticipants = 0;
        this._participants = {};
        this._myUserID = undefined;
        this._onStageParticipant = undefined;
        this._iAmvisitor = undefined;
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
     * @param {string} sandbox - Sandbox directive for the created iframe, if desired.
     * @returns {void}
     *
     * @private
     */
    _createIFrame(height, width, sandbox) {
        const frameName = `jitsiConferenceFrame${id}`;

        this._frame = document.createElement('iframe');
        this._frame.allow = [
            'autoplay',
            'camera',
            'clipboard-write',
            'compute-pressure',
            'display-capture',
            'hid',
            'microphone',
            'screen-wake-lock',
            'speaker-selection'
        ].join('; ');
        this._frame.name = frameName;
        this._frame.id = frameName;
        this._setSize(height, width);
        this._frame.setAttribute('allowFullScreen', 'true');
        this._frame.style.border = 0;

        if (sandbox) {
            this._frame.sandbox = sandbox;
        }

        this._frame.src = this._url;

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
            filename => new URL(filename, baseURL).href
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
     * Getter for the prejoin video element in Jitsi Meet.
     *
     * @returns {HTMLElement|undefined} - The prejoin video.
     */
    _getPrejoinVideo() {
        const iframe = this.getIFrame();

        if (!this._isPrejoinVideoVisible
                || !iframe
                || !iframe.contentWindow
                || !iframe.contentWindow.document) {
            return;
        }

        return iframe.contentWindow.document.getElementById('prejoinVideo');
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
            case 'ready': {
                // Fake the iframe onload event because it's not reliable.
                this._onload?.();

                break;
            }
            case 'video-conference-joined': {
                if (typeof this._tmpE2EEKey !== 'undefined') {

                    const hexToBytes = hex => {
                        const bytes = [];

                        for (let c = 0; c < hex.length; c += 2) {
                            bytes.push(parseInt(hex.substring(c, c + 2), 16));
                        }

                        return bytes;
                    };

                    this.executeCommand('setMediaEncryptionKey', JSON.stringify({
                        exportedKey: hexToBytes(this._tmpE2EEKey),
                        index: 0
                    }));

                    this._tmpE2EEKey = undefined;
                }

                this._myUserID = userID;
                this._participants[userID] = {
                    email: data.email,
                    avatarURL: data.avatarURL
                };
                this._iAmvisitor = data.visitor;
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
            case 'prejoin-screen-loaded':
                this._participants[userID] = {
                    displayName: data.displayName,
                    formattedDisplayName: data.formattedDisplayName
                };
                break;
            case 'on-prejoin-video-changed':
                this._isPrejoinVideoVisible = data.isVisible;
                this.emit('prejoinVideoChanged');
                break;
            case 'video-conference-left':
                changeParticipantNumber(this, -1);
                delete this._participants[this._myUserID];
                break;
            case 'video-quality-changed':
                this._videoQuality = data.videoQuality;
                break;
            case 'breakout-rooms-updated':
                this.updateNumberOfParticipants(data.rooms);
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

        this._transport.on('request', (request, callback) => {
            const requestName = requests[request.name];
            const data = {
                ...request,
                name: requestName
            };

            if (requestName) {
                this.emit(requestName, data, callback);
            }
        });
    }

    /**
     * Update number of participants based on all rooms.
     *
     * @param {Object} rooms - Rooms available rooms in the conference.
     * @returns {void}
     */
    updateNumberOfParticipants(rooms) {
        if (!rooms || !Object.keys(rooms).length) {
            return;
        }

        const allParticipants = Object.keys(rooms).reduce((prev, roomItemKey) => {
            if (rooms[roomItemKey]?.participants) {
                return Object.keys(rooms[roomItemKey].participants).length + prev;
            }

            return prev;
        }, 0);

        this._numberOfParticipants = allParticipants;
    }

    /**
     * Returns the rooms info in the conference.
     *
     * @returns {Object} Rooms info.
     */
    async getRoomsInfo() {
        return this._transport.sendRequest({
            name: 'rooms-info'
        });
    }

    /**
     * Returns whether the conference is P2P.
     *
     * @returns {Promise}
     */
    isP2pActive() {
        return this._transport.sendRequest({
            name: 'get-p2p-status'
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
     * Returns any custom avatars backgrounds.
     *
     * @returns {Promise} - Resolves with the list of custom avatar backgrounds.
     */
    getCustomAvatarBackgrounds() {
        return this._transport.sendRequest({
            name: 'get-custom-avatar-backgrounds'
        });
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
     * Returns the audio disabled status.
     *
     * @returns {Promise} - Resolves with the audio disabled status and rejects on
     * failure.
     */
    isAudioDisabled() {
        return this._transport.sendRequest({
            name: 'is-audio-disabled'
        });
    }

    /**
     * Returns the moderation on status on the given mediaType.
     *
     * @param {string} mediaType - The media type for which to check moderation.
     * @returns {Promise} - Resolves with the moderation on status and rejects on
     * failure.
     */
    isModerationOn(mediaType) {
        return this._transport.sendRequest({
            name: 'is-moderation-on',
            mediaType
        });
    }

    /**
     * Returns force muted status of the given participant id for the given media type.
     *
     * @param {string} participantId - The id of the participant to check.
     * @param {string} mediaType - The media type for which to check.
     * @returns {Promise} - Resolves with the force muted status and rejects on
     * failure.
     */
    isParticipantForceMuted(participantId, mediaType) {
        return this._transport.sendRequest({
            name: 'is-participant-force-muted',
            participantId,
            mediaType
        });
    }

    /**
     * Returns whether the participants pane is open.
     *
     * @returns {Promise} - Resolves with true if the participants pane is open
     * and with false if not.
     */
    isParticipantsPaneOpen() {
        return this._transport.sendRequest({
            name: 'is-participants-pane-open'
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
     * Returns whether meeting is started silent.
     *
     * @returns {Promise} - Resolves with start silent status.
     */
    isStartSilent() {
        return this._transport.sendRequest({
            name: 'is-start-silent'
        });
    }

    /**
     * Returns whether we have joined as visitor in a meeting.
     *
     * @returns {boolean} - Returns true if we have joined as visitor.
     */
    isVisitor() {
        return this._iAmvisitor;
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
     * Gets the deployment info.
     *
     * @returns {Promise} - Resolves with the deployment info object.
     */
    getDeploymentInfo() {
        return this._transport.sendRequest({
            name: 'deployment-info'
        });
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
     * Returns the number of participants in the conference from all rooms. The local
     * participant is included.
     *
     * @returns {int} The number of participants in the conference.
     */
    getNumberOfParticipants() {
        return this._numberOfParticipants;
    }

    /**
     * Return the conference`s sessionId.
     *
     * @returns {Promise} - Resolves with the conference`s sessionId.
     */
    getSessionId() {
        return this._transport.sendRequest({
            name: 'session-id'
        });
    }

    /**
     * Returns array of commands supported by executeCommand().
     *
     * @returns {Array<string>} Array of commands.
     */
    getSupportedCommands() {
        return Object.keys(commands);
    }

    /**
     * Returns array of events supported by addEventListener().
     *
     * @returns {Array<string>} Array of events.
     */
    getSupportedEvents() {
        return Object.values(events);
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
     * Returns the list of breakout rooms.
     *
     * @returns {Promise} Resolves with the list of breakout rooms.
     */
    listBreakoutRooms() {
        return this._transport.sendRequest({
            name: 'list-breakout-rooms'
        });
    }

    /**
     * Returns the state of availability electron share screen via external api.
     *
     * @returns {Promise}
     */
    _isNewElectronScreensharingSupported() {
        return this._transport.sendRequest({
            name: '_new_electron_screensharing_supported'
        });
    }

    /**
     * Pins a participant's video on to the stage view.
     *
     * @param {string} participantId - Participant id (JID) of the participant
     * that needs to be pinned on the stage view.
     * @param {string} [videoType] - Indicates the type of thumbnail to be pinned when multistream support is enabled.
     * Accepts "camera" or "desktop" values. Default is "camera". Any invalid values will be ignored and default will
     * be used.
     * @returns {void}
     */
    pinParticipant(participantId, videoType) {
        this.executeCommand('pinParticipant', participantId, videoType);
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
     * @param {string} [videoType] - Indicates the type of video to be set when multistream support is enabled.
     * Accepts "camera" or "desktop" values. Default is "camera". Any invalid values will be ignored and default will
     * be used.
     * @returns {void}
     */
    setLargeVideoParticipant(participantId, videoType) {
        this.executeCommand('setLargeVideoParticipant', participantId, videoType);
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
     * @param { string } options.rtmpBroadcastID - The RTMP broadcast ID.
     * @param { string } options.youtubeStreamKey - The youtube stream key.
     * @param { string } options.youtubeBroadcastID - The youtube broadcast ID.
     * @param {Object } options.extraMetadata - Any extra metadata params for file recording.
     * @param { boolean } arg.transcription - Whether a transcription should be started or not.
     * @returns {void}
     */
    startRecording(options) {
        this.executeCommand('startRecording', options);
    }

    /**
     * Stops a recording or streaming session that is in progress.
     *
     * @param {string} mode - `file` or `stream`.
     * @param {boolean} transcription - Whether the transcription needs to be stopped.
     * @returns {void}
     */
    stopRecording(mode, transcription) {
        this.executeCommand('stopRecording', mode, transcription);
    }

    /**
     * Sets e2ee enabled/disabled.
     *
     * @param {boolean} enabled - The new value for e2ee enabled.
     * @returns {void}
     */
    toggleE2EE(enabled) {
        this.executeCommand('toggleE2EE', enabled);
    }

    /**
     * Sets the key and keyIndex for e2ee.
     *
     * @param {Object} keyInfo - Json containing key information.
     * @param {CryptoKey} [keyInfo.encryptionKey] - The encryption key.
     * @param {number} [keyInfo.index] - The index of the encryption key.
     * @returns {void}
     */
    async setMediaEncryptionKey(keyInfo) {
        const { key, index } = keyInfo;

        if (key) {
            const exportedKey = await crypto.subtle.exportKey('raw', key);

            this.executeCommand('setMediaEncryptionKey', JSON.stringify({
                exportedKey: Array.from(new Uint8Array(exportedKey)),
                index }));
        } else {
            this.executeCommand('setMediaEncryptionKey', JSON.stringify({
                exportedKey: false,
                index }));
        }
    }

    /**
     * Enable or disable the virtual background with a custom base64 image.
     *
     * @param {boolean} enabled - The boolean value to enable or disable.
     * @param {string} backgroundImage - The base64 image.
     * @returns {void}
    */
    setVirtualBackground(enabled, backgroundImage) {
        this.executeCommand('setVirtualBackground', enabled, backgroundImage);
    }
}
