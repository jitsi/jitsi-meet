import { openDialog } from '../base/dialog';

import {
    RESET_DESKTOP_SOURCES,
    UPDATE_DESKTOP_SOURCES
} from './actionTypes';
import { DesktopPicker } from './components';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Begins a request to get available DesktopCapturerSources.
 *
 * @param {Array} types - An array with DesktopCapturerSource type strings.
 * @param {Object} options - Additional configuration for getting a list of
 * sources.
 * @param {Object} options.thumbnailSize - The desired height and width of the
 * return native image object used for the preview image of the source.
 * @returns {Function}
 */
export function obtainDesktopSources(types, options = {}) {
    const capturerOptions = {
        types
    };

    if (options.thumbnailSize) {
        capturerOptions.thumbnailSize = options.thumbnailSize;
    }

    return dispatch => {
        const { JitsiMeetElectron } = window;

        if (JitsiMeetElectron && JitsiMeetElectron.obtainDesktopStreams) {
            JitsiMeetElectron.obtainDesktopStreams(
                sources => dispatch(updateDesktopSources(sources)),
                error =>
                    logger.error(
                        `Error while obtaining desktop sources: ${error}`),
                capturerOptions
            );
        } else {
            logger.error(
                'Called JitsiMeetElectron.obtainDesktopStreams'
                    + ' but it is not defined');
        }
    };
}

/**
 * Signals to remove all stored DesktopCapturerSources.
 *
 * @returns {{
 *     type: RESET_DESKTOP_SOURCES
 * }}
 */
export function resetDesktopSources() {
    return {
        type: RESET_DESKTOP_SOURCES
    };
}

/**
 * Signals to open a dialog with the DesktopPicker component.
 *
 * @param {Function} onSourceChoose - The callback to invoke when
 * a DesktopCapturerSource has been chosen.
 * @returns {Object}
 */
export function showDesktopPicker(onSourceChoose) {
    return openDialog(DesktopPicker, {
        onSourceChoose
    });
}

/**
 * Signals new DesktopCapturerSources have been received.
 *
 * @param {Object} sources - Arrays with DesktopCapturerSources.
 * @returns {{
 *     type: UPDATE_DESKTOP_SOURCES,
 *     sources: Array
 * }}
 */
export function updateDesktopSources(sources) {
    return {
        type: UPDATE_DESKTOP_SOURCES,
        sources
    };
}
