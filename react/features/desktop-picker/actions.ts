import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';

import { DELETE_DESKTOP_SORCES, INIT_DESKTOP_SOURCES } from './actionTypes';
import DesktopPicker from './components/DesktopPicker';
import { _separateSourcesByType } from './functions';
import { IDesktopSources } from './types';

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
export function executeInitDesktopSources(sources: any) {
    return (dispatch: IStore['dispatch']) => {
        const sourcesByType = _separateSourcesByType(sources || []);

        dispatch(initDesktopSources(sourcesByType));
    };
}

/**
 * Action used to init desktop sources.
 *
 * @param {IDesktopSources} sources - Desktop sources.
 * @returns {Object}
 */
export function initDesktopSources(sources: IDesktopSources) {
    return {
        type: INIT_DESKTOP_SOURCES,
        sources
    };
}

/**
 * Action used to delete desktop sources.
 *
 * @returns {Object}
 */
export function deleteDesktopSources() {
    return {
        type: DELETE_DESKTOP_SORCES
    };
}
