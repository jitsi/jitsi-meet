import { IReduxState } from '../app/types';

import { getOverlays } from './overlays';

/**
 * Returns the overlay to be currently rendered.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {?React$ComponentType<*>}
 */
export function getOverlayToRender(state: IReduxState) {
    for (const overlay of getOverlays()) {
        // react-i18n / react-redux wrap components and thus we cannot access
        // the wrapped component's static methods directly.
        // @ts-ignore
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
 * @param {IReduxState} state - The Redux state.
 * @returns {boolean}
 */
export function getMediaPermissionPromptVisibility(state: IReduxState) {
    return state['features/overlay'].isMediaPermissionPromptVisible;
}
