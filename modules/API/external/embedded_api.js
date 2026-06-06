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

    /**
     * Loads the Jitsi Meet app.bundle.js and renders the app into our
     * container div. If the bundle is already loaded (window.APP exists),
     * it renders immediately.
     *
     * @param {string} domain - The domain to load scripts from.
     * @returns {void}
     * @private
     */
    _loadApp(domain) {
        const renderApp = () => {
            const globalNS = window.JitsiMeetJS?.app;

            if (!globalNS) {
                console.error('[EmbeddedAPI] JitsiMeetJS.app namespace not found.');

                return;
            }

            // Swap the app-side transport backend to our direct backend.
            if (typeof globalNS.setExternalTransportBackend === 'function') {
                globalNS.setExternalTransportBackend(this._appBackend);
            } else {
                console.error('[EmbeddedAPI] setExternalTransportBackend not available.');
            }

            // Render the React app into our container's inner div.
            if (typeof globalNS.renderEntryPoint === 'function'
                    && globalNS.entryPoints?.APP) {
                globalNS.renderEntryPoint({
                    Component: globalNS.entryPoints.APP,
                    elementId: this._reactRoot.id
                });
            } else {
                console.error('[EmbeddedAPI] renderEntryPoint or APP entry point not available.');
            }

            this._loaded = true;
        };

        // Check if the app bundle is already loaded.
        if (window.APP && window.JitsiMeetJS?.app?.renderEntryPoint) {
            renderApp();

            return;
        }

        // Load the app bundle dynamically.
        const basePath = `https://${domain}`;
        const isDev = basePath.includes('localhost') || basePath.includes('127.0.0.1');

        // Preload CSS early so it's ready when the JS finishes.
        const cssLink = document.createElement('link');

        cssLink.rel = 'stylesheet';
        cssLink.href = `${basePath}/css/all.css`;
        document.head.appendChild(cssLink);

        // Helper to load a script and return a Promise.
        const loadScript = src => new Promise((resolve, reject) => {
            const s = document.createElement('script');

            s.src = src;
            s.async = false;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`[EmbeddedAPI] Failed to load ${src}`));
            document.head.appendChild(s);
        });

        // Load lib-jitsi-meet first (app.bundle.js depends on it),
        // then load the app bundle.
        loadScript(`${basePath}/libs/lib-jitsi-meet.min.js`)
            .then(() => loadScript(`${basePath}/libs/${isDev ? 'app.bundle.js' : 'app.bundle.min.js'}`))
            .then(() => this._waitForGlobalNS(renderApp))
            .catch(err => console.error(err.message));
    }

    /**
     * Waits for the JitsiMeetJS.app global namespace to become available,
     * then calls the callback. Checks every 50ms, gives up after 50 tries
     * (~2.5 seconds).
     *
     * @param {Function} callback - Called once the namespace is ready.
     * @returns {void}
     * @private
     */
    _waitForGlobalNS(callback) {
        let attempts = 0;

        const poll = () => {
            if (window.JitsiMeetJS?.app?.renderEntryPoint) {
                callback();

                return;
            }

            attempts++;

            if (attempts >= 50) {
                console.error('[EmbeddedAPI] Timed out waiting for app namespace.');

                return;
            }

            setTimeout(poll, 50);
        };

        poll();
    }

    /**
     * Sets the size of the container element.
     *
     * @param {number|string} height - The height.
     * @param {number|string} width - The width.
     * @returns {void}
     * @private
     */
    _setSize(height, width) {
        const parsedHeight = parseSizeParam(height);
        const parsedWidth = parseSizeParam(width);

        if (parsedHeight !== undefined) {
            this._height = height;
            this._container.style.height = parsedHeight;
        }

        if (parsedWidth !== undefined) {
            this._width = width;
            this._container.style.width = parsedWidth;
        }
    }

    /**
     * Sets up listeners on the transport for events from the Jitsi app.
     * This is the same logic as in external_api.js.
     *
     * @returns {void}
     * @private
     */
    _setupListeners() {
        this._transport.on('event', ({ name, ...data }) => {
            const userID = data.id;

            switch (name) {
            case 'ready': {
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
}
