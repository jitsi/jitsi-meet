import { openDialog } from '../base/dialog';

import { DesktopPicker } from './components';

import { obtainDesktopSources } from './functions';
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

/**
 * set desktop without dialog.
 *
 * @param {Object} options - Desktop sharing settings.
 * @param {Function} onSourceChoose - The callback to invoke when
 * a DesktopCapturerSource has been chosen.
 * @returns {Object}
 */
export function notShowDesktopPicker(options = {}, onSourceChoose) {    
    obtainDesktopSources(
        [ 'screen' ]
    )
    .then(sources => {
        onSourceChoose(sources['screen'][0].id,'screen');
    }); 
}
