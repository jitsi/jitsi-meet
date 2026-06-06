import logger from './logger';

/**
 * Begins a request to get available DesktopCapturerSources.
 *
 * @param {Object} options - Additional configuration for getting a list of
 * sources.
 * @param {Array} options.types - An array with DesktopCapturerSource type strings.
 * @param {Object} options.thumbnailSize - The desired height and width of the
 * return native image object used for the preview image of the source.
 * @returns {Function}
 */
export function obtainDesktopSources(options: { thumbnailSize?: Object; types: string[]; }) {
    return APP.API.requestDesktopSources(options).then(
        ({ sources, error }: { error: Error; sources: Array<{ id: string; }>; }) => {
            if (sources) {
                return _separateSourcesByType(sources);
            } else if (error) {
                logger.error(
                    `Error while obtaining desktop sources: ${error}`);

                return null;
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
