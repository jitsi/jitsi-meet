/* eslint-disable no-undef */

/**
 * Define lobby reject notification element.
*/
class LobbyRejectNotification {

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
     * Lobby reject notification.
     *
     * @returns {HTMLElement}
     */
    get Notification() {
        return this.userBrowser.$('[data-testid="lobby.joinRejectedMessage"]');
    }
}
module.exports = LobbyRejectNotification;
