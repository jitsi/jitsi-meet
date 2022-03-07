/**
* Define toolbox element.
*/
class Toolbox {

    // Toolbox object.
    get ToolboxView() {
        const video = $('#largeVideo');
        video.moveTo();
        const toolbox = $('.toolbox-content-items');
        return toolbox;
    };

    // More action object.
    get MoreActionOption() {
        const toolbarSecurityOption = $('.toolbox-button-wth-dialog div');
        return toolbarSecurityOption;
    };

    // Overflow menu object.
    get OverflowMenu() {
        const overflowMenu = $('#overflow-menu');
        return overflowMenu;
    };

    // Security option button object.
    get SecurityOptionButton() {
        const securityOptions = $('[aria-label="Security options"]');
        return securityOptions;
    };

    // Participants pane button object.
    get ParticipantsPaneButton() {
        const participantsPaneButton = $("[aria-label='Participants']");
        return participantsPaneButton;
    };
}
module.exports = new Toolbox();