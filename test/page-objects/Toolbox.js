/* eslint-disable no-undef */

/**
* Define toolbox element.
*/
class Toolbox {

    /**
     * Toolbox element.
     *
     * @returns {HTMLElement}
     */
    get ToolboxView() {
        const video = $('#largeVideo');

        video.moveTo();

        return $('.toolbox-content-items');
    }

    /**
     * More action element.
     *
     * @returns {HTMLElement}
     */
    get MoreActionOption() {
        return $('.toolbox-button-wth-dialog div');
    }

    /**
     * Overflow menu element.
     *
     * @returns {HTMLElement}
     */
    get OverflowMenu() {
        return $('#overflow-menu');
    }

    /**
     * Security option button element.
     *
     * @returns {HTMLElement}
     */
    get SecurityOptionButton() {
        return $('[aria-label="Security options"]');
    }

    /**
     * Participants pane button element.
     *
     * @returns {HTMLElement}
     */
    get ParticipantsPaneButton() {
        return $('[aria-label="Participants"]');
    }
}
module.exports = new Toolbox();
