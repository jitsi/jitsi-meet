import { ReactElement } from 'react';

// @ts-ignore
import { PageReloadOverlay } from './components/native';

/**
 * Returns the list of available platform specific overlays.
 *
 * @returns {Array<ReactElement>}
 */
export function getOverlays(): Array<ReactElement> {
    return [
        PageReloadOverlay
    ];
}
