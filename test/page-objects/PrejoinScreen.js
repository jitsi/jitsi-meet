/* eslint-disable no-undef */

/**
 * Define prejoinscreen elements.
*/
class PrejoinScreen {

    /**
     * Premeeting screen element.
     *
     * @returns {HTMLElement}
     */
    get PremeetingScreen() {
        return $('.premeeting-screen');
    }

    /**
     * Prejoin input element.
     *
     * @returns {HTMLElement}
     */
    get PrejoinInput() {
        return $('.prejoin-input-area input');
    }
}

module.exports = new PrejoinScreen();
