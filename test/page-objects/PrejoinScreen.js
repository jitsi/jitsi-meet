/* eslint-disable no-undef */

/**
 * Define prejoinscreen elements.
*/
class PrejoinScreen {

    /**
     * Initializes a new user browser instance.
     *
     * @param {Object} userBrowser - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(userBrowser) {
        this.userBrowser = userBrowser;
    }

    /**
     * Premeeting screen element.
     *
     * @returns {HTMLElement}
     */
    get PremeetingScreen() {
        return this.userBrowser.$('.premeeting-screen');
    }

    /**
     * Prejoin input element.
     *
     * @returns {HTMLElement}
     */
    get PrejoinInput() {
        return this.userBrowser.$('.prejoin-input-area input');
    }

    /**
     * Prejoin button element.
     *
     * @returns {HTMLElement}
     */
    get PrejoinButton() {
        return this.userBrowser.$('[data-testid="prejoin.joinMeeting"]');
    }
}

module.exports = PrejoinScreen;
