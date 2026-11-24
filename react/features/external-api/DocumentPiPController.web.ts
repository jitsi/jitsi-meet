import type { MediaCastSignal } from '../base/media-cast/types.web';
import { DEFAULT_DOCUMENT_PIP_HEIGHT, DEFAULT_DOCUMENT_PIP_WIDTH } from '../pip/constants';
import type { IDocumentPictureInPictureOptions } from '../pip/types';

/**
 * Renderer bundle loaded into the host-owned Document PiP window.
 */
const DOCUMENT_PIP_SCRIPT = 'libs/documentpip.min.js';

/**
 * Application stylesheet loaded into the host-owned Document PiP window.
 */
const DOCUMENT_PIP_STYLESHEET = 'css/all.css';

/**
 * Options for constructing a {@link DocumentPiPController}.
 */
interface IDocumentPiPControllerOptions {
    /**
     * The JitsiMeetExternalAPI instance; exposed to the renderer bundle through window.alwaysOnTop.
     */
    api: any;

    /**
     * The iframe hosting the meeting; used to derive the renderer bundle base URL.
     */
    frame: HTMLIFrameElement;

    /**
     * The URL of the meeting iframe, used as the fallback base URL for the renderer bundle.
     */
    meetingUrl: string;

    /**
     * The transport used to send host commands back to the meeting iframe.
     */
    transport: any;

    /**
     * The Document PiP window options supplied by the embedder, if any.
     */
    windowOptions?: IDocumentPictureInPictureOptions;
}

/**
 * Owns the top-level portion of embedded Document Picture-in-Picture.
 *
 * The iframe learns the outcome of every open request exclusively through the 'opened' or
 * 'open-failed' host commands, so every exit path of {@link open} must answer with one of them.
 */
export default class DocumentPiPController {
    /**
     * The currently resolving Document PiP window request, if any.
     */
    private _pendingRequest?: Promise<Window>;

    /**
     * The currently open Document PiP window, if any.
     */
    private _pipWindow?: Window;

    /**
     * Whether the renderer bundle has loaded in the active Document PiP window.
     */
    private _rendererReady = false;

    /**
     * Immutable dependencies and configuration supplied by the owning External API instance.
     */
    private _options: IDocumentPiPControllerOptions;

    /**
     * Creates a controller with private per-API lifecycle state.
     *
     * @param {IDocumentPiPControllerOptions} options - Configuration for the controller.
     */
    constructor(options: IDocumentPiPControllerOptions) {
        this._options = options;
    }

    /**
     * Opens and initializes a Document PiP window. Every exit path answers the iframe with
     * either the 'opened' or the 'open-failed' command so a request never goes unanswered.
     *
     * @returns {Promise<void>}
     */
    async open(): Promise<void> {
        if (this._pendingRequest || this._pipWindow) {
            // A session is already owned. Answer so the iframe never waits forever: a live
            // ready window is 'opened'; an unresolved or initializing request is 'open-failed'.
            this._sendCommand(this._pipWindow && this._rendererReady ? 'opened' : 'open-failed');

            return;
        }

        const documentPiP = window.documentPictureInPicture;

        if (!documentPiP) {
            this._sendCommand('open-failed');

            return;
        }

        let newPiPWindow: Window | undefined;
        let request: Promise<Window> | undefined;

        try {
            // Toolbar clicks and Chrome's automatic PiP callback preserve activation across the
            // iframe transport hop. Visibility-only IntersectionObserver requests may be rejected
            // because scrolling does not create transient user activation; that failure is reported below.
            request = documentPiP.requestWindow({
                height: DEFAULT_DOCUMENT_PIP_HEIGHT,
                width: DEFAULT_DOCUMENT_PIP_WIDTH,
                ...this._options.windowOptions
            });
            this._pendingRequest = request;

            newPiPWindow = await request;

            if (this._pendingRequest !== request) {
                // A close was requested while the window was resolving; closeSession() already
                // acknowledged it with the 'closed' command, so do not double-acknowledge here.
                newPiPWindow.close();

                return;
            }

            this._pendingRequest = undefined;
            this._pipWindow = newPiPWindow;
            this._initializeWindow(newPiPWindow);
        } catch (error) {
            // A cleared pending request with no matching window means close() already cancelled
            // and acknowledged this operation. Otherwise this request still owns the failure.
            const ownsPendingRequest = !request || this._pendingRequest === request;
            const ownsPiPWindow = Boolean(newPiPWindow && this._pipWindow === newPiPWindow);

            if (ownsPendingRequest || ownsPiPWindow) {
                this._pendingRequest = undefined;
                this._closeSession(false);
                this._sendCommand('open-failed');
            }

            throw error;
        }
    }

