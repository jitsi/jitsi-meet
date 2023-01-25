/* eslint-disable lines-around-comment */

import { IReduxState } from '../app/types';

// @ts-ignore
import PageReloadOverlay from './components/web/PageReloadOverlay';
// @ts-ignore
import SuspendedOverlay from './components/web/SuspendedOverlay';
// @ts-ignore
import UserMediaPermissionsOverlay from './components/web/UserMediaPermissionsOverlay';
/**
 * Returns the overlay to be currently rendered.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {?React$ComponentType<*>}
 */
export function getOverlayToRender(state: IReduxState) {
    const overlays = [
        PageReloadOverlay,
        SuspendedOverlay,
        UserMediaPermissionsOverlay
    ];

    for (const overlay of overlays) {
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
