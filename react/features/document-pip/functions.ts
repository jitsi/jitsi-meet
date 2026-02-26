/**
 * Checks if the Document Picture-in-Picture API is supported by the browser.
 * Currently only available in Chromium-based browsers (Chrome/Edge 116+).
 *
 * @returns {boolean} Whether Document PiP is supported.
 */
export function isDocumentPiPSupported(): boolean {
    return "documentPictureInPicture" in window;
}
