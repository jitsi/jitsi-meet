/**
 * Define lobby reject notification element.
*/
class LobbyRejectNotification {

    //Lobby reject notification object
    get Notification() {
        return $('[data-testid="lobby.joinRejectedMessage"]');
    };
}
module.exports = new LobbyRejectNotification();