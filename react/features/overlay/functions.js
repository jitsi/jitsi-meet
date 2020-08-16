// @flow

import { getOverlays } from './overlays';

/**
 * Returns the overlay to be currently rendered.
 *
 * @param {Object} state - The Redux state.
 * @returns {?React$ComponentType<*>}
 */
export function getOverlayToRender(state: Object) {
    for (const overlay of getOverlays()) {
        // react-i18n / react-redux wrap components and thus we cannot access
        // the wrapped component's static methods directly.
        const component = overlay.WrappedComponent || overlay;

        if (component.needsRender(state)) {
            return overlay;
        }
    }

    return undefined;
}

/**
 * Returns the visibility of the media permissions prompt.
 *
 * @param {Object} state - The Redux state.
 * @returns {boolean}
 */
export function getMediaPermissionPromptVisibility(state: Object) {
    return state['features/overlay'].isMediaPermissionPromptVisible;
}
