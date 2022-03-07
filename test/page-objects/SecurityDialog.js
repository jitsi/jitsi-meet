/**
 * Define security dialog elements.
*/
class SecurityDialog {

    // Security dialog object.
    get SecurityDialogView() {
        const securityDialog = $('.security-dialog');
        return securityDialog;
    };

    // Lobby switch object.
    get LobbySwitch() {
        const lobbySwitch = $('[aria-label="cross"]');
        return lobbySwitch;
    };

    // Lobby enabled object. Check if lobby is enabled.
    get LobbyEnabled() {
        const lobbyEnabled = $('[data-checked="true"]');
        return lobbyEnabled;
    }

    //Security dialog close button object.
    get SecurityDialogCloseButton() {
        const closeButton = $('#modal-header-close-button');
        return closeButton;
    }
}

module.exports = new SecurityDialog();