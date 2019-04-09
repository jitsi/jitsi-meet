// @flow

import {
    LoadConfigOverlay,
    PageReloadOverlay
} from './components/native';

/**
 * Returns the list of available platform specific overlays.
 *
 * @returns {Array<React$Element>}
 */
export function getOverlays(): Array<React$Element<*>> {
    return [
        LoadConfigOverlay,
        PageReloadOverlay
    ];
}
