/**
 * Define lobby notification elements.
*/
class LobbyNotification {

    // Lobby notification object.
    get Notification() {
        const notification = $('#notifications-container');
        return notification;
    };

    // View lobby button object.
    get ViewLobby() {
        const viewLobbyBtn = $('[data-testid="notify.viewLobby"]');
        return viewLobbyBtn;
    };

    // Admit lobby button object.
    get AdmitLobby() {
        const lobbyAdmitBtn = $('[data-testid="lobby.admit"]');
        return lobbyAdmitBtn;
    };

    // Reject lobby button object.
    get RejectLobby() {
        const lobbyRejectBtn = $('[data-testid="lobby.reject"]');
        return lobbyRejectBtn;
    };
}
module.exports = new LobbyNotification();