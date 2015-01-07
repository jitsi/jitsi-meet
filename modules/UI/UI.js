var UI = {};

var VideoLayout = require("./videolayout/VideoLayout.js");
var AudioLevels = require("./audio_levels/AudioLevels.js");
var Prezi = require("./prezi/Prezi.js");
var Etherpad = require("./etherpad/Etherpad.js");
var Chat = require("./side_pannels/chat/Chat.js");
var Toolbar = require("./toolbars/toolbar");
var ToolbarToggler = require("./toolbars/toolbartoggler");
var BottomToolbar = require("./toolbars/BottomToolbar");
var ContactList = require("./side_pannels/contactlist/ContactList");
var Avatar = require("./avatar/Avatar");
//var EventEmitter = require("events");
var SettingsMenu = require("./side_pannels/settings/SettingsMenu");
var Settings = require("./side_pannels/settings/Settings");
var PanelToggler = require("./side_pannels/SidePanelToggler");
var RoomNameGenerator = require("./welcome_page/RoomnameGenerator");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;

//var eventEmitter = new EventEmitter();



function setupPrezi()
{
    $("#reloadPresentationLink").click(function()
    {
        Prezi.reloadPresentation();
    });
}

function setupChat()
{
    Chat.init();
    $("#toggle_smileys").click(function() {
        Chat.toggleSmileys();
    });
}

function setupToolbars() {
    Toolbar.init();
    Toolbar.setupButtonsFromConfig();
    BottomToolbar.init();
}


function registerListeners() {
    RTC.addStreamListener(function (stream) {
        switch (stream.type)
        {
            case "audio":
                VideoLayout.changeLocalAudio(stream.getOriginalStream());
                break;
            case "video":
                VideoLayout.changeLocalVideo(stream.getOriginalStream(), true);
                break;
            case "stream":
                VideoLayout.changeLocalStream(stream.getOriginalStream());
                break;
            case "desktop":
                VideoLayout.changeLocalVideo(stream, !isUsingScreenStream);
                break;
        }
    }, StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);

    RTC.addStreamListener(function (stream) {
        VideoLayout.onRemoteStreamAdded(stream);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CREATED);

    // Listen for large video size updates
    document.getElementById('largeVideo')
        .addEventListener('loadedmetadata', function (e) {
            currentVideoWidth = this.videoWidth;
            currentVideoHeight = this.videoHeight;
            VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
        });


    statistics.addAudioLevelListener(function(jid, audioLevel)
    {
        var resourceJid;
        if(jid === statistics.LOCAL_JID)
        {
            resourceJid = AudioLevels.LOCAL_LEVEL;
            if(isAudioMuted())
            {
                audioLevel = 0;
            }
        }
        else
        {
            resourceJid = Strophe.getResourceFromJid(jid);
        }

        AudioLevels.updateAudioLevel(resourceJid, audioLevel,
            UI.getLargeVideoState().userResourceJid);
    });

}

function bindEvents()
{
    /**
     * Resizes and repositions videos in full screen mode.
     */
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function () {
            VideoLayout.resizeLargeVideoContainer();
            VideoLayout.positionLarge();
            isFullScreen = document.fullScreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen;

        }
    );

    $(window).resize(function () {
        VideoLayout.resizeLargeVideoContainer();
        VideoLayout.positionLarge();
    });
}

UI.start = function () {
    document.title = interfaceConfig.APP_NAME;
    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled || window.localStorage.welcomePageDisabled == "false"))
    {
        $("#videoconference_page").hide();
        var setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#largeVideoContainer div[class='watermark leftwatermark']");

        leftWatermarkDiv.css({display: 'block'});
        leftWatermarkDiv.parent().get(0).href
            = interfaceConfig.JITSI_WATERMARK_LINK;
    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#largeVideoContainer div[class='watermark rightwatermark']");

        rightWatermarkDiv.css({display: 'block'});
        rightWatermarkDiv.parent().get(0).href
            = interfaceConfig.BRAND_WATERMARK_LINK;
        rightWatermarkDiv.get(0).style.backgroundImage
            = "url(images/rightwatermark.png)";
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#largeVideoContainer>a[class='poweredby']").css({display: 'block'});
    }

    $("#welcome_page").hide();

    $('body').popover({ selector: '[data-toggle=popover]',
        trigger: 'click hover',
        content: function() {
            return this.getAttribute("content") +
                KeyboardShortcut.getShortcut(this.getAttribute("shortcut"));
        }
    });
    VideoLayout.resizeLargeVideoContainer();
    $("#videospace").mousemove(function () {
        return ToolbarToggler.showToolbar();
    });
    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});

