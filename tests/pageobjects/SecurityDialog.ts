import BaseDialog from './BaseDialog';

const ADD_PASSWORD_LINK = 'add-password';
const ADD_PASSWORD_FIELD = 'info-password-input';
const DIALOG_CONTAINER = 'security-dialog';
const LOCAL_LOCK = 'info-password-local';
const REMOTE_LOCK = 'info-password-remote';
const REMOVE_PASSWORD = 'remove-password';

/**
 * Page object for the security dialog.
 */
export default class SecurityDialog extends BaseDialog {
    /**
     *  Waits for the settings dialog to be visible.
     */
    waitForDisplay() {
        return this.participant.driver.$(`.${DIALOG_CONTAINER}`).waitForDisplayed();
    }

    /**
     * Returns the switch that can be used to detect lobby state or change lobby state.
     * @private
     */
    private getLobbySwitch() {
        return this.participant.driver.$('#lobby-section-switch');
    }

    /**
     * Returns is the lobby enabled.
     */
    isLobbyEnabled() {
        return this.getLobbySwitch().isSelected();
    }

    /**
     * Toggles the lobby option from the security dialog.
     */
    async toggleLobby() {
        const lobbySwitch = this.getLobbySwitch();

        await lobbySwitch.moveTo();
        await lobbySwitch.click();
    }

    /**
     * Checks whether lobby section is present in the UI.
     */
    isLobbySectionPresent() {
        return this.getLobbySwitch().isExisting();
    }

    /**
     * Waits for the lobby to be enabled or disabled.
     * @param reverse
     */
    waitForLobbyEnabled(reverse = false) {
        const lobbySwitch = this.getLobbySwitch();

        return this.participant.driver.waitUntil(
            async () => await lobbySwitch.isSelected() !== reverse,
            {
                timeout: 5_000, // 30 seconds
                timeoutMsg: `Timeout waiting for lobby being ${reverse ? 'disabled' : 'enabled'} for ${
                    this.participant.name}.`
            }
        );
    }

    /**
     * Checks if the current conference is locked with a locally set password.
     *
     * @return {@code true} if the conference is displayed as locked locally in
     * the security dialog, {@code false} otherwise.
     */
    private isLockedLocally() {
        return this.participant.driver.$(`.${LOCAL_LOCK}`).isExisting();
    }

    /**
     * Checks if the current conference is locked with a locally set password.
     *
     * @return {@code true}  if the conference is displayed as locked remotely
     * in the security dialog, {@code false} otherwise.
     */
    private isLockedRemotely() {
        return this.participant.driver.$(`.${REMOTE_LOCK}`).isExisting();
    }

    /**
     * Checks if the current conference is locked based on the security dialog's
     * display state.
     *
     * @return {@code true} if the conference is displayed as locked in the
     * security dialog, {@code false} otherwise.
     */
    async isLocked() {
        return await this.isLockedLocally() || await this.isLockedRemotely();
    }

    /**
     * Sets a password on the current conference to lock it.
     *
     * @param password - The password to use to lock the conference.
     */
    async addPassword(password: string) {
        const addPasswordLink = this.participant.driver.$(`.${ADD_PASSWORD_LINK}`);

        await addPasswordLink.waitForClickable();
        await addPasswordLink.click();

        const passwordEntry = this.participant.driver.$(`#${ADD_PASSWORD_FIELD}`);

        await passwordEntry.waitForDisplayed();
        await passwordEntry.click();

        await this.participant.driver.keys(password);
        await this.participant.driver.$('button=Add').click();
    }

    /**
     * Removes the password from the current conference through the security dialog, if a password is set.
     */
    async removePassword() {
        if (!await this.isLocked()) {
            return;
        }

        const removePassword = this.participant.driver.$(`.${REMOVE_PASSWORD}`);

        await removePassword.waitForClickable();
        await removePassword.click();
    }
}
