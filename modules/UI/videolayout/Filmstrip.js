/* global APP, interfaceConfig */

import {
    getVerticalFilmstripVisibleAreaWidth,
    isFilmstripVisible
} from '../../../react/features/filmstrip/functions';

const Filmstrip = {
    /**
     * Returns the height of filmstrip
     * @returns {number} height
     */
    getFilmstripHeight() {
        // FIXME Make it more clear the getFilmstripHeight check is used in
        // horizontal film strip mode for calculating how tall large video
        // display should be.
        if (isFilmstripVisible(APP.store) && !interfaceConfig.VERTICAL_FILMSTRIP) {
            return document.querySelector('.filmstrip')?.offsetHeight ?? 0;
        }

        return 0;
    },

    /**
     * Returns the width of the vertical filmstrip if the filmstrip is visible and 0 otherwise.
     *
     * @returns {number} - The width of the vertical filmstrip if the filmstrip is visible and 0 otherwise.
     */
    getVerticalFilmstripWidth() {
        return isFilmstripVisible(APP.store) ? getVerticalFilmstripVisibleAreaWidth() : 0;
    }
};

export default Filmstrip;
