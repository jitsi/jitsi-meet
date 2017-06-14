import EventEmitter from 'events';

import {
    PostMessageTransportBackend,
    Transport
} from '../../transport';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Maps the names of the commands expected by the API with the name of the
 * commands expected by jitsi-meet
 */
const commands = {
    avatarUrl: 'avatar-url',
    displayName: 'display-name',
    email: 'email',
    hangup: 'video-hangup',
    toggleAudio: 'toggle-audio',
    toggleChat: 'toggle-chat',
    toggleContactList: 'toggle-contact-list',
    toggleFilmStrip: 'toggle-film-strip',
    toggleShareScreen: 'toggle-share-screen',
    toggleVideo: 'toggle-video'
};

/**
 * Maps the names of the events expected by the API with the name of the
 * events expected by jitsi-meet
 */
const events = {
    'display-name-change': 'displayNameChange',
    'incoming-message': 'incomingMessage',
    'outgoing-message': 'outgoingMessage',
    'participant-joined': 'participantJoined',
    'participant-left': 'participantLeft',
    'video-ready-to-close': 'readyToClose',
    'video-conference-joined': 'videoConferenceJoined',
    'video-conference-left': 'videoConferenceLeft'
};

/**
 * Last id of api object
 * @type {number}
 */
let id = 0;

/**
 * The minimum height for the Jitsi Meet frame
 * @type {number}
 */
const MIN_HEIGHT = 300;

/**
 * The minimum width for the Jitsi Meet frame
 * @type {number}
 */
const MIN_WIDTH = 790;

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
    APIInstance.numberOfParticipants += number;
}

/**
 * Generates array with URL params based on the passed config object that will
 * be used for the Jitsi Meet URL generation.
 *
 * @param {Object} config - The config object.
 * @returns {Array<string>} The array with URL param strings.
 */
function configToURLParamsArray(config = {}) {
    const params = [];

    for (const key in config) { // eslint-disable-line guard-for-in
        try {
            params.push(
                `${key}=${encodeURIComponent(JSON.stringify(config[key]))}`);
        } catch (e) {
            console.warn(`Error encoding ${key}: ${e}`);
        }
    }

    return params;
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
 * @param {boolean} [options.noSsl] - If the value is true https won't be used.
 * @param {string} [options.roomName] - The name of the room to join.
 * @returns {string} The URL.
 */
function generateURL(domain, options = {}) {
    const {
        configOverwrite,
        interfaceConfigOverwrite,
        jwt,
        noSSL,
        roomName
    } = options;

    let url = `${noSSL ? 'http' : 'https'}://${domain}/${roomName || ''}`;

    if (jwt) {
        url += `?jwt=${jwt}`;
    }

    url += `#jitsi_meet_external_api_id=${id}`;

    const configURLParams = configToURLParamsArray(configOverwrite);

    if (configURLParams.length) {
        url += `&config.${configURLParams.join('&config.')}`;
    }

    const interfaceConfigURLParams
        = configToURLParamsArray(interfaceConfigOverwrite);

    if (interfaceConfigURLParams.length) {
        url += `&interfaceConfig.${
            interfaceConfigURLParams.join('&interfaceConfig.')}`;
    }

    return url;
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
     * @param {string} [roomName] - The name of the room to join.
     * @param {number} [width] - Width of the iframe.
     * @param {number} [height] - Height of the iframe.
     * @param {DOMElement} [parentNode] - The node that will contain the
     * iframe.
     * @param {Object} [configOverwrite] - Object containing configuration
     * options defined in config.js to be overridden.
     * @param {Object} [interfaceConfigOverwrite] - Object containing
     * configuration options defined in interface_config.js to be overridden.
     * @param {boolean} [noSSL] - If the value is true https won't be used.
     * @param {string} [jwt] - The JWT token if needed by jitsi-meet for
     * authentication.
     */
    constructor(domain, // eslint-disable-line max-params
        roomName = '',
        width = MIN_WIDTH,
        height = MIN_HEIGHT,
        parentNode = document.body,
        configOverwrite = {},
        interfaceConfigOverwrite = {},
        noSSL = false,
        jwt = undefined) {
        super();
        this.parentNode = parentNode;
        this.url = generateURL(domain, {
            configOverwrite,
            interfaceConfigOverwrite,
            jwt,
            noSSL,
            roomName
        });
        this._createIFrame(Math.max(height, MIN_HEIGHT),
            Math.max(width, MIN_WIDTH));
        this._transport = new Transport({
            backend: new PostMessageTransportBackend({
                postisOptions: {
                    scope: `jitsi_meet_external_api_${id}`,
                    window: this.frame.contentWindow
                }
            })
        });
        this.numberOfParticipants = 1;
        this._setupListeners();
        id++;
    }

    /**
     * Creates the iframe element.
     *
     * @param {number} height - The height of the iframe.
     * @param {number} width - The with of the iframe.
     * @returns {void}
     *
     * @private
     */
    _createIFrame(height, width) {
        this.iframeHolder
            = this.parentNode.appendChild(document.createElement('div'));
        this.iframeHolder.id = `jitsiConference${id}`;
        this.iframeHolder.style.width = `${width}px`;
        this.iframeHolder.style.height = `${height}px`;

        this.frameName = `jitsiConferenceFrame${id}`;

        this.frame = document.createElement('iframe');
        this.frame.src = this.url;
        this.frame.name = this.frameName;
        this.frame.id = this.frameName;
        this.frame.width = '100%';
        this.frame.height = '100%';
        this.frame.setAttribute('allowFullScreen', 'true');
        this.frame = this.iframeHolder.appendChild(this.frame);
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
            if (name === 'participant-joined') {
                changeParticipantNumber(this, 1);
            } else if (name === 'participant-left') {
                changeParticipantNumber(this, -1);
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
        if (this.iframeHolder) {
            this.iframeHolder.parentNode.removeChild(this.iframeHolder);
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
     * toggleContactList - hides / shows contact list. no arguments.
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
     * Returns the number of participants in the conference. The local
     * participant is included.
     *
     * @returns {int} The number of participants in the conference.
     */
    getNumberOfParticipants() {
        return this.numberOfParticipants;
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
}
