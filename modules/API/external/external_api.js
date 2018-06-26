import EventEmitter from 'events';

import { urlObjectToString } from '../../../react/features/base/util/uri';
import {
    PostMessageTransportBackend,
    Transport
} from '../../transport';

import electronPopupsConfig from './electronPopupsConfig.json';

const logger = require('jitsi-meet-logger').getLogger(__filename);

const ALWAYS_ON_TOP_FILENAMES = [
    'css/all.css', 'libs/alwaysontop.min.js'
];

/**
 * Maps the names of the commands expected by the API with the name of the
 * commands expected by jitsi-meet
 */
const commands = {
    avatarUrl: 'avatar-url',
    displayName: 'display-name',
    email: 'email',
    hangup: 'video-hangup',
    submitFeedback: 'submit-feedback',
    toggleAudio: 'toggle-audio',
    toggleChat: 'toggle-chat',
    toggleFilmStrip: 'toggle-film-strip',
    toggleShareScreen: 'toggle-share-screen',
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
    'display-name-change': 'displayNameChange',
    'email-change': 'emailChange',
    'feedback-submitted': 'feedbackSubmitted',
    'incoming-message': 'incomingMessage',
    'outgoing-message': 'outgoingMessage',
    'participant-joined': 'participantJoined',
    'participant-left': 'participantLeft',
    'video-ready-to-close': 'readyToClose',
    'video-conference-joined': 'videoConferenceJoined',
    'video-conference-left': 'videoConferenceLeft',
    'video-availability-changed': 'videoAvailabilityChanged',
    'video-mute-status-changed': 'videoMuteStatusChanged',
    'screen-sharing-status-changed': 'screenSharingStatusChanged'
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
 * @param {boolean} [options.noSSL] - If the value is true https won't be used.
 * @param {string} [options.roomName] - The name of the room to join.
 * @returns {string} The URL.
 */
function generateURL(domain, options = {}) {
    return urlObjectToString({
        ...options,
        url:
            `${options.noSSL ? 'http' : 'https'}://${
                domain}/#jitsi_meet_external_api_id=${id}`
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
    case undefined: // eslint-disable-line no-case-declarations
    // not sure which format but we are trying to parse the old
    // format because if the new format is used everything will be undefined
    // anyway.
        const [
            roomName,
            width,
            height,
            parentNode,
            configOverwrite,
            interfaceConfigOverwrite,
            noSSL,
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
            noSSL,
            jwt,
            onload
        };
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
     * @param {boolean} [options.noSSL] - If the value is true https won't be
     * used.
     * @param {string} [options.jwt] - The JWT token if needed by jitsi-meet for
     * authentication.
     * @param {string} [options.onload] - The onload function that will listen
     * for iframe onload event.
     * @param {Array<Object>} [options.invitees] - Array of objects containing
     * information about new participants that will be invited in the call.
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
            noSSL = false,
            jwt = undefined,
            onload = undefined,
            invitees
        } = parseArguments(args);

        this._parentNode = parentNode;
        this._url = generateURL(domain, {
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            noSSL,
            roomName
        });
        this._createIFrame(height, width, onload);
        this._transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: {
                    scope: `jitsi_meet_external_api_${id}`,
                    window: this._frame.contentWindow
                }
            })
        });
        this.invite(invitees);
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
        this._frame.allow = 'camera; microphone';
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
            this._frame.style.height = parsedHeight;
        }

        if (parsedWidth !== undefined) {
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
            case 'video-conference-joined':
                this._myUserID = userID;
                this._participants[userID] = {
                    avatarURL: data.avatarURL
                };

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
     * incomingMessage - receives event notifications about incoming
     * messages. The listener will receive object with the following structure:
     * {{
     *  'from': from,//JID of the user that sent the message
     *  'nick': nick,//the nickname of the user that sent the message
     *  'message': txt//the text of the message
     * }}
     * outgoingMessage - receives event notifications about outgoing
     * messages. The listener will receive object with the following structure:
     * {{
     *  'message': txt//the text of the message
     * }}
     * displayNameChanged - receives event notifications about display name
     * change. The listener will receive object with the following structure:
     * {{
     * jid: jid,//the JID of the participant that changed his display name
     * displayname: displayName //the new display name
     * }}
     * participantJoined - receives event notifications about new participant.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * participantLeft - receives event notifications about the participant that
     * left the room.
     * The listener will receive object with the following structure:
     * {{
     * jid: jid //the jid of the participant
     * }}
     * video-conference-joined - receives event notifications about the local
     * user has successfully joined the video conference.
     * The listener will receive object with the following structure:
     * {{
     * roomName: room //the room name of the conference
     * }}
     * video-conference-left - receives event notifications about the local user
     * has left the video conference.
     * The listener will receive object with the following structure:
     * {{
     * roomName: room //the room name of the conference
     * }}
     * screenSharingStatusChanged - receives event notifications about
     * turning on/off the local user screen sharing.
     * The listener will receive object with the following structure:
     * {{
     * on: on //whether screen sharing is on
     * }}
     * readyToClose - all hangup operations are completed and Jitsi Meet is
     * ready to be disposed.
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
     * Removes the listeners and removes the Jitsi Meet frame.
     *
     * @returns {void}
     */
    dispose() {
        this._transport.dispose();
        this.removeAllListeners();
        if (this._frame) {
            this._frame.parentNode.removeChild(this._frame);
        }
    }

    /**
     * Executes command. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * toggleAudio - mutes / unmutes audio with no arguments.
     * toggleVideo - mutes / unmutes video with no arguments.
     * toggleFilmStrip - hides / shows the filmstrip with no arguments.
     * If the command doesn't require any arguments the parameter should be set
     * to empty array or it may be omitted.
     *
     * @param {string} name - The name of the command.
     * @returns {void}
     */
    executeCommand(name, ...args) {
        if (!(name in commands)) {
            logger.error('Not supported command name.');

            return;
        }
        this._transport.sendEvent({
            data: args,
            name: commands[name]
        });
    }

    /**
     * Executes commands. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * toggleAudio - mutes / unmutes audio. no arguments
     * toggleVideo - mutes / unmutes video. no arguments
     * toggleFilmStrip - hides / shows the filmstrip. no arguments
     * toggleChat - hides / shows chat. no arguments.
     * toggleShareScreen - starts / stops screen sharing. no arguments.
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
     * Invite people to the call.
     *
     * @param {Array<Object>} invitees - The invitees.
     * @returns {Promise} - Resolves on success and rejects on failure.
     */
    invite(invitees) {
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
     * Returns the configuration for electron for the windows that are open
     * from Jitsi Meet.
     *
     * @returns {Promise<Object>}
     *
     * NOTE: For internal use only.
     */
    _getElectronPopupsConfig() {
        return Promise.resolve(electronPopupsConfig);
    }
}
