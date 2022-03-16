/* eslint-disable no-undef */

/**
 * Define lobby reject notification element.
*/
class LobbyRejectNotification {

    /**
     * Lobby reject notification.
     *
     * @returns {HTMLElement}
     */
    get Notification() {
        return $('[data-testid="lobby.joinRejectedMessage"]');
    }
}
module.exports = new LobbyRejectNotification();
