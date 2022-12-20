// @ts-ignore
import PageReloadOverlay from './components/web/PageReloadOverlay';
// @ts-ignore
import SuspendedOverlay from './components/web/SuspendedOverlay';
// @ts-ignore
import UserMediaPermissionsOverlay from './components/web/UserMediaPermissionsOverlay';

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
