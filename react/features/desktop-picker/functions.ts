import { IReduxState } from '../app/types';

import logger from './logger';
import { ElectronWindowType } from './types';

/**
 * Returns root conference state.
 *
 * @param {IReduxState} state - Global state.
 * @returns {Object} Conference state.
 */
export const getDesktopPicker = (state: IReduxState) => state['features/desktop-picker'];

/**
* Selector to return a list of knocking participants.
*
* @param {IReduxState} state - State object.
* @returns {IDesktopSources}
*/
export function getDesktopPickerSources(state: IReduxState) {
    const root = getDesktopPicker(state);

    return root.sources;
}


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
export function obtainDesktopSources(types: string[], options: { thumbnailSize?: Object; } = {}) {
    const capturerOptions: any = {
        types
    };

    if (options.thumbnailSize) {
        capturerOptions.thumbnailSize = options.thumbnailSize;
    }

    return new Promise((resolve, reject) => {
        const { JitsiMeetElectron } = window as ElectronWindowType;

        if (JitsiMeetElectron?.obtainDesktopStreams) {
            JitsiMeetElectron.obtainDesktopStreams(
                (sources: Array<{ id: string; }>) => resolve(_separateSourcesByType(sources)),
                (error: Error) => {
                    logger.error(
                        `Error while obtaining desktop sources: ${error}`);
                    reject(error);
                },
                capturerOptions
            );
        } else {
            const reason = 'Called JitsiMeetElectron.obtainDesktopStreams'
                + ' but it is not defined';

            logger.error(reason);

            return Promise.reject(new Error(reason));
        }
    });
}

/**
 * Check usage of old jitsi meet electron version.
 *
 * @returns {boolean} True if we use old jitsi meet electron, otherwise false.
 */
export function oldJitsiMeetElectronUsage() {
    const { JitsiMeetElectron } = window as ElectronWindowType;

    if (JitsiMeetElectron?.obtainDesktopStreams) {
        return true;
    }

    return false;
}

/**
 * Converts an array of DesktopCapturerSources to an object with types for keys
 * and values being an array with sources of the key's type.
 *
 * @param {Array} sources - DesktopCapturerSources.
 * @private
 * @returns {Object} An object with the sources split into separate arrays based
 * on source type.
 */
export function _separateSourcesByType(sources: Array<{ id: string; }> = []) {
    const sourcesByType: any = {
        screen: [],
        window: []
    };

    sources.forEach(source => {
        const idParts = source.id.split(':');
        const type = idParts[0];

        if (sourcesByType[type]) {
            sourcesByType[type].push(source);
        }
    });

    return sourcesByType;
}