    /**
     * Closes an active or pending PiP session and acknowledges the close once.
     *
     * @returns {void}
     */
    close(): void {
        this._closeSession(true);
    }

    /**
     * Forwards a media-cast signal from the Document PiP renderer to the meeting iframe.
     *
     * @param {MediaCastSignal} signal - Answer, candidate, restart, or stop signal.
     * @returns {void}
     */
    sendSignal(signal: MediaCastSignal): void {
        this._sendCommand('signal', signal);
    }

    /**
     * Sends an internal host command to the embedded meeting iframe.
     *
     * @param {string} name - Command name, e.g. 'opened', 'open-failed', 'closed' or 'signal'.
     * @param {any} [data] - Optional command payload.
     * @returns {void}
     */
    private _sendCommand(name: string, data?: any): void {
        this._options.transport.sendEvent({
            data: data === undefined ? [] : [ data ],
            name: `document-pip-${name}`
        });
    }

    /**
     * Tears down the active or pending session, closing any live window and optionally
     * acknowledging the close to the iframe.
     *
     * @param {boolean} notify - Whether to send the 'closed' command when a session existed.
     * @returns {void}
     */
    private _closeSession(notify: boolean): void {
        const hadSession = Boolean(this._pendingRequest || this._pipWindow);
        const activeWindow = this._pipWindow;

        this._pendingRequest = undefined;
        this._pipWindow = undefined;
        this._rendererReady = false;

        if (activeWindow && !activeWindow.closed) {
            activeWindow.close();
        }

        if (notify && hadSession) {
            this._sendCommand('closed');
        }
    }

    /**
     * Initializes a freshly opened PiP window: copies the stylesheet, seeds the container markup,
     * exposes the embedder API to the renderer bundle and loads libs/documentpip.min.js. The
     * renderer's load success or failure is reported back as the 'opened' or 'open-failed' command.
     *
     * @param {Window} newPiPWindow - The Document PiP window to initialize.
     * @returns {void}
     */
    private _initializeWindow(newPiPWindow: Window): void {
        let baseURL = new URL('/', this._options.meetingUrl).href;

        try {
            // For a cross-origin meeting frame contentDocument is always null, so the URL-derived
            // fallback is what we use in practice; the <base> lookup only matters for same-origin
            // deployments. Deployments that serve files from a versioned CDN therefore load the
            // fallback URL, so it must resolve to the same release as the iframe — otherwise the
            // PiP window loads a 404 or a bundle from a different release.
            const base = this._options.frame.contentDocument?.querySelector('base');

            if (base) {
                baseURL = base.href;
            }
        } catch {
            // Cross-origin meeting iframes use the URL-derived fallback.
        }

        const pipDocument = newPiPWindow.document;
        const link = pipDocument.createElement('link');
        const script = pipDocument.createElement('script');

        link.href = new URL(DOCUMENT_PIP_STYLESHEET, baseURL).href;
        link.rel = 'stylesheet';
        pipDocument.head.appendChild(link);

        pipDocument.body.innerHTML
            = '<div class="videocontainer" id="react" style="height:100%"></div>';

        newPiPWindow.alwaysOnTop = { api: this._options.api };

        newPiPWindow.addEventListener('pagehide', () => {
            if (this._pipWindow === newPiPWindow) {
                this._closeSession(true);
            }
        }, { once: true });

        script.addEventListener('load', () => {
            if (this._pipWindow === newPiPWindow) {
                this._rendererReady = true;
                this._sendCommand('opened');
            }
        }, { once: true });
        script.addEventListener('error', () => {
            if (this._pipWindow === newPiPWindow) {
                this._closeSession(false);
                this._sendCommand('open-failed');
                console.error('Document PiP renderer failed to load.');
            }
        }, { once: true });
        script.src = new URL(DOCUMENT_PIP_SCRIPT, baseURL).href;
        pipDocument.body.appendChild(script);
    }
}
