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
 * Checks if PiP is enabled based on config and environment.
 *
 * @param {Object} pipConfig - The pip config object.
 * @returns {boolean} - True if PiP is enabled.
 */
export function isPiPEnabled(pipConfig?: {
    disabled?: boolean;
    documentPiP?: {
        embedMode?: 'auto' | 'disabled';
    };
}): boolean {
    if (pipConfig?.disabled) {
        return false;
    }

    return isElectron() || isEmbeddedDocumentPiPEnabled(pipConfig);
}

/**
 * Checks whether host-assisted Document PiP is explicitly enabled.
 * A missing embedMode is disabled for backwards compatibility.
 *
 * @param {Object} pipConfig - The pip config object.
 * @returns {boolean} - True if embedded Document PiP is enabled.
 */
export function isEmbeddedDocumentPiPEnabled(pipConfig?: {
    disabled?: boolean;
    documentPiP?: {
        embedMode?: 'auto' | 'disabled';
    };
}): boolean {
    return pipConfig?.disabled !== true && pipConfig?.documentPiP?.embedMode === 'auto';
}

export const DOCUMENT_PIP_TRANSPORT_SCOPE = 'jitsi_document_pip_renderer';
