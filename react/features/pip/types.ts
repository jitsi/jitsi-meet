/**
 * MediaSession state for microphone and camera.
 */
export interface IMediaSessionState {
    /**
     * Whether the camera is active (unmuted).
     */
    cameraActive: boolean;

    /**
     * Whether the microphone is active (unmuted).
     */
    microphoneActive: boolean;
}

/**
 * Details supplied when MediaSession requests entering Document PiP.
 */
export interface IDocumentPiPMediaSessionActionDetails {
    /**
     * The MediaSession action being handled.
     */
    action: 'enterpictureinpicture';

    /**
     * The reason Document PiP was requested.
     */
    enterPictureInPictureReason?: 'contentoccluded' | 'useraction';
}

/**
 * Handles a MediaSession request to enter Document PiP.
 */
export type DocumentPiPMediaSessionActionHandler = (
    details: IDocumentPiPMediaSessionActionDetails
) => void;

/**
 * Options controlling user-facing failure handling when opening Document PiP.
 */
export interface IOpenDocumentPiPOptions {
    /**
     * Whether to show an error notification when opening the PiP window fails.
     */
    notifyOnFailure?: boolean;
}

/**
 * The browser's Document Picture-in-Picture API.
 */
export interface IDocumentPictureInPicture {
    /**
     * Registers a listener for Document PiP lifecycle events.
     */
    addEventListener: (
        type: 'enter' | 'leave',
        listener: ((event: IDocumentPictureInPictureEvent) => void) | ((event: Event) => void)
    ) => void;

    /**
     * Opens a Document PiP window using the supplied window options.
     */
    requestWindow: (options?: IDocumentPictureInPictureOptions) => Promise<Window>;

    /**
     * The currently open Document PiP window, if any.
     */
    readonly window: Window | null;
}

/**
 * Options used when requesting a Document PiP window.
 */
export interface IDocumentPictureInPictureOptions {
    /**
     * Whether the browser should hide its control for returning to the opener tab.
     */
    disallowReturnToOpener?: boolean;

    /**
     * The requested initial window height in CSS pixels.
     */
    height?: number;

    /**
     * Whether the browser should prefer the default placement over reusing the previous window position and size.
     */
    preferInitialWindowPlacement?: boolean;

    /**
     * The requested initial window width in CSS pixels.
     */
    width?: number;
}

/**
 * A Document PiP lifecycle event containing the associated PiP window.
 */
export interface IDocumentPictureInPictureEvent extends Event {
    /**
     * The Document PiP window associated with the event.
     */
    readonly window: Window;
}

/**
 * MediaSession actions supported by the PiP controls in addition to the standard action set.
 */
export type ExtendedMediaSessionAction = 'hangup' | 'togglecamera' | 'togglemicrophone';

/**
 * Details supplied to an extended MediaSession action handler.
 */
export interface IExtendedMediaSessionActionDetails {
    /**
     * The extended MediaSession action being handled.
     */
    action: ExtendedMediaSessionAction;
}

/**
 * Handles an extended MediaSession action used by the PiP controls.
 */
export type ExtendedMediaSessionActionHandler = (
    details: IExtendedMediaSessionActionDetails
) => void;

/**
 * WebKit video presentation modes used to enter and leave Safari's native Video PiP.
 */
export type WebKitPresentationMode = 'inline' | 'picture-in-picture';

/**
 * Safari's non-standard Video PiP additions to HTMLVideoElement.
 */
export interface IWebKitPictureInPictureVideoElement extends HTMLVideoElement {
    /**
     * The video's current WebKit presentation mode.
     */
    webkitPresentationMode?: WebKitPresentationMode;

    /**
     * Changes the video's WebKit presentation mode.
     */
    webkitSetPresentationMode?: (mode: WebKitPresentationMode) => void;

    /**
     * Returns whether the video currently supports the requested WebKit presentation mode.
     */
    webkitSupportsPresentationMode?: (mode: WebKitPresentationMode) => boolean;
}

/**
 * Internal WebRTC signaling shared by the meeting iframe and its embedding page.
 */
export type DocumentPiPSignal =
    | { description: RTCSessionDescriptionInit; generation: number; type: 'offer'; }
    | { description: RTCSessionDescriptionInit; generation: number; type: 'answer'; }
    | { candidate: RTCIceCandidateInit; generation: number; type: 'candidate'; }
    | { generation: number; type: 'restart'; };
