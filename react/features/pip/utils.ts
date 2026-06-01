/**
 * Document Picture-in-Picture utility functions.
 */

declare global {
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

    interface IWindow {
        documentPictureInPicture?: IDocumentPictureInPicture;
    }
}

export interface IDocPiPParticipant {
    id: string;
    isLocal: boolean;
    isPinned: boolean;
    name: string;
}

/**
 * Checks if the Document Picture-in-Picture API is supported.
 *
 * @returns {boolean} True if Document PiP is supported.
 */
export function isDocumentPiPSupported(): boolean {
    return 'documentPictureInPicture' in window;
}

/**
 * Gets the current Document PiP window if one is active.
 *
 * @returns {Window | null} The PiP window or null.
 */
export function getDocumentPiPWindow(): Window | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pip = (window as any).documentPictureInPicture as IDocumentPictureInPicture | undefined;

    return pip?.window ?? null;
}

/**
 * Checks if Document PiP window is currently open.
 *
 * @returns {boolean} True if PiP window is open.
 */
export function isDocumentPiPOpen(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pip = (window as any).documentPictureInPicture as IDocumentPictureInPicture | undefined;

    return pip?.window !== null && pip?.window !== undefined;
}
