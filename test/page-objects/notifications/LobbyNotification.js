class LobbyNotification{
    get Notification() {
        const notification = $('#notifications-container');
        return notification;
    };
    get ViewLobby() {
        const viewLobbyBtn = $('[data-testid="notify.viewLobby"]');
        return viewLobbyBtn;
    };
    get AdmitLobby() {
        const lobbyAdmitBtn = $('[data-testid="lobby.admit"]');
        return lobbyAdmitBtn;
    };
    get RejectLobby() {
        const lobbyRejectBtn = $('[data-testid="lobby.reject"]');
        return lobbyRejectBtn;
    };
}
module.exports = new LobbyNotification();