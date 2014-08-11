var Toolbar = (function (my) {
    var INITIAL_TOOLBAR_TIMEOUT = 20000;
    var TOOLBAR_TIMEOUT = INITIAL_TOOLBAR_TIMEOUT;

    /**
     * Opens the lock room dialog.
     */
    my.openLockDialog = function () {
        // Only the focus is able to set a shared key.
        if (focus === null) {
            if (sharedKey)
                $.prompt("This conversation is currently protected by"
                        + " a shared secret key.",
                    {
                        title: "Secrect key",
                        persistent: false
                    }
                );
            else
                $.prompt("This conversation isn't currently protected by"
                        + " a secret key. Only the owner of the conference" +
                        + " could set a shared key.",
                    {
                        title: "Secrect key",
                        persistent: false
                    }
                );
        } else {
            if (sharedKey) {
                $.prompt("Are you sure you would like to remove your secret key?",
                    {
                        title: "Remove secret key",
                        persistent: false,
                        buttons: { "Remove": true, "Cancel": false},
                        defaultButton: 1,
                        submit: function (e, v, m, f) {
                            if (v) {
                                setSharedKey('');
                                lockRoom(false);
                            }
                        }
                    }
                );
            } else {
                $.prompt('<h2>Set a secret key to lock your room</h2>' +
                         '<input id="lockKey" type="text" placeholder="your shared key" autofocus>',
                    {
                        persistent: false,
                        buttons: { "Save": true, "Cancel": false},
                        defaultButton: 1,
                        loaded: function (event) {
                            document.getElementById('lockKey').focus();
                        },
                        submit: function (e, v, m, f) {
                            if (v) {
                                var lockKey = document.getElementById('lockKey');
    
                                if (lockKey.value) {
                                    setSharedKey(Util.escapeHtml(lockKey.value));
                                    lockRoom(true);
                                }
                            }
                        }
                    }
                );
            }
        }
    };

    /**
     * Opens the invite link dialog.
     */
    my.openLinkDialog = function () {
        var inviteLink;
        if (roomUrl == null)
            inviteLink = "Your conference is currently being created...";
        else
            inviteLink = encodeURI(roomUrl);

        $.prompt('<input id="inviteLinkRef" type="text" value="' +
                inviteLink + '" onclick="this.select();" readonly>',
                {
                    title: "Share this link with everyone you want to invite",
                    persistent: false,
                    buttons: { "Invite": true, "Cancel": false},
                    defaultButton: 1,
                    loaded: function (event) {
                        if (roomUrl)
                            document.getElementById('inviteLinkRef').select();
                        else
                            document.getElementById('jqi_state0_buttonInvite')
                                .disabled = true;
                    },
                    submit: function (e, v, m, f) {
                        if (v) {
                            if (roomUrl) {
                                inviteParticipants();
                            }
                        }
                    }
                }
            );
    };

    /**
     * Invite participants to conference.
     */
    function inviteParticipants() {
        if (roomUrl == null)
            return;

        var sharedKeyText = "";
        if (sharedKey && sharedKey.length > 0)
            sharedKeyText
                = "This conference is password protected. Please use the "
                    + "following pin when joining:%0D%0A%0D%0A"
                    + sharedKey + "%0D%0A%0D%0A";

        var conferenceName = roomUrl.substring(roomUrl.lastIndexOf('/') + 1);
        var subject = "Invitation to a Jitsi Meet (" + conferenceName + ")";
        var body = "Hey there, I%27d like to invite you to a Jitsi Meet"
                    + " conference I%27ve just set up.%0D%0A%0D%0A"
                    + "Please click on the following link in order"
                    + " to join the conference.%0D%0A%0D%0A"
                    + roomUrl + "%0D%0A%0D%0A"
                    + sharedKeyText
                    + "Note that Jitsi Meet is currently only supported by Chromium,"
                    + " Google Chrome and Opera, so you need"
                    + " to be using one of these browsers.%0D%0A%0D%0A"
                    + "Talk to you in a sec!";

        if (window.localStorage.displayname)
            body += "%0D%0A%0D%0A" + window.localStorage.displayname;

        window.open("mailto:?subject=" + subject + "&body=" + body, '_blank');
    }

    /**
     * Opens the settings dialog.
     */
    my.openSettingsDialog = function () {
        $.prompt('<h2>Configure your conference</h2>' +
            '<input type="checkbox" id="initMuted"> Participants join muted<br/>' +
            '<input type="checkbox" id="requireNicknames"> Require nicknames<br/><br/>' +
            'Set a secret key to lock your room: <input id="lockKey" type="text" placeholder="your shared key" autofocus>',
            {
                persistent: false,
                buttons: { "Save": true, "Cancel": false},
                defaultButton: 1,
                loaded: function (event) {
                    document.getElementById('lockKey').focus();
                },
                submit: function (e, v, m, f) {
                    if (v) {
                        if ($('#initMuted').is(":checked")) {
                            // it is checked
                        }
    
                        if ($('#requireNicknames').is(":checked")) {
                            // it is checked
                        }
                        /*
                        var lockKey = document.getElementById('lockKey');
    
                        if (lockKey.value)
                        {
                            setSharedKey(lockKey.value);
                            lockRoom(true);
                        }
                        */
                    }
                }
            }
        );
    };

    /**
     * Toggles the application in and out of full screen mode
     * (a.k.a. presentation mode in Chrome).
     */
    my.toggleFullScreen = function() {
        var fsElement = document.documentElement;

        if (!document.mozFullScreen && !document.webkitIsFullScreen) {
            //Enter Full Screen
            if (fsElement.mozRequestFullScreen) {
                fsElement.mozRequestFullScreen();
            }
            else {
                fsElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            //Exit Full Screen
            if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else {
                document.webkitCancelFullScreen();
            }
        }
    };

    /**
     * Shows the main toolbar.
     */
    my.showToolbar = function() {
        if (!$('#header').is(':visible')) {
            $('#header').show("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "+=40"}, 300);

            if (toolbarTimeout) {
                clearTimeout(toolbarTimeout);
                toolbarTimeout = null;
            }
            toolbarTimeout = setTimeout(hideToolbar, TOOLBAR_TIMEOUT);
            TOOLBAR_TIMEOUT = 4000;
        }

        if (focus != null)
        {
//            TODO: Enable settings functionality. Need to uncomment the settings button in index.html.
//            $('#settingsButton').css({visibility:"visible"});
        }

        // Show/hide desktop sharing button
        showDesktopSharingButton();
    };

    /**
     * Docks/undocks the toolbar.
     *
     * @param isDock indicates what operation to perform
     */
    my.dockToolbar = function(isDock) {
        if (isDock) {
            // First make sure the toolbar is shown.
            if (!$('#header').is(':visible')) {
                Toolbar.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            if (toolbarTimeout) {
                clearTimeout(toolbarTimeout);
                toolbarTimeout = null;
            }
        }
        else {
            if (!$('#header').is(':visible')) {
                Toolbar.showToolbar();
            }
            else {
                toolbarTimeout = setTimeout(hideToolbar, TOOLBAR_TIMEOUT);
            }
        }
    };

    /**
     * Updates the lock button state.
     */
    my.updateLockButton = function() {
        buttonClick("#lockIcon", "icon-security icon-security-locked");
    };

    /**
     * Hides the toolbar.
     */
    var hideToolbar = function () {
        var isToolbarHover = false;
        $('#header').find('*').each(function () {
            var id = $(this).attr('id');
            if ($("#" + id + ":hover").length > 0) {
                isToolbarHover = true;
            }
        });

        clearTimeout(toolbarTimeout);
        toolbarTimeout = null;

        if (!isToolbarHover) {
            $('#header').hide("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "-=40"}, 300);
        }
        else {
            toolbarTimeout = setTimeout(hideToolbar, TOOLBAR_TIMEOUT);
        }
    };

    // Shows or hides the 'recording' button.
    my.showRecordingButton = function (show) {
        if (!config.enableRecording) {
            return;
        }

        if (show) {
            $('#recording').css({display: "inline"});
        }
        else {
            $('#recording').css({display: "none"});
        }
    };

    // Toggle the state of the recording button
    my.toggleRecordingButtonState = function() {
        $('#recordButton').toggleClass('active');
    };

    // Shows or hides SIP calls button
    my.showSipCallButton = function (show)
    {
        if (config.hosts.call_control && show)
        {
            $('#sipCallButton').css({display: "inline"});
        }
        else
        {
            $('#sipCallButton').css({display: "none"});
        }
    };

    return my;
}(Toolbar || {}));
