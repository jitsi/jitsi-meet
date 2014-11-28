/* global $, config, connection, Etherpad, Toolbar, VideoLayout */
/**
 * Contains logic responsible for enabling/disabling functionality available
 * only to moderator users.
 */
var Moderator = (function (my) {

    my.isModerator = function () {
        return connection.emuc.isModerator();
    };

    my.onModeratorStatusChanged = function (isModerator) {

        Toolbar.showSipCallButton(isModerator);
        Toolbar.showRecordingButton(
                isModerator); //&&
                // FIXME:
                // Recording visible if
                // there are at least 2(+ 1 focus) participants
                //Object.keys(connection.emuc.members).length >= 3);

        if (isModerator && config.etherpad_base) {
            Etherpad.init();
        }

        $(document).trigger('local.role.moderator', [isModerator]);
    };

    my.init = function () {
        $(document).bind(
            'role.changed.muc',
            function (event, jid, info, pres) {
                console.info(
                    "Role changed for " + jid + ", new role: " + info.role);
                VideoLayout.showModeratorIndicator();
            }
        );

        $(document).bind(
            'local.role.changed.muc',
            function (event, jid, info, pres) {
                console.info("My role changed, new role: " + info.role);
                VideoLayout.showModeratorIndicator();
                Moderator.onModeratorStatusChanged(Moderator.isModerator());
            }
        );
    };

    return my;
}(Moderator || {}));



