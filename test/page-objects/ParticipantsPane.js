/**
 * Define participants pane elements.
*/
class ParticipantsPane {

    // Participants pane object.
    get ParticipantsPaneView() {
        const participantsPane = $('.participants_pane');
        return participantsPane
    };
}
module.exports = new ParticipantsPane();