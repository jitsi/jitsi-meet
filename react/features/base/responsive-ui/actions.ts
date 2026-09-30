import { batch } from 'react-redux';

import { IStore } from '../../app/types';
import { CHAT_SIZE } from '../../chat/constants';
import { getCustomPanelWidth } from '../../custom-panel/functions';
import { getParticipantsPaneWidth } from '../../participants-pane/functions';

import {
    CLIENT_RESIZED,
    SAFE_AREA_INSETS_CHANGED,
    SET_ASPECT_RATIO,
    SET_CONTEXT_MENU_OPEN,
    SET_NARROW_LAYOUT,
    SET_REDUCED_UI
} from './actionTypes';
import { ASPECT_RATIO_NARROW, ASPECT_RATIO_WIDE } from './constants';

/**
 * Size threshold for determining if we are in reduced UI mode or not.
 *
 * FIXME The logic to base {@code reducedUI} on a hardcoded width or height is
 * very brittle because it's completely disconnected from the UI which wants to
 * be rendered and, naturally, it broke on iPad where even the secondary Toolbar
 * didn't fit in the height. We do need to measure the actual UI at runtime and
 * determine whether and how to render it.
 */
const REDUCED_UI_THRESHOLD = 300;
const WEB_REDUCED_UI_THRESHOLD = 320;

/**
 * Aspect ratio hysteresis deadband margin.
 *
 * Prevents layout thrashing / infinite oscillation on square/foldable displays
 * (e.g. Galaxy Z Fold, Pixel Fold, split-screen mode, iPad multitasking) where
 * applying a layout (such as rendering a filmstrip or dialog insets) subtly alters
 * available dimensions across the 1:1 boundary.
 */
const ASPECT_RATIO_HYSTERESIS = 0.05;

/**
 * Indicates a resize of the window.
 *
 * @param {number} clientWidth - The width of the window.
 * @param {number} clientHeight - The height of the window.
 * @returns {Object}
 */
export function clientResized(clientWidth: number, clientHeight: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!clientWidth && !clientHeight) {
            return;
        }

        const state = getState();
        const prevResponsiveUI = state['features/base/responsive-ui'];
        let availableWidth = clientWidth;

        if (navigator.product !== 'ReactNative') {
            const { reducedUIEnabled = true } = state['features/base/config'];
            const { isOpen: isChatOpen, width } = state['features/chat'];

            if (isChatOpen) {
                availableWidth -= width?.current ?? CHAT_SIZE;
            }

            availableWidth -= getParticipantsPaneWidth(state);
            availableWidth -= getCustomPanelWidth(state);

            reducedUIEnabled && dispatch(setReducedUI(availableWidth, clientHeight));
        }

        if (prevResponsiveUI.clientHeight === clientHeight
                && prevResponsiveUI.clientWidth === clientWidth
                && prevResponsiveUI.videoSpaceWidth === availableWidth) {
            return;
        }

        batch(() => {
            dispatch({
                type: CLIENT_RESIZED,
                clientHeight,
                clientWidth,
                videoSpaceWidth: availableWidth
            });
            dispatch(setAspectRatio(availableWidth, clientHeight));
        });
    };
}

/**
 * Sets the aspect ratio of the app's user interface based on specific width and
 * height.
 *
 * @param {number} width - The width of the app's user interface.
 * @param {number} height - The height of the app's user interface.
 * @returns {{
 *     type: SET_ASPECT_RATIO,
 *     aspectRatio: Symbol
 * }}
 */
export function setAspectRatio(width: number, height: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!width || !height) {
            return;
        }

        const currentAspectRatio = getState()['features/base/responsive-ui'].aspectRatio;
        const ratio = width / height;
        let aspectRatio = currentAspectRatio;

        // Apply hysteresis:
        // - To switch from NARROW to WIDE: width must exceed height by the hysteresis margin (ratio > 1 + margin).
        // - To switch from WIDE to NARROW: width must be less than height by the hysteresis margin (ratio < 1 - margin).
        // - In the deadband around 1:1 (~[0.95, 1.05]), retain the current stable aspect ratio.
        if (currentAspectRatio === ASPECT_RATIO_NARROW) {
            if (ratio > 1 + ASPECT_RATIO_HYSTERESIS) {
                aspectRatio = ASPECT_RATIO_WIDE;
            }
        } else if (currentAspectRatio === ASPECT_RATIO_WIDE) {
            if (ratio < 1 - ASPECT_RATIO_HYSTERESIS) {
                aspectRatio = ASPECT_RATIO_NARROW;
            }
        } else {
            aspectRatio = width < height ? ASPECT_RATIO_NARROW : ASPECT_RATIO_WIDE;
        }

        if (aspectRatio !== currentAspectRatio) {
            return dispatch({
                type: SET_ASPECT_RATIO,
                aspectRatio
            });
        }
    };
}

/**
 * Sets the "reduced UI" property. In reduced UI mode some components will
 * be hidden if there is no space to render them.
 *
 * @param {number} width - Current usable width.
 * @param {number} height - Current usable height.
 * @returns {{
 *     type: SET_REDUCED_UI,
 *     reducedUI: boolean
 * }}
 */
export function setReducedUI(width: number, height: number) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const threshold = navigator.product === 'ReactNative'
            ? REDUCED_UI_THRESHOLD
            : WEB_REDUCED_UI_THRESHOLD;
        const reducedUI = Math.max(width, height) < threshold;

        if (reducedUI !== getState()['features/base/responsive-ui'].reducedUI) {
            return dispatch({
                type: SET_REDUCED_UI,
                reducedUI
            });
        }
    };
}

/**
 * Sets whether the local or remote participant context menu is open.
 *
 * @param {boolean} isOpen - Whether local or remote context menu is open.
 * @returns {Object}
 */
export function setParticipantContextMenuOpen(isOpen: boolean) {
    return {
        type: SET_CONTEXT_MENU_OPEN,
        isOpen
    };
}

/**
 * Sets the insets from the SafeAreaProvider.
 *
 * @param {Object} insets - The new insets to be set.
 * @returns {{
 *    type: SAFE_AREA_INSETS_CHANGED,
 *    insets: Object
 * }}
 */
export function setSafeAreaInsets(insets: Object) {
    return {
        type: SAFE_AREA_INSETS_CHANGED,
        insets
    };
}

/**
 * Sets narrow layout.
 *
 * @param {boolean} isNarrow - Whether is narrow layout.
 * @returns {{
*    type: SET_NARROW_LAYOUT,
*    isNarrow: boolean
* }}
 */
export function setNarrowLayout(isNarrow: boolean) {
    return {
        type: SET_NARROW_LAYOUT,
        isNarrow
    };
}
