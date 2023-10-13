import { openDialog } from '../base/dialog/actions';

import { DELETE_DESKTOP_SOURCES, SET_DESKTOP_SOURCES } from './actionTypes';
import DesktopPicker from './components/DesktopPicker';
import { _separateSourcesByType } from './functions';

/**
 * Signals to open a dialog with the DesktopPicker component.
 *
 * @param {Object} options - Desktop sharing settings.
 * @param {Function} onSourceChoose - The callback to invoke when
 * a DesktopCapturerSource has been chosen.
 * @returns {Object}
 */
export function showDesktopPicker(options: { desktopSharingSources?: any; } = {}, onSourceChoose: Function) {
    const { desktopSharingSources } = options;

    return openDialog(DesktopPicker, {
        desktopSharingSources,
        onSourceChoose
    });
}

/**
 * Signals to open a dialog with the DesktopPicker component with screen sharing sources.
 *
 * @param {Array} sources - Desktop capturer sources.
 * @returns {Function}
 */
export function setDesktopSources(sources: Array<any>) {
    return {
        type: SET_DESKTOP_SOURCES,
        sources: _separateSourcesByType(sources ?? [])
    };
}

/**
 * Action used to delete desktop sources.
 *
 * @returns {Object}
 */
export function deleteDesktopSources() {
    return {
        type: DELETE_DESKTOP_SOURCES
    };
}
