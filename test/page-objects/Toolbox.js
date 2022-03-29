/* eslint-disable no-undef */

/**
* Define toolbox element.
*/
class Toolbox {

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
     * Toolbox element.
     *
     * @returns {HTMLElement}
     */
    get ToolboxView() {
        const video = this.userBrowser.$('#largeVideo');

        video.moveTo();

        return this.userBrowser.$('.toolbox-content-items');
    }

    /**
     * More action element.
     *
     * @returns {HTMLElement}
     */
    get MoreActionOption() {
        return this.userBrowser.$('.toolbox-button-wth-dialog div');
    }

    /**
     * Overflow menu element.
     *
     * @returns {HTMLElement}
     */
    get OverflowMenu() {
        return this.userBrowser.$('#overflow-menu');
    }

    /**
     * Security option button element.
     *
     * @returns {HTMLElement}
     */
    get SecurityOptionButton() {
        return this.userBrowser.$('[aria-label="Security options"]');
    }

    /**
     * Participants pane button element.
     *
     * @returns {HTMLElement}
     */
    get ParticipantsPaneButton() {
        return this.userBrowser.$('[aria-label="Participants"]');
    }
}
module.exports = Toolbox;
