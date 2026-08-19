import { DEFAULT_DOCUMENT_PIP_HEIGHT, DEFAULT_DOCUMENT_PIP_WIDTH } from '../../../react/features/pip/constants';

const DOCUMENT_PIP_SCRIPT = 'libs/documentpip.min.js';
const DOCUMENT_PIP_STYLESHEET = 'css/all.css';

interface IDocumentPiPControllerOptions {
    api: any;
    frame: HTMLIFrameElement;
    getWindowOptions: () => {
        disallowReturnToOpener?: boolean;
        height?: number;
        preferInitialWindowPlacement?: boolean;
        width?: number;
    } | undefined;
    meetingUrl: string;
}

/**
 * Owns the top-level portion of embedded Document Picture-in-Picture.
 */
export default class DocumentPiPController {
    private _pendingRequest?: Promise<Window>;
    private _pipWindow?: Window;

    declare close: () => void;
    declare open: () => Promise<void>;

    /**
     * Returns whether the current top-level page can open Document PiP.
     *
     * @returns {boolean}
     */
    static isSupported(): boolean {
        return window === window.top && 'documentPictureInPicture' in window;
    }

    /**
     * Creates a controller with private per-API lifecycle state.
     */
    constructor({
        api,
        frame,
        getWindowOptions,
        meetingUrl
    }: IDocumentPiPControllerOptions) {
        const closeSession = (notify: boolean) => {
            const hadSession = Boolean(this._pendingRequest || this._pipWindow);
            const activeWindow = this._pipWindow;

            this._pendingRequest = undefined;
            this._pipWindow = undefined;

            if (activeWindow && !activeWindow.closed) {
                activeWindow.close();
            }

            if (notify && hadSession) {
                api._sendPiPEvent('closed');
            }
        };
        const initializeWindow = (newPiPWindow: Window) => {
            let baseURL = new URL('/', meetingUrl).href;

            try {
                baseURL = frame.contentDocument?.querySelector('base')?.href || baseURL;
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
                = '<div class="videocontainer" style="height:100%;position:relative;width:100%">'
                    + '<div id="react" style="height:100%;width:100%"></div></div>';

            newPiPWindow.alwaysOnTop = { api };

            newPiPWindow.addEventListener('pagehide', () => {
                if (this._pipWindow === newPiPWindow) {
                    closeSession(true);
                }
            }, { once: true });

            script.addEventListener('load', () => {
                if (this._pipWindow === newPiPWindow) {
                    api._sendPiPEvent('opened');
                }
            }, { once: true });
            script.addEventListener('error', () => {
                if (this._pipWindow === newPiPWindow) {
                    closeSession(false);
                    api._sendPiPEvent('open-failed');
                }
            }, { once: true });
            script.src = new URL(DOCUMENT_PIP_SCRIPT, baseURL).href;
            pipDocument.body.appendChild(script);
        };

        /**
         * Opens and initializes a Document PiP window if no request is active.
         *
         * @returns {Promise<void>}
         */
        this.open = async () => {
            if (this._pendingRequest || this._pipWindow) {
                return;
            }

            const documentPiP = window.documentPictureInPicture;

            if (!documentPiP) {
                return;
            }

            let request: Promise<Window> | undefined;

            try {
                // Toolbar clicks and Chrome's automatic PiP callback preserve activation across the
                // iframe transport hop. Visibility-only IntersectionObserver requests may be rejected
                // because scrolling does not create transient user activation; that failure is reported below.
                request = documentPiP.requestWindow({
                    height: DEFAULT_DOCUMENT_PIP_HEIGHT,
                    width: DEFAULT_DOCUMENT_PIP_WIDTH,
                    ...getWindowOptions()
                });
                this._pendingRequest = request;

                const newPiPWindow = await request;

                if (this._pendingRequest !== request) {
                    newPiPWindow.close();

                    return;
                }

                this._pendingRequest = undefined;
                this._pipWindow = newPiPWindow;
                initializeWindow(newPiPWindow);
            } catch (error) {
                if (!request || this._pendingRequest === request || this._pipWindow) {
                    this._pendingRequest = undefined;
                    closeSession(false);
                    api._sendPiPEvent('open-failed');
                }

                throw error;
            }
        };

        /**
         * Closes an active or pending PiP session and acknowledges the close once.
         *
         * @returns {void}
         */
        this.close = () => closeSession(true);
    }
}
