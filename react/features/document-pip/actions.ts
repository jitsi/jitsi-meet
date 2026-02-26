import { IStore } from "../app/types";

import { SET_DOCUMENT_PIP_ACTIVE } from "./actionTypes";
import logger from "./logger";

/**
 * Module-level reference to the Document PiP window.
 * Stored here so the close action can access it without Redux.
 */
let pipWindow: Window | null = null;

/**
 * Returns the current Document PiP window reference.
 *
 * @returns {Window | null} The PiP window or null.
 */
export function getDocumentPiPWindow(): Window | null {
    return pipWindow;
}

/**
 * Action to set Document PiP active state.
 *
 * @param {boolean} isActive - Whether Document PiP is active.
 * @returns {{ type: string; isActive: boolean; }}
 */
export function setDocumentPiPActive(isActive: boolean) {
    return {
        type: SET_DOCUMENT_PIP_ACTIVE,
        isActive,
    };
}

/**
 * Opens a Document Picture-in-Picture window.
 * Uses the Document PiP API to create a new browser window that floats
 * above other windows. React content is rendered into it via createPortal.
 *
 * @returns {Function}
 */
export function openDocumentPiP() {
    return async (dispatch: IStore["dispatch"]) => {
        try {
            // @ts-ignore — Document PiP API types not yet in TypeScript lib
            const newWindow = await window.documentPictureInPicture.requestWindow({
                width: 400,
                height: 300,
            });

            pipWindow = newWindow;

            // Copy stylesheets from the main document so our components render correctly.
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
                    const style = newWindow.document.createElement("style");

                    style.textContent = cssRules;
                    newWindow.document.head.appendChild(style);
                } catch {
                    // External stylesheets may throw SecurityError — link them instead.
                    if (styleSheet.href) {
                        const link = newWindow.document.createElement("link");

                        link.rel = "stylesheet";
                        link.href = styleSheet.href;
                        newWindow.document.head.appendChild(link);
                    }
                }
            });

            // Listen for pagehide to clean up when user closes PiP via browser chrome.
            newWindow.addEventListener("pagehide", () => {
                dispatch(closeDocumentPiP());
            });

            dispatch(setDocumentPiPActive(true));
            logger.info("Document PiP window opened");
        } catch (error) {
            logger.error("Failed to open Document PiP window:", error);
        }
    };
}

/**
 * Closes the Document Picture-in-Picture window and cleans up.
 *
 * @returns {Function}
 */
export function closeDocumentPiP() {
    return (dispatch: IStore["dispatch"], getState: IStore["getState"]) => {
        const state = getState();
        const isActive = state["features/document-pip"]?.isActive;

        if (pipWindow) {
            try {
                pipWindow.close();
            } catch (error) {
                logger.error("Error closing Document PiP window:", error);
            }
            pipWindow = null;
        }

        if (isActive) {
            dispatch(setDocumentPiPActive(false));
            logger.info("Document PiP window closed");
        }
    };
}

/**
 * Toggles Document PiP — opens if closed, closes if open.
 *
 * @returns {Function}
 */
export function toggleDocumentPiP() {
    return (dispatch: IStore["dispatch"], getState: IStore["getState"]) => {
        const state = getState();
        const isActive = state["features/document-pip"]?.isActive;

        if (isActive) {
            dispatch(closeDocumentPiP());
        } else {
            dispatch(openDocumentPiP());
        }
    };
}
