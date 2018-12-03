// @flow

import {
    PageReloadFilmstripOnlyOverlay,
    PageReloadOverlay,
    SuspendedFilmstripOnlyOverlay,
    SuspendedOverlay,
    UserMediaPermissionsFilmstripOnlyOverlay,
    UserMediaPermissionsOverlay
} from './components';

declare var interfaceConfig: Object;

/**
 * Returns the list of available overlays that might be rendered.
 *
 * @private
 * @returns {Array<?React$ComponentType<*>>}
 */
function _getOverlays() {
    const filmstripOnly
        = typeof interfaceConfig === 'object' && interfaceConfig.filmStripOnly;
    let overlays;

    if (filmstripOnly) {
        overlays = [
            PageReloadFilmstripOnlyOverlay,
            SuspendedFilmstripOnlyOverlay,
            UserMediaPermissionsFilmstripOnlyOverlay
        ];
    } else {
        overlays = [
            PageReloadOverlay
        ];
    }

    // Mobile only has a PageReloadOverlay.
    if (navigator.product !== 'ReactNative') {
        overlays.push(...[
            SuspendedOverlay,
            UserMediaPermissionsOverlay
        ]);
    }

    return overlays;
}

/**
 * Returns the overlay to be currently rendered.
 *
 * @param {Object} state - The Redux state.
 * @returns {?React$ComponentType<*>}
 */
export function getOverlayToRender(state: Object) {
    for (const overlay of _getOverlays()) {
        // react-i18n / react-redux wrap components and thus we cannot access
        // the wrapped component's static methods directly.
        const component = overlay.WrappedComponent || overlay;

        if (component.needsRender(state)) {
            return overlay;
        }
    }

    return undefined;
}
