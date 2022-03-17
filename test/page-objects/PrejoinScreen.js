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

    /**
     * Prejoin button element.
     *
     * @returns {HTMLElement}
     */
    get PrejoinButton() {
        return $('[data-testid="prejoin.joinMeeting"]');
    }
}

module.exports = new PrejoinScreen();
