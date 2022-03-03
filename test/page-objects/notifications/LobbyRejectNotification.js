class LobbyRejectNotification{
    get Notification() {
        const rejectedMessage = $('[data-testid="lobby.joinRejectedMessage"]');
        return rejectedMessage;
    };
}
module.exports = new LobbyRejectNotification();