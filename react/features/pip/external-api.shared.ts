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
export function isPiPEnabled(pipConfig?: { disabled?: boolean; }): boolean {
    if (pipConfig?.disabled) {
        return false;
    }

    return isElectron();
}
