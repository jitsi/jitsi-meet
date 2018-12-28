import { openDialog } from '../base/dialog';

import { DesktopPicker } from './components';

/**
 * Signals to open a dialog with the DesktopPicker component.
 *
 * @param {Object} options - Desktop sharing settings.
 * @param {Function} onSourceChoose - The callback to invoke when
 * a DesktopCapturerSource has been chosen.
 * @returns {Object}
 */
export function showDesktopPicker(options = {}, onSourceChoose) {
    const { desktopSharingSources } = options;

    return openDialog(DesktopPicker, {
        desktopSharingSources,
        onSourceChoose
    });
}
