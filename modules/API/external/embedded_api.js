import EventEmitter from 'events';

import { commands, events } from './apiNameMaps';

/**
 * The id of the element the Jitsi Meet application is rendered into.
 */
const ROOT_ELEMENT_ID = 'jitsiEmbeddedRoot';

/**
 * Loads a script by appending a script element to the page.
 *
 * @param {string} src - The source of the script.
 * @returns {Promise<void>}
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Loads a stylesheet by appending a link element to the page.
 *
 * @param {string} href - The location of the stylesheet.
 * @returns {void}
 */
function loadStylesheet(href) {
    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * The embedded (no-iframe) API interface class.
 *
 * Unlike {@code JitsiMeetExternalAPI}, which loads the application in an
 * iframe and talks to it over postMessage, this class mounts the application
 * directly into an element of the host page and communicates with it through
 * direct function calls - no transport is involved. Commands and requests are
 * served by the very same handlers in modules/API/API.js that serve the
 * iframe API, so the two APIs are in feature parity by construction.
 *
 * KNOWN LIMITATION: the host page must be served by the Jitsi Meet deployment
 * itself (or the deployment's config.js, CSS, bundles, language files and
 * workers must be reachable from the host page's origin). Cross-origin
 * embedding is not supported yet.
 */
export default class JitsiMeetEmbeddedAPI extends EventEmitter {
    /**
     * Constructs a new API instance and starts loading the application into
     * the host page.
     *
     * @param {Object} options - Options.
     * @param {HTMLElement} options.parentNode - The element the application
     * is rendered into. Required.
     * @param {string} options.roomName - The name of the room to join.
     * Required, since in embedded mode the room cannot be derived from the
     * URL of the page.
     * @param {string} [options.baseUrl=''] - The base URL the deployment
     * assets (config.js, css, bundles) are loaded from. Only same-origin (or
     * CORS-enabled) deployments are supported.
     * @param {Object} [options.configOverwrite] - Overrides for config.js.
     * Unlike the iframe API no whitelist filtering is applied - the host page
     * runs in the same JavaScript context and is fully trusted by definition.
     * @param {Object} [options.interfaceConfigOverwrite] - Overrides for
     * interface_config.js.
     */
    constructor({
        parentNode,
        roomName,
        baseUrl = '',
        configOverwrite = {},
        interfaceConfigOverwrite = {}
    } = {}) {
        super();

        if (!parentNode || !roomName) {
            throw new Error('JitsiMeetEmbeddedAPI: parentNode and roomName are required');
        }

        this._parentNode = parentNode;
        this._onApiEvent = this._onApiEvent.bind(this);
        this._ready = this._load({
            baseUrl,
            configOverwrite,
            interfaceConfigOverwrite,
            roomName
        });

        // Command shortcuts: api.toggleAudio(), api.hangup(), etc.
        for (const name of Object.keys(commands)) {
            if (!(name in this)) {
                this[name] = (...args) => this.executeCommand(name, ...args);
            }
        }
    }

    /**
     * Loads the application into the host page: first the deployment
     * configuration, then styles and bundles; then renders the app and waits
     * for its API to become ready.
     *
     * @param {Object} options - The subset of the constructor options that
     * drive the loading.
     * @returns {Promise<void>}
     * @private
     */
    async _load({ baseUrl, configOverwrite, interfaceConfigOverwrite, roomName }) {
        // Signal embedded mode to the app bundle. Read by
        // modules/API/constants.js (EMBEDDED_MODE) and by
        // react/features/base/config/getRoomName.ts before anything else runs.
        window._jitsiMeetEmbeddedMode = true;
        window._jitsiMeetEmbeddedRoomName = roomName;

        // The deployment's generated configuration. This is why the host page
        // currently has to be served by (or have CORS access to) the
        // deployment: these files only exist there.
        await loadScript(`${baseUrl}/config.js`);
        await loadScript(`${baseUrl}/interface_config.js`);

        // The host page runs in the same context, so unlike the iframe API
        // the overrides are applied directly, without whitelist filtering.
        Object.assign(window.config, configOverwrite);
        window.interfaceConfig = Object.assign(window.interfaceConfig || {}, interfaceConfigOverwrite);

        loadStylesheet(`${baseUrl}/css/all.css`);
        window.EXCALIDRAW_ASSET_PATH = `${baseUrl}/libs/`;

        await loadScript(`${baseUrl}/libs/lib-jitsi-meet.min.js`);
        await loadScript(`${baseUrl}/libs/app.bundle.min.js`);

        const root = document.createElement('div');

        root.id = ROOT_ELEMENT_ID;
        root.style.height = '100%';
        root.style.width = '100%';
        this._parentNode.appendChild(root);

        // window.APP and APP.API exist as soon as the app bundle has been
        // evaluated. Bridge the events before rendering so that nothing
        // (including 'ready') is missed.
        window.APP.API.onEvent(this._onApiEvent);

        const readyPromise = new Promise(resolve => {
            this.once('ready', resolve);
        });

        window.JitsiMeetJS.app.renderEntryPoint({
            Component: window.JitsiMeetJS.app.entryPoints.APP,
            elementId: ROOT_ELEMENT_ID
        });

        await readyPromise;
    }

    /**
     * Re-emits an application event under its public (camelCase) name, so the
     * host page can use the exact same event names it would use with
     * {@code JitsiMeetExternalAPI}.
     *
     * @param {Object} event - The event; its name property identifies it.
     * @returns {void}
     * @private
     */
    _onApiEvent(event) {
        const name = events[event.name];

        if (name) {
            this.emit(name, event);
        }
    }

    /**
     * Returns a promise that resolves once the application has been loaded
     * and its API is ready to be used.
     *
     * @returns {Promise<void>}
     */
    ready() {
        return this._ready;
    }

    /**
     * Executes a command. The names and arguments are identical to the ones
     * accepted by {@code JitsiMeetExternalAPI#executeCommand}, but the
     * command is executed with a direct function call instead of a
     * postMessage round trip.
     *
     * @param {string} name - The name of the command.
     * @param {...*} args - The arguments for the command.
     * @returns {void}
     */
    executeCommand(name, ...args) {
        if (!(name in commands)) {
            throw new Error(`Unsupported command: ${name}`);
        }

        window.APP.API.executeCommand(commands[name], ...args);
    }

    /**
     * Executes commands. The names and values of the commands are passed as
     * object properties - same contract as
     * {@code JitsiMeetExternalAPI#executeCommands}.
     *
     * @param {Object} commandList - The object with the commands to be
     * executed.
     * @returns {void}
     */
    executeCommands(commandList) {
        for (const key of Object.keys(commandList)) {
            this.executeCommand(key, commandList[key]);
        }
    }

    /**
     * Sends a request to the application and resolves with the result. This
     * is the direct-call counterpart of the request/response pairs of the
     * iframe API and resolves with the exact same payloads.
     *
     * @param {Object} request - The request object. The name property
     * identifies the request; any other properties are request-specific.
     * @returns {Promise<*>}
     */
    sendRequest(request) {
        return window.APP.API.executeRequest(request);
    }

    /**
     * Returns whether the local audio is muted.
     *
     * @returns {Promise<boolean>}
     */
    isAudioMuted() {
        return this.sendRequest({ name: 'is-audio-muted' });
    }

    /**
     * Returns whether the local video is muted.
     *
     * @returns {Promise<boolean>}
     */
    isVideoMuted() {
        return this.sendRequest({ name: 'is-video-muted' });
    }

    /**
     * Returns whether the connection is currently peer to peer.
     *
     * @returns {Promise<boolean>}
     */
    isP2pActive() {
        return this.sendRequest({ name: 'get-p2p-status' });
    }

    /**
     * Removes the embedded application from the page.
     *
     * KNOWN LIMITATION: the application bundle registers page-level resources
     * (globals, styles, keyboard shortcuts) that are not fully reclaimed yet,
     * so disposing an instance and creating a new one on the same page is not
     * supported.
     *
     * @returns {void}
     */
    dispose() {
        try {
            this.executeCommand('hangup');
        } catch (error) {
            // The application may not have finished loading yet - there is
            // nothing to hang up in that case.
        }

        window.APP?.API?.offEvent(this._onApiEvent);
        document.getElementById(ROOT_ELEMENT_ID)?.remove();
        this.removeAllListeners();
    }
}