//    KeyboardShortcut.init();
    registerListeners();
    bindEvents();
    setupPrezi();
    setupToolbars();
    setupChat();

    document.title = interfaceConfig.APP_NAME;

    $("#downloadlog").click(function (event) {
        dump(event.target);
    });

    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled || window.localStorage.welcomePageDisabled == "false"))
    {
        $("#videoconference_page").hide();
        var setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    $("#welcome_page").hide();

    document.getElementById('largeVideo').volume = 0;

    if (!$('#settings').is(':visible')) {
        console.log('init');
        init();
    } else {
        loginInfo.onsubmit = function (e) {
            if (e.preventDefault) e.preventDefault();
            $('#settings').hide();
            init();
        };
    }

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "positionClass": "notification-bottom-right",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
        "reposition": function() {
            if(PanelToggler.isVisible()) {
                $("#toast-container").addClass("notification-bottom-right-center");
            } else {
                $("#toast-container").removeClass("notification-bottom-right-center");
            }
        },
        "newestOnTop": false
    };

    $('#settingsmenu>input').keyup(function(event){
        if(event.keyCode === 13) {//enter
            SettingsMenu.update();
        }
    });

    $("#updateSettings").click(function () {
        SettingsMenu.update();
    });

};


UI.setUserAvatar = function (jid, id) {
    Avatar.setUserAvatar(jid, id);
};

UI.toggleSmileys = function () {
    Chat.toggleSmileys();
};

UI.chatAddError = function(errorMessage, originalText)
{
    return Chat.chatAddError(errorMessage, originalText);
};

UI.chatSetSubject = function(text)
{
    return Chat.chatSetSubject(text);
};

UI.updateChatConversation = function (from, displayName, message) {
    return Chat.updateChatConversation(from, displayName, message);
};

UI.onMucJoined = function (jid, info) {
    Toolbar.updateRoomUrl(window.location.href);
    document.getElementById('localNick').appendChild(
        document.createTextNode(Strophe.getResourceFromJid(jid) + ' (me)')
    );

    var settings = Settings.getSettings();
    // Add myself to the contact list.
    ContactList.addContact(jid, settings.email || settings.uid);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    // Show authenticate button if needed
    Toolbar.showAuthenticateButton(
            Moderator.isExternalAuthEnabled() && !Moderator.isModerator());

    var displayName = !config.displayJids
        ? info.displayName : Strophe.getResourceFromJid(jid);

    if (displayName)
        $(document).trigger('displaynamechanged',
            ['localVideoContainer', displayName + ' (me)']);
};

UI.initEtherpad = function (name) {
    Etherpad.init(name);
};

UI.onMucLeft = function (jid) {
    console.log('left.muc', jid);
    var displayName = $('#participant_' + Strophe.getResourceFromJid(jid) +
        '>.displayname').html();
    messageHandler.notify(displayName || 'Somebody',
        'disconnected',
        'disconnected');
    // Need to call this with a slight delay, otherwise the element couldn't be
    // found for some reason.
    // XXX(gp) it works fine without the timeout for me (with Chrome 38).
    window.setTimeout(function () {
        var container = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(jid));
        if (container) {
            ContactList.removeContact(jid);
            VideoLayout.removeConnectionIndicator(jid);
            // hide here, wait for video to close before removing
            $(container).hide();
            VideoLayout.resizeThumbnails();
        }
    }, 10);

    // Unlock large video
    if (focusedVideoInfo && focusedVideoInfo.jid === jid)
    {
        console.info("Focused video owner has left the conference");
        focusedVideoInfo = null;
    }

};

UI.getSettings = function () {
    return Settings.getSettings();
};

UI.toggleFilmStrip = function () {
    return BottomToolbar.toggleFilmStrip();
};

UI.toggleChat = function () {
    return BottomToolbar.toggleChat();
};

UI.toggleContactList = function () {
    return BottomToolbar.toggleContactList();
};

UI.onLocalRoleChange = function (jid, info, pres) {

    console.info("My role changed, new role: " + info.role);
    var isModerator = Moderator.isModerator();

    VideoLayout.showModeratorIndicator();
    Toolbar.showAuthenticateButton(
            Moderator.isExternalAuthEnabled() && !isModerator);

    if (isModerator) {
        Toolbar.closeAuthenticationWindow();
        messageHandler.notify(
            'Me', 'connected', 'Moderator rights granted !');
    }
};

