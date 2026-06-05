import { jitsiLocalStorage } from '@jitsi/js-utils/jitsi-local-storage';
import { EmbeddedTransportBackend, Transport } from '@jitsi/js-utils/transport';
import EventEmitter from 'events';

import {
    getAvailableDevices,
    getCurrentDevices,
    isDeviceChangeAvailable,
    isMultipleAudioInputSupported,
    setAudioInputDevice,
    setAudioOutputDevice,
    setVideoInputDevice
} from './functions';

/**
 * Maps the names of the commands expected by the API with the name of the
 * commands expected by jitsi-meet. Same mapping as in external_api.js.
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
    grantRecordingConsent: 'grant-recording-consent',
    hangup: 'video-hangup',
    hideNotification: 'hide-notification',
    initiatePrivateChat: 'initiate-private-chat',
    joinBreakoutRoom: 'join-breakout-room',
    localSubject: 'local-subject',
    kickParticipant: 'kick-participant',
    muteEveryone: 'mute-everyone',
    muteRemoteParticipant: 'mute-remote-participant',
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
 * Maps internal event names to public event names. Same as external_api.js.
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
    'custom-notification-action-triggered': 'customNotificationActionTriggered',
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
    'file-deleted': 'fileDeleted',
    'file-uploaded': 'fileUploaded',
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
    'participant-muted': 'participantMuted',
    'participant-role-changed': 'participantRoleChanged',
    'participants-pane-toggled': 'participantsPaneToggled',
    'password-required': 'passwordRequired',
    'peer-connection-failure': 'peerConnectionFailure',
    'prejoin-screen-loaded': 'prejoinScreenLoaded',
    'proxy-connection-event': 'proxyConnectionEvent',
    'raise-hand-updated': 'raiseHandUpdated',
    'ready': 'ready',
    'recording-consent-dialog-open': 'recordingConsentDialogOpen',
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
    'toolbar-visibility-changed': 'toolbarVisibilityChanged',
    'transcribing-status-changed': 'transcribingStatusChanged',
    'transcription-chunk-received': 'transcriptionChunkReceived',
    'whiteboard-status-changed': 'whiteboardStatusChanged'
};

/**
 * Maps request names.
 */
const requests = {
    '_request-desktop-sources': '_requestDesktopSources'
};

/**
 * Adds given number to the numberOfParticipants property of given APIInstance.
 *
 * @param {JitsiMeetEmbeddedAPI} APIInstance - The instance of the API.
 * @param {int} number - The number of participants to be added to
 * numberOfParticipants property (this parameter can be negative number if the
 * numberOfParticipants should be decreased).
 * @returns {void}
 */
function changeParticipantNumber(APIInstance, number) {
    APIInstance._numberOfParticipants += number;
}

/**
 * Compute valid values for height and width.
 *
 * @param {any} value - The value to be parsed.
 * @returns {string|undefined} The parsed value for CSS.
 */
function parseSizeParam(value) {
    let parsedValue;

    const re = /([0-9]*\.?[0-9]+)(em|pt|px|((d|l|s)?v)(h|w)|%)$/;

    if (typeof value === 'string' && String(value).match(re) !== null) {
        parsedValue = value;
    } else if (typeof value === 'number') {
        parsedValue = `${value}px`;
    }

    return parsedValue;
}


/**
 * The Embedded API interface class.
 *
 * Unlike JitsiMeetExternalAPI, this class renders Jitsi Meet directly
 * into a <div> on the host page — no iframe, no postMessage. Communication
 * between the host app and the Jitsi Meet app happens through
 * EmbeddedTransportBackend, which passes JS objects directly in memory.
 */
