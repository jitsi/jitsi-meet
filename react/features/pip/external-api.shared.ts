/**
 * Shared utilities for PiP feature used by external_api.js.
 *
 * IMPORTANT: Keep this file minimal with no heavy dependencies.
 * It's bundled into external_api.min.js and we want to keep that bundle slim.
 * Only import lightweight modules here.
 */

/**
 * Checks if current environment is Electron.
 * Inline check to avoid importing BrowserDetection and its ua-parser dependency.
 *
 * @returns {boolean} - True if running in Electron.
 */
function isElectron(): boolean {
    return navigator.userAgent.includes('Electron');
}

/**
 * Checks if the browser supports the native (video element) Picture-in-Picture API.
 * Inline check to keep this file lightweight (no BrowserDetection dependency).
 *
 * @returns {boolean} - True if Picture-in-Picture is supported and not disabled by the UA.
 */
function isVideoPiPSupported(): boolean {
    return typeof document !== 'undefined'
        && 'pictureInPictureEnabled' in document
        && document.pictureInPictureEnabled === true;
}

/**
 * Checks if the browser supports the Document Picture-in-Picture API (rich, always-on-top
 * HTML window, as used by Google Meet). Available on Chromium and Firefox 151+ desktop.
 *
 * @returns {boolean} - True if the Document PiP API is available.
 */
export function isDocumentPiPSupported(): boolean {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

/**
 * Checks if PiP is enabled based on config and environment.
 *
 * @param {Object} pipConfig - The pip config object.
 * @returns {boolean} - True if PiP is enabled.
 */
export function isPiPEnabled(pipConfig?: { disabled?: boolean; }): boolean {
    if (pipConfig?.disabled) {
        return false;
    }

    return isElectron() || isVideoPiPSupported() || isDocumentPiPSupported();
}
