import { IStore } from '../app/types';
import i18next from '../base/i18n/i18next';
import BaseTheme from '../base/ui/components/BaseTheme.web';
import { showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { SET_MULTI_SCREEN_ACTIVE, SET_SECONDARY_LAYOUT } from './actionTypes';
import { SECONDARY_WINDOW_NAME, SECONDARY_WINDOW_ROOT_ID, SecondaryLayout } from './constants';
import { getSecondaryWindowPlacement, isMultiScreenSupported } from './functions';
import logger from './logger';

/**
 * Module-level reference to the secondary window.
 * Stored at module scope so it persists across renders and can be
 * accessed by the portal component without going through Redux.
 */
let secondaryWindow: Window | null = null;

/**
 * Synchronous in-flight guard for openSecondaryWindow(). Flipped before the
 * first await so two rapid toggles can't both pass the "already open" check and
 * race to window.open() with the same named target.
 */
let isOpening = false;

/**
 * Set while we are closing the window ourselves, so the window's beforeunload
 * listener can tell a programmatic close from a user-initiated one and avoid
 * dispatching a duplicate closeSecondaryWindow(). Reset on the next open.
 */
let isClosingProgrammatically = false;

/**
 * Observer that mirrors stylesheets added to the main document's <head> after
 * the window opened (CSS-in-JS, lazily-loaded feature CSS) into the popup.
 */
let styleObserver: MutationObserver | null = null;

/**
 * Returns the current secondary window reference, or null if not open.
 *
 * @returns {Window|null} The secondary window.
 */
export function getSecondaryWindow(): Window | null {
    return secondaryWindow;
}

/**
 * Copies all stylesheets from the main document into a target window document.
 *
 * Uses a two-tier approach:
 * 1. Same-origin stylesheets: inline the CSS rules as style elements.
 * 2. Cross-origin stylesheets: link to the external stylesheet via link element.
 *
 * @param {Window} targetWindow - The window to copy styles into.
 * @returns {void}
 */
export function copyStylesToWindow(targetWindow: Window): void {
    const targetDoc = targetWindow.document;

    Array.from(document.styleSheets).forEach(styleSheet => {
        try {
            // Tier 1: Same-origin — inline the CSS rules directly.
            const cssRules = Array.from(styleSheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            const style = targetDoc.createElement('style');

            style.textContent = cssRules;
            targetDoc.head.appendChild(style);
        } catch {
            // Tier 2: Cross-origin — link to the external stylesheet.
            if (styleSheet.href) {
                const link = targetDoc.createElement('link');

                link.rel = 'stylesheet';
                link.href = styleSheet.href;
                targetDoc.head.appendChild(link);
            }
        }
    });
}

/**
 * Copies a single <style>/<link rel="stylesheet"> node that was added to the
 * main document into the target window, mirroring copyStylesToWindow()'s
 * two-tier approach for one node. Non-stylesheet nodes are ignored.
 *
 * @param {Node} node - The node that was added to the main document's <head>.
 * @param {Window} targetWindow - The window to copy the style into.
 * @returns {void}
 */
function copyStyleNodeToWindow(node: Node, targetWindow: Window): void {
    const targetDoc = targetWindow.document;

    if (node instanceof HTMLStyleElement) {
        const style = targetDoc.createElement('style');

        try {
            // Prefer the parsed rules so CSS-in-JS (rules inserted via the CSSOM
            // with empty textContent) is captured; fall back to textContent.
            style.textContent = Array.from(node.sheet?.cssRules ?? [])
                .map(rule => rule.cssText)
                .join('\n') || node.textContent || '';
        } catch {
            style.textContent = node.textContent ?? '';
        }
        targetDoc.head.appendChild(style);
    } else if (node instanceof HTMLLinkElement && node.rel === 'stylesheet' && node.href) {
        const link = targetDoc.createElement('link');

        link.rel = 'stylesheet';
        link.href = node.href;
        targetDoc.head.appendChild(link);
    }
}

/**
 * Watches the main document's <head> and copies any stylesheet nodes added
 * after the window opened into the popup, so content rendered into it later
 * (e.g. lazily-loaded features) is not left unstyled.
 *
 * @param {Window} targetWindow - The window to keep in sync.
 * @returns {MutationObserver} The observer, so the caller can disconnect it.
 */
function observeStyleChanges(targetWindow: Window): MutationObserver {
    const observer = new MutationObserver(mutations => {
        if (targetWindow.closed) {
            return;
        }

        mutations.forEach(mutation =>
            mutation.addedNodes.forEach(node => copyStyleNodeToWindow(node, targetWindow)));
    });

    observer.observe(document.head, { childList: true });

    return observer;
}

/**
 * Resolves once the freshly-opened window's document is ready to be mutated.
 *
 * A window.open('about:blank') call can hand back an initial empty document
 * that Chromium asynchronously replaces, wiping synchronous DOM changes; waiting
 * for DOMContentLoaded (when the document is still loading) avoids that race.
 *
 * @param {Window} win - The newly-opened window.
 * @returns {Promise<void>}
 */
function whenDocumentReady(win: Window): Promise<void> {
    return new Promise(resolve => {
        if (win.document.readyState !== 'loading') {
            resolve();

            return;
        }

        win.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
}

/**
 * Initialises the secondary window's document: title, themed background and the
 * root element the conference is portaled into.
 *
 * @param {Window} win - The secondary window.
 * @returns {void}
 */
function setupSecondaryDocument(win: Window): void {
    const { uiBackground } = BaseTheme.palette;
    const doc = win.document;

    doc.title = i18next.t('multiScreen.windowTitle');

    // Match the conference background using the theme token so it stays
    // consistent if branding changes.
    doc.documentElement.style.backgroundColor = uiBackground;
    doc.body.style.backgroundColor = uiBackground;
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.overflow = 'hidden';

    // Create the root element for React portal rendering.
    const rootDiv = doc.createElement('div');

    rootDiv.id = SECONDARY_WINDOW_ROOT_ID;
    rootDiv.style.width = '100%';
    rootDiv.style.height = '100%';
    doc.body.appendChild(rootDiv);
}

/**
 * Opens a secondary browser window for multi-screen conferencing.
 *
 * Uses the Window Management API (getScreenDetails) to detect connected
 * monitors and position the window on a non-primary screen when available.
 * Falls back to a default offset position if the API is unavailable.
 *
 * @returns {Function}
 */
export function openSecondaryWindow() {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (!isMultiScreenSupported(state)) {
            logger.warn('Multi-screen is not supported or not enabled');

            return;
        }

        // Synchronous in-flight guard: don't open a second window if one is
        // already open or another open is mid-flight (before the await below).
        if (isOpening || (secondaryWindow && !secondaryWindow.closed)) {
            logger.warn('Secondary window is already open or opening');
            secondaryWindow?.focus();

            return;
        }
        isOpening = true;

        try {
            // Resolve where to place the secondary window (smart multi-monitor
            // placement when available, otherwise a sensible fallback).
            const { placement, permissionDenied } = await getSecondaryWindowPlacement();

            if (permissionDenied) {
                dispatch(showWarningNotification({
                    titleKey: 'multiScreen.permissionDeniedTitle',
                    descriptionKey: 'multiScreen.permissionDenied'
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
            }

            const { left, top, width, height } = placement;
            const features = `left=${left},top=${top},width=${width},height=${height}`;
            const newWindow = window.open('about:blank', SECONDARY_WINDOW_NAME, features);

            if (!newWindow) {
                logger.error('Popup was blocked by the browser');

                return;
            }

            // Wait for the document to settle before mutating it (about:blank race).
            await whenDocumentReady(newWindow);

            // The window could have been closed while we were awaiting.
            if (newWindow.closed) {
                logger.warn('Secondary window was closed before it could be initialised');

                return;
            }

            setupSecondaryDocument(newWindow);

            // Copy current stylesheets, then keep them in sync with later additions.
            copyStylesToWindow(newWindow);
            styleObserver = observeStyleChanges(newWindow);

            secondaryWindow = newWindow;
            isClosingProgrammatically = false;

            // Mirror the window going away (user closes it, navigates, etc.) back
            // into Redux — unless we initiated the close ourselves.
            newWindow.addEventListener('beforeunload', () => {
                if (isClosingProgrammatically) {
                    return;
                }

                dispatch(closeSecondaryWindow());
            });

            // Update Redux state.
            dispatch({
                type: SET_MULTI_SCREEN_ACTIVE,
                isActive: true
            });

            logger.info('Secondary window opened successfully');
        } catch (error) {
            logger.error('Failed to open secondary window', error);
        } finally {
            isOpening = false;
        }
    };
}

/**
 * Closes the secondary browser window and cleans up state.
 *
 * @returns {Function}
 */
export function closeSecondaryWindow() {
    return (dispatch: IStore['dispatch']) => {
        // Stop mirroring styles into a window that's going away.
        styleObserver?.disconnect();
        styleObserver = null;

        if (secondaryWindow && !secondaryWindow.closed) {
            // Flag this as our own close so the beforeunload listener doesn't
            // dispatch a second closeSecondaryWindow(). Left set until the next
            // open, in case beforeunload fires asynchronously after close().
            isClosingProgrammatically = true;
            secondaryWindow.close();
        }

        secondaryWindow = null;

        dispatch({
            type: SET_MULTI_SCREEN_ACTIVE,
            isActive: false
        });

        logger.info('Secondary window closed');
    };
}

/**
 * Toggles the secondary multi-screen window open or closed.
 *
 * @returns {Function}
 */
export function toggleMultiScreen() {
    return (dispatch: IStore['dispatch']) => {
        if (secondaryWindow && !secondaryWindow.closed) {
            dispatch(closeSecondaryWindow());
        } else {
            dispatch(openSecondaryWindow());
        }
    };
}

/**
 * Sets the layout mode of the secondary window.
 *
 * @param {SecondaryLayout} layout - The layout to set (from SECONDARY_LAYOUTS).
 * @returns {{
 *     type: SET_SECONDARY_LAYOUT,
 *     layout: SecondaryLayout
 * }}
 */
export function setSecondaryLayout(layout: SecondaryLayout) {
    return {
        type: SET_SECONDARY_LAYOUT,
        layout
    };
}
