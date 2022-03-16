/* eslint-disable no-undef */

/**
 * Define participants pane elements.
*/
class ParticipantsPane {

    /**
     * Participants pane element.
     *
     * @returns {HTMLElement}
     */
    get ParticipantsPaneView() {
        return $('.participants_pane');
    }
}
module.exports = new ParticipantsPane();
