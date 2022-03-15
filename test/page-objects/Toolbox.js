/**
* Define toolbox element.
*/
class Toolbox {

    // Toolbox object.
    get ToolboxView() {
        const video = $('#largeVideo');
        video.moveTo();
        return $('.toolbox-content-items');
    }

    // More action object.
    get MoreActionOption() {
        return $('.toolbox-button-wth-dialog div');
    }

    // Overflow menu object.
    get OverflowMenu() {
        return $('#overflow-menu');
    }

    // Security option button object.
    get SecurityOptionButton() {
        return $('[aria-label="Security options"]');
    }

    // Participants pane button object.
    get ParticipantsPaneButton() {
        return $("[aria-label='Participants']");
    }
}
module.exports = new Toolbox();
