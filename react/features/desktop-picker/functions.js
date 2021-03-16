
import logger from './logger';

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

    return new Promise((resolve, reject) => {
        const { JitsiMeetElectron } = window;

        if (JitsiMeetElectron && JitsiMeetElectron.obtainDesktopStreams) {
            JitsiMeetElectron.obtainDesktopStreams(
                sources => resolve(_seperateSourcesByType(sources)),
                error => {
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
 * Converts an array of DesktopCapturerSources to an object with types for keys
 * and values being an array with sources of the key's type.
 *
 * @param {Array} sources - DesktopCapturerSources.
 * @private
 * @returns {Object} An object with the sources split into separate arrays based
 * on source type.
 */
function _seperateSourcesByType(sources = []) {
    const sourcesByType = {
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
