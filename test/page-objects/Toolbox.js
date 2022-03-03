class Toolbox{
    get ToolboxView() {
        const video = $('#largeVideo');
        video.moveTo();
        const toolbox = $('.toolbox-content-items');
        return toolbox;
    };

    get ToolboxSecurityOption() {
        const toolbarSecurityOption = $('.toolbox-button-wth-dialog div');
        return toolbarSecurityOption;
    }

    get OverflowMenu() {
        const overflowMenu = $('#overflow-menu');
        return overflowMenu;
    }

    get SecurityOptionButton() {
        const securityOptions = $('[aria-label="Security options"]');
        return securityOptions;
    }

    get ParticipantsPaneButton() {
        const participantsPaneButton = $("[aria-label='Participants']");
        return participantsPaneButton;
    }
}
module.exports = new Toolbox();