class SecurityDialog{
    get SecurityDialogView() {
        const securityDialog = $('.security-dialog');
        return securityDialog
    };
    get LobbySwitch() {
        const lobbySwitch = $('[aria-label="cross"]');
        return lobbySwitch
    };
    get LobbyEnabled() {
        const lobbyEnabled = $('[data-checked="true"]');
        return lobbyEnabled
    }
    get SecurityDialogCloseButton() {
        const closeButton = $('#modal-header-close-button');
        return closeButton
    }
}

module.exports = new SecurityDialog();