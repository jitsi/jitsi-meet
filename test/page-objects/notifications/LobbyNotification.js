/**
 * Define lobby notification elements.
*/
class LobbyNotification {

    // Lobby notification object.
    get Notification() {
        return  $('#notifications-container');
    };

    // View lobby button object.
    get ViewLobby() {
        return $('[data-testid="notify.viewLobby"]');
    };

    // Admit lobby button object.
    get AdmitLobby() {
        return  $('[data-testid="lobby.admit"]');
    };

    // Reject lobby button object.
    get RejectLobby() {
        return $('[data-testid="lobby.reject"]');
    };
}
module.exports = new LobbyNotification();