// @flow

import {
    PageReloadOverlay,
    SuspendedOverlay,
    UserMediaPermissionsOverlay
} from './components/web';

declare var interfaceConfig: Object;

/**
 * Returns the list of available platform specific overlays.
 *
 * @returns {Array<Object>}
 */
export function getOverlays(): Array<Object> {
    return [
        PageReloadOverlay,
        SuspendedOverlay,
        UserMediaPermissionsOverlay
    ];
}