export default class JitsiMeetEmbeddedAPI extends EventEmitter {
    /**
     * Constructs new Embedded API instance. Renders Jitsi Meet directly
     * into a container div on the host page.
     *
     * @param {string} domain - The domain name of the server that hosts the
     * conference.
     * @param {Object} [options] - Optional arguments.
     * @param {string} [options.roomName] - The name of the room to join.
     * @param {number|string} [options.width] - Width of the container.
     * @param {number|string} [options.height] - Height of the container.
     * @param {DOMElement} [options.parentNode] - The node that will contain the
     * embedded meeting.
     * @param {Object} [options.configOverwrite] - Config overrides for config.js.
     * @param {Object} [options.interfaceConfigOverwrite] - Config overrides for
     * interface_config.js.
     * @param {string} [options.jwt] - JWT token for authentication.
     * @param {string} [options.lang] - The meeting's default language.
     * @param {Function} [options.onload] - Callback when the app is ready.
     * @param {Array<Object>} [options.invitees] - Invitees to add on join.
     * @param {Array<Object>} [options.devices] - Initial devices.
     * @param {Object} [options.userInfo] - Info about the local participant.
     * @param {string} [options.e2eeKey] - E2EE key (experimental).
     * @param {string} [options.release] - Release key if enabled on backend.
     */
    constructor(domain, options = {}) {
        super();

        const {
            roomName = '',
            width = '100%',
            height = '100%',
            parentNode = document.body,
            configOverwrite = {},
            interfaceConfigOverwrite = {},
            jwt,
            lang,
            onload,
            invitees,
            devices,
            userInfo,
            e2eeKey,
            release
        } = options;

        this._parentNode = parentNode;
        this._domain = domain;
        this._roomName = roomName;

        // --- Create the container div ---
        this._container = document.createElement('div');
        this._container.id = 'jitsiEmbeddedContainer';
        this._setSize(height, width);
        this._container.style.overflow = 'hidden';
        this._container.style.position = 'relative';

        // Inner div that the React app renders into (same id as index.html).
        this._reactRoot = document.createElement('div');
        this._reactRoot.id = 'react';
        this._reactRoot.style.width = '100%';
        this._reactRoot.style.height = '100%';
        this._container.appendChild(this._reactRoot);
        this._parentNode.appendChild(this._container);

        // --- Create the linked transport pair ---
        const [ hostBackend, appBackend ] = EmbeddedTransportBackend.createPair();

        this._appBackend = appBackend;

        this._transport = new Transport({
            backend: hostBackend
        });

        // --- Store options for later ---
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

        if (Array.isArray(invitees) && invitees.length > 0) {
            this.invite(invitees);
        }

        // --- Build the room URL for the app's location context ---
        let roomUrl = `https://${domain}/${roomName}`;
        const hashParams = [];

        if (jwt) {
            hashParams.push(`jwt=${jwt}`);
        }
        if (lang) {
            hashParams.push(`lang=${lang}`);
        }
        if (release) {
            hashParams.push(`release=${release}`);
        }

        if (hashParams.length) {
            roomUrl += `#${hashParams.join('&')}`;
        }

        // --- Apply config/interfaceConfig to globals before app loads ---
        this._applyConfig({
            roomUrl,
            configOverwrite,
            interfaceConfigOverwrite,
            devices,
            userInfo,
            roomName
        });

        // --- Load the Jitsi Meet app bundle and render ---
        this._loadApp(domain);
    }

    /**
     * Applies configuration overrides to window globals so the Jitsi app
     * picks them up when it initializes.
     *
     * @param {Object} options - Configuration options.
     * @param {string} options.roomUrl - The full room URL.
     * @param {Object} options.configOverwrite - Config overrides.
     * @param {Object} options.interfaceConfigOverwrite - Interface config overrides.
     * @param {Array} options.devices - Initial devices.
     * @param {Object} options.userInfo - User info.
     * @param {string} options.roomName - Room name.
     * @returns {void}
     * @private
     */
    _applyConfig({ roomUrl: _roomUrl, configOverwrite, interfaceConfigOverwrite,
        devices, userInfo, roomName }) {
        // Set the embedded mode flag BEFORE the app bundle evaluates.
        // This is read by modules/API/constants.js to enable the API
        // without a numeric API_ID in the URL.
        if (!window.JitsiMeetJS) {
            window.JitsiMeetJS = {};
        }
        if (!window.JitsiMeetJS.app) {
            window.JitsiMeetJS.app = {};
        }
        window.JitsiMeetJS.app._embeddedMode = true;

        // Config overrides — the app reads these from window.config /
        // window.interfaceConfig when it starts.
        if (configOverwrite && Object.keys(configOverwrite).length) {
            window.config = {
                ...window.config || {},
                ...configOverwrite
            };
        }

        if (interfaceConfigOverwrite && Object.keys(interfaceConfigOverwrite).length) {
            window.interfaceConfig = {
                ...window.interfaceConfig || {},
                ...interfaceConfigOverwrite
            };
        }

        // Store info the app needs to find the room.
        window.location.hash = '';

        // Provide room name and user info via config.
        if (roomName) {
            window.config = window.config || {};

            // The app uses location to derive the room name, but in embedded
            // mode the location belongs to the host page. We pass it via config.
            window.config.defaultRemoteDisplayName = window.config.defaultRemoteDisplayName || 'Fellow Jitster';
        }

        if (devices) {
            window.config = window.config || {};
            window.config.devices = devices;
        }

        if (userInfo) {
            window.config = window.config || {};
            window.config.userInfo = userInfo;
        }
    }
