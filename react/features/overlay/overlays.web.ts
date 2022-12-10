import {
    PageReloadOverlay,
    SuspendedOverlay,
    UserMediaPermissionsOverlay

    // @ts-ignore
} from './components/web';

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
