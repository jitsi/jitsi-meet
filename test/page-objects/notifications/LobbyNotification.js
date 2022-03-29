/* eslint-disable no-undef */

/**
 * Define lobby notification elements.
*/
class LobbyNotification {

    /**
     * Initializes a new user browser instance.
     *
     * @param {Object} userBrowser - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(userBrowser) {
        this.userBrowser = userBrowser;
    }

    /**
     * Lobby notification element.
     *
     * @returns {HTMLElement}
     */
    get Notification() {
        return this.userBrowser.$('#notifications-container');
    }

    /**
     * View lobby button element.
     *
     * @returns {HTMLElement}
     */
    get ViewLobby() {
        return this.userBrowser.$('[data-testid="notify.viewLobby"]');
    }

    /**
     * Admit lobby button element.
     *
     * @returns {HTMLElement}
     */
    get AdmitLobby() {
        return this.userBrowser.$('[data-testid="lobby.admit"]');
    }

    /**
     * Reject lobby button element.
     *
     * @returns {HTMLElement}
     */
    get RejectLobby() {
        return this.userBrowser.$('[data-testid="lobby.reject"]');
    }
}
module.exports = LobbyNotification;
