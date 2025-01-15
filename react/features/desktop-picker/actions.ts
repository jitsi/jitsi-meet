import { openDialog } from '../base/dialog/actions';
import { DesktopSharingSourceType } from '../base/tracks/types';

import DesktopPicker from './components/DesktopPicker';

type Options = {
    desktopSharingSources?: Array<DesktopSharingSourceType>;
};

/**
 * Signals to open a dialog with the DesktopPicker component.
 *
 * @param {Object} options - Desktop sharing settings.
 * @param {Function} onSourceChoose - The callback to invoke when
 * a DesktopCapturerSource has been chosen.
 * @returns {Object}
 */
export function showDesktopPicker(options: Options = {}, onSourceChoose: Function) {
    const { desktopSharingSources } = options;

    return openDialog(DesktopPicker, {
        desktopSharingSources,
        onSourceChoose
    });
}
