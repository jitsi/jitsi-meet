import { IReduxState } from '../app/types';

import PageReloadOverlay from './components/web/PageReloadOverlay';
import SuspendedOverlay from './components/web/SuspendedOverlay';

/**
 * Returns the overlay to be currently rendered.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {?React$ComponentType<*>}
 */
export function getOverlayToRender(state: IReduxState) {
    const overlays = [
        PageReloadOverlay,
        SuspendedOverlay
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
