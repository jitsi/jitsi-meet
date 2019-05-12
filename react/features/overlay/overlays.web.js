// @flow

import {
    PageReloadFilmstripOnlyOverlay,
    PageReloadOverlay,
    SuspendedFilmstripOnlyOverlay,
    SuspendedOverlay,
    UserMediaPermissionsFilmstripOnlyOverlay,
    UserMediaPermissionsOverlay
} from './components/web';

declare var interfaceConfig: Object;

/**
 * Returns the list of available platform specific overlays.
 *
 * @returns {Array<Object>}
 */
export function getOverlays(): Array<Object> {
    const overlays = [
        SuspendedOverlay,
        UserMediaPermissionsOverlay
    ];

    const filmstripOnly
            = typeof interfaceConfig === 'object' && interfaceConfig.filmStripOnly;

    if (filmstripOnly) {
        overlays.push(
            PageReloadFilmstripOnlyOverlay,
            SuspendedFilmstripOnlyOverlay,
            UserMediaPermissionsFilmstripOnlyOverlay);
    } else {
        overlays.push(PageReloadOverlay);
    }

    return overlays;
}
