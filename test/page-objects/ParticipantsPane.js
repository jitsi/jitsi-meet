/* eslint-disable no-undef */

/**
 * Define participants pane elements.
*/
class ParticipantsPane {

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
     * Participants pane element.
     *
     * @returns {HTMLElement}
     */
    get ParticipantsPaneView() {
        return this.userBrowser.$('.participants_pane');
    }
}
module.exports = ParticipantsPane;
