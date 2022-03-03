class ParticipantsPane{
    get ParticipantsPaneView() {
        const participantsPane = $('.participants_pane');
        return participantsPane
    };
}
module.exports = new ParticipantsPane();