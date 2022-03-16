/* eslint-disable no-undef */

/**
 * Define lobby notification elements.
*/
class LobbyNotification {

    /**
     * Lobby notification element.
     *
     * @returns {HTMLElement}
     */
    get Notification() {
        return $('#notifications-container');
    }

    /**
     * View lobby button element.
     *
     * @returns {HTMLElement}
     */
    get ViewLobby() {
        return $('[data-testid="notify.viewLobby"]');
    }

    /**
     * Admit lobby button element.
     *
     * @returns {HTMLElement}
     */
    get AdmitLobby() {
        return $('[data-testid="lobby.admit"]');
    }

    /**
     * Reject lobby button element.
     *
     * @returns {HTMLElement}
     */
    get RejectLobby() {
        return $('[data-testid="lobby.reject"]');
    }
}
module.exports = new LobbyNotification();
