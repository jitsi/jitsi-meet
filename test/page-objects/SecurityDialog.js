/**
 * Define security dialog elements.
*/
class SecurityDialog {

    // Security dialog object.
    get SecurityDialogView() {
        return $('.security-dialog');
    }

    // Lobby switch object.
    get LobbySwitch() {
        return $('[aria-label="cross"]');
    }

    // Lobby enabled object. Check if lobby is enabled.
    get LobbyEnabled() {
        return $('[data-checked="true"]');
    }

    //Security dialog close button object.
    get SecurityDialogCloseButton() {
        return $('#modal-header-close-button');
    }
}

module.exports = new SecurityDialog();
