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
 * Document Picture-in-Picture types.
 */

declare global {
    interface IDocumentPiPMediaSessionActionDetails {
        action: 'enterpictureinpicture';
        enterPictureInPictureReason?: 'contentoccluded' | 'useraction';
    }

    type DocumentPiPMediaSessionActionHandler = (
        details: IDocumentPiPMediaSessionActionDetails
    ) => void;

    interface IDocumentPictureInPicture {
        addEventListener: (
            type: 'enter' | 'leave',
            listener: ((event: IDocumentPictureInPictureEvent) => void) | ((event: Event) => void)
        ) => void;
        requestWindow: (options?: IDocumentPictureInPictureOptions) => Promise<Window>;
        readonly window: Window | null;
    }

    interface IDocumentPictureInPictureOptions {
        disallowReturnToOpener?: boolean;
        height?: number;
        preferInitialWindowPlacement?: boolean;
        width?: number;
    }

    interface IDocumentPictureInPictureEvent extends Event {
        readonly window: Window;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        documentPictureInPicture?: IDocumentPictureInPicture;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface MediaSession {
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        setActionHandler(
            action: 'hangup' | 'togglecamera' | 'togglemicrophone',
            handler: MediaSessionActionHandler | null
        ): void;
        // eslint-disable-next-line @typescript-eslint/method-signature-style
        setActionHandler(
            action: 'enterpictureinpicture',
            handler: DocumentPiPMediaSessionActionHandler | null
        ): void;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface HTMLVideoElement {
        requestPictureInPicture: () => Promise<PictureInPictureWindow>;
    }
}