UI.onDisposeConference = function (unload) {
    Toolbar.showAuthenticateButton(false);
};

UI.onModeratorStatusChanged = function (isModerator) {

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
};

UI.onPasswordReqiured = function (callback) {
    // password is required
    Toolbar.lockLockButton();

    messageHandler.openTwoButtonDialog(null,
            '<h2>Password required</h2>' +
            '<input id="lockKey" type="text" placeholder="password" autofocus>',
        true,
        "Ok",
        function (e, v, m, f) {},
        function (event) {
            document.getElementById('lockKey').focus();
        },
        function (e, v, m, f) {
            if (v) {
                var lockKey = document.getElementById('lockKey');
                if (lockKey.value !== null) {
                    Toolbar.setSharedKey(lockKey.value);
                    callback(lockKey.value);
                }
            }
        }
    );
};

UI.onAuthenticationRequired = function () {
    // extract room name from 'room@muc.server.net'
    var room = roomName.substr(0, roomName.indexOf('@'));

    messageHandler.openDialog(
        'Stop',
            'Authentication is required to create room:<br/>' + room,
        true,
        {
            Authenticate: 'authNow',
            Close: 'close'
        },
        function (onSubmitEvent, submitValue) {
            console.info('On submit: ' + submitValue, submitValue);
            if (submitValue === 'authNow') {
                Toolbar.authenticateClicked();
            } else {
                Toolbar.showAuthenticateButton(true);
            }
        }
    );
};

UI.setRecordingButtonState = function (state) {
    Toolbar.setRecordingButtonState(state);
};

UI.changeDesktopSharingButtonState = function (isUsingScreenStream) {
    Toolbar.changeDesktopSharingButtonState(isUsingScreenStream);
};

UI.inputDisplayNameHandler = function (value) {
    VideoLayout.inputDisplayNameHandler(value);
};

UI.onMucEntered = function (jid, id, displayName) {
    messageHandler.notify(displayName || 'Somebody',
        'connected',
        'connected');

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid,id);

    if(APIConnector.isEnabled() &&
        APIConnector.isEventEnabled("participantJoined"))
    {
        APIConnector.triggerEvent("participantJoined",{jid: jid});
    }
};

UI.onMucPresenceStatus = function ( jid, info) {
    VideoLayout.setPresenceStatus(
            'participant_' + Strophe.getResourceFromJid(jid), info.status);
};

UI.onMucRoleChanged = function (role, displayName) {
    VideoLayout.showModeratorIndicator();

    if (role === 'moderator') {
        var displayName = displayName;
        if (!displayName) {
            displayName = 'Somebody';
        }
        messageHandler.notify(
            displayName,
            'connected',
                'Moderator rights granted to ' + displayName + '!');
    }
};

UI.updateLocalConnectionStats = function(percent, stats)
{
    VideoLayout.updateLocalConnectionStats(percent, stats);
};

UI.updateConnectionStats = function(jid, percent, stats)
{
    VideoLayout.updateConnectionStats(jid, percent, stats);
};

UI.onStatsStop = function () {
    VideoLayout.onStatsStop();
};

UI.getLargeVideoState = function()
{
    return VideoLayout.getLargeVideoState();
};

UI.showLocalAudioIndicator = function (mute) {
    VideoLayout.showLocalAudioIndicator(mute);
};

UI.changeLocalVideo = function (stream, flipx) {
    VideoLayout.changeLocalVideo(stream, flipx);
};

UI.generateRoomName = function() {
    var roomnode = null;
    var path = window.location.pathname;

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomnode = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * this is making assumptions about how the URL->room mapping happens.
         * It currently assumes deployment at root, with a rewrite like the
         * following one (for nginx):
         location ~ ^/([a-zA-Z0-9]+)$ {
         rewrite ^/(.*)$ / break;
         }
         */
        if (path.length > 1) {
            roomnode = path.substr(1).toLowerCase();
        } else {
            var word = RoomNameGenerator.generateRoomWithoutSeparator();
            roomnode = word.toLowerCase();

            window.history.pushState('VideoChat',
                    'Room: ' + word, window.location.pathname + word);
        }
    }

    roomName = roomnode + '@' + config.hosts.muc;
};


UI.connectionIndicatorShowMore = function(id)
{
    return VideoLayout.connectionIndicators[id].showMore();
}


module.exports = UI;

