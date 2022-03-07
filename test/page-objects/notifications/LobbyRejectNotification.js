/**
 * Define lobby reject notification element.
*/
class LobbyRejectNotification {

    //Lobby reject notification object
    get Notification() {
        const rejectedMessage = $('[data-testid="lobby.joinRejectedMessage"]');
        return rejectedMessage;
    };
}
module.exports = new LobbyRejectNotification();