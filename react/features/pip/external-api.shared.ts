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
 * Honors the config it is given, but when `enableBrowserPiP` is absent it deliberately stays
 * permissive: the external API evaluates this against only the embedder-provided config, never
 * the deployment's server-side config, so applying the opt-in default here would silently
 * disable embedded auto-PiP for deployments that opt in server-side. The authoritative opt-in
 * default (an absent flag counts as disabled) is applied by `shouldShowPiP()` inside the client,
 * where the merged config is available — an over-approximating embedder only costs a no-op
 * show-PiP request that the client refuses.
 *
 * @param {Object} pipConfig - The pip config object.
 * @returns {boolean} - True if PiP is enabled.
 */
export function isPiPEnabled(pipConfig?: { disabled?: boolean; enableBrowserPiP?: boolean; }): boolean {
    if (pipConfig?.disabled) {
        return false;
    }

    if (isElectron()) {
        return true;
    }

    if (pipConfig?.enableBrowserPiP === false) {
        return false;
    }

    return 'documentPictureInPicture' in window
        || Boolean(document.pictureInPictureEnabled);
}

/**
 * Checks whether host-assisted Document PiP is explicitly enabled.
 * A missing embedMode is disabled for backwards compatibility.
 *
 * @param {Object} pipConfig - The pip config object.
 * @returns {boolean} - True if embedded Document PiP is enabled.
 */
export function isEmbeddedDocumentPiPEnabled(pipConfig?: {
    disableEmbedPiP?: boolean;
}): boolean {
    return pipConfig?.disableEmbedPiP != true;
}
