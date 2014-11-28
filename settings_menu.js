var SettingsMenu = (function(my) {

    var email = '';
    var displayName = '';
    var userId;

    if(supportsLocalStorage()) {
        if(!window.localStorage.jitsiMeetId) {
            window.localStorage.jitsiMeetId = generateUniqueId();
            console.log("generated id", window.localStorage.jitsiMeetId);
        }
        userId = window.localStorage.jitsiMeetId || '';
        email = window.localStorage.email || '';
        displayName = window.localStorage.displayname || '';
    } else {
        console.log("local storage is not supported");
        userId = generateUniqueId();
    }

    my.update = function() {
        var newDisplayName = Util.escapeHtml($('#setDisplayName').get(0).value);
        if(newDisplayName) {
            displayName = newDisplayName;
            connection.emuc.addDisplayNameToPresence(displayName);
            window.localStorage.displayname = displayName;
        }

        var newEmail = Util.escapeHtml($('#setEmail').get(0).value);
        connection.emuc.addEmailToPresence(newEmail);
        email = newEmail;
        window.localStorage.email = newEmail;

        connection.emuc.sendPresence();
        Avatar.setUserAvatar(connection.emuc.myroomjid, email);
    };

    my.isVisible = function() {
        return $('#settingsmenu').is(':visible');
    };

    my.getUID = function() {
        return userId;
    };

    my.getEmail = function() {
        return email;
    };

    my.getDisplayName = function() {
        return displayName;
    };

    my.setDisplayName = function(newDisplayName) {
        displayName = newDisplayName;
        window.localStorage.displayname = displayName;
        $('#setDisplayName').get(0).value = displayName;
    };

    function supportsLocalStorage() {
        try {
            return 'localStorage' in window && window.localStorage !== null;
        } catch (e) {
            console.log("localstorage is not supported");
            return false;
        }
    }

    function generateUniqueId() {
        function _p8() {
            return (Math.random().toString(16)+"000000000").substr(2,8);
        }
        return _p8() + _p8() + _p8() + _p8();
    }

    $(document).bind('displaynamechanged', function(event, peerJid, newDisplayName) {
       if(peerJid === 'localVideoContainer' ||
           peerJid === connection.emuc.myroomjid) {
           SettingsMenu.setDisplayName(newDisplayName);
       }
    });

    return my;
}(SettingsMenu || {}));
