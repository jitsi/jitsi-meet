!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.UI=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
var Authentication  = require("./authentication/Authentication");
var UIUtil = require("./util/UIUtil");

//var eventEmitter = new EventEmitter();
var roomName = null;


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
    Toolbar.init(UI);
    Toolbar.setupButtonsFromConfig();
    BottomToolbar.init();
}

function streamHandler(stream) {
    switch (stream.type)
    {
        case "audio":
            VideoLayout.changeLocalAudio(stream);
            break;
        case "video":
            VideoLayout.changeLocalVideo(stream);
            break;
        case "stream":
            VideoLayout.changeLocalStream(stream);
            break;
        case "desktop":
            VideoLayout.changeLocalVideo(stream);
            break;
    }
}

function onDisposeConference(unload) {
    Toolbar.showAuthenticateButton(false);
};

function onDisplayNameChanged(jid, displayName) {
    ContactList.onDisplayNameChange(jid, displayName);
    SettingsMenu.onDisplayNameChange(jid, displayName);
    VideoLayout.onDisplayNameChanged(jid, displayName);
}

function registerListeners() {
    RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);

    RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED);
    RTC.addStreamListener(function (stream) {
        VideoLayout.onRemoteStreamAdded(stream);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CREATED);

    VideoLayout.init();

    statistics.addAudioLevelListener(function(jid, audioLevel)
    {
        var resourceJid;
        if(jid === statistics.LOCAL_JID)
        {
            resourceJid = AudioLevels.LOCAL_LEVEL;
            if(RTC.localAudio.isMuted())
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
    desktopsharing.addListener(function () {
        ToolbarToggler.showDesktopSharingButton();
    }, DesktopSharingEventTypes.INIT);
    desktopsharing.addListener(
        Toolbar.changeDesktopSharingButtonState,
        DesktopSharingEventTypes.SWITCHING_DONE);
    xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
    xmpp.addListener(XMPPEvents.KICKED, function () {
        messageHandler.openMessageDialog("Session Terminated",
            "Ouch! You have been kicked out of the meet!");
    });
    xmpp.addListener(XMPPEvents.BRIDGE_DOWN, function () {
        messageHandler.showError("Error",
            "Jitsi Videobridge is currently unavailable. Please try again later!");
    });
    xmpp.addListener(XMPPEvents.USER_ID_CHANGED, Avatar.setUserAvatar);
    xmpp.addListener(XMPPEvents.CHANGED_STREAMS, function (jid, changedStreams) {
        for(stream in changedStreams)
        {
            // might need to update the direction if participant just went from sendrecv to recvonly
            if (stream.type === 'video' || stream.type === 'screen') {
                var el = $('#participant_'  + Strophe.getResourceFromJid(jid) + '>video');
                switch (stream.direction) {
                    case 'sendrecv':
                        el.show();
                        break;
                    case 'recvonly':
                        el.hide();
                        // FIXME: Check if we have to change large video
                        //VideoLayout.updateLargeVideo(el);
                        break;
                }
            }
        }

    });
    xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, onDisplayNameChanged);
    xmpp.addListener(XMPPEvents.MUC_JOINED, onMucJoined);
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

function onMucJoined(jid, info) {
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
            xmpp.isExternalAuthEnabled() && !xmpp.isModerator());

    var displayName = !config.displayJids
        ? info.displayName : Strophe.getResourceFromJid(jid);

    if (displayName)
        onDisplayNameChanged('localVideoContainer', displayName + ' (me)');
}

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
    var isModerator = xmpp.isModerator();

    VideoLayout.showModeratorIndicator();
    Toolbar.showAuthenticateButton(
            xmpp.isExternalAuthEnabled() && !isModerator);

    if (isModerator) {
        Authentication.closeAuthenticationWindow();
        messageHandler.notify(
            'Me', 'connected', 'Moderator rights granted !');
    }
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

UI.onAuthenticationRequired = function (intervalCallback) {
    Authentication.openAuthenticationDialog(
        roomName, intervalCallback, function () {
            Toolbar.authenticateClicked();
        });
};

UI.setRecordingButtonState = function (state) {
    Toolbar.setRecordingButtonState(state);
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

UI.generateRoomName = function() {
    if(roomName)
        return roomName;
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
    return roomName;
};


UI.connectionIndicatorShowMore = function(id)
{
    return VideoLayout.connectionIndicators[id].showMore();
};

UI.showToolbar = function () {
    return ToolbarToggler.showToolbar();
};

UI.dockToolbar = function (isDock) {
    return ToolbarToggler.dockToolbar(isDock);
};

UI.getCreadentials = function () {
    return {
        bosh: document.getElementById('boshURL').value,
        password: document.getElementById('password').value,
        jid: document.getElementById('jid').value
    };
};

UI.disableConnect = function () {
    document.getElementById('connect').disabled = true;
};

UI.showLoginPopup = function(callback)
{
    console.log('password is required');

    UI.messageHandler.openTwoButtonDialog(null,
            '<h2>Password required</h2>' +
            '<input id="passwordrequired.username" type="text" placeholder="user@domain.net" autofocus>' +
            '<input id="passwordrequired.password" type="password" placeholder="user password">',
        true,
        "Ok",
        function (e, v, m, f) {
            if (v) {
                var username = document.getElementById('passwordrequired.username');
                var password = document.getElementById('passwordrequired.password');

                if (username.value !== null && password.value != null) {
                    callback(username.value, password.value);
                }
            }
        },
        function (event) {
            document.getElementById('passwordrequired.username').focus();
        }
    );
}

UI.checkForNicknameAndJoin = function () {

    Authentication.closeAuthenticationDialog();
    Authentication.stopInterval();

    var nick = null;
    if (config.useNicks) {
        nick = window.prompt('Your nickname (optional)');
    }
    xmpp.joinRooom(roomName, config.useNicks, nick);
}


function dump(elem, filename) {
    elem = elem.parentNode;
    elem.download = filename || 'meetlog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = xmpp.populateData();
    var metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    var log = xmpp.getLogger();
    if (log) {
        metadata.xmpp = log;
    }
    data.metadata = metadata;
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}

UI.getRoomName = function () {
    return roomName;
}

/**
 * Mutes/unmutes the local video.
 *
 * @param mute <tt>true</tt> to mute the local video; otherwise, <tt>false</tt>
 * @param options an object which specifies optional arguments such as the
 * <tt>boolean</tt> key <tt>byUser</tt> with default value <tt>true</tt> which
 * specifies whether the method was initiated in response to a user command (in
 * contrast to an automatic decision taken by the application logic)
 */
function setVideoMute(mute, options) {
    xmpp.setVideoMute(
        mute,
        function (mute) {
            var video = $('#video');
            var communicativeClass = "icon-camera";
            var muteClass = "icon-camera icon-camera-disabled";

            if (mute) {
                video.removeClass(communicativeClass);
                video.addClass(muteClass);
            } else {
                video.removeClass(muteClass);
                video.addClass(communicativeClass);
            }
        },
        options);
}

/**
 * Mutes/unmutes the local video.
 */
UI.toggleVideo = function () {
    UIUtil.buttonClick("#video", "icon-camera icon-camera-disabled");

    setVideoMute(!RTC.localVideo.isMuted());
};

/**
 * Mutes / unmutes audio for the local participant.
 */
UI.toggleAudio = function() {
    UI.setAudioMuted(!RTC.localAudio.isMuted());
};

/**
 * Sets muted audio state for the local participant.
 */
UI.setAudioMuted = function (mute) {

    if(!xmpp.setAudioMute(mute, function () {
        UI.showLocalAudioIndicator(mute);

        UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
    }))
    {
        // We still click the button.
        UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
        return;
    }

}

UI.onLastNChanged = function (oldValue, newValue) {
    if (config.muteLocalVideoIfNotInLastN) {
        setVideoMute(!newValue, { 'byUser': false });
    }
}

module.exports = UI;


},{"./audio_levels/AudioLevels.js":2,"./authentication/Authentication":4,"./avatar/Avatar":5,"./etherpad/Etherpad.js":6,"./prezi/Prezi.js":7,"./side_pannels/SidePanelToggler":8,"./side_pannels/chat/Chat.js":9,"./side_pannels/contactlist/ContactList":13,"./side_pannels/settings/Settings":14,"./side_pannels/settings/SettingsMenu":15,"./toolbars/BottomToolbar":16,"./toolbars/toolbar":18,"./toolbars/toolbartoggler":19,"./util/MessageHandler":21,"./util/UIUtil":22,"./videolayout/VideoLayout.js":24,"./welcome_page/RoomnameGenerator":25,"./welcome_page/WelcomePage":26}],2:[function(require,module,exports){
var CanvasUtil = require("./CanvasUtils");

/**
 * The audio Levels plugin.
 */
var AudioLevels = (function(my) {
    var audioLevelCanvasCache = {};

    my.LOCAL_LEVEL = 'local';

    /**
     * Updates the audio level canvas for the given peerJid. If the canvas
     * didn't exist we create it.
     */
    my.updateAudioLevelCanvas = function (peerJid, VideoLayout) {
        var resourceJid = null;
        var videoSpanId = null;
        if (!peerJid)
            videoSpanId = 'localVideoContainer';
        else {
            resourceJid = Strophe.getResourceFromJid(peerJid);

            videoSpanId = 'participant_' + resourceJid;
        }

        var videoSpan = document.getElementById(videoSpanId);

        if (!videoSpan) {
            if (resourceJid)
                console.error("No video element for jid", resourceJid);
            else
                console.error("No video element for local video.");

            return;
        }

        var audioLevelCanvas = $('#' + videoSpanId + '>canvas');

        var videoSpaceWidth = $('#remoteVideos').width();
        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var thumbnailWidth = thumbnailSize[0];
        var thumbnailHeight = thumbnailSize[1];

        if (!audioLevelCanvas || audioLevelCanvas.length === 0) {

            audioLevelCanvas = document.createElement('canvas');
            audioLevelCanvas.className = "audiolevel";
            audioLevelCanvas.style.bottom = "-" + interfaceConfig.CANVAS_EXTRA/2 + "px";
            audioLevelCanvas.style.left = "-" + interfaceConfig.CANVAS_EXTRA/2 + "px";
            resizeAudioLevelCanvas( audioLevelCanvas,
                    thumbnailWidth,
                    thumbnailHeight);

            videoSpan.appendChild(audioLevelCanvas);
        } else {
            audioLevelCanvas = audioLevelCanvas.get(0);

            resizeAudioLevelCanvas( audioLevelCanvas,
                    thumbnailWidth,
                    thumbnailHeight);
        }
    };

    /**
     * Updates the audio level UI for the given resourceJid.
     *
     * @param resourceJid the resource jid indicating the video element for
     * which we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    my.updateAudioLevel = function (resourceJid, audioLevel, largeVideoResourceJid) {
        drawAudioLevelCanvas(resourceJid, audioLevel);

        var videoSpanId = getVideoSpanId(resourceJid);

        var audioLevelCanvas = $('#' + videoSpanId + '>canvas').get(0);

        if (!audioLevelCanvas)
            return;

        var drawContext = audioLevelCanvas.getContext('2d');

        var canvasCache = audioLevelCanvasCache[resourceJid];

        drawContext.clearRect (0, 0,
                audioLevelCanvas.width, audioLevelCanvas.height);
        drawContext.drawImage(canvasCache, 0, 0);

        if(resourceJid === AudioLevels.LOCAL_LEVEL) {
            if(!xmpp.myJid()) {
                return;
            }
            resourceJid = xmpp.myResource();
        }

        if(resourceJid  === largeVideoResourceJid) {
            AudioLevels.updateActiveSpeakerAudioLevel(audioLevel);
        }
    };

    my.updateActiveSpeakerAudioLevel = function(audioLevel) {
        var drawContext = $('#activeSpeakerAudioLevel')[0].getContext('2d');
        var r = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE / 2;
        var center = (interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE + r) / 2;

        // Save the previous state of the context.
        drawContext.save();

        drawContext.clearRect(0, 0, 300, 300);

        // Draw a circle.
        drawContext.arc(center, center, r, 0, 2 * Math.PI);

        // Add a shadow around the circle
        drawContext.shadowColor = interfaceConfig.SHADOW_COLOR;
        drawContext.shadowBlur = getShadowLevel(audioLevel);
        drawContext.shadowOffsetX = 0;
        drawContext.shadowOffsetY = 0;

        // Fill the shape.
        drawContext.fill();

        drawContext.save();

        drawContext.restore();


        drawContext.arc(center, center, r, 0, 2 * Math.PI);

        drawContext.clip();
        drawContext.clearRect(0, 0, 277, 200);

        // Restore the previous context state.
        drawContext.restore();
    };

    /**
     * Resizes the given audio level canvas to match the given thumbnail size.
     */
    function resizeAudioLevelCanvas(audioLevelCanvas,
                                    thumbnailWidth,
                                    thumbnailHeight) {
        audioLevelCanvas.width = thumbnailWidth + interfaceConfig.CANVAS_EXTRA;
        audioLevelCanvas.height = thumbnailHeight + interfaceConfig.CANVAS_EXTRA;
    }

    /**
     * Draws the audio level canvas into the cached canvas object.
     *
     * @param resourceJid the resource jid indicating the video element for
     * which we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    function drawAudioLevelCanvas(resourceJid, audioLevel) {
        if (!audioLevelCanvasCache[resourceJid]) {

            var videoSpanId = getVideoSpanId(resourceJid);

            var audioLevelCanvasOrig = $('#' + videoSpanId + '>canvas').get(0);

            /*
             * FIXME Testing has shown that audioLevelCanvasOrig may not exist.
             * In such a case, the method CanvasUtil.cloneCanvas may throw an
             * error. Since audio levels are frequently updated, the errors have
             * been observed to pile into the console, strain the CPU.
             */
            if (audioLevelCanvasOrig)
            {
                audioLevelCanvasCache[resourceJid]
                    = CanvasUtil.cloneCanvas(audioLevelCanvasOrig);
            }
        }

        var canvas = audioLevelCanvasCache[resourceJid];

        if (!canvas)
            return;

        var drawContext = canvas.getContext('2d');

        drawContext.clearRect(0, 0, canvas.width, canvas.height);

        var shadowLevel = getShadowLevel(audioLevel);

        if (shadowLevel > 0)
            // drawContext, x, y, w, h, r, shadowColor, shadowLevel
            CanvasUtil.drawRoundRectGlow(   drawContext,
                interfaceConfig.CANVAS_EXTRA/2, interfaceConfig.CANVAS_EXTRA/2,
                canvas.width - interfaceConfig.CANVAS_EXTRA,
                canvas.height - interfaceConfig.CANVAS_EXTRA,
                interfaceConfig.CANVAS_RADIUS,
                interfaceConfig.SHADOW_COLOR,
                shadowLevel);
    }

    /**
     * Returns the shadow/glow level for the given audio level.
     *
     * @param audioLevel the audio level from which we determine the shadow
     * level
     */
    function getShadowLevel (audioLevel) {
        var shadowLevel = 0;

        if (audioLevel <= 0.3) {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*(audioLevel/0.3));
        }
        else if (audioLevel <= 0.6) {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.3) / 0.3));
        }
        else {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.6) / 0.4));
        }
        return shadowLevel;
    }

    /**
     * Returns the video span id corresponding to the given resourceJid or local
     * user.
     */
    function getVideoSpanId(resourceJid) {
        var videoSpanId = null;
        if (resourceJid === AudioLevels.LOCAL_LEVEL
                || (xmpp.myResource() && resourceJid
                    === xmpp.myResource()))
            videoSpanId = 'localVideoContainer';
        else
            videoSpanId = 'participant_' + resourceJid;

        return videoSpanId;
    }

    /**
     * Indicates that the remote video has been resized.
     */
    $(document).bind('remotevideo.resized', function (event, width, height) {
        var resized = false;
        $('#remoteVideos>span>canvas').each(function() {
            var canvas = $(this).get(0);
            if (canvas.width !== width + interfaceConfig.CANVAS_EXTRA) {
                canvas.width = width + interfaceConfig.CANVAS_EXTRA;
                resized = true;
            }

            if (canvas.heigh !== height + interfaceConfig.CANVAS_EXTRA) {
                canvas.height = height + interfaceConfig.CANVAS_EXTRA;
                resized = true;
            }
        });

        if (resized)
            Object.keys(audioLevelCanvasCache).forEach(function (resourceJid) {
                audioLevelCanvasCache[resourceJid].width
                    = width + interfaceConfig.CANVAS_EXTRA;
                audioLevelCanvasCache[resourceJid].height
                    = height + interfaceConfig.CANVAS_EXTRA;
            });
    });

    return my;

})(AudioLevels || {});

module.exports = AudioLevels;
},{"./CanvasUtils":3}],3:[function(require,module,exports){
/**
 * Utility class for drawing canvas shapes.
 */
var CanvasUtil = (function(my) {

    /**
     * Draws a round rectangle with a glow. The glowWidth indicates the depth
     * of the glow.
     *
     * @param drawContext the context of the canvas to draw to
     * @param x the x coordinate of the round rectangle
     * @param y the y coordinate of the round rectangle
     * @param w the width of the round rectangle
     * @param h the height of the round rectangle
     * @param glowColor the color of the glow
     * @param glowWidth the width of the glow
     */
    my.drawRoundRectGlow
        = function(drawContext, x, y, w, h, r, glowColor, glowWidth) {

        // Save the previous state of the context.
        drawContext.save();

        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;

        // Draw a round rectangle.
        drawContext.beginPath();
        drawContext.moveTo(x+r, y);
        drawContext.arcTo(x+w, y,   x+w, y+h, r);
        drawContext.arcTo(x+w, y+h, x,   y+h, r);
        drawContext.arcTo(x,   y+h, x,   y,   r);
        drawContext.arcTo(x,   y,   x+w, y,   r);
        drawContext.closePath();

        // Add a shadow around the rectangle
        drawContext.shadowColor = glowColor;
        drawContext.shadowBlur = glowWidth;
        drawContext.shadowOffsetX = 0;
        drawContext.shadowOffsetY = 0;

        // Fill the shape.
        drawContext.fill();

        drawContext.save();

        drawContext.restore();

//      1) Uncomment this line to use Composite Operation, which is doing the
//      same as the clip function below and is also antialiasing the round
//      border, but is said to be less fast performance wise.

//      drawContext.globalCompositeOperation='destination-out';

        drawContext.beginPath();
        drawContext.moveTo(x+r, y);
        drawContext.arcTo(x+w, y,   x+w, y+h, r);
        drawContext.arcTo(x+w, y+h, x,   y+h, r);
        drawContext.arcTo(x,   y+h, x,   y,   r);
        drawContext.arcTo(x,   y,   x+w, y,   r);
        drawContext.closePath();

//      2) Uncomment this line to use Composite Operation, which is doing the
//      same as the clip function below and is also antialiasing the round
//      border, but is said to be less fast performance wise.

//      drawContext.fill();

        // Comment these two lines if choosing to do the same with composite
        // operation above 1 and 2.
        drawContext.clip();
        drawContext.clearRect(0, 0, 277, 200);

        // Restore the previous context state.
        drawContext.restore();
    };

    /**
     * Clones the given canvas.
     *
     * @return the new cloned canvas.
     */
    my.cloneCanvas = function (oldCanvas) {
        /*
         * FIXME Testing has shown that oldCanvas may not exist. In such a case,
         * the method CanvasUtil.cloneCanvas may throw an error. Since audio
         * levels are frequently updated, the errors have been observed to pile
         * into the console, strain the CPU.
         */
        if (!oldCanvas)
            return oldCanvas;

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    };

    return my;
})(CanvasUtil || {});

module.exports = CanvasUtil;
},{}],4:[function(require,module,exports){
/* Initial "authentication required" dialog */
var authDialog = null;
/* Loop retry ID that wits for other user to create the room */
var authRetryId = null;
var authenticationWindow = null;

var Authentication = {
    openAuthenticationDialog: function (roomName, intervalCallback, callback) {
        // This is the loop that will wait for the room to be created by
        // someone else. 'auth_required.moderator' will bring us back here.
        authRetryId = window.setTimeout(intervalCallback , 5000);
        // Show prompt only if it's not open
        if (authDialog !== null) {
            return;
        }
        // extract room name from 'room@muc.server.net'
        var room = roomName.substr(0, roomName.indexOf('@'));

        authDialog = messageHandler.openDialog(
            'Stop',
                'Authentication is required to create room:<br/><b>' + room +
                '</b></br> You can either authenticate to create the room or ' +
                'just wait for someone else to do so.',
            true,
            {
                Authenticate: 'authNow'
            },
            function (onSubmitEvent, submitValue) {

                // Do not close the dialog yet
                onSubmitEvent.preventDefault();

                // Open login popup
                if (submitValue === 'authNow') {
                    callback();
                }
            }
        );
    },
    closeAuthenticationWindow:function () {
        if (authenticationWindow) {
            authenticationWindow.close();
            authenticationWindow = null;
        }
    },
    focusAuthenticationWindow: function () {
        // If auth window exists just bring it to the front
        if (authenticationWindow) {
            authenticationWindow.focus();
            return;
        }
    },
    closeAuthenticationDialog: function () {
        // Close authentication dialog if opened
        if (authDialog) {
            UI.messageHandler.closeDialog();
            authDialog = null;
        }
    },
    createAuthenticationWindow: function (callback, url) {
        authenticationWindow = messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            function () {
                // Close authentication dialog if opened
                if (authDialog) {
                    messageHandler.closeDialog();
                    authDialog = null;
                }
                callback();
                authenticationWindow = null;
            });
        return authenticationWindow;
    },
    stopInterval: function () {
        // Clear retry interval, so that we don't call 'doJoinAfterFocus' twice
        if (authRetryId) {
            window.clearTimeout(authRetryId);
            authRetryId = null;
        }
    }
};

module.exports = Authentication;
},{}],5:[function(require,module,exports){
var Settings = require("../side_pannels/settings/Settings");

var users = {};
var activeSpeakerJid;

function setVisibility(selector, show) {
    if (selector && selector.length > 0) {
        selector.css("visibility", show ? "visible" : "hidden");
    }
}

function isUserMuted(jid) {
    // XXX(gp) we may want to rename this method to something like
    // isUserStreaming, for example.
    if (jid && jid != xmpp.myJid()) {
        var resource = Strophe.getResourceFromJid(jid);
        if (!require("../videolayout/VideoLayout").isInLastN(resource)) {
            return true;
        }
    }

    if (!RTC.remoteStreams[jid] || !RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
        return null;
    }
    return RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE].muted;
}

function getGravatarUrl(id, size) {
    if(id === xmpp.myJid() || !id) {
        id = Settings.getSettings().uid;
    }
    return 'https://www.gravatar.com/avatar/' +
        MD5.hexdigest(id.trim().toLowerCase()) +
        "?d=wavatar&size=" + (size || "30");
}

var Avatar = {

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param jid jid of the user
     * @param id email or userID to be used as a hash
     */
    setUserAvatar: function (jid, id) {
        if (id) {
            if (users[jid] === id) {
                return;
            }
            users[jid] = id;
        }
        var thumbUrl = getGravatarUrl(users[jid] || jid, 100);
        var contactListUrl = getGravatarUrl(users[jid] || jid);
        var resourceJid = Strophe.getResourceFromJid(jid);
        var thumbnail = $('#participant_' + resourceJid);
        var avatar = $('#avatar_' + resourceJid);

        // set the avatar in the settings menu if it is local user and get the
        // local video container
        if (jid === xmpp.myJid()) {
            $('#avatar').get(0).src = thumbUrl;
            thumbnail = $('#localVideoContainer');
        }

        // set the avatar in the contact list
        var contact = $('#' + resourceJid + '>img');
        if (contact && contact.length > 0) {
            contact.get(0).src = contactListUrl;
        }

        // set the avatar in the thumbnail
        if (avatar && avatar.length > 0) {
            avatar[0].src = thumbUrl;
        } else {
            if (thumbnail && thumbnail.length > 0) {
                avatar = document.createElement('img');
                avatar.id = 'avatar_' + resourceJid;
                avatar.className = 'userAvatar';
                avatar.src = thumbUrl;
                thumbnail.append(avatar);
            }
        }

        //if the user is the current active speaker - update the active speaker
        // avatar
        if (jid === activeSpeakerJid) {
            this.updateActiveSpeakerAvatarSrc(jid);
        }
    },

    /**
     * Hides or shows the user's avatar
     * @param jid jid of the user
     * @param show whether we should show the avatar or not
     * video because there is no dominant speaker and no focused speaker
     */
    showUserAvatar: function (jid, show) {
        if (users[jid]) {
            var resourceJid = Strophe.getResourceFromJid(jid);
            var video = $('#participant_' + resourceJid + '>video');
            var avatar = $('#avatar_' + resourceJid);

            if (jid === xmpp.myJid()) {
                video = $('#localVideoWrapper>video');
            }
            if (show === undefined || show === null) {
                show = isUserMuted(jid);
            }

            //if the user is the currently focused, the dominant speaker or if
            //there is no focused and no dominant speaker and the large video is
            //currently shown
            if (activeSpeakerJid === jid && require("../videolayout/VideoLayout").isLargeVideoOnTop()) {
                setVisibility($("#largeVideo"), !show);
                setVisibility($('#activeSpeaker'), show);
                setVisibility(avatar, false);
                setVisibility(video, false);
            } else {
                if (video && video.length > 0) {
                    setVisibility(video, !show);
                    setVisibility(avatar, show);
                }
            }
        }
    },

    /**
     * Updates the src of the active speaker avatar
     * @param jid of the current active speaker
     */
    updateActiveSpeakerAvatarSrc: function (jid) {
        if (!jid) {
            jid = xmpp.findJidFromResource(
                require("../videolayout/VideoLayout").getLargeVideoState().userResourceJid);
        }
        var avatar = $("#activeSpeakerAvatar")[0];
        var url = getGravatarUrl(users[jid],
            interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE);
        if (jid === activeSpeakerJid && avatar.src === url) {
            return;
        }
        activeSpeakerJid = jid;
        var isMuted = isUserMuted(jid);
        if (jid && isMuted !== null) {
            avatar.src = url;
            setVisibility($("#largeVideo"), !isMuted);
            Avatar.showUserAvatar(jid, isMuted);
        }
    }

};


module.exports = Avatar;
},{"../side_pannels/settings/Settings":14,"../videolayout/VideoLayout":24}],6:[function(require,module,exports){
/* global $, config, dockToolbar,
   setLargeVideoVisible, Util */

var VideoLayout = require("../videolayout/VideoLayout");
var Prezi = require("../prezi/Prezi");
var UIUtil = require("../util/UIUtil");

var etherpadName = null;
var etherpadIFrame = null;
var domain = null;
var options = "?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=false";


/**
 * Resizes the etherpad.
 */
function resize() {
    if ($('#etherpad>iframe').length) {
        var remoteVideos = $('#remoteVideos');
        var availableHeight
            = window.innerHeight - remoteVideos.outerHeight();
        var availableWidth = UIUtil.getAvailableVideoWidth();

        $('#etherpad>iframe').width(availableWidth);
        $('#etherpad>iframe').height(availableHeight);
    }
}

/**
 * Shares the Etherpad name with other participants.
 */
function shareEtherpad() {
    xmpp.addToPresence("etherpad", etherpadName);
}

/**
 * Creates the Etherpad button and adds it to the toolbar.
 */
function enableEtherpadButton() {
    if (!$('#etherpadButton').is(":visible"))
        $('#etherpadButton').css({display: 'inline-block'});
}

/**
 * Creates the IFrame for the etherpad.
 */
function createIFrame() {
    etherpadIFrame = document.createElement('iframe');
    etherpadIFrame.src = domain + etherpadName + options;
    etherpadIFrame.frameBorder = 0;
    etherpadIFrame.scrolling = "no";
    etherpadIFrame.width = $('#largeVideoContainer').width() || 640;
    etherpadIFrame.height = $('#largeVideoContainer').height() || 480;
    etherpadIFrame.setAttribute('style', 'visibility: hidden;');

    document.getElementById('etherpad').appendChild(etherpadIFrame);

    etherpadIFrame.onload = function() {

        document.domain = document.domain;
        bubbleIframeMouseMove(etherpadIFrame);
        setTimeout(function() {
            // the iframes inside of the etherpad are
            // not yet loaded when the etherpad iframe is loaded
            var outer = etherpadIFrame.
                contentDocument.getElementsByName("ace_outer")[0];
            bubbleIframeMouseMove(outer);
            var inner = outer.
                contentDocument.getElementsByName("ace_inner")[0];
            bubbleIframeMouseMove(inner);
        }, 2000);
    };
}

function bubbleIframeMouseMove(iframe){
    var existingOnMouseMove = iframe.contentWindow.onmousemove;
    iframe.contentWindow.onmousemove = function(e){
        if(existingOnMouseMove) existingOnMouseMove(e);
        var evt = document.createEvent("MouseEvents");
        var boundingClientRect = iframe.getBoundingClientRect();
        evt.initMouseEvent(
            "mousemove",
            true, // bubbles
            false, // not cancelable
            window,
            e.detail,
            e.screenX,
            e.screenY,
                e.clientX + boundingClientRect.left,
                e.clientY + boundingClientRect.top,
            e.ctrlKey,
            e.altKey,
            e.shiftKey,
            e.metaKey,
            e.button,
            null // no related element
        );
        iframe.dispatchEvent(evt);
    };
}


/**
 * On video selected event.
 */
$(document).bind('video.selected', function (event, isPresentation) {
    if (config.etherpad_base && etherpadIFrame && etherpadIFrame.style.visibility !== 'hidden')
        Etherpad.toggleEtherpad(isPresentation);
});


var Etherpad = {
    /**
     * Initializes the etherpad.
     */
    init: function (name) {

        if (config.etherpad_base && !etherpadName) {

            domain = config.etherpad_base;

            if (!name) {
                // In case we're the focus we generate the name.
                etherpadName = Math.random().toString(36).substring(7) +
                                '_' + (new Date().getTime()).toString();
                shareEtherpad();
            }
            else
                etherpadName = name;

            enableEtherpadButton();

            /**
             * Resizes the etherpad, when the window is resized.
             */
            $(window).resize(function () {
                resize();
            });
        }
    },

    /**
     * Opens/hides the Etherpad.
     */
    toggleEtherpad: function (isPresentation) {
        if (!etherpadIFrame)
            createIFrame();

        var largeVideo = null;
        if (Prezi.isPresentationVisible())
            largeVideo = $('#presentation>iframe');
        else
            largeVideo = $('#largeVideo');

        if ($('#etherpad>iframe').css('visibility') === 'hidden') {
            $('#activeSpeaker').css('visibility', 'hidden');
            largeVideo.fadeOut(300, function () {
                if (Prezi.isPresentationVisible()) {
                    largeVideo.css({opacity: '0'});
                } else {
                    VideoLayout.setLargeVideoVisible(false);
                }
            });

            $('#etherpad>iframe').fadeIn(300, function () {
                document.body.style.background = '#eeeeee';
                $('#etherpad>iframe').css({visibility: 'visible'});
                $('#etherpad').css({zIndex: 2});
            });
        }
        else if ($('#etherpad>iframe')) {
            $('#etherpad>iframe').fadeOut(300, function () {
                $('#etherpad>iframe').css({visibility: 'hidden'});
                $('#etherpad').css({zIndex: 0});
                document.body.style.background = 'black';
            });

            if (!isPresentation) {
                $('#largeVideo').fadeIn(300, function () {
                    VideoLayout.setLargeVideoVisible(true);
                });
            }
        }
        resize();
    },

    isVisible: function() {
        var etherpadIframe = $('#etherpad>iframe');
        return etherpadIframe && etherpadIframe.is(':visible');
    }

};

module.exports = Etherpad;

},{"../prezi/Prezi":7,"../util/UIUtil":22,"../videolayout/VideoLayout":24}],7:[function(require,module,exports){
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");
var VideoLayout = require("../videolayout/VideoLayout");
var messageHandler = require("../util/MessageHandler");

var preziPlayer = null;

var Prezi = {


    /**
     * Reloads the current presentation.
     */
    reloadPresentation: function() {
        var iframe = document.getElementById(preziPlayer.options.preziId);
        iframe.src = iframe.src;
    },

    /**
     * Returns <tt>true</tt> if the presentation is visible, <tt>false</tt> -
     * otherwise.
     */
    isPresentationVisible: function () {
        return ($('#presentation>iframe') != null
                && $('#presentation>iframe').css('opacity') == 1);
    },

    /**
     * Opens the Prezi dialog, from which the user could choose a presentation
     * to load.
     */
    openPreziDialog: function() {
        var myprezi = xmpp.getPrezi();
        if (myprezi) {
            messageHandler.openTwoButtonDialog("Remove Prezi",
                "Are you sure you would like to remove your Prezi?",
                false,
                "Remove",
                function(e,v,m,f) {
                    if(v) {
                        xmpp.removePreziFromPresence();
                    }
                }
            );
        }
        else if (preziPlayer != null) {
            messageHandler.openTwoButtonDialog("Share a Prezi",
                "Another participant is already sharing a Prezi." +
                    "This conference allows only one Prezi at a time.",
                false,
                "Ok",
                function(e,v,m,f) {
                    $.prompt.close();
                }
            );
        }
        else {
            var openPreziState = {
                state0: {
                    html:   '<h2>Share a Prezi</h2>' +
                            '<input id="preziUrl" type="text" ' +
                            'placeholder="e.g. ' +
                            'http://prezi.com/wz7vhjycl7e6/my-prezi" autofocus>',
                    persistent: false,
                    buttons: { "Share": true , "Cancel": false},
                    defaultButton: 1,
                    submit: function(e,v,m,f){
                        e.preventDefault();
                        if(v)
                        {
                            var preziUrl = document.getElementById('preziUrl');

                            if (preziUrl.value)
                            {
                                var urlValue
                                    = encodeURI(Util.escapeHtml(preziUrl.value));

                                if (urlValue.indexOf('http://prezi.com/') != 0
                                    && urlValue.indexOf('https://prezi.com/') != 0)
                                {
                                    $.prompt.goToState('state1');
                                    return false;
                                }
                                else {
                                    var presIdTmp = urlValue.substring(
                                            urlValue.indexOf("prezi.com/") + 10);
                                    if (!isAlphanumeric(presIdTmp)
                                            || presIdTmp.indexOf('/') < 2) {
                                        $.prompt.goToState('state1');
                                        return false;
                                    }
                                    else {
                                        xmpp.addToPresence("prezi", urlValue);
                                        $.prompt.close();
                                    }
                                }
                            }
                        }
                        else
                            $.prompt.close();
                    }
                },
                state1: {
                    html:   '<h2>Share a Prezi</h2>' +
                            'Please provide a correct prezi link.',
                    persistent: false,
                    buttons: { "Back": true, "Cancel": false },
                    defaultButton: 1,
                    submit:function(e,v,m,f) {
                        e.preventDefault();
                        if(v==0)
                            $.prompt.close();
                        else
                            $.prompt.goToState('state0');
                    }
                }
            };
            var focusPreziUrl =  function(e) {
                    document.getElementById('preziUrl').focus();
                };
            messageHandler.openDialogWithStates(openPreziState, focusPreziUrl, focusPreziUrl);
        }
    }

};

/**
 * A new presentation has been added.
 *
 * @param event the event indicating the add of a presentation
 * @param jid the jid from which the presentation was added
 * @param presUrl url of the presentation
 * @param currentSlide the current slide to which we should move
 */
function presentationAdded(event, jid, presUrl, currentSlide) {
    console.log("presentation added", presUrl);

    var presId = getPresentationId(presUrl);

    var elementId = 'participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId;

    // We explicitly don't specify the peer jid here, because we don't want
    // this video to be dealt with as a peer related one (for example we
    // don't want to show a mute/kick menu for this one, etc.).
    VideoLayout.addRemoteVideoContainer(null, elementId);
    VideoLayout.resizeThumbnails();

    var controlsEnabled = false;
    if (jid === xmpp.myJid())
        controlsEnabled = true;

    setPresentationVisible(true);
    $('#largeVideoContainer').hover(
        function (event) {
            if (Prezi.isPresentationVisible()) {
                var reloadButtonRight = window.innerWidth
                    - $('#presentation>iframe').offset().left
                    - $('#presentation>iframe').width();

                $('#reloadPresentation').css({  right: reloadButtonRight,
                    display:'inline-block'});
            }
        },
        function (event) {
            if (!Prezi.isPresentationVisible())
                $('#reloadPresentation').css({display:'none'});
            else {
                var e = event.toElement || event.relatedTarget;

                if (e && e.id != 'reloadPresentation' && e.id != 'header')
                    $('#reloadPresentation').css({display:'none'});
            }
        });

    preziPlayer = new PreziPlayer(
        'presentation',
        {preziId: presId,
            width: getPresentationWidth(),
            height: getPresentationHeihgt(),
            controls: controlsEnabled,
            debug: true
        });

    $('#presentation>iframe').attr('id', preziPlayer.options.preziId);

    preziPlayer.on(PreziPlayer.EVENT_STATUS, function(event) {
        console.log("prezi status", event.value);
        if (event.value == PreziPlayer.STATUS_CONTENT_READY) {
            if (jid != xmpp.myJid())
                preziPlayer.flyToStep(currentSlide);
        }
    });

    preziPlayer.on(PreziPlayer.EVENT_CURRENT_STEP, function(event) {
        console.log("event value", event.value);
        xmpp.addToPresence("preziSlide", event.value);
    });

    $("#" + elementId).css( 'background-image',
        'url(../images/avatarprezi.png)');
    $("#" + elementId).click(
        function () {
            setPresentationVisible(true);
        }
    );
};

/**
 * A presentation has been removed.
 *
 * @param event the event indicating the remove of a presentation
 * @param jid the jid for which the presentation was removed
 * @param the url of the presentation
 */
function presentationRemoved(event, jid, presUrl) {
    console.log('presentation removed', presUrl);
    var presId = getPresentationId(presUrl);
    setPresentationVisible(false);
    $('#participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId).remove();
    $('#presentation>iframe').remove();
    if (preziPlayer != null) {
        preziPlayer.destroy();
        preziPlayer = null;
    }
};

/**
 * Indicates if the given string is an alphanumeric string.
 * Note that some special characters are also allowed (-, _ , /, &, ?, =, ;) for the
 * purpose of checking URIs.
 */
function isAlphanumeric(unsafeText) {
    var regex = /^[a-z0-9-_\/&\?=;]+$/i;
    return regex.test(unsafeText);
}

/**
 * Returns the presentation id from the given url.
 */
function getPresentationId (presUrl) {
    var presIdTmp = presUrl.substring(presUrl.indexOf("prezi.com/") + 10);
    return presIdTmp.substring(0, presIdTmp.indexOf('/'));
}

/**
 * Returns the presentation width.
 */
function getPresentationWidth() {
    var availableWidth = UIUtil.getAvailableVideoWidth();
    var availableHeight = getPresentationHeihgt();

    var aspectRatio = 16.0 / 9.0;
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }
    return availableWidth;
}

/**
 * Returns the presentation height.
 */
function getPresentationHeihgt() {
    var remoteVideos = $('#remoteVideos');
    return window.innerHeight - remoteVideos.outerHeight();
}

/**
 * Resizes the presentation iframe.
 */
function resize() {
    if ($('#presentation>iframe')) {
        $('#presentation>iframe').width(getPresentationWidth());
        $('#presentation>iframe').height(getPresentationHeihgt());
    }
}

/**
 * Shows/hides a presentation.
 */
function setPresentationVisible(visible) {
    var prezi = $('#presentation>iframe');
    if (visible) {
        // Trigger the video.selected event to indicate a change in the
        // large video.
        $(document).trigger("video.selected", [true]);

        $('#largeVideo').fadeOut(300);
        prezi.fadeIn(300, function() {
            prezi.css({opacity:'1'});
            ToolbarToggler.dockToolbar(true);
            VideoLayout.setLargeVideoVisible(false);
        });
        $('#activeSpeaker').css('visibility', 'hidden');
    }
    else {
        if (prezi.css('opacity') == '1') {
            prezi.fadeOut(300, function () {
                prezi.css({opacity:'0'});
                $('#reloadPresentation').css({display:'none'});
                $('#largeVideo').fadeIn(300, function() {
                    VideoLayout.setLargeVideoVisible(true);
                    ToolbarToggler.dockToolbar(false);
                });
            });
        }
    }
}

/**
 * Presentation has been removed.
 */
$(document).bind('presentationremoved.muc', presentationRemoved);

/**
 * Presentation has been added.
 */
$(document).bind('presentationadded.muc', presentationAdded);

/*
 * Indicates presentation slide change.
 */
$(document).bind('gotoslide.muc', function (event, jid, presUrl, current) {
    if (preziPlayer && preziPlayer.getCurrentStep() != current) {
        preziPlayer.flyToStep(current);

        var animationStepsArray = preziPlayer.getAnimationCountOnSteps();
        for (var i = 0; i < parseInt(animationStepsArray[current]); i++) {
            preziPlayer.flyToStep(current, i);
        }
    }
});

/**
 * On video selected event.
 */
$(document).bind('video.selected', function (event, isPresentation) {
    if (!isPresentation && $('#presentation>iframe')) {
        setPresentationVisible(false);
    }
});

$(window).resize(function () {
    resize();
});

module.exports = Prezi;

},{"../toolbars/ToolbarToggler":17,"../util/MessageHandler":21,"../util/UIUtil":22,"../videolayout/VideoLayout":24}],8:[function(require,module,exports){
var Chat = require("./chat/Chat");
var ContactList = require("./contactlist/ContactList");
var Settings = require("./settings/Settings");
var SettingsMenu = require("./settings/SettingsMenu");
var VideoLayout = require("../videolayout/VideoLayout");
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");

/**
 * Toggler for the chat, contact list, settings menu, etc..
 */
var PanelToggler = (function(my) {

    var currentlyOpen = null;
    var buttons = {
        '#chatspace': '#chatBottomButton',
        '#contactlist': '#contactListButton',
        '#settingsmenu': '#settingsButton'
    };

    /**
     * Resizes the video area
     * @param isClosing whether the side panel is going to be closed or is going to open / remain opened
     * @param completeFunction a function to be called when the video space is resized
     */
    var resizeVideoArea = function(isClosing, completeFunction) {
        var videospace = $('#videospace');

        var panelSize = isClosing ? [0, 0] : PanelToggler.getPanelSize();
        var videospaceWidth = window.innerWidth - panelSize[0];
        var videospaceHeight = window.innerHeight;
        var videoSize
            = VideoLayout.getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = VideoLayout.getVideoPosition(videoWidth,
            videoHeight,
            videospaceWidth,
            videospaceHeight);
        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videospaceWidth);
        var thumbnailsWidth = thumbnailSize[0];
        var thumbnailsHeight = thumbnailSize[1];
        //for chat

        videospace.animate({
                right: panelSize[0],
                width: videospaceWidth,
                height: videospaceHeight
            },
            {
                queue: false,
                duration: 500,
                complete: completeFunction
            });

        $('#remoteVideos').animate({
                height: thumbnailsHeight
            },
            {
                queue: false,
                duration: 500
            });

        $('#remoteVideos>span').animate({
                height: thumbnailsHeight,
                width: thumbnailsWidth
            },
            {
                queue: false,
                duration: 500,
                complete: function () {
                    $(document).trigger(
                        "remotevideo.resized",
                        [thumbnailsWidth,
                            thumbnailsHeight]);
                }
            });

        $('#largeVideoContainer').animate({
                width: videospaceWidth,
                height: videospaceHeight
            },
            {
                queue: false,
                duration: 500
            });

        $('#largeVideo').animate({
                width: videoWidth,
                height: videoHeight,
                top: verticalIndent,
                bottom: verticalIndent,
                left: horizontalIndent,
                right: horizontalIndent
            },
            {
                queue: false,
                duration: 500
            });
    };

    /**
     * Toggles the windows in the side panel
     * @param object the window that should be shown
     * @param selector the selector for the element containing the panel
     * @param onOpenComplete function to be called when the panel is opened
     * @param onOpen function to be called if the window is going to be opened
     * @param onClose function to be called if the window is going to be closed
     */
    var toggle = function(object, selector, onOpenComplete, onOpen, onClose) {
        UIUtil.buttonClick(buttons[selector], "active");

        if (object.isVisible()) {
            $("#toast-container").animate({
                    right: '5px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).hide("slide", {
                direction: "right",
                queue: false,
                duration: 500
            });
            if(typeof onClose === "function") {
                onClose();
            }

            currentlyOpen = null;
        }
        else {
            // Undock the toolbar when the chat is shown and if we're in a
            // video mode.
            if (VideoLayout.isLargeVideoVisible()) {
                ToolbarToggler.dockToolbar(false);
            }

            if(currentlyOpen) {
                var current = $(currentlyOpen);
                UIUtil.buttonClick(buttons[currentlyOpen], "active");
                current.css('z-index', 4);
                setTimeout(function () {
                    current.css('display', 'none');
                    current.css('z-index', 5);
                }, 500);
            }

            $("#toast-container").animate({
                    right: (PanelToggler.getPanelSize()[0] + 5) + 'px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).show("slide", {
                direction: "right",
                queue: false,
                duration: 500,
                complete: onOpenComplete
            });
            if(typeof onOpen === "function") {
                onOpen();
            }

            currentlyOpen = selector;
        }
    };

    /**
     * Opens / closes the chat area.
     */
    my.toggleChat = function() {
        var chatCompleteFunction = Chat.isVisible() ?
            function() {} : function () {
            Chat.scrollChatToBottom();
            $('#chatspace').trigger('shown');
        };

        resizeVideoArea(Chat.isVisible(), chatCompleteFunction);

        toggle(Chat,
            '#chatspace',
            function () {
                // Request the focus in the nickname field or the chat input field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            null,
            Chat.resizeChat,
            null);
    };

    /**
     * Opens / closes the contact list area.
     */
    my.toggleContactList = function () {
        var completeFunction = ContactList.isVisible() ?
            function() {} : function () { $('#contactlist').trigger('shown');};
        resizeVideoArea(ContactList.isVisible(), completeFunction);

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null);
    };

    /**
     * Opens / closes the settings menu
     */
    my.toggleSettingsMenu = function() {
        resizeVideoArea(SettingsMenu.isVisible(), function (){});
        toggle(SettingsMenu,
            '#settingsmenu',
            null,
            function() {
                var settings = Settings.getSettings();
                $('#setDisplayName').get(0).value = settings.displayName;
                $('#setEmail').get(0).value = settings.email;
            },
            null);
    };

    /**
     * Returns the size of the side panel.
     */
    my.getPanelSize = function () {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var panelWidth = 200;
        if (availableWidth * 0.2 < 200) {
            panelWidth = availableWidth * 0.2;
        }

        return [panelWidth, availableHeight];
    };

    my.isVisible = function() {
        return (Chat.isVisible() || ContactList.isVisible() || SettingsMenu.isVisible());
    };

    return my;

}(PanelToggler || {}));

module.exports = PanelToggler;
},{"../toolbars/ToolbarToggler":17,"../util/UIUtil":22,"../videolayout/VideoLayout":24,"./chat/Chat":9,"./contactlist/ContactList":13,"./settings/Settings":14,"./settings/SettingsMenu":15}],9:[function(require,module,exports){
/* global $, Util, nickname:true, showToolbar */
var Replacement = require("./Replacement");
var CommandsProcessor = require("./Commands");
var ToolbarToggler = require("../../toolbars/ToolbarToggler");
var smileys = require("./smileys.json").smileys;

var notificationInterval = false;
var unreadMessages = 0;


/**
 * Shows/hides a visual notification, indicating that a message has arrived.
 */
function setVisualNotification(show) {
    var unreadMsgElement = document.getElementById('unreadMessages');
    var unreadMsgBottomElement
        = document.getElementById('bottomUnreadMessages');

    var glower = $('#chatButton');
    var bottomGlower = $('#chatBottomButton');

    if (unreadMessages) {
        unreadMsgElement.innerHTML = unreadMessages.toString();
        unreadMsgBottomElement.innerHTML = unreadMessages.toString();

        ToolbarToggler.dockToolbar(true);

        var chatButtonElement
            = document.getElementById('chatButton').parentNode;
        var leftIndent = (Util.getTextWidth(chatButtonElement) -
            Util.getTextWidth(unreadMsgElement)) / 2;
        var topIndent = (Util.getTextHeight(chatButtonElement) -
            Util.getTextHeight(unreadMsgElement)) / 2 - 3;

        unreadMsgElement.setAttribute(
            'style',
                'top:' + topIndent +
                '; left:' + leftIndent + ';');

        var chatBottomButtonElement
            = document.getElementById('chatBottomButton').parentNode;
        var bottomLeftIndent = (Util.getTextWidth(chatBottomButtonElement) -
            Util.getTextWidth(unreadMsgBottomElement)) / 2;
        var bottomTopIndent = (Util.getTextHeight(chatBottomButtonElement) -
            Util.getTextHeight(unreadMsgBottomElement)) / 2 - 2;

        unreadMsgBottomElement.setAttribute(
            'style',
                'top:' + bottomTopIndent +
                '; left:' + bottomLeftIndent + ';');


        if (!glower.hasClass('icon-chat-simple')) {
            glower.removeClass('icon-chat');
            glower.addClass('icon-chat-simple');
        }
    }
    else {
        unreadMsgElement.innerHTML = '';
        unreadMsgBottomElement.innerHTML = '';
        glower.removeClass('icon-chat-simple');
        glower.addClass('icon-chat');
    }

    if (show && !notificationInterval) {
        notificationInterval = window.setInterval(function () {
            glower.toggleClass('active');
            bottomGlower.toggleClass('active glowing');
        }, 800);
    }
    else if (!show && notificationInterval) {
        window.clearInterval(notificationInterval);
        notificationInterval = false;
        glower.removeClass('active');
        bottomGlower.removeClass('glowing');
        bottomGlower.addClass('active');
    }
}


/**
 * Returns the current time in the format it is shown to the user
 * @returns {string}
 */
function getCurrentTime() {
    var now     = new Date();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(hour.toString().length === 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length === 1) {
        minute = '0'+minute;
    }
    if(second.toString().length === 1) {
        second = '0'+second;
    }
    return hour+':'+minute+':'+second;
}

function toggleSmileys()
{
    var smileys = $('#smileysContainer');
    if(!smileys.is(':visible')) {
        smileys.show("slide", { direction: "down", duration: 300});
    } else {
        smileys.hide("slide", { direction: "down", duration: 300});
    }
    $('#usermsg').focus();
}

function addClickFunction(smiley, number) {
    smiley.onclick = function addSmileyToMessage() {
        var usermsg = $('#usermsg');
        var message = usermsg.val();
        message += smileys['smiley' + number];
        usermsg.val(message);
        usermsg.get(0).setSelectionRange(message.length, message.length);
        toggleSmileys();
        usermsg.focus();
    };
}

/**
 * Adds the smileys container to the chat
 */
function addSmileys() {
    var smileysContainer = document.createElement('div');
    smileysContainer.id = 'smileysContainer';
    for(var i = 1; i <= 21; i++) {
        var smileyContainer = document.createElement('div');
        smileyContainer.id = 'smiley' + i;
        smileyContainer.className = 'smileyContainer';
        var smiley = document.createElement('img');
        smiley.src = 'images/smileys/smiley' + i + '.svg';
        smiley.className =  'smiley';
        addClickFunction(smiley, i);
        smileyContainer.appendChild(smiley);
        smileysContainer.appendChild(smileyContainer);
    }

    $("#chatspace").append(smileysContainer);
}

/**
 * Resizes the chat conversation.
 */
function resizeChatConversation() {
    var msgareaHeight = $('#usermsg').outerHeight();
    var chatspace = $('#chatspace');
    var width = chatspace.width();
    var chat = $('#chatconversation');
    var smileys = $('#smileysarea');

    smileys.height(msgareaHeight);
    $("#smileys").css('bottom', (msgareaHeight - 26) / 2);
    $('#smileysContainer').css('bottom', msgareaHeight);
    chat.width(width - 10);
    chat.height(window.innerHeight - 15 - msgareaHeight);
}

/**
 * Chat related user interface.
 */
var Chat = (function (my) {
    /**
     * Initializes chat related interface.
     */
    my.init = function () {
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
            nickname = storedDisplayName;

            Chat.setChatConversationMode(true);
        }

        $('#nickinput').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var val = Util.escapeHtml(this.value);
                this.value = '';
                if (!nickname) {
                    nickname = val;
                    window.localStorage.displayname = nickname;

                    xmpp.addToPresence("displayName", nickname);

                    Chat.setChatConversationMode(true);

                    return;
                }
            }
        });

        $('#usermsg').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var value = this.value;
                $('#usermsg').val('').trigger('autosize.resize');
                this.focus();
                var command = new CommandsProcessor(value);
                if(command.isCommand())
                {
                    command.processCommand();
                }
                else
                {
                    var message = Util.escapeHtml(value);
                    xmpp.sendChatMessage(message, nickname);
                }
            }
        });

        var onTextAreaResize = function () {
            resizeChatConversation();
            Chat.scrollChatToBottom();
        };
        $('#usermsg').autosize({callback: onTextAreaResize});

        $("#chatspace").bind("shown",
            function () {
                unreadMessages = 0;
                setVisualNotification(false);
            });

        addSmileys();
    };

    /**
     * Appends the given message to the chat conversation.
     */
    my.updateChatConversation = function (from, displayName, message) {
        var divClassName = '';

        if (xmpp.myJid() === from) {
            divClassName = "localuser";
        }
        else {
            divClassName = "remoteuser";

            if (!Chat.isVisible()) {
                unreadMessages++;
                Util.playSoundNotification('chatNotification');
                setVisualNotification(true);
            }
        }

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        var escMessage = message.replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        var escDisplayName = Util.escapeHtml(displayName);
        message = Replacement.processReplacements(escMessage);

        var messageContainer =
            '<div class="chatmessage">'+
                '<img src="../images/chatArrow.svg" class="chatArrow">' +
                '<div class="username ' + divClassName +'">' + escDisplayName +
                '</div>' + '<div class="timestamp">' + getCurrentTime() +
                '</div>' + '<div class="usermessage">' + message + '</div>' +
            '</div>';

        $('#chatconversation').append(messageContainer);
        $('#chatconversation').animate(
                { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    };

    /**
     * Appends error message to the conversation
     * @param errorMessage the received error message.
     * @param originalText the original message.
     */
    my.chatAddError = function(errorMessage, originalText)
    {
        errorMessage = Util.escapeHtml(errorMessage);
        originalText = Util.escapeHtml(originalText);

        $('#chatconversation').append(
            '<div class="errorMessage"><b>Error: </b>' + 'Your message' +
            (originalText? (' \"'+ originalText + '\"') : "") +
            ' was not sent.' +
            (errorMessage? (' Reason: ' + errorMessage) : '') +  '</div>');
        $('#chatconversation').animate(
            { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    };

    /**
     * Sets the subject to the UI
     * @param subject the subject
     */
    my.chatSetSubject = function(subject)
    {
        if(subject)
            subject = subject.trim();
        $('#subject').html(Replacement.linkify(Util.escapeHtml(subject)));
        if(subject === "")
        {
            $("#subject").css({display: "none"});
        }
        else
        {
            $("#subject").css({display: "block"});
        }
    };



    /**
     * Sets the chat conversation mode.
     */
    my.setChatConversationMode = function (isConversationMode) {
        if (isConversationMode) {
            $('#nickname').css({visibility: 'hidden'});
            $('#chatconversation').css({visibility: 'visible'});
            $('#usermsg').css({visibility: 'visible'});
            $('#smileysarea').css({visibility: 'visible'});
            $('#usermsg').focus();
        }
    };

    /**
     * Resizes the chat area.
     */
    my.resizeChat = function () {
        var chatSize = require("../SidePanelToggler").getPanelSize();

        $('#chatspace').width(chatSize[0]);
        $('#chatspace').height(chatSize[1]);

        resizeChatConversation();
    };

    /**
     * Indicates if the chat is currently visible.
     */
    my.isVisible = function () {
        return $('#chatspace').is(":visible");
    };
    /**
     * Shows and hides the window with the smileys
     */
    my.toggleSmileys = toggleSmileys;

    /**
     * Scrolls chat to the bottom.
     */
    my.scrollChatToBottom = function() {
        setTimeout(function () {
            $('#chatconversation').scrollTop(
                $('#chatconversation')[0].scrollHeight);
        }, 5);
    };


    return my;
}(Chat || {}));
module.exports = Chat;
},{"../../toolbars/ToolbarToggler":17,"../SidePanelToggler":8,"./Commands":10,"./Replacement":11,"./smileys.json":12}],10:[function(require,module,exports){
/**
 * List with supported commands. The keys are the names of the commands and
 * the value is the function that processes the message.
 * @type {{String: function}}
 */
var commands = {
    "topic" : processTopic
};

/**
 * Extracts the command from the message.
 * @param message the received message
 * @returns {string} the command
 */
function getCommand(message)
{
    if(message)
    {
        for(var command in commands)
        {
            if(message.indexOf("/" + command) == 0)
                return command;
        }
    }
    return "";
};

/**
 * Processes the data for topic command.
 * @param commandArguments the arguments of the topic command.
 */
function processTopic(commandArguments)
{
    var topic = Util.escapeHtml(commandArguments);
    xmpp.setSubject(topic);
}

/**
 * Constructs new CommandProccessor instance from a message that
 * handles commands received via chat messages.
 * @param message the message
 * @constructor
 */
function CommandsProcessor(message)
{


    var command = getCommand(message);

    /**
     * Returns the name of the command.
     * @returns {String} the command
     */
    this.getCommand = function()
    {
        return command;
    };


    var messageArgument = message.substr(command.length + 2);

    /**
     * Returns the arguments of the command.
     * @returns {string}
     */
    this.getArgument = function()
    {
        return messageArgument;
    };
}

/**
 * Checks whether this instance is valid command or not.
 * @returns {boolean}
 */
CommandsProcessor.prototype.isCommand = function()
{
    if(this.getCommand())
        return true;
    return false;
};

/**
 * Processes the command.
 */
CommandsProcessor.prototype.processCommand = function()
{
    if(!this.isCommand())
        return;

    commands[this.getCommand()](this.getArgument());

};

module.exports = CommandsProcessor;
},{}],11:[function(require,module,exports){
var Smileys = require("./smileys.json");
/**
 * Processes links and smileys in "body"
 */
function processReplacements(body)
{
    //make links clickable
    body = linkify(body);

    //add smileys
    body = smilify(body);

    return body;
}

/**
 * Finds and replaces all links in the links in "body"
 * with their <a href=""></a>
 */
function linkify(inputText)
{
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

/**
 * Replaces common smiley strings with images
 */
function smilify(body)
{
    if(!body) {
        return body;
    }

    var regexs = Smileys["regexs"];
    for(var smiley in regexs) {
        if(regexs.hasOwnProperty(smiley)) {
            body = body.replace(regexs[smiley],
                    '<img class="smiley" src="images/smileys/' + smiley + '.svg">');
        }
    }

    return body;
}

module.exports = {
    processReplacements: processReplacements,
    linkify: linkify
};

},{"./smileys.json":12}],12:[function(require,module,exports){
module.exports={
    "smileys": {
        "smiley1": ":)",
        "smiley2": ":(",
        "smiley3": ":D",
        "smiley4": "(y)",
        "smiley5": " :P",
        "smiley6": "(wave)",
        "smiley7": "(blush)",
        "smiley8": "(chuckle)",
        "smiley9": "(shocked)",
        "smiley10": ":*",
        "smiley11": "(n)",
        "smiley12": "(search)",
        "smiley13": " <3",
        "smiley14": "(oops)",
        "smiley15": "(angry)",
        "smiley16": "(angel)",
        "smiley17": "(sick)",
        "smiley18": ";(",
        "smiley19": "(bomb)",
        "smiley20": "(clap)",
        "smiley21": " ;)"
    },
    "regexs": {
        "smiley2": /(:-\(\(|:-\(|:\(\(|:\(|\(sad\))/gi,
        "smiley3": /(:-\)\)|:\)\)|\(lol\)|:-D|:D)/gi,
        "smiley1": /(:-\)|:\))/gi,
        "smiley4": /(\(y\)|\(Y\)|\(ok\))/gi,
        "smiley5": /(:-P|:P|:-p|:p)/gi,
        "smiley6": /(\(wave\))/gi,
        "smiley7": /(\(blush\))/gi,
        "smiley8": /(\(chuckle\))/gi,
        "smiley9": /(:-0|\(shocked\))/gi,
        "smiley10": /(:-\*|:\*|\(kiss\))/gi,
        "smiley11": /(\(n\))/gi,
        "smiley12": /(\(search\))/g,
        "smiley13": /(<3|&lt;3|&amp;lt;3|\(L\)|\(l\)|\(H\)|\(h\))/gi,
        "smiley14": /(\(oops\))/gi,
        "smiley15": /(\(angry\))/gi,
        "smiley16": /(\(angel\))/gi,
        "smiley17": /(\(sick\))/gi,
        "smiley18": /(;-\(\(|;\(\(|;-\(|;\(|:"\(|:"-\(|:~-\(|:~\(|\(upset\))/gi,
        "smiley19": /(\(bomb\))/gi,
        "smiley20": /(\(clap\))/gi,
        "smiley21": /(;-\)|;\)|;-\)\)|;\)\)|;-D|;D|\(wink\))/gi
    }
}

},{}],13:[function(require,module,exports){

var numberOfContacts = 0;
var notificationInterval;

/**
 * Updates the number of participants in the contact list button and sets
 * the glow
 * @param delta indicates whether a new user has joined (1) or someone has
 * left(-1)
 */
function updateNumberOfParticipants(delta) {
    //when the user is alone we don't show the number of participants
    if(numberOfContacts === 0) {
        $("#numberOfParticipants").text('');
        numberOfContacts += delta;
    } else if(numberOfContacts !== 0 && !ContactList.isVisible()) {
        ContactList.setVisualNotification(true);
        numberOfContacts += delta;
        $("#numberOfParticipants").text(numberOfContacts);
    }
}

/**
 * Creates the avatar element.
 *
 * @return the newly created avatar element
 */
function createAvatar(id) {
    var avatar = document.createElement('img');
    avatar.className = "icon-avatar avatar";
    avatar.src = "https://www.gravatar.com/avatar/" + id + "?d=wavatar&size=30";

    return avatar;
}

/**
 * Creates the display name paragraph.
 *
 * @param displayName the display name to set
 */
function createDisplayNameParagraph(displayName) {
    var p = document.createElement('p');
    p.innerText = displayName;

    return p;
}


function stopGlowing(glower) {
    window.clearInterval(notificationInterval);
    notificationInterval = false;
    glower.removeClass('glowing');
    if (!ContactList.isVisible()) {
        glower.removeClass('active');
    }
}


/**
 * Contact list.
 */
var ContactList = {
    /**
     * Indicates if the chat is currently visible.
     *
     * @return <tt>true</tt> if the chat is currently visible, <tt>false</tt> -
     * otherwise
     */
    isVisible: function () {
        return $('#contactlist').is(":visible");
    },

    /**
     * Adds a contact for the given peerJid if such doesn't yet exist.
     *
     * @param peerJid the peerJid corresponding to the contact
     * @param id the user's email or userId used to get the user's avatar
     */
    ensureAddContact: function (peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (!contact || contact.length <= 0)
            ContactList.addContact(peerJid, id);
    },

    /**
     * Adds a contact for the given peer jid.
     *
     * @param peerJid the jid of the contact to add
     * @param id the email or userId of the user
     */
    addContact: function (peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactlist = $('#contactlist>ul');

        var newContact = document.createElement('li');
        newContact.id = resourceJid;
        newContact.className = "clickable";
        newContact.onclick = function (event) {
            if (event.currentTarget.className === "clickable") {
                $(ContactList).trigger('contactclicked', [peerJid]);
            }
        };

        newContact.appendChild(createAvatar(id));
        newContact.appendChild(createDisplayNameParagraph("Participant"));

        var clElement = contactlist.get(0);

        if (resourceJid === xmpp.myResource()
            && $('#contactlist>ul .title')[0].nextSibling.nextSibling) {
            clElement.insertBefore(newContact,
                $('#contactlist>ul .title')[0].nextSibling.nextSibling);
        }
        else {
            clElement.appendChild(newContact);
        }
        updateNumberOfParticipants(1);
    },

    /**
     * Removes a contact for the given peer jid.
     *
     * @param peerJid the peerJid corresponding to the contact to remove
     */
    removeContact: function (peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (contact && contact.length > 0) {
            var contactlist = $('#contactlist>ul');

            contactlist.get(0).removeChild(contact.get(0));

            updateNumberOfParticipants(-1);
        }
    },

    setVisualNotification: function (show, stopGlowingIn) {
        var glower = $('#contactListButton');

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function () {
                glower.toggleClass('active glowing');
            }, 800);
        }
        else if (!show && notificationInterval) {
            stopGlowing(glower);
        }
        if (stopGlowingIn) {
            setTimeout(function () {
                stopGlowing(glower);
            }, stopGlowingIn);
        }
    },

    setClickable: function (resourceJid, isClickable) {
        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');
        if (isClickable) {
            contact.addClass('clickable');
        } else {
            contact.removeClass('clickable');
        }
    },

    onDisplayNameChange: function (peerJid, displayName) {
        if (peerJid === 'localVideoContainer')
            peerJid = xmpp.myJid();

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactName = $('#contactlist #' + resourceJid + '>p');

        if (contactName && displayName && displayName.length > 0)
            contactName.html(displayName);
    }
};

module.exports = ContactList;
},{}],14:[function(require,module,exports){
var email = '';
var displayName = '';
var userId;


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

var Settings =
{
    setDisplayName: function (newDisplayName) {
        displayName = newDisplayName;
        window.localStorage.displayname = displayName;
        return displayName;
    },
    setEmail: function(newEmail)
    {
        email = newEmail;
        window.localStorage.email = newEmail;
        return email;
    },
    getSettings: function () {
        return {
            email: email,
            displayName: displayName,
            uid: userId
        };
    }
};

module.exports = Settings;

},{}],15:[function(require,module,exports){
var Avatar = require("../../avatar/Avatar");
var Settings = require("./Settings");


var SettingsMenu = {

    update: function() {
        var newDisplayName = Util.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = Util.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            xmpp.addToPresence("displayName", displayName, true);
        }


        xmpp.addToPresence("email", newEmail);
        var email = Settings.setEmail(newEmail);


        Avatar.setUserAvatar(xmpp.myJid(), email);
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    setDisplayName: function(newDisplayName) {
        var displayName = Settings.setDisplayName(newDisplayName);
        $('#setDisplayName').get(0).value = displayName;
    },

    onDisplayNameChange: function(peerJid, newDisplayName) {
        if(peerJid === 'localVideoContainer' ||
            peerJid === xmpp.myJid()) {
            this.setDisplayName(newDisplayName);
        }
    }
};


module.exports = SettingsMenu;
},{"../../avatar/Avatar":5,"./Settings":14}],16:[function(require,module,exports){
var PanelToggler = require("../side_pannels/SidePanelToggler");

var buttonHandlers = {
    "bottom_toolbar_contact_list": function () {
        BottomToolbar.toggleContactList();
    },
    "bottom_toolbar_film_strip": function () {
        BottomToolbar.toggleFilmStrip();
    },
    "bottom_toolbar_chat": function () {
        BottomToolbar.toggleChat();
    }
};

var BottomToolbar = (function (my) {
    my.init = function () {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    };

    my.toggleChat = function() {
        PanelToggler.toggleChat();
    };

    my.toggleContactList = function() {
        PanelToggler.toggleContactList();
    };

    my.toggleFilmStrip = function() {
        var filmstrip = $("#remoteVideos");
        filmstrip.toggleClass("hidden");
    };

    $(document).bind("remotevideo.resized", function (event, width, height) {
        var bottom = (height - $('#bottomToolbar').outerHeight())/2 + 18;

        $('#bottomToolbar').css({bottom: bottom + 'px'});
    });

    return my;
}(BottomToolbar || {}));

module.exports = BottomToolbar;

},{"../side_pannels/SidePanelToggler":8}],17:[function(require,module,exports){
/* global $, interfaceConfig, Moderator, DesktopStreaming.showDesktopSharingButton */

var toolbarTimeoutObject,
    toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;

function showDesktopSharingButton() {
    if (desktopsharing.isDesktopSharingEnabled()) {
        $('#desktopsharing').css({display: "inline"});
    } else {
        $('#desktopsharing').css({display: "none"});
    }
}

/**
 * Hides the toolbar.
 */
function hideToolbar() {
    var header = $("#header"),
        bottomToolbar = $("#bottomToolbar");
    var isToolbarHover = false;
    header.find('*').each(function () {
        var id = $(this).attr('id');
        if ($("#" + id + ":hover").length > 0) {
            isToolbarHover = true;
        }
    });
    if ($("#bottomToolbar:hover").length > 0) {
        isToolbarHover = true;
    }

    clearTimeout(toolbarTimeoutObject);
    toolbarTimeoutObject = null;

    if (!isToolbarHover) {
        header.hide("slide", { direction: "up", duration: 300});
        $('#subject').animate({top: "-=40"}, 300);
        if ($("#remoteVideos").hasClass("hidden")) {
            bottomToolbar.hide(
                "slide", {direction: "right", duration: 300});
        }
    }
    else {
        toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
    }
}

var ToolbarToggler = {
    /**
     * Shows the main toolbar.
     */
    showToolbar: function () {
        var header = $("#header"),
            bottomToolbar = $("#bottomToolbar");
        if (!header.is(':visible') || !bottomToolbar.is(":visible")) {
            header.show("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "+=40"}, 300);
            if (!bottomToolbar.is(":visible")) {
                bottomToolbar.show(
                    "slide", {direction: "right", duration: 300});
            }

            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
            toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            toolbarTimeout = interfaceConfig.TOOLBAR_TIMEOUT;
        }

        if (xmpp.isModerator())
        {
//            TODO: Enable settings functionality.
//                  Need to uncomment the settings button in index.html.
//            $('#settingsButton').css({visibility:"visible"});
        }

        // Show/hide desktop sharing button
        showDesktopSharingButton();
    },


    /**
     * Docks/undocks the toolbar.
     *
     * @param isDock indicates what operation to perform
     */
    dockToolbar: function (isDock) {
        if (isDock) {
            // First make sure the toolbar is shown.
            if (!$('#header').is(':visible')) {
                this.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
        }
        else {
            if (!$('#header').is(':visible')) {
                this.showToolbar();
            }
            else {
                toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            }
        }
    },

    showDesktopSharingButton: showDesktopSharingButton

};

module.exports = ToolbarToggler;
},{}],18:[function(require,module,exports){
/* global $, buttonClick, config, lockRoom,
   setSharedKey, Util */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var Prezi = require("../prezi/Prezi");
var Etherpad = require("../etherpad/Etherpad");
var PanelToggler = require("../side_pannels/SidePanelToggler");
var Authentication = require("../authentication/Authentication");
var UIUtil = require("../util/UIUtil");

var roomUrl = null;
var sharedKey = '';
var UI = null;

var buttonHandlers =
{
    "toolbar_button_mute": function () {
        return UI.toggleAudio();
    },
    "toolbar_button_camera": function () {
        return UI.toggleVideo();
    },
    "toolbar_button_authentication": function () {
        return Toolbar.authenticateClicked();
    },
    "toolbar_button_record": function () {
        return toggleRecording();
    },
    "toolbar_button_security": function () {
        return Toolbar.openLockDialog();
    },
    "toolbar_button_link": function () {
        return Toolbar.openLinkDialog();
    },
    "toolbar_button_chat": function () {
        return BottomToolbar.toggleChat();
    },
    "toolbar_button_prezi": function () {
        return Prezi.openPreziDialog();
    },
    "toolbar_button_etherpad": function () {
        return Etherpad.toggleEtherpad(0);
    },
    "toolbar_button_desktopsharing": function () {
        return desktopsharing.toggleScreenSharing();
    },
    "toolbar_button_fullScreen": function()
    {
        UIUtil.buttonClick("#fullScreen", "icon-full-screen icon-exit-full-screen");
        return Toolbar.toggleFullScreen();
    },
    "toolbar_button_sip": function () {
        return callSipButtonClicked();
    },
    "toolbar_button_settings": function () {
        PanelToggler.toggleSettingsMenu();
    },
    "toolbar_button_hangup": function () {
        return hangup();
    }
};

function hangup() {
    xmpp.disposeConference();
    if(config.enableWelcomePage)
    {
        setTimeout(function()
        {
            window.localStorage.welcomePageDisabled = false;
            window.location.pathname = "/";
        }, 10000);

    }

    UI.messageHandler.openDialog(
        "Session Terminated",
        "You hung up the call",
        true,
        { "Join again": true },
        function(event, value, message, formVals)
        {
            window.location.reload();
            return false;
        }
    );
}

/**
 * Starts or stops the recording for the conference.
 */

function toggleRecording() {
    xmpp.toggleRecording(function (callback) {
        UI.messageHandler.openTwoButtonDialog(null,
                '<h2>Enter recording token</h2>' +
                '<input id="recordingToken" type="text" ' +
                'placeholder="token" autofocus>',
            false,
            "Save",
            function (e, v, m, f) {
                if (v) {
                    var token = document.getElementById('recordingToken');

                    if (token.value) {
                        callback(Util.escapeHtml(token.value));
                    }
                }
            },
            function (event) {
                document.getElementById('recordingToken').focus();
            },
            function () {
            }
        );
    }, Toolbar.setRecordingButtonState, Toolbar.setRecordingButtonState);
}

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    var currentSharedKey = '';
    if (lock)
        currentSharedKey = sharedKey;

    xmpp.lockRoom(currentSharedKey, function (res) {
        // password is required
        if (sharedKey)
        {
            console.log('set room password');
            Toolbar.lockLockButton();
        }
        else
        {
            console.log('removed room password');
            Toolbar.unlockLockButton();
        }
    }, function (err) {
        console.warn('setting password failed', err);
        messageHandler.showError('Lock failed',
            'Failed to lock conference.',
            err);
        Toolbar.setSharedKey('');
    }, function () {
        console.warn('room passwords not supported');
        messageHandler.showError('Warning',
            'Room passwords are currently not supported.');
        Toolbar.setSharedKey('');
    });
};

/**
 * Invite participants to conference.
 */
function inviteParticipants() {
    if (roomUrl === null)
        return;

    var sharedKeyText = "";
    if (sharedKey && sharedKey.length > 0) {
        sharedKeyText =
            "This conference is password protected. Please use the " +
            "following pin when joining:%0D%0A%0D%0A" +
            sharedKey + "%0D%0A%0D%0A";
    }

    var conferenceName = roomUrl.substring(roomUrl.lastIndexOf('/') + 1);
    var subject = "Invitation to a " + interfaceConfig.APP_NAME + " (" + conferenceName + ")";
    var body = "Hey there, I%27d like to invite you to a " + interfaceConfig.APP_NAME +
        " conference I%27ve just set up.%0D%0A%0D%0A" +
        "Please click on the following link in order" +
        " to join the conference.%0D%0A%0D%0A" +
        roomUrl +
        "%0D%0A%0D%0A" +
        sharedKeyText +
        "Note that " + interfaceConfig.APP_NAME + " is currently" +
        " only supported by Chromium," +
        " Google Chrome and Opera, so you need" +
        " to be using one of these browsers.%0D%0A%0D%0A" +
        "Talk to you in a sec!";

    if (window.localStorage.displayname) {
        body += "%0D%0A%0D%0A" + window.localStorage.displayname;
    }

    if (interfaceConfig.INVITATION_POWERED_BY) {
        body += "%0D%0A%0D%0A--%0D%0Apowered by jitsi.org";
    }

    window.open("mailto:?subject=" + subject + "&body=" + body, '_blank');
}

function callSipButtonClicked()
{
    var defaultNumber
        = config.defaultSipNumber ? config.defaultSipNumber : '';

    messageHandler.openTwoButtonDialog(null,
        '<h2>Enter SIP number</h2>' +
        '<input id="sipNumber" type="text"' +
        ' value="' + defaultNumber + '" autofocus>',
        false,
        "Dial",
        function (e, v, m, f) {
            if (v) {
                var numberInput = document.getElementById('sipNumber');
                if (numberInput.value) {
                    xmpp.dial(numberInput.value, 'fromnumber',
                        UI.getRoomName(), sharedKey);
                }
            }
        },
        function (event) {
            document.getElementById('sipNumber').focus();
        }
    );
}

var Toolbar = (function (my) {

    my.init = function (ui) {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
        UI = ui;
    }

    /**
     * Sets shared key
     * @param sKey the shared key
     */
    my.setSharedKey = function (sKey) {
        sharedKey = sKey;
    };

    my.authenticateClicked = function () {
        Authentication.focusAuthenticationWindow();
        // Get authentication URL
        xmpp.getAuthUrl(UI.getRoomName(), function (url) {
            // Open popup with authentication URL
            var authenticationWindow = Authentication.createAuthenticationWindow(function () {
                // On popup closed - retry room allocation
                xmpp.allocateConferenceFocus(UI.getRoomName(), UI.checkForNicknameAndJoin);
            }, url);
            if (!authenticationWindow) {
                Toolbar.showAuthenticateButton(true);
                messageHandler.openMessageDialog(
                    null, "Your browser is blocking popup windows from this site." +
                        " Please enable popups in your browser security settings" +
                        " and try again.");
            }
        });
    };

    /**
     * Updates the room invite url.
     */
    my.updateRoomUrl = function (newRoomUrl) {
        roomUrl = newRoomUrl;

        // If the invite dialog has been already opened we update the information.
        var inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = roomUrl;
            inviteLink.select();
            document.getElementById('jqi_state0_buttonInvite').disabled = false;
        }
    };

    /**
     * Disables and enables some of the buttons.
     */
    my.setupButtonsFromConfig = function () {
        if (config.disablePrezi)
        {
            $("#prezi_button").css({display: "none"});
        }
    };

    /**
     * Opens the lock room dialog.
     */
    my.openLockDialog = function () {
        // Only the focus is able to set a shared key.
        if (!xmpp.isModerator()) {
            if (sharedKey) {
                messageHandler.openMessageDialog(null,
                        "This conversation is currently protected by" +
                        " a password. Only the owner of the conference" +
                        " could set a password.",
                    false,
                    "Password");
            } else {
                messageHandler.openMessageDialog(null,
                    "This conversation isn't currently protected by" +
                        " a password. Only the owner of the conference" +
                        " could set a password.",
                    false,
                    "Password");
            }
        } else {
            if (sharedKey) {
                messageHandler.openTwoButtonDialog(null,
                    "Are you sure you would like to remove your password?",
                    false,
                    "Remove",
                    function (e, v) {
                        if (v) {
                            Toolbar.setSharedKey('');
                            lockRoom(false);
                        }
                    });
            } else {
                messageHandler.openTwoButtonDialog(null,
                    '<h2>Set a password to lock your room</h2>' +
                        '<input id="lockKey" type="text"' +
                        'placeholder="your password" autofocus>',
                    false,
                    "Save",
                    function (e, v) {
                        if (v) {
                            var lockKey = document.getElementById('lockKey');

                            if (lockKey.value) {
                                Toolbar.setSharedKey(Util.escapeHtml(lockKey.value));
                                lockRoom(true);
                            }
                        }
                    },
                    function () {
                        document.getElementById('lockKey').focus();
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
        if (roomUrl === null) {
            inviteLink = "Your conference is currently being created...";
        } else {
            inviteLink = encodeURI(roomUrl);
        }
        messageHandler.openTwoButtonDialog(
            "Share this link with everyone you want to invite",
            '<input id="inviteLinkRef" type="text" value="' +
                inviteLink + '" onclick="this.select();" readonly>',
            false,
            "Invite",
            function (e, v) {
                if (v) {
                    if (roomUrl) {
                        inviteParticipants();
                    }
                }
            },
            function () {
                if (roomUrl) {
                    document.getElementById('inviteLinkRef').select();
                } else {
                    document.getElementById('jqi_state0_buttonInvite')
                        .disabled = true;
                }
            }
        );
    };

    /**
     * Opens the settings dialog.
     */
    my.openSettingsDialog = function () {
        messageHandler.openTwoButtonDialog(
            '<h2>Configure your conference</h2>' +
                '<input type="checkbox" id="initMuted">' +
                'Participants join muted<br/>' +
                '<input type="checkbox" id="requireNicknames">' +
                'Require nicknames<br/><br/>' +
                'Set a password to lock your room:' +
                '<input id="lockKey" type="text" placeholder="your password"' +
                'autofocus>',
            null,
            false,
            "Save",
            function () {
                document.getElementById('lockKey').focus();
            },
            function (e, v) {
                if (v) {
                    if ($('#initMuted').is(":checked")) {
                        // it is checked
                    }

                    if ($('#requireNicknames').is(":checked")) {
                        // it is checked
                    }
                    /*
                    var lockKey = document.getElementById('lockKey');

                    if (lockKey.value) {
                        setSharedKey(lockKey.value);
                        lockRoom(true);
                    }
                    */
                }
            }
        );
    };

    /**
     * Toggles the application in and out of full screen mode
     * (a.k.a. presentation mode in Chrome).
     */
    my.toggleFullScreen = function () {
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
     * Unlocks the lock button state.
     */
    my.unlockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };
    /**
     * Updates the lock button state to locked.
     */
    my.lockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    my.showAuthenticateButton = function (show) {
        if (show) {
            $('#authentication').css({display: "inline"});
        }
        else {
            $('#authentication').css({display: "none"});
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

    // Sets the state of the recording button
    my.setRecordingButtonState = function (isRecording) {
        if (isRecording) {
            $('#recordButton').removeClass("icon-recEnable");
            $('#recordButton').addClass("icon-recEnable active");
        } else {
            $('#recordButton').removeClass("icon-recEnable active");
            $('#recordButton').addClass("icon-recEnable");
        }
    };

    // Shows or hides SIP calls button
    my.showSipCallButton = function (show) {
        if (xmpp.isSipGatewayEnabled() && show) {
            $('#sipCallButton').css({display: "inline"});
        } else {
            $('#sipCallButton').css({display: "none"});
        }
    };

    /**
     * Sets the state of the button. The button has blue glow if desktop
     * streaming is active.
     * @param active the state of the desktop streaming.
     */
    my.changeDesktopSharingButtonState = function (active) {
        var button = $("#desktopsharing > a");
        if (active)
        {
            button.addClass("glow");
        }
        else
        {
            button.removeClass("glow");
        }
    };

    return my;
}(Toolbar || {}));

module.exports = Toolbar;
},{"../authentication/Authentication":4,"../etherpad/Etherpad":6,"../prezi/Prezi":7,"../side_pannels/SidePanelToggler":8,"../util/MessageHandler":21,"../util/UIUtil":22,"./BottomToolbar":16}],19:[function(require,module,exports){
module.exports=require(17)
},{}],20:[function(require,module,exports){
var JitsiPopover = (function () {
    /**
     * Constructs new JitsiPopover and attaches it to the element
     * @param element jquery selector
     * @param options the options for the popover.
     * @constructor
     */
    function JitsiPopover(element, options)
    {
        this.options = {
            skin: "white",
            content: ""
        };
        if(options)
        {
            if(options.skin)
                this.options.skin = options.skin;

            if(options.content)
                this.options.content = options.content;
        }

        this.elementIsHovered = false;
        this.popoverIsHovered = false;
        this.popoverShown = false;

        element.data("jitsi_popover", this);
        this.element = element;
        this.template = ' <div class="jitsipopover ' + this.options.skin +
            '"><div class="arrow"></div><div class="jitsipopover-content"></div>' +
            '<div class="jitsiPopupmenuPadding"></div></div>';
        var self = this;
        this.element.on("mouseenter", function () {
            self.elementIsHovered = true;
            self.show();
        }).on("mouseleave", function () {
            self.elementIsHovered = false;
            setTimeout(function () {
                self.hide();
            }, 10);
        });
    }

    /**
     * Shows the popover
     */
    JitsiPopover.prototype.show = function () {
        this.createPopover();
        this.popoverShown = true;

    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.hide = function () {
        if(!this.elementIsHovered && !this.popoverIsHovered && this.popoverShown)
        {
            this.forceHide();
        }
    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.forceHide = function () {
        $(".jitsipopover").remove();
        this.popoverShown = false;
    };

    /**
     * Creates the popover html
     */
    JitsiPopover.prototype.createPopover = function () {
        $("body").append(this.template);
        $(".jitsipopover > .jitsipopover-content").html(this.options.content);
        var self = this;
        $(".jitsipopover").on("mouseenter", function () {
            self.popoverIsHovered = true;
        }).on("mouseleave", function () {
            self.popoverIsHovered = false;
            self.hide();
        });

        this.refreshPosition();
    };

    /**
     * Refreshes the position of the popover
     */
    JitsiPopover.prototype.refreshPosition = function () {
        $(".jitsipopover").position({
            my: "bottom",
            at: "top",
            collision: "fit",
            of: this.element,
            using: function (position, elements) {
                var calcLeft = elements.target.left - elements.element.left + elements.target.width/2;
                $(".jitsipopover").css({top: position.top, left: position.left, display: "table"});
                $(".jitsipopover > .arrow").css({left: calcLeft});
                $(".jitsipopover > .jitsiPopupmenuPadding").css({left: calcLeft - 50});
            }
        });
    };

    /**
     * Updates the content of popover.
     * @param content new content
     */
    JitsiPopover.prototype.updateContent = function (content) {
        this.options.content = content;
        if(!this.popoverShown)
            return;
        $(".jitsipopover").remove();
        this.createPopover();
    };

    return JitsiPopover;


})();

module.exports = JitsiPopover;
},{}],21:[function(require,module,exports){
/* global $, jQuery */
var messageHandler = (function(my) {

    /**
     * Shows a message to the user.
     *
     * @param titleString the title of the message
     * @param messageString the text of the message
     */
    my.openMessageDialog = function(titleString, messageString) {
        $.prompt(messageString,
            {
                title: titleString,
                persistent: false
            }
        );
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param leftButton the fist button's text
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     * @param closeFunction function to be called after the prompt is closed
     */
    my.openTwoButtonDialog = function(titleString, msgString, persistent, leftButton,
                                      submitFunction, loadedFunction, closeFunction) {
        var buttons = {};
        buttons[leftButton] = true;
        buttons.Cancel = false;
        $.prompt(msgString, {
            title: titleString,
            persistent: false,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction,
            close: closeFunction
        });
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param buttons object with the buttons. The keys must be the name of the button and value is the value
     * that will be passed to submitFunction
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     */
    my.openDialog = function (titleString,    msgString, persistent, buttons,
                              submitFunction, loadedFunction) {
        var args = {
            title: titleString,
            persistent: persistent,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction
        };
        if (persistent) {
            args.closeText = '';
        }
        return $.prompt(msgString, args);
    };

    /**
     * Closes currently opened dialog.
     */
    my.closeDialog = function () {
        $.prompt.close();
    };

    /**
     * Shows a dialog with different states to the user.
     *
     * @param statesObject object containing all the states of the dialog
     * @param loadedFunction function to be called after the prompt is fully loaded
     * @param stateChangedFunction function to be called when the state of the dialog is changed
     */
    my.openDialogWithStates = function(statesObject, loadedFunction, stateChangedFunction) {


        var myPrompt = $.prompt(statesObject);

        myPrompt.on('impromptu:loaded', loadedFunction);
        myPrompt.on('impromptu:statechanged', stateChangedFunction);
    };

    /**
     * Opens new popup window for given <tt>url</tt> centered over current
     * window.
     *
     * @param url the URL to be displayed in the popup window
     * @param w the width of the popup window
     * @param h the height of the popup window
     * @param onPopupClosed optional callback function called when popup window
     *        has been closed.
     *
     * @returns popup window object if opened successfully or undefined
     *          in case we failed to open it(popup blocked)
     */
    my.openCenteredPopup = function (url, w, h, onPopupClosed) {
        var l = window.screenX + (window.innerWidth / 2) - (w / 2);
        var t = window.screenY + (window.innerHeight / 2) - (h / 2);
        var popup = window.open(
            url, '_blank',
            'top=' + t + ', left=' + l + ', width=' + w + ', height=' + h + '');
        if (popup && onPopupClosed) {
            var pollTimer = window.setInterval(function () {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }
        return popup;
    };

    /**
     * Shows a dialog prompting the user to send an error report.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param error the error that is being reported
     */
    my.openReportDialog = function(titleString, msgString, error) {
        my.openMessageDialog(titleString, msgString);
        console.log(error);
        //FIXME send the error to the server
    };

    /**
     *  Shows an error dialog to the user.
     * @param title the title of the message
     * @param message the text of the messafe
     */
    my.showError = function(title, message) {
        if(!(title || message)) {
            title = title || "Oops!";
            message = message || "There was some kind of error";
        }
        messageHandler.openMessageDialog(title, message);
    };

    my.notify = function(displayName, cls, message) {
        toastr.info(
            '<span class="nickname">' +
                displayName +
            '</span><br>' +
            '<span class=' + cls + '>' +
                message +
            '</span>');
    };

    return my;
}(messageHandler || {}));

module.exports = messageHandler;



},{}],22:[function(require,module,exports){
/**
 * Created by hristo on 12/22/14.
 */
module.exports = {
    /**
     * Returns the available video width.
     */
    getAvailableVideoWidth: function () {
        var PanelToggler = require("../side_pannels/SidePanelToggler");
        var rightPanelWidth
            = PanelToggler.isVisible() ? PanelToggler.getPanelSize()[0] : 0;

        return window.innerWidth - rightPanelWidth;
    },
    /**
     * Changes the style class of the element given by id.
     */
    buttonClick: function(id, classname) {
        $(id).toggleClass(classname); // add the class to the clicked element
    }


};
},{"../side_pannels/SidePanelToggler":8}],23:[function(require,module,exports){
var JitsiPopover = require("../util/JitsiPopover");

/**
 * Constructs new connection indicator.
 * @param videoContainer the video container associated with the indicator.
 * @constructor
 */
function ConnectionIndicator(videoContainer, jid, VideoLayout)
{
    this.videoContainer = videoContainer;
    this.bandwidth = null;
    this.packetLoss = null;
    this.bitrate = null;
    this.showMoreValue = false;
    this.resolution = null;
    this.transport = [];
    this.popover = null;
    this.jid = jid;
    this.create();
    this.videoLayout = VideoLayout;
}

/**
 * Values for the connection quality
 * @type {{98: string,
 *         81: string,
 *         64: string,
 *         47: string,
 *         30: string,
 *         0: string}}
 */
ConnectionIndicator.connectionQualityValues = {
    98: "18px", //full
    81: "15px",//4 bars
    64: "11px",//3 bars
    47: "7px",//2 bars
    30: "3px",//1 bar
    0: "0px"//empty
};

ConnectionIndicator.getIP = function(value)
{
    return value.substring(0, value.lastIndexOf(":"));
};

ConnectionIndicator.getPort = function(value)
{
    return value.substring(value.lastIndexOf(":") + 1, value.length);
};

ConnectionIndicator.getStringFromArray = function (array) {
    var res = "";
    for(var i = 0; i < array.length; i++)
    {
        res += (i === 0? "" : ", ") + array[i];
    }
    return res;
};

/**
 * Generates the html content.
 * @returns {string} the html content.
 */
ConnectionIndicator.prototype.generateText = function () {
    var downloadBitrate, uploadBitrate, packetLoss, resolution, i;

    if(this.bitrate === null)
    {
        downloadBitrate = "N/A";
        uploadBitrate = "N/A";
    }
    else
    {
        downloadBitrate =
            this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
        uploadBitrate =
            this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
    }

    if(this.packetLoss === null)
    {
        packetLoss = "N/A";
    }
    else
    {

        packetLoss = "<span class='jitsipopover_green'>&darr;</span>" +
            (this.packetLoss.download !== null? this.packetLoss.download : "N/A") +
            "% <span class='jitsipopover_orange'>&uarr;</span>" +
            (this.packetLoss.upload !== null? this.packetLoss.upload : "N/A") + "%";
    }

    var resolutionValue = null;
    if(this.resolution && this.jid != null)
    {
        var keys = Object.keys(this.resolution);
        if(keys.length == 1)
        {
            for(var ssrc in this.resolution)
            {
                resolutionValue = this.resolution[ssrc];
            }
        }
        else if(keys.length > 1)
        {
            var displayedSsrc = simulcast.getReceivingSSRC(this.jid);
            resolutionValue = this.resolution[displayedSsrc];
        }
    }

    if(this.jid === null)
    {
        resolution = "";
        if(this.resolution === null || !Object.keys(this.resolution) ||
            Object.keys(this.resolution).length === 0)
        {
            resolution = "N/A";
        }
        else
            for(i in this.resolution)
            {
                resolutionValue = this.resolution[i];
                if(resolutionValue)
                {
                    if(resolutionValue.height &&
                        resolutionValue.width)
                    {
                        resolution += (resolution === ""? "" : ", ") +
                            resolutionValue.width + "x" +
                            resolutionValue.height;
                    }
                }
            }
    }
    else if(!resolutionValue ||
        !resolutionValue.height ||
        !resolutionValue.width)
    {
        resolution = "N/A";
    }
    else
    {
        resolution = resolutionValue.width + "x" + resolutionValue.height;
    }

    var result = "<table style='width:100%'>" +
        "<tr>" +
        "<td><span class='jitsipopover_blue'>Bitrate:</span></td>" +
        "<td><span class='jitsipopover_green'>&darr;</span>" +
        downloadBitrate + " <span class='jitsipopover_orange'>&uarr;</span>" +
        uploadBitrate + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue'>Packet loss: </span></td>" +
        "<td>" + packetLoss  + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue'>Resolution:</span></td>" +
        "<td>" + resolution + "</td></tr></table>";

    if(this.videoContainer.id == "localVideoContainer")
        result += "<div class=\"jitsipopover_showmore\" " +
            "onclick = \"UI.connectionIndicatorShowMore('" +
            this.videoContainer.id + "')\">" +
            (this.showMoreValue? "Show less" : "Show More") + "</div><br />";

    if(this.showMoreValue)
    {
        var downloadBandwidth, uploadBandwidth, transport;
        if(this.bandwidth === null)
        {
            downloadBandwidth = "N/A";
            uploadBandwidth = "N/A";
        }
        else
        {
            downloadBandwidth = this.bandwidth.download?
                this.bandwidth.download + " Kbps" :
                "N/A";
            uploadBandwidth = this.bandwidth.upload?
                this.bandwidth.upload + " Kbps" :
                "N/A";
        }

        if(!this.transport || this.transport.length === 0)
        {
            transport = "<tr>" +
                "<td><span class='jitsipopover_blue'>Address:</span></td>" +
                "<td> N/A</td></tr>";
        }
        else
        {
            var data = {remoteIP: [], localIP:[], remotePort:[], localPort:[]};
            for(i = 0; i < this.transport.length; i++)
            {
                var ip =  ConnectionIndicator.getIP(this.transport[i].ip);
                var port = ConnectionIndicator.getPort(this.transport[i].ip);
                var localIP =
                    ConnectionIndicator.getIP(this.transport[i].localip);
                var localPort =
                    ConnectionIndicator.getPort(this.transport[i].localip);
                if(data.remoteIP.indexOf(ip) == -1)
                {
                    data.remoteIP.push(ip);
                }

                if(data.remotePort.indexOf(port) == -1)
                {
                    data.remotePort.push(port);
                }

                if(data.localIP.indexOf(localIP) == -1)
                {
                    data.localIP.push(localIP);
                }

                if(data.localPort.indexOf(localPort) == -1)
                {
                    data.localPort.push(localPort);
                }

            }
            var localTransport =
                "<tr><td><span class='jitsipopover_blue'>Local address" +
                (data.localIP.length > 1? "es" : "") + ": </span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.localIP) +
                "</td></tr>";
            transport =
                "<tr><td><span class='jitsipopover_blue'>Remote address"+
                (data.remoteIP.length > 1? "es" : "") + ":</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.remoteIP) +
                "</td></tr>";
            if(this.transport.length > 1)
            {
                transport += "<tr>" +
                    "<td>" +
                    "<span class='jitsipopover_blue'>Remote ports:</span>" +
                    "</td><td>";
                localTransport += "<tr>" +
                    "<td>" +
                    "<span class='jitsipopover_blue'>Local ports:</span>" +
                    "</td><td>";
            }
            else
            {
                transport +=
                    "<tr>" +
                    "<td>" +
                    "<span class='jitsipopover_blue'>Remote port:</span>" +
                    "</td><td>";
                localTransport +=
                    "<tr>" +
                    "<td>" +
                    "<span class='jitsipopover_blue'>Local port:</span>" +
                    "</td><td>";
            }

            transport +=
                ConnectionIndicator.getStringFromArray(data.remotePort);
            localTransport +=
                ConnectionIndicator.getStringFromArray(data.localPort);
            transport += "</td></tr>";
            transport += localTransport + "</td></tr>";
            transport +="<tr>" +
                "<td><span class='jitsipopover_blue'>Transport:</span></td>" +
                "<td>" + this.transport[0].type + "</td></tr>";

        }

        result += "<table  style='width:100%'>" +
            "<tr>" +
            "<td>" +
            "<span class='jitsipopover_blue'>Estimated bandwidth:</span>" +
            "</td><td>" +
            "<span class='jitsipopover_green'>&darr;</span>" +
            downloadBandwidth +
            " <span class='jitsipopover_orange'>&uarr;</span>" +
            uploadBandwidth + "</td></tr>";

        result += transport + "</table>";

    }

    return result;
};

/**
 * Shows or hide the additional information.
 */
ConnectionIndicator.prototype.showMore = function () {
    this.showMoreValue = !this.showMoreValue;
    this.updatePopoverData();
};


function createIcon(classes)
{
    var icon = document.createElement("span");
    for(var i in classes)
    {
        icon.classList.add(classes[i]);
    }
    icon.appendChild(
        document.createElement("i")).classList.add("icon-connection");
    return icon;
}

/**
 * Creates the indicator
 */
ConnectionIndicator.prototype.create = function () {
    this.connectionIndicatorContainer = document.createElement("div");
    this.connectionIndicatorContainer.className = "connectionindicator";
    this.connectionIndicatorContainer.style.display = "none";
    this.videoContainer.appendChild(this.connectionIndicatorContainer);
    this.popover = new JitsiPopover(
        $("#" + this.videoContainer.id + " > .connectionindicator"),
        {content: "<div class=\"connection_info\">Come back here for " +
            "connection information once the conference starts</div>",
            skin: "black"});

    this.emptyIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_empty"]));
    this.fullIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_full"]));

};

/**
 * Removes the indicator
 */
ConnectionIndicator.prototype.remove = function()
{
    this.connectionIndicatorContainer.remove();
    this.popover.forceHide();

};

/**
 * Updates the data of the indicator
 * @param percent the percent of connection quality
 * @param object the statistics data.
 */
ConnectionIndicator.prototype.updateConnectionQuality =
function (percent, object) {

    if(percent === null)
    {
        this.connectionIndicatorContainer.style.display = "none";
        this.popover.forceHide();
        return;
    }
    else
    {
        if(this.connectionIndicatorContainer.style.display == "none") {
            this.connectionIndicatorContainer.style.display = "block";
            this.videoLayout.updateMutePosition(this.videoContainer.id);
        }
    }
    this.bandwidth = object.bandwidth;
    this.bitrate = object.bitrate;
    this.packetLoss = object.packetLoss;
    this.transport = object.transport;
    if(object.resolution)
    {
        this.resolution = object.resolution;
    }
    for(var quality in ConnectionIndicator.connectionQualityValues)
    {
        if(percent >= quality)
        {
            this.fullIcon.style.width =
                ConnectionIndicator.connectionQualityValues[quality];
        }
    }
    this.updatePopoverData();
};

/**
 * Updates the resolution
 * @param resolution the new resolution
 */
ConnectionIndicator.prototype.updateResolution = function (resolution) {
    this.resolution = resolution;
    this.updatePopoverData();
};

/**
 * Updates the content of the popover
 */
ConnectionIndicator.prototype.updatePopoverData = function () {
    this.popover.updateContent(
            "<div class=\"connection_info\">" + this.generateText() + "</div>");
};

/**
 * Hides the popover
 */
ConnectionIndicator.prototype.hide = function () {
    this.popover.forceHide();
};

/**
 * Hides the indicator
 */
ConnectionIndicator.prototype.hideIndicator = function () {
    this.connectionIndicatorContainer.style.display = "none";
    if(this.popover)
        this.popover.forceHide();
};

module.exports = ConnectionIndicator;
},{"../util/JitsiPopover":20}],24:[function(require,module,exports){
var AudioLevels = require("../audio_levels/AudioLevels");
var Avatar = require("../avatar/Avatar");
var Chat = require("../side_pannels/chat/Chat");
var ContactList = require("../side_pannels/contactlist/ContactList");
var UIUtil = require("../util/UIUtil");
var ConnectionIndicator = require("./ConnectionIndicator");

var currentDominantSpeaker = null;
var lastNCount = config.channelLastN;
var localLastNCount = config.channelLastN;
var localLastNSet = [];
var lastNEndpointsCache = [];
var lastNPickupJid = null;
var largeVideoState = {
    updateInProgress: false,
    newSrc: ''
};

/**
 * Indicates if we have muted our audio before the conference has started.
 * @type {boolean}
 */
var preMuted = false;

var mutedAudios = {};

var flipXLocalVideo = true;
var currentVideoWidth = null;
var currentVideoHeight = null;

var localVideoSrc = null;

var defaultLocalDisplayName = "Me";

function videoactive( videoelem) {
    if (videoelem.attr('id').indexOf('mixedmslabel') === -1) {
        // ignore mixedmslabela0 and v0

        videoelem.show();
        VideoLayout.resizeThumbnails();

        var videoParent = videoelem.parent();
        var parentResourceJid = null;
        if (videoParent)
            parentResourceJid
                = VideoLayout.getPeerContainerResourceJid(videoParent[0]);

        // Update the large video to the last added video only if there's no
        // current dominant, focused speaker or prezi playing or update it to
        // the current dominant speaker.
        if ((!focusedVideoInfo &&
            !VideoLayout.getDominantSpeakerResourceJid() &&
            !require("../prezi/Prezi").isPresentationVisible()) ||
            (parentResourceJid &&
                VideoLayout.getDominantSpeakerResourceJid() === parentResourceJid)) {
            VideoLayout.updateLargeVideo(
                RTC.getVideoSrc(videoelem[0]),
                1,
                parentResourceJid);
        }

        VideoLayout.showModeratorIndicator();
    }
}

function waitForRemoteVideo(selector, ssrc, stream, jid) {
    // XXX(gp) so, every call to this function is *always* preceded by a call
    // to the RTC.attachMediaStream() function but that call is *not* followed
    // by an update to the videoSrcToSsrc map!
    //
    // The above way of doing things results in video SRCs that don't correspond
    // to any SSRC for a short period of time (to be more precise, for as long
    // the waitForRemoteVideo takes to complete). This causes problems (see
    // bellow).
    //
    // I'm wondering why we need to do that; i.e. why call RTC.attachMediaStream()
    // a second time in here and only then update the videoSrcToSsrc map? Why
    // not simply update the videoSrcToSsrc map when the RTC.attachMediaStream()
    // is called the first time? I actually do that in the lastN changed event
    // handler because the "orphan" video SRC is causing troubles there. The
    // purpose of this method would then be to fire the "videoactive.jingle".
    //
    // Food for though I guess :-)

    if (selector.removed || !selector.parent().is(":visible")) {
        console.warn("Media removed before had started", selector);
        return;
    }

    if (stream.id === 'mixedmslabel') return;

    if (selector[0].currentTime > 0) {
        var videoStream = simulcast.getReceivingVideoStream(stream);
        RTC.attachMediaStream(selector, videoStream); // FIXME: why do i have to do this for FF?

        // FIXME: add a class that will associate peer Jid, video.src, it's ssrc and video type
        //        in order to get rid of too many maps
        if (ssrc && jid) {
            jid2Ssrc[Strophe.getResourceFromJid(jid)] = ssrc;
        } else {
            console.warn("No ssrc given for jid", jid);
        }

        videoactive(selector);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(selector, ssrc, stream, jid);
        }, 250);
    }
}

/**
 * Returns an array of the video horizontal and vertical indents,
 * so that if fits its parent.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getCameraVideoPosition(videoWidth,
                                videoHeight,
                                videoSpaceWidth,
                                videoSpaceHeight) {
    // Parent height isn't completely calculated when we position the video in
    // full screen mode and this is why we use the screen height in this case.
    // Need to think it further at some point and implement it properly.
    var isFullScreen = document.fullScreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen;
    if (isFullScreen)
        videoSpaceHeight = window.innerHeight;

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;
    var verticalIndent = (videoSpaceHeight - videoHeight) / 2;

    return [horizontalIndent, verticalIndent];
}

/**
 * Returns an array of the video horizontal and vertical indents.
 * Centers horizontally and top aligns vertically.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getDesktopVideoPosition(videoWidth,
                                 videoHeight,
                                 videoSpaceWidth,
                                 videoSpaceHeight) {

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;

    var verticalIndent = 0;// Top aligned

    return [horizontalIndent, verticalIndent];
}


/**
 * Returns an array of the video dimensions, so that it covers the screen.
 * It leaves no empty areas, but some parts of the video might not be visible.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getCameraVideoSize(videoWidth,
                            videoHeight,
                            videoSpaceWidth,
                            videoSpaceHeight) {
    if (!videoWidth)
        videoWidth = currentVideoWidth;
    if (!videoHeight)
        videoHeight = currentVideoHeight;

    var aspectRatio = videoWidth / videoHeight;

    var availableWidth = Math.max(videoWidth, videoSpaceWidth);
    var availableHeight = Math.max(videoHeight, videoSpaceHeight);

    if (availableWidth / aspectRatio < videoSpaceHeight) {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio < videoSpaceWidth) {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Sets the display name for the given video span id.
 */
function setDisplayName(videoSpanId, displayName) {
    var nameSpan = $('#' + videoSpanId + '>span.displayname');
    var defaultLocalDisplayName = interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME;

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        var nameSpanElement = nameSpan.get(0);

        if (nameSpanElement.id === 'localDisplayName' &&
            $('#localDisplayName').text() !== displayName) {
            if (displayName && displayName.length > 0)
                $('#localDisplayName').html(displayName + ' (me)');
            else
                $('#localDisplayName').text(defaultLocalDisplayName);
        } else {
            if (displayName && displayName.length > 0)
                $('#' + videoSpanId + '_name').html(displayName);
            else
                $('#' + videoSpanId + '_name').text(interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
        }
    } else {
        var editButton = null;

        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + videoSpanId)[0].appendChild(nameSpan);

        if (videoSpanId === 'localVideoContainer') {
            editButton = createEditDisplayNameButton();
            nameSpan.innerText = defaultLocalDisplayName;
        }
        else {
            nameSpan.innerText = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }

        if (displayName && displayName.length > 0) {
            nameSpan.innerText = displayName;
        }

        if (!editButton) {
            nameSpan.id = videoSpanId + '_name';
        } else {
            nameSpan.id = 'localDisplayName';
            $('#' + videoSpanId)[0].appendChild(editButton);

            var editableText = document.createElement('input');
            editableText.className = 'displayname';
            editableText.type = 'text';
            editableText.id = 'editDisplayName';

            if (displayName && displayName.length) {
                editableText.value
                    = displayName.substring(0, displayName.indexOf(' (me)'));
            }

            editableText.setAttribute('style', 'display:none;');
            editableText.setAttribute('placeholder', 'ex. Jane Pink');
            $('#' + videoSpanId)[0].appendChild(editableText);

            $('#localVideoContainer .displayname')
                .bind("click", function (e) {

                    e.preventDefault();
                    e.stopPropagation();
                    $('#localDisplayName').hide();
                    $('#editDisplayName').show();
                    $('#editDisplayName').focus();
                    $('#editDisplayName').select();

                    $('#editDisplayName').one("focusout", function (e) {
                        VideoLayout.inputDisplayNameHandler(this.value);
                    });

                    $('#editDisplayName').on('keydown', function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            VideoLayout.inputDisplayNameHandler(this.value);
                        }
                    });
                });
        }
    }
}

/**
 * Gets the selector of video thumbnail container for the user identified by
 * given <tt>userJid</tt>
 * @param resourceJid user's Jid for whom we want to get the video container.
 */
function getParticipantContainer(resourceJid)
{
    if (!resourceJid)
        return null;

    if (resourceJid === xmpp.myResource())
        return $("#localVideoContainer");
    else
        return $("#participant_" + resourceJid);
}

/**
 * Sets the size and position of the given video element.
 *
 * @param video the video element to position
 * @param width the desired video width
 * @param height the desired video height
 * @param horizontalIndent the left and right indent
 * @param verticalIndent the top and bottom indent
 */
function positionVideo(video,
                       width,
                       height,
                       horizontalIndent,
                       verticalIndent) {
    video.width(width);
    video.height(height);
    video.css({  top: verticalIndent + 'px',
        bottom: verticalIndent + 'px',
        left: horizontalIndent + 'px',
        right: horizontalIndent + 'px'});
}

/**
 * Adds the remote video menu element for the given <tt>jid</tt> in the
 * given <tt>parentElement</tt>.
 *
 * @param jid the jid indicating the video for which we're adding a menu.
 * @param parentElement the parent element where this menu will be added
 */
function addRemoteVideoMenu(jid, parentElement) {
    var spanElement = document.createElement('span');
    spanElement.className = 'remotevideomenu';

    parentElement.appendChild(spanElement);

    var menuElement = document.createElement('i');
    menuElement.className = 'fa fa-angle-down';
    menuElement.title = 'Remote user controls';
    spanElement.appendChild(menuElement);

//        <ul class="popupmenu">
//        <li><a href="#">Mute</a></li>
//        <li><a href="#">Eject</a></li>
//        </ul>

    var popupmenuElement = document.createElement('ul');
    popupmenuElement.className = 'popupmenu';
    popupmenuElement.id
        = 'remote_popupmenu_' + Strophe.getResourceFromJid(jid);
    spanElement.appendChild(popupmenuElement);

    var muteMenuItem = document.createElement('li');
    var muteLinkItem = document.createElement('a');

    var mutedIndicator = "<i class='icon-mic-disabled'></i>";

    if (!mutedAudios[jid]) {
        muteLinkItem.innerHTML = mutedIndicator + 'Mute';
        muteLinkItem.className = 'mutelink';
    }
    else {
        muteLinkItem.innerHTML = mutedIndicator + ' Muted';
        muteLinkItem.className = 'mutelink disabled';
    }

    muteLinkItem.onclick = function(){
        if ($(this).attr('disabled') != undefined) {
            event.preventDefault();
        }
        var isMute = mutedAudios[jid] == true;
        xmpp.setMute(jid, !isMute);

        popupmenuElement.setAttribute('style', 'display:none;');

        if (isMute) {
            this.innerHTML = mutedIndicator + ' Muted';
            this.className = 'mutelink disabled';
        }
        else {
            this.innerHTML = mutedIndicator + ' Mute';
            this.className = 'mutelink';
        }
    };

    muteMenuItem.appendChild(muteLinkItem);
    popupmenuElement.appendChild(muteMenuItem);

    var ejectIndicator = "<i class='fa fa-eject'></i>";

    var ejectMenuItem = document.createElement('li');
    var ejectLinkItem = document.createElement('a');
    ejectLinkItem.innerHTML = ejectIndicator + ' Kick out';
    ejectLinkItem.onclick = function(){
        xmpp.eject(jid);
        popupmenuElement.setAttribute('style', 'display:none;');
    };

    ejectMenuItem.appendChild(ejectLinkItem);
    popupmenuElement.appendChild(ejectMenuItem);

    var paddingSpan = document.createElement('span');
    paddingSpan.className = 'popupmenuPadding';
    popupmenuElement.appendChild(paddingSpan);
}

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
function removeRemoteVideoMenu(videoElementId) {
    var menuSpan = $('#' + videoElementId + '>span.remotevideomenu');
    if (menuSpan.length) {
        menuSpan.remove();
    }
}

/**
 * Updates the data for the indicator
 * @param id the id of the indicator
 * @param percent the percent for connection quality
 * @param object the data
 */
function updateStatsIndicator(id, percent, object) {
    if(VideoLayout.connectionIndicators[id])
        VideoLayout.connectionIndicators[id].updateConnectionQuality(percent, object);
}


/**
 * Returns an array of the video dimensions, so that it keeps it's aspect
 * ratio and fits available area with it's larger dimension. This method
 * ensures that whole video will be visible and can leave empty areas.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getDesktopVideoSize(videoWidth,
                             videoHeight,
                             videoSpaceWidth,
                             videoSpaceHeight) {
    if (!videoWidth)
        videoWidth = currentVideoWidth;
    if (!videoHeight)
        videoHeight = currentVideoHeight;

    var aspectRatio = videoWidth / videoHeight;

    var availableWidth = Math.max(videoWidth, videoSpaceWidth);
    var availableHeight = Math.max(videoHeight, videoSpaceHeight);

    videoSpaceHeight -= $('#remoteVideos').outerHeight();

    if (availableWidth / aspectRatio >= videoSpaceHeight)
    {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio >= videoSpaceWidth)
    {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Creates the edit display name button.
 *
 * @returns the edit button
 */
function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    Util.setTooltip(editButton,
        'Click to edit your<br/>display name',
        "top");
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}

/**
 * Creates the element indicating the moderator(owner) of the conference.
 *
 * @param parentElement the parent element where the owner indicator will
 * be added
 */
function createModeratorIndicatorElement(parentElement) {
    var moderatorIndicator = document.createElement('i');
    moderatorIndicator.className = 'fa fa-star';
    parentElement.appendChild(moderatorIndicator);

    Util.setTooltip(parentElement,
        "The owner of<br/>this conference",
        "top");
}


/**
 * Checks if video identified by given src is desktop stream.
 * @param videoSrc eg.
 * blob:https%3A//pawel.jitsi.net/9a46e0bd-131e-4d18-9c14-a9264e8db395
 * @returns {boolean}
 */
function isVideoSrcDesktop(jid) {
    // FIXME: fix this mapping mess...
    // figure out if large video is desktop stream or just a camera

    if(!jid)
        return false;
    var isDesktop = false;
    if (xmpp.myJid() &&
        xmpp.myResource() === jid) {
        // local video
        isDesktop = desktopsharing.isUsingScreenStream();
    } else {
        // Do we have associations...
        var videoSsrc = jid2Ssrc[jid];
        if (videoSsrc) {
            var videoType = ssrc2videoType[videoSsrc];
            if (videoType) {
                // Finally there...
                isDesktop = videoType === 'screen';
            } else {
                console.error("No video type for ssrc: " + videoSsrc);
            }
        } else {
            console.error("No ssrc for jid: " + jid);
        }
    }
    return isDesktop;
}



var VideoLayout = (function (my) {
    my.connectionIndicators = {};

    // By default we use camera
    my.getVideoSize = getCameraVideoSize;
    my.getVideoPosition = getCameraVideoPosition;

    my.init = function () {
        // Listen for large video size updates
        document.getElementById('largeVideo')
            .addEventListener('loadedmetadata', function (e) {
                currentVideoWidth = this.videoWidth;
                currentVideoHeight = this.videoHeight;
                VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
            });
    };

    my.isInLastN = function(resource) {
        return lastNCount < 0 // lastN is disabled, return true
            || (lastNCount > 0 && lastNEndpointsCache.length == 0) // lastNEndpoints cache not built yet, return true
            || (lastNEndpointsCache && lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream) {
        VideoLayout.changeLocalVideo(stream);
    };

    my.changeLocalAudio = function(stream) {
        RTC.attachMediaStream($('#localAudio'), stream.getOriginalStream());
        document.getElementById('localAudio').autoplay = true;
        document.getElementById('localAudio').volume = 0;
        if (preMuted) {
            if(!UI.setAudioMuted(true))
            {
                preMuted = mute;
            }
            preMuted = false;
        }
    };

    my.changeLocalVideo = function(stream) {
        var flipX = true;
        if(stream.type == "desktop")
            flipX = false;
        var localVideo = document.createElement('video');
        localVideo.id = 'localVideo_' +
            RTC.getStreamID(stream.getOriginalStream());
        localVideo.autoplay = true;
        localVideo.volume = 0; // is it required if audio is separated ?
        localVideo.oncontextmenu = function () { return false; };

        var localVideoContainer = document.getElementById('localVideoWrapper');
        localVideoContainer.appendChild(localVideo);

        // Set default display name.
        setDisplayName('localVideoContainer');

        if(!VideoLayout.connectionIndicators["localVideoContainer"]) {
            VideoLayout.connectionIndicators["localVideoContainer"]
                = new ConnectionIndicator($("#localVideoContainer")[0], null, VideoLayout);
        }

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        var localVideoSelector = $('#' + localVideo.id);
        // Add click handler to both video and video wrapper elements in case
        // there's no video.
        localVideoSelector.click(function (event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                RTC.getVideoSrc(localVideo),
                false,
                xmpp.myResource());
        });
        $('#localVideoContainer').click(function (event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                RTC.getVideoSrc(localVideo),
                false,
                xmpp.myResource());
        });

        // Add hover handler
        $('#localVideoContainer').hover(
            function() {
                VideoLayout.showDisplayName('localVideoContainer', true);
            },
            function() {
                if (!VideoLayout.isLargeVideoVisible()
                        || RTC.getVideoSrc(localVideo) !== RTC.getVideoSrc($('#largeVideo')[0]))
                    VideoLayout.showDisplayName('localVideoContainer', false);
            }
        );
        // Add stream ended handler
        stream.getOriginalStream().onended = function () {
            localVideoContainer.removeChild(localVideo);
            VideoLayout.updateRemovedVideo(RTC.getVideoSrc(localVideo));
        };
        // Flip video x axis if needed
        flipXLocalVideo = flipX;
        if (flipX) {
            localVideoSelector.addClass("flipVideoX");
        }
        // Attach WebRTC stream
        var videoStream = simulcast.getLocalVideoStream();
        RTC.attachMediaStream(localVideoSelector, videoStream);

        localVideoSrc = RTC.getVideoSrc(localVideo);

        var myResourceJid = xmpp.myResource();

        VideoLayout.updateLargeVideo(localVideoSrc, 0,
            myResourceJid);

    };

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(removedVideoSrc) {
        if (removedVideoSrc === RTC.getVideoSrc($('#largeVideo')[0])) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick
                = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video')
                    .get(0);

            if (!pick) {
                console.info("Last visible video no longer exists");
                pick = $('#remoteVideos>span[id!="mixedstream"]>video').get(0);

                if (!pick || !RTC.getVideoSrc(pick)) {
                    // Try local video
                    console.info("Fallback to local video...");
                    pick = $('#remoteVideos>span>span>video').get(0);
                }
            }

            // mute if localvideo
            if (pick) {
                var container = pick.parentNode;
                var jid = null;
                if(container)
                {
                    if(container.id == "localVideoWrapper")
                    {
                        jid = xmpp.myResource();
                    }
                    else
                    {
                        jid = VideoLayout.getPeerContainerResourceJid(container);
                    }
                }

                VideoLayout.updateLargeVideo(RTC.getVideoSrc(pick), pick.volume, jid);
            } else {
                console.warn("Failed to elect large video");
            }
        }
    };
    
    my.onRemoteStreamAdded = function (stream) {
        var container;
        var remotes = document.getElementById('remoteVideos');

        if (stream.peerjid) {
            VideoLayout.ensurePeerContainerExists(stream.peerjid);

            container  = document.getElementById(
                    'participant_' + Strophe.getResourceFromJid(stream.peerjid));
        } else {
            var id = stream.getOriginalStream().id;
            if (id !== 'mixedmslabel'
                // FIXME: default stream is added always with new focus
                // (to be investigated)
                && id !== 'default') {
                console.error('can not associate stream',
                    id,
                    'with a participant');
                // We don't want to add it here since it will cause troubles
                return;
            }
            // FIXME: for the mixed ms we dont need a video -- currently
            container = document.createElement('span');
            container.id = 'mixedstream';
            container.className = 'videocontainer';
            remotes.appendChild(container);
            Util.playSoundNotification('userJoined');
        }

        if (container) {
            VideoLayout.addRemoteStreamElement( container,
                stream.sid,
                stream.getOriginalStream(),
                stream.peerjid,
                stream.ssrc);
        }
    }

    my.getLargeVideoState = function () {
        return largeVideoState;
    };

    /**
     * Updates the large video with the given new video source.
     */
    my.updateLargeVideo = function(newSrc, vol, resourceJid) {
        console.log('hover in', newSrc);

        if (RTC.getVideoSrc($('#largeVideo')[0]) !== newSrc) {

            $('#activeSpeaker').css('visibility', 'hidden');
            // Due to the simulcast the localVideoSrc may have changed when the
            // fadeOut event triggers. In that case the getJidFromVideoSrc and
            // isVideoSrcDesktop methods will not function correctly.
            //
            // Also, again due to the simulcast, the updateLargeVideo method can
            // be called multiple times almost simultaneously. Therefore, we
            // store the state here and update only once.

            largeVideoState.newSrc = newSrc;
            largeVideoState.isVisible = $('#largeVideo').is(':visible');
            largeVideoState.isDesktop = isVideoSrcDesktop(resourceJid);
            if(jid2Ssrc[largeVideoState.userResourceJid] ||
                (xmpp.myResource() &&
                    largeVideoState.userResourceJid ===
                    xmpp.myResource())) {
                largeVideoState.oldResourceJid = largeVideoState.userResourceJid;
            } else {
                largeVideoState.oldResourceJid = null;
            }
            largeVideoState.userResourceJid = resourceJid;

            // Screen stream is already rotated
            largeVideoState.flipX = (newSrc === localVideoSrc) && flipXLocalVideo;

            var userChanged = false;
            if (largeVideoState.oldResourceJid !== largeVideoState.userResourceJid) {
                userChanged = true;
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                $(document).trigger("selectedendpointchanged", [largeVideoState.userResourceJid]);
            }

            if (!largeVideoState.updateInProgress) {
                largeVideoState.updateInProgress = true;

                var doUpdate = function () {

                    Avatar.updateActiveSpeakerAvatarSrc(
                        xmpp.findJidFromResource(
                            largeVideoState.userResourceJid));

                    if (!userChanged && largeVideoState.preload &&
                        largeVideoState.preload !== null &&
                        RTC.getVideoSrc($(largeVideoState.preload)[0]) === newSrc)
                    {

                        console.info('Switching to preloaded video');
                        var attributes = $('#largeVideo').prop("attributes");

                        // loop through largeVideo attributes and apply them on
                        // preload.
                        $.each(attributes, function () {
                            if (this.name !== 'id' && this.name !== 'src') {
                                largeVideoState.preload.attr(this.name, this.value);
                            }
                        });

                        largeVideoState.preload.appendTo($('#largeVideoContainer'));
                        $('#largeVideo').attr('id', 'previousLargeVideo');
                        largeVideoState.preload.attr('id', 'largeVideo');
                        $('#previousLargeVideo').remove();

                        largeVideoState.preload.on('loadedmetadata', function (e) {
                            currentVideoWidth = this.videoWidth;
                            currentVideoHeight = this.videoHeight;
                            VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
                        });
                        largeVideoState.preload = null;
                        largeVideoState.preload_ssrc = 0;
                    } else {
                        RTC.setVideoSrc($('#largeVideo')[0], largeVideoState.newSrc);
                    }

                    var videoTransform = document.getElementById('largeVideo')
                        .style.webkitTransform;

                    if (largeVideoState.flipX && videoTransform !== 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "scaleX(-1)";
                    }
                    else if (!largeVideoState.flipX && videoTransform === 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "none";
                    }

                    // Change the way we'll be measuring and positioning large video

                    VideoLayout.getVideoSize = largeVideoState.isDesktop
                        ? getDesktopVideoSize
                        : getCameraVideoSize;
                    VideoLayout.getVideoPosition = largeVideoState.isDesktop
                        ? getDesktopVideoPosition
                        : getCameraVideoPosition;


                    // Only if the large video is currently visible.
                    // Disable previous dominant speaker video.
                    if (largeVideoState.oldResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.oldResourceJid,
                            false);
                    }

                    // Enable new dominant speaker in the remote videos section.
                    if (largeVideoState.userResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.userResourceJid,
                            true);
                    }

                    if (userChanged && largeVideoState.isVisible) {
                        // using "this" should be ok because we're called
                        // from within the fadeOut event.
                        $(this).fadeIn(300);
                    }

                    if(userChanged) {
                        Avatar.showUserAvatar(
                            xmpp.findJidFromResource(
                                largeVideoState.oldResourceJid));
                    }

                    largeVideoState.updateInProgress = false;
                };

                if (userChanged) {
                    $('#largeVideo').fadeOut(300, doUpdate);
                } else {
                    doUpdate();
                }
            }
        } else {
            Avatar.showUserAvatar(
                xmpp.findJidFromResource(
                    largeVideoState.userResourceJid));
        }

    };

    my.handleVideoThumbClicked = function(videoSrc,
                                          noPinnedEndpointChangedEvent, 
                                          resourceJid) {
        // Restore style for previously focused video
        var oldContainer = null;
        if(focusedVideoInfo) {
            var focusResourceJid = focusedVideoInfo.resourceJid;
            oldContainer = getParticipantContainer(focusResourceJid);
        }

        if (oldContainer) {
            oldContainer.removeClass("videoContainerFocused");
        }

        // Unlock current focused.
        if (focusedVideoInfo && focusedVideoInfo.src === videoSrc)
        {
            focusedVideoInfo = null;
            var dominantSpeakerVideo = null;
            // Enable the currently set dominant speaker.
            if (currentDominantSpeaker) {
                dominantSpeakerVideo
                    = $('#participant_' + currentDominantSpeaker + '>video')
                        .get(0);

                if (dominantSpeakerVideo) {
                    VideoLayout.updateLargeVideo(
                        RTC.getVideoSrc(dominantSpeakerVideo),
                        1,
                        currentDominantSpeaker);
                }
            }

            if (!noPinnedEndpointChangedEvent) {
                $(document).trigger("pinnedendpointchanged");
            }
            return;
        }

        // Lock new video
        focusedVideoInfo = {
            src: videoSrc,
            resourceJid: resourceJid
        };

        // Update focused/pinned interface.
        if (resourceJid)
        {
            var container = getParticipantContainer(resourceJid);
            container.addClass("videoContainerFocused");

            if (!noPinnedEndpointChangedEvent) {
                $(document).trigger("pinnedendpointchanged", [resourceJid]);
            }
        }

        if ($('#largeVideo').attr('src') === videoSrc &&
            VideoLayout.isLargeVideoOnTop()) {
            return;
        }

        // Triggers a "video.selected" event. The "false" parameter indicates
        // this isn't a prezi.
        $(document).trigger("video.selected", [false]);

        VideoLayout.updateLargeVideo(videoSrc, 1, resourceJid);

        $('audio').each(function (idx, el) {
            if (el.id.indexOf('mixedmslabel') !== -1) {
                el.volume = 0;
                el.volume = 1;
            }
        });
    };

    /**
     * Positions the large video.
     *
     * @param videoWidth the stream video width
     * @param videoHeight the stream video height
     */
    my.positionLarge = function (videoWidth, videoHeight) {
        var videoSpaceWidth = $('#videospace').width();
        var videoSpaceHeight = window.innerHeight;

        var videoSize = VideoLayout.getVideoSize(videoWidth,
                                     videoHeight,
                                     videoSpaceWidth,
                                     videoSpaceHeight);

        var largeVideoWidth = videoSize[0];
        var largeVideoHeight = videoSize[1];

        var videoPosition = VideoLayout.getVideoPosition(largeVideoWidth,
                                             largeVideoHeight,
                                             videoSpaceWidth,
                                             videoSpaceHeight);

        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        positionVideo($('#largeVideo'),
                      largeVideoWidth,
                      largeVideoHeight,
                      horizontalIndent, verticalIndent);
    };

    /**
     * Shows/hides the large video.
     */
    my.setLargeVideoVisible = function(isVisible) {
        var resourceJid = largeVideoState.userResourceJid;

        if (isVisible) {
            $('#largeVideo').css({visibility: 'visible'});
            $('.watermark').css({visibility: 'visible'});
            VideoLayout.enableDominantSpeaker(resourceJid, true);
        }
        else {
            $('#largeVideo').css({visibility: 'hidden'});
            $('#activeSpeaker').css('visibility', 'hidden');
            $('.watermark').css({visibility: 'hidden'});
            VideoLayout.enableDominantSpeaker(resourceJid, false);
            if(focusedVideoInfo) {
                var focusResourceJid = focusedVideoInfo.resourceJid;
                var oldContainer = getParticipantContainer(focusResourceJid);

                if (oldContainer && oldContainer.length > 0) {
                    oldContainer.removeClass("videoContainerFocused");
                }
                focusedVideoInfo = null;
                if(focusResourceJid) {
                    Avatar.showUserAvatar(
                        xmpp.findJidFromResource(focusResourceJid));
                }
            }
        }
    };

    /**
     * Indicates if the large video is currently visible.
     *
     * @return <tt>true</tt> if visible, <tt>false</tt> - otherwise
     */
    my.isLargeVideoVisible = function() {
        return $('#largeVideo').is(':visible');
    };

    my.isLargeVideoOnTop = function () {
        var Etherpad = require("../etherpad/Etherpad");
        var Prezi = require("../prezi/Prezi");
        return !Prezi.isPresentationVisible() && !Etherpad.isVisible();
    };

    /**
     * Checks if container for participant identified by given peerJid exists
     * in the document and creates it eventually.
     * 
     * @param peerJid peer Jid to check.
     * @param userId user email or id for setting the avatar
     * 
     * @return Returns <tt>true</tt> if the peer container exists,
     * <tt>false</tt> - otherwise
     */
    my.ensurePeerContainerExists = function(peerJid, userId) {
        ContactList.ensureAddContact(peerJid, userId);

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var videoSpanId = 'participant_' + resourceJid;

        if (!$('#' + videoSpanId).length) {
            var container =
                VideoLayout.addRemoteVideoContainer(peerJid, videoSpanId, userId);
            Avatar.setUserAvatar(peerJid, userId);
            // Set default display name.
            setDisplayName(videoSpanId);

            VideoLayout.connectionIndicators[videoSpanId] =
                new ConnectionIndicator(container, peerJid, VideoLayout);

            var nickfield = document.createElement('span');
            nickfield.className = "nick";
            nickfield.appendChild(document.createTextNode(resourceJid));
            container.appendChild(nickfield);

            // In case this is not currently in the last n we don't show it.
            if (localLastNCount
                && localLastNCount > 0
                && $('#remoteVideos>span').length >= localLastNCount + 2) {
                showPeerContainer(resourceJid, 'hide');
            }
            else
                VideoLayout.resizeThumbnails();
        }
    };

    my.addRemoteVideoContainer = function(peerJid, spanId) {
        var container = document.createElement('span');
        container.id = spanId;
        container.className = 'videocontainer';
        var remotes = document.getElementById('remoteVideos');

        // If the peerJid is null then this video span couldn't be directly
        // associated with a participant (this could happen in the case of prezi).
        if (xmpp.isModerator() && peerJid !== null)
            addRemoteVideoMenu(peerJid, container);

        remotes.appendChild(container);
        AudioLevels.updateAudioLevelCanvas(peerJid, VideoLayout);

        return container;
    };

    /**
     * Creates an audio or video stream element.
     */
    my.createStreamElement = function (sid, stream) {
        var isVideo = stream.getVideoTracks().length > 0;

        var element = isVideo
                        ? document.createElement('video')
                        : document.createElement('audio');
        var id = (isVideo ? 'remoteVideo_' : 'remoteAudio_')
                    + sid + '_' + RTC.getStreamID(stream);

        element.id = id;
        element.autoplay = true;
        element.oncontextmenu = function () { return false; };

        return element;
    };

    my.addRemoteStreamElement
        = function (container, sid, stream, peerJid, thessrc) {
        var newElementId = null;

        var isVideo = stream.getVideoTracks().length > 0;

        if (container) {
            var streamElement = VideoLayout.createStreamElement(sid, stream);
            newElementId = streamElement.id;

            container.appendChild(streamElement);

            var sel = $('#' + newElementId);
            sel.hide();

            // If the container is currently visible we attach the stream.
            if (!isVideo
                || (container.offsetParent !== null && isVideo)) {
                var videoStream = simulcast.getReceivingVideoStream(stream);
                RTC.attachMediaStream(sel, videoStream);

                if (isVideo)
                    waitForRemoteVideo(sel, thessrc, stream, peerJid);
            }

            stream.onended = function () {
                console.log('stream ended', this);

                VideoLayout.removeRemoteStreamElement(
                    stream, isVideo, container);

                // NOTE(gp) it seems that under certain circumstances, the
                // onended event is not fired and thus the contact list is not
                // updated.
                //
                // The onended event of a stream should be fired when the SSRCs
                // corresponding to that stream are removed from the SDP; but
                // this doesn't seem to always be the case, resulting in ghost
                // contacts.
                //
                // In an attempt to fix the ghost contacts problem, I'm moving
                // the removeContact() method call in app.js, inside the
                // 'muc.left' event handler.

                //if (peerJid)
                //    ContactList.removeContact(peerJid);
            };

            // Add click handler.
            container.onclick = function (event) {
                /*
                 * FIXME It turns out that videoThumb may not exist (if there is
                 * no actual video).
                 */
                var videoThumb = $('#' + container.id + '>video').get(0);
                if (videoThumb) {
                    VideoLayout.handleVideoThumbClicked(
                        RTC.getVideoSrc(videoThumb),
                        false,
                        Strophe.getResourceFromJid(peerJid));
                }

                event.stopPropagation();
                event.preventDefault();
                return false;
            };

            // Add hover handler
            $(container).hover(
                function() {
                    VideoLayout.showDisplayName(container.id, true);
                },
                function() {
                    var videoSrc = null;
                    if ($('#' + container.id + '>video')
                            && $('#' + container.id + '>video').length > 0) {
                        videoSrc = RTC.getVideoSrc($('#' + container.id + '>video').get(0));
                    }

                    // If the video has been "pinned" by the user we want to
                    // keep the display name on place.
                    if (!VideoLayout.isLargeVideoVisible()
                            || videoSrc !== RTC.getVideoSrc($('#largeVideo')[0]))
                        VideoLayout.showDisplayName(container.id, false);
                }
            );
        }

        return newElementId;
    };

    /**
     * Removes the remote stream element corresponding to the given stream and
     * parent container.
     * 
     * @param stream the stream
     * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
     * @param container
     */
    my.removeRemoteStreamElement = function (stream, isVideo, container) {
        if (!container)
            return;

        var select = null;
        var removedVideoSrc = null;
        if (isVideo) {
            select = $('#' + container.id + '>video');
            removedVideoSrc = RTC.getVideoSrc(select.get(0));
        }
        else
            select = $('#' + container.id + '>audio');


        // Mark video as removed to cancel waiting loop(if video is removed
        // before has started)
        select.removed = true;
        select.remove();

        var audioCount = $('#' + container.id + '>audio').length;
        var videoCount = $('#' + container.id + '>video').length;

        if (!audioCount && !videoCount) {
            console.log("Remove whole user", container.id);
            if(VideoLayout.connectionIndicators[container.id])
                VideoLayout.connectionIndicators[container.id].remove();
            // Remove whole container
            container.remove();

            Util.playSoundNotification('userLeft');
            VideoLayout.resizeThumbnails();
        }

        if (removedVideoSrc)
            VideoLayout.updateRemovedVideo(removedVideoSrc);
    };

    /**
     * Show/hide peer container for the given resourceJid.
     */
    function showPeerContainer(resourceJid, state) {
        var peerContainer = $('#participant_' + resourceJid);

        if (!peerContainer)
            return;

        var isHide = state === 'hide';
        var resizeThumbnails = false;

        if (!isHide) {
            if (!peerContainer.is(':visible')) {
                resizeThumbnails = true;
                peerContainer.show();
            }

            if (state == 'show')
            {
                // peerContainer.css('-webkit-filter', '');
                var jid = xmpp.findJidFromResource(resourceJid);
                Avatar.showUserAvatar(jid, false);
            }
            else // if (state == 'avatar')
            {
                // peerContainer.css('-webkit-filter', 'grayscale(100%)');
                var jid = xmpp.findJidFromResource(resourceJid);
                Avatar.showUserAvatar(jid, true);
            }
        }
        else if (peerContainer.is(':visible') && isHide)
        {
            resizeThumbnails = true;
            peerContainer.hide();
            if(VideoLayout.connectionIndicators['participant_' + resourceJid])
                VideoLayout.connectionIndicators['participant_' + resourceJid].hide();
        }

        if (resizeThumbnails) {
            VideoLayout.resizeThumbnails();
        }

        // We want to be able to pin a participant from the contact list, even
        // if he's not in the lastN set!
        // ContactList.setClickable(resourceJid, !isHide);

    };

    my.inputDisplayNameHandler = function (name) {
        if (name && nickname !== name) {
            nickname = name;
            window.localStorage.displayname = nickname;
            xmpp.addToPresence("displayName", nickname);

            Chat.setChatConversationMode(true);
        }

        if (!$('#localDisplayName').is(":visible")) {
            if (nickname)
                $('#localDisplayName').text(nickname + " (me)");
            else
                $('#localDisplayName')
                    .text(interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
            $('#localDisplayName').show();
        }

        $('#editDisplayName').hide();
    };

    /**
     * Shows/hides the display name on the remote video.
     * @param videoSpanId the identifier of the video span element
     * @param isShow indicates if the display name should be shown or hidden
     */
    my.showDisplayName = function(videoSpanId, isShow) {
        var nameSpan = $('#' + videoSpanId + '>span.displayname').get(0);
        if (isShow) {
            if (nameSpan && nameSpan.innerHTML && nameSpan.innerHTML.length) 
                nameSpan.setAttribute("style", "display:inline-block;");
        }
        else {
            if (nameSpan)
                nameSpan.setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows the presence status message for the given video.
     */
    my.setPresenceStatus = function (videoSpanId, statusMsg) {

        if (!$('#' + videoSpanId).length) {
            // No container
            return;
        }

        var statusSpan = $('#' + videoSpanId + '>span.status');
        if (!statusSpan.length) {
            //Add status span
            statusSpan = document.createElement('span');
            statusSpan.className = 'status';
            statusSpan.id = videoSpanId + '_status';
            $('#' + videoSpanId)[0].appendChild(statusSpan);

            statusSpan = $('#' + videoSpanId + '>span.status');
        }

        // Display status
        if (statusMsg && statusMsg.length) {
            $('#' + videoSpanId + '_status').text(statusMsg);
            statusSpan.get(0).setAttribute("style", "display:inline-block;");
        }
        else {
            // Hide
            statusSpan.get(0).setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows a visual indicator for the moderator of the conference.
     */
    my.showModeratorIndicator = function () {

        var isModerator = xmpp.isModerator();
        if (isModerator) {
            var indicatorSpan = $('#localVideoContainer .focusindicator');

            if (indicatorSpan.children().length === 0)
            {
                createModeratorIndicatorElement(indicatorSpan[0]);
            }
        }

        var members = xmpp.getMembers();

        Object.keys(members).forEach(function (jid) {

            if (Strophe.getResourceFromJid(jid) === 'focus') {
                // Skip server side focus
                return;
            }

            var resourceJid = Strophe.getResourceFromJid(jid);
            var videoSpanId = 'participant_' + resourceJid;
            var videoContainer = document.getElementById(videoSpanId);

            if (!videoContainer) {
                console.error("No video container for " + jid);
                return;
            }

            var member = members[jid];

            if (member.role === 'moderator') {
                // Remove menu if peer is moderator
                var menuSpan = $('#' + videoSpanId + '>span.remotevideomenu');
                if (menuSpan.length) {
                    removeRemoteVideoMenu(videoSpanId);
                }
                // Show moderator indicator
                var indicatorSpan
                    = $('#' + videoSpanId + ' .focusindicator');

                if (!indicatorSpan || indicatorSpan.length === 0) {
                    indicatorSpan = document.createElement('span');
                    indicatorSpan.className = 'focusindicator';

                    videoContainer.appendChild(indicatorSpan);

                    createModeratorIndicatorElement(indicatorSpan);
                }
            } else if (isModerator) {
                // We are moderator, but user is not - add menu
                if ($('#remote_popupmenu_' + resourceJid).length <= 0) {
                    addRemoteVideoMenu(
                        jid,
                        document.getElementById('participant_' + resourceJid));
                }
            }
        });
    };

    /**
     * Shows video muted indicator over small videos.
     */
    my.showVideoIndicator = function(videoSpanId, isMuted) {
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');

        if (isMuted === 'false') {
            if (videoMutedSpan.length > 0) {
                videoMutedSpan.remove();
            }
        }
        else {
            if(videoMutedSpan.length == 0) {
                videoMutedSpan = document.createElement('span');
                videoMutedSpan.className = 'videoMuted';

                $('#' + videoSpanId)[0].appendChild(videoMutedSpan);

                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-camera-disabled';
                Util.setTooltip(mutedIndicator,
                    "Participant has<br/>stopped the camera.",
                    "top");
                videoMutedSpan.appendChild(mutedIndicator);
            }

            VideoLayout.updateMutePosition(videoSpanId);

        }
    };

    my.updateMutePosition = function (videoSpanId) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');
        var connectionIndicator = $('#' + videoSpanId + '>div.connectionindicator');
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');
        if(connectionIndicator.length > 0
            && connectionIndicator[0].style.display != "none") {
            audioMutedSpan.css({right: "23px"});
            videoMutedSpan.css({right: ((audioMutedSpan.length > 0? 23 : 0) + 30) + "px"});
        }
        else
        {
            audioMutedSpan.css({right: "0px"});
            videoMutedSpan.css({right: (audioMutedSpan.length > 0? 30 : 0) + "px"});
        }
    }
    /**
     * Shows audio muted indicator over small videos.
     * @param {string} isMuted
     */
    my.showAudioIndicator = function(videoSpanId, isMuted) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');

        if (isMuted === 'false') {
            if (audioMutedSpan.length > 0) {
                audioMutedSpan.popover('hide');
                audioMutedSpan.remove();
            }
        }
        else {
            if(audioMutedSpan.length == 0 ) {
                audioMutedSpan = document.createElement('span');
                audioMutedSpan.className = 'audioMuted';
                Util.setTooltip(audioMutedSpan,
                    "Participant is muted",
                    "top");

                $('#' + videoSpanId)[0].appendChild(audioMutedSpan);
                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-mic-disabled';
                audioMutedSpan.appendChild(mutedIndicator);

            }
            VideoLayout.updateMutePosition(videoSpanId);
        }
    };

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    my.showLocalAudioIndicator = function(isMuted) {
        VideoLayout.showAudioIndicator('localVideoContainer', isMuted.toString());
    };

    /**
     * Resizes the large video container.
     */
    my.resizeLargeVideoContainer = function () {
        Chat.resizeChat();
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) return;

        $('#videospace').width(availableWidth);
        $('#videospace').height(availableHeight);
        $('#largeVideoContainer').width(availableWidth);
        $('#largeVideoContainer').height(availableHeight);

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

        VideoLayout.resizeThumbnails();
    };

    /**
     * Resizes thumbnails.
     */
    my.resizeThumbnails = function() {
        var videoSpaceWidth = $('#remoteVideos').width();

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var width = thumbnailSize[0];
        var height = thumbnailSize[1];

        // size videos so that while keeping AR and max height, we have a
        // nice fit
        $('#remoteVideos').height(height);
        $('#remoteVideos>span').width(width);
        $('#remoteVideos>span').height(height);

        $('.userAvatar').css('left', (width - height) / 2);

        $(document).trigger("remotevideo.resized", [width, height]);
    };

    /**
     * Enables the dominant speaker UI.
     *
     * @param resourceJid the jid indicating the video element to
     * activate/deactivate
     * @param isEnable indicates if the dominant speaker should be enabled or
     * disabled
     */
    my.enableDominantSpeaker = function(resourceJid, isEnable) {

        var videoSpanId = null;
        var videoContainerId = null;
        if (resourceJid
                === xmpp.myResource()) {
            videoSpanId = 'localVideoWrapper';
            videoContainerId = 'localVideoContainer';
        }
        else {
            videoSpanId = 'participant_' + resourceJid;
            videoContainerId = videoSpanId;
        }

        var displayName = resourceJid;
        var nameSpan = $('#' + videoContainerId + '>span.displayname');
        if (nameSpan.length > 0)
            displayName = nameSpan.html();

        console.log("UI enable dominant speaker",
            displayName,
            resourceJid,
            isEnable);

        videoSpan = document.getElementById(videoContainerId);

        if (!videoSpan) {
            return;
        }

        var video = $('#' + videoSpanId + '>video');

        if (video && video.length > 0) {
            if (isEnable) {
                var isLargeVideoVisible = VideoLayout.isLargeVideoOnTop();
                VideoLayout.showDisplayName(videoContainerId, isLargeVideoVisible);

                if (!videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.add("dominantspeaker");
            }
            else {
                VideoLayout.showDisplayName(videoContainerId, false);

                if (videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.remove("dominantspeaker");
            }

            Avatar.showUserAvatar(
                xmpp.findJidFromResource(resourceJid));
        }
    };

    /**
     * Calculates the thumbnail size.
     *
     * @param videoSpaceWidth the width of the video space
     */
    my.calculateThumbnailSize = function (videoSpaceWidth) {
        // Calculate the available height, which is the inner window height minus
       // 39px for the header minus 2px for the delimiter lines on the top and
       // bottom of the large video, minus the 36px space inside the remoteVideos
       // container used for highlighting shadow.
       var availableHeight = 100;

        var numvids = $('#remoteVideos>span:visible').length;
        if (localLastNCount && localLastNCount > 0) {
            numvids = Math.min(localLastNCount + 1, numvids);
        }

       // Remove the 3px borders arround videos and border around the remote
       // videos area and the 4 pixels between the local video and the others
       //TODO: Find out where the 4 pixels come from and remove them
       var availableWinWidth = videoSpaceWidth - 2 * 3 * numvids - 70 - 4;

       var availableWidth = availableWinWidth / numvids;
       var aspectRatio = 16.0 / 9.0;
       var maxHeight = Math.min(160, availableHeight);
       availableHeight = Math.min(maxHeight, availableWidth / aspectRatio);
       if (availableHeight < availableWidth / aspectRatio) {
           availableWidth = Math.floor(availableHeight * aspectRatio);
       }

       return [availableWidth, availableHeight];
   };

    /**
     * Updates the remote video menu.
     *
     * @param jid the jid indicating the video for which we're adding a menu.
     * @param isMuted indicates the current mute state
     */
    my.updateRemoteVideoMenu = function(jid, isMuted) {
        var muteMenuItem
            = $('#remote_popupmenu_'
                    + Strophe.getResourceFromJid(jid)
                    + '>li>a.mutelink');

        var mutedIndicator = "<i class='icon-mic-disabled'></i>";

        if (muteMenuItem.length) {
            var muteLink = muteMenuItem.get(0);

            if (isMuted === 'true') {
                muteLink.innerHTML = mutedIndicator + ' Muted';
                muteLink.className = 'mutelink disabled';
            }
            else {
                muteLink.innerHTML = mutedIndicator + ' Mute';
                muteLink.className = 'mutelink';
            }
        }
    };

    /**
     * Returns the current dominant speaker resource jid.
     */
    my.getDominantSpeakerResourceJid = function () {
        return currentDominantSpeaker;
    };

    /**
     * Returns the corresponding resource jid to the given peer container
     * DOM element.
     *
     * @return the corresponding resource jid to the given peer container
     * DOM element
     */
    my.getPeerContainerResourceJid = function (containerElement) {
        var i = containerElement.id.indexOf('participant_');

        if (i >= 0)
            return containerElement.id.substring(i + 12); 
    };

    /**
     * On contact list item clicked.
     */
    $(ContactList).bind('contactclicked', function(event, jid) {
        if (!jid) {
            return;
        }

        var resource = Strophe.getResourceFromJid(jid);
        var videoContainer = $("#participant_" + resource);
        if (videoContainer.length > 0) {
            var videoThumb = $('video', videoContainer).get(0);
            // It is not always the case that a videoThumb exists (if there is
            // no actual video).
            if (videoThumb) {
                if (videoThumb.src && videoThumb.src != '') {

                    // We have a video src, great! Let's update the large video
                    // now.

                    VideoLayout.handleVideoThumbClicked(
                        videoThumb.src,
                        false,
                        Strophe.getResourceFromJid(jid));
                } else {

                    // If we don't have a video src for jid, there's absolutely
                    // no point in calling handleVideoThumbClicked; Quite
                    // simply, it won't work because it needs an src to attach
                    // to the large video.
                    //
                    // Instead, we trigger the pinned endpoint changed event to
                    // let the bridge adjust its lastN set for myjid and store
                    // the pinned user in the lastNPickupJid variable to be
                    // picked up later by the lastN changed event handler.

                    lastNPickupJid = jid;
                    $(document).trigger("pinnedendpointchanged", [jid]);
                }
            } else if (jid == xmpp.myJid()) {
                $("#localVideoContainer").click();
            }
        }
    });

    /**
     * On audio muted event.
     */
    $(document).bind('audiomuted.muc', function (event, jid, isMuted) {
        /*
         // FIXME: but focus can not mute in this case ? - check
        if (jid === xmpp.myJid()) {

            // The local mute indicator is controlled locally
            return;
        }*/
        var videoSpanId = null;
        if (jid === xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        mutedAudios[jid] = isMuted;

        if (xmpp.isModerator()) {
            VideoLayout.updateRemoteVideoMenu(jid, isMuted);
        }

        if (videoSpanId)
            VideoLayout.showAudioIndicator(videoSpanId, isMuted);
    });

    /**
     * On video muted event.
     */
    $(document).bind('videomuted.muc', function (event, jid, value) {
        var isMuted = (value === "true");
        if(!RTC.muteRemoteVideoStream(jid, isMuted))
            return;

        Avatar.showUserAvatar(jid, isMuted);
        var videoSpanId = null;
        if (jid === xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        if (videoSpanId)
            VideoLayout.showVideoIndicator(videoSpanId, value);
    });

    /**
     * Display name changed.
     */
    my.onDisplayNameChanged =
                    function (jid, displayName, status) {
        var name = null;
        if (jid === 'localVideoContainer'
            || jid === xmpp.myJid()) {
            name = nickname;
            setDisplayName('localVideoContainer',
                           displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            name = $('#participant_' + Strophe.getResourceFromJid(jid) + "_name").text();
            setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
                displayName,
                status);
        }

        if(jid === 'localVideoContainer')
            jid = xmpp.myJid();
        if(!name || name != displayName)
            API.triggerEvent("displayNameChange",{jid: jid, displayname: displayName});
    };

    /**
     * On dominant speaker changed event.
     */
    $(document).bind('dominantspeakerchanged', function (event, resourceJid) {
        // We ignore local user events.
        if (resourceJid
                === xmpp.myResource())
            return;

        // Update the current dominant speaker.
        if (resourceJid !== currentDominantSpeaker) {
            var oldSpeakerVideoSpanId = "participant_" + currentDominantSpeaker,
                newSpeakerVideoSpanId = "participant_" + resourceJid;
            if($("#" + oldSpeakerVideoSpanId + ">span.displayname").text() ===
                interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME) {
                setDisplayName(oldSpeakerVideoSpanId, null);
            }
            if($("#" + newSpeakerVideoSpanId + ">span.displayname").text() ===
                interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME) {
                setDisplayName(newSpeakerVideoSpanId,
                    interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME);
            }
            currentDominantSpeaker = resourceJid;
        } else {
            return;
        }

        // Obtain container for new dominant speaker.
        var container  = document.getElementById(
                'participant_' + resourceJid);

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        if (container && !focusedVideoInfo)
        {
            var video = container.getElementsByTagName("video");

            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (video.length && video[0].currentTime > 0)
                VideoLayout.updateLargeVideo(RTC.getVideoSrc(video[0]), resourceJid);
        }
    });

    /**
     * On last N change event.
     *
     * @param event the event that notified us
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    $(document).bind('lastnchanged', function ( event,
                                                lastNEndpoints,
                                                endpointsEnteringLastN,
                                                stream) {
        if (lastNCount !== lastNEndpoints.length)
            lastNCount = lastNEndpoints.length;

        lastNEndpointsCache = lastNEndpoints;

        // Say A, B, C, D, E, and F are in a conference and LastN = 3.
        //
        // If LastN drops to, say, 2, because of adaptivity, then E should see
        // thumbnails for A, B and C. A and B are in E's server side LastN set,
        // so E sees them. C is only in E's local LastN set.
        //
        // If F starts talking and LastN = 3, then E should see thumbnails for
        // F, A, B. B gets "ejected" from E's server side LastN set, but it
        // enters E's local LastN ejecting C.

        // Increase the local LastN set size, if necessary.
        if (lastNCount > localLastNCount) {
            localLastNCount = lastNCount;
        }

        // Update the local LastN set preserving the order in which the
        // endpoints appeared in the LastN/local LastN set.

        var nextLocalLastNSet = lastNEndpoints.slice(0);
        for (var i = 0; i < localLastNSet.length; i++) {
            if (nextLocalLastNSet.length >= localLastNCount) {
                break;
            }

            var resourceJid = localLastNSet[i];
            if (nextLocalLastNSet.indexOf(resourceJid) === -1) {
                nextLocalLastNSet.push(resourceJid);
            }
        }

        localLastNSet = nextLocalLastNSet;

        var updateLargeVideo = false;

        // Handle LastN/local LastN changes.
        $('#remoteVideos>span').each(function( index, element ) {
            var resourceJid = VideoLayout.getPeerContainerResourceJid(element);

            var isReceived = true;
            if (resourceJid
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) < 0) {
                console.log("Remove from last N", resourceJid);
                showPeerContainer(resourceJid, 'hide');
                isReceived = false;
            } else if (resourceJid
                && $('#participant_' + resourceJid).is(':visible')
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) >= 0) {
                showPeerContainer(resourceJid, 'avatar');
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                var largeVideoResource = largeVideoState.userResourceJid;
                if (!updateLargeVideo && resourceJid === largeVideoResource) {
                    updateLargeVideo = true;
                }
            }
        });

        if (!endpointsEnteringLastN || endpointsEnteringLastN.length < 0)
            endpointsEnteringLastN = lastNEndpoints;

        if (endpointsEnteringLastN && endpointsEnteringLastN.length > 0) {
            endpointsEnteringLastN.forEach(function (resourceJid) {

                var isVisible = $('#participant_' + resourceJid).is(':visible');
                showPeerContainer(resourceJid, 'show');
                if (!isVisible) {
                    console.log("Add to last N", resourceJid);

                    var jid = xmpp.findJidFromResource(resourceJid);
                    var mediaStream = RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
                    var sel = $('#participant_' + resourceJid + '>video');

                    var videoStream = simulcast.getReceivingVideoStream(
                        mediaStream.stream);
                    RTC.attachMediaStream(sel, videoStream);
                    if (lastNPickupJid == mediaStream.peerjid) {
                        // Clean up the lastN pickup jid.
                        lastNPickupJid = null;

                        // Don't fire the events again, they've already
                        // been fired in the contact list click handler.
                        VideoLayout.handleVideoThumbClicked(
                            $(sel).attr('src'),
                            false,
                            Strophe.getResourceFromJid(mediaStream.peerjid));

                        updateLargeVideo = false;
                    }
                    waitForRemoteVideo(sel, mediaStream.ssrc, mediaStream.stream, resourceJid);
                }
            })
        }

        // The endpoint that was being shown in the large video has dropped out
        // of the lastN set and there was no lastN pickup jid. We need to update
        // the large video now.

        if (updateLargeVideo) {

            var resource, container, src;
            var myResource
                = xmpp.myResource();

            // Find out which endpoint to show in the large video.
            for (var i = 0; i < lastNEndpoints.length; i++) {
                resource = lastNEndpoints[i];
                if (!resource || resource === myResource)
                    continue;

                container = $("#participant_" + resource);
                if (container.length == 0)
                    continue;

                src = $('video', container).attr('src');
                if (!src)
                    continue;

                // videoSrcToSsrc needs to be update for this call to succeed.
                VideoLayout.updateLargeVideo(src);
                break;

            }
        }
    });

    $(document).bind('simulcastlayerschanging', function (event, endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not preload anything).
            //
            // The bridge could probably stop sending this message if it's for
            // an endpoint that's not in lastN.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var sid = res.sid;
            var electedStream = res.stream;

            if (sid && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info([esl, primarySSRC, msid, sid, electedStream]);

                var msidParts = msid.split(' ');

                var preload = (Strophe.getResourceFromJid(ssrc2jid[primarySSRC]) == largeVideoState.userResourceJid);

                if (preload) {
                    if (largeVideoState.preload)
                    {
                        $(largeVideoState.preload).remove();
                    }
                    console.info('Preloading remote video');
                    largeVideoState.preload = $('<video autoplay></video>');
                    // ssrcs are unique in an rtp session
                    largeVideoState.preload_ssrc = primarySSRC;

                    RTC.attachMediaStream(largeVideoState.preload, electedStream)
                }

            } else {
                console.error('Could not find a stream or a session.', sid, electedStream);
            }
        });
    });

    /**
     * On simulcast layers changed event.
     */
    $(document).bind('simulcastlayerschanged', function (event, endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not change large video/thumbnail
            // SRCs).
            //
            // Note that even if we ignore the "changed" event in this event
            // handler, the bridge must continue sending these events because
            // the simulcast code in simulcast.js uses it to know what's going
            // to be streamed by the bridge when/if the endpoint gets back into
            // the lastN set.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var sid = res.sid;
            var electedStream = res.stream;

            if (sid && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info('Switching simulcast substream.');
                console.info([esl, primarySSRC, msid, sid, electedStream]);

                var msidParts = msid.split(' ');
                var selRemoteVideo = $(['#', 'remoteVideo_', sid, '_', msidParts[0]].join(''));

                var updateLargeVideo = (Strophe.getResourceFromJid(ssrc2jid[primarySSRC])
                    == largeVideoState.userResourceJid);
                var updateFocusedVideoSrc = (focusedVideoInfo && focusedVideoInfo.src && focusedVideoInfo.src != '' &&
                    (RTC.getVideoSrc(selRemoteVideo[0]) == focusedVideoInfo.src));

                var electedStreamUrl;
                if (largeVideoState.preload_ssrc == primarySSRC)
                {
                    RTC.setVideoSrc(selRemoteVideo[0], RTC.getVideoSrc(largeVideoState.preload[0]));
                }
                else
                {
                    if (largeVideoState.preload
                        && largeVideoState.preload != null) {
                        $(largeVideoState.preload).remove();
                    }

                    largeVideoState.preload_ssrc = 0;

                    RTC.attachMediaStream(selRemoteVideo, electedStream);
                }

                var jid = ssrc2jid[primarySSRC];
                jid2Ssrc[jid] = primarySSRC;

                if (updateLargeVideo) {
                    VideoLayout.updateLargeVideo(RTC.getVideoSrc(selRemoteVideo[0]), null,
                        Strophe.getResourceFromJid(jid));
                }

                if (updateFocusedVideoSrc) {
                    focusedVideoInfo.src = RTC.getVideoSrc(selRemoteVideo[0]);
                }

                var videoId;
                if(resource == xmpp.myResource())
                {
                    videoId = "localVideoContainer";
                }
                else
                {
                    videoId = "participant_" + resource;
                }
                var connectionIndicator = VideoLayout.connectionIndicators[videoId];
                if(connectionIndicator)
                    connectionIndicator.updatePopoverData();

            } else {
                console.error('Could not find a stream or a sid.', sid, electedStream);
            }
        });
    });

    /**
     * Updates local stats
     * @param percent
     * @param object
     */
    my.updateLocalConnectionStats = function (percent, object) {
        var resolution = null;
        if(object.resolution !== null)
        {
            resolution = object.resolution;
            object.resolution = resolution[xmpp.myJid()];
            delete resolution[xmpp.myJid()];
        }
        updateStatsIndicator("localVideoContainer", percent, object);
        for(var jid in resolution)
        {
            if(resolution[jid] === null)
                continue;
            var id = 'participant_' + Strophe.getResourceFromJid(jid);
            if(VideoLayout.connectionIndicators[id])
            {
                VideoLayout.connectionIndicators[id].updateResolution(resolution[jid]);
            }
        }

    };

    /**
     * Updates remote stats.
     * @param jid the jid associated with the stats
     * @param percent the connection quality percent
     * @param object the stats data
     */
    my.updateConnectionStats = function (jid, percent, object) {
        var resourceJid = Strophe.getResourceFromJid(jid);

        var videoSpanId = 'participant_' + resourceJid;
        updateStatsIndicator(videoSpanId, percent, object);
    };

    /**
     * Removes the connection
     * @param jid
     */
    my.removeConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].remove();
    };

    /**
     * Hides the connection indicator
     * @param jid
     */
    my.hideConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].hide();
    };

    /**
     * Hides all the indicators
     */
    my.onStatsStop = function () {
        for(var indicator in VideoLayout.connectionIndicators)
        {
            VideoLayout.connectionIndicators[indicator].hideIndicator();
        }
    };

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;
},{"../audio_levels/AudioLevels":2,"../avatar/Avatar":5,"../etherpad/Etherpad":6,"../prezi/Prezi":7,"../side_pannels/chat/Chat":9,"../side_pannels/contactlist/ContactList":13,"../util/UIUtil":22,"./ConnectionIndicator":23}],25:[function(require,module,exports){
//var nouns = [
//];
var pluralNouns = [
    "Aliens", "Animals", "Antelopes", "Ants", "Apes", "Apples", "Baboons", "Bacteria", "Badgers", "Bananas", "Bats",
    "Bears", "Birds", "Bonobos", "Brides", "Bugs", "Bulls", "Butterflies", "Cheetahs",
    "Cherries", "Chicken", "Children", "Chimps", "Clowns", "Cows", "Creatures", "Dinosaurs", "Dogs", "Dolphins",
    "Donkeys", "Dragons", "Ducks", "Dwarfs", "Eagles", "Elephants", "Elves", "FAIL", "Fathers",
    "Fish", "Flowers", "Frogs", "Fruit", "Fungi", "Galaxies", "Geese", "Goats",
    "Gorillas", "Hedgehogs", "Hippos", "Horses", "Hunters", "Insects", "Kids", "Knights",
    "Lemons", "Lemurs", "Leopards", "LifeForms", "Lions", "Lizards", "Mice", "Monkeys", "Monsters",
    "Mushrooms", "Octopodes", "Oranges", "Orangutans", "Organisms", "Pants", "Parrots", "Penguins",
    "People", "Pigeons", "Pigs", "Pineapples", "Plants", "Potatoes", "Priests", "Rats", "Reptiles", "Reptilians",
    "Rhinos", "Seagulls", "Sheep", "Siblings", "Snakes", "Spaghetti", "Spiders", "Squid", "Squirrels",
    "Stars", "Students", "Teachers", "Tigers", "Tomatoes", "Trees", "Vampires", "Vegetables", "Viruses", "Vulcans",
    "Warewolves", "Weasels", "Whales", "Witches", "Wizards", "Wolves", "Workers", "Worms", "Zebras"
];
//var places = [
//"Pub", "University", "Airport", "Library", "Mall", "Theater", "Stadium", "Office", "Show", "Gallows", "Beach",
// "Cemetery", "Hospital", "Reception", "Restaurant", "Bar", "Church", "House", "School", "Square", "Village",
// "Cinema", "Movies", "Party", "Restroom", "End", "Jail", "PostOffice", "Station", "Circus", "Gates", "Entrance",
// "Bridge"
//];
var verbs = [
    "Abandon", "Adapt", "Advertise", "Answer", "Anticipate", "Appreciate",
    "Approach", "Argue", "Ask", "Bite", "Blossom", "Blush", "Breathe", "Breed", "Bribe", "Burn", "Calculate",
    "Clean", "Code", "Communicate", "Compute", "Confess", "Confiscate", "Conjugate", "Conjure", "Consume",
    "Contemplate", "Crawl", "Dance", "Delegate", "Devour", "Develop", "Differ", "Discuss",
    "Dissolve", "Drink", "Eat", "Elaborate", "Emancipate", "Estimate", "Expire", "Extinguish",
    "Extract", "FAIL", "Facilitate", "Fall", "Feed", "Finish", "Floss", "Fly", "Follow", "Fragment", "Freeze",
    "Gather", "Glow", "Grow", "Hex", "Hide", "Hug", "Hurry", "Improve", "Intersect", "Investigate", "Jinx",
    "Joke", "Jubilate", "Kiss", "Laugh", "Manage", "Meet", "Merge", "Move", "Object", "Observe", "Offer",
    "Paint", "Participate", "Party", "Perform", "Plan", "Pursue", "Pierce", "Play", "Postpone", "Pray", "Proclaim",
    "Question", "Read", "Reckon", "Rejoice", "Represent", "Resize", "Rhyme", "Scream", "Search", "Select", "Share", "Shoot",
    "Shout", "Signal", "Sing", "Skate", "Sleep", "Smile", "Smoke", "Solve", "Spell", "Steer", "Stink",
    "Substitute", "Swim", "Taste", "Teach", "Terminate", "Think", "Type", "Unite", "Vanish", "Worship"
];
var adverbs = [
    "Absently", "Accurately", "Accusingly", "Adorably", "AllTheTime", "Alone", "Always", "Amazingly", "Angrily",
    "Anxiously", "Anywhere", "Appallingly", "Apparently", "Articulately", "Astonishingly", "Badly", "Barely",
    "Beautifully", "Blindly", "Bravely", "Brightly", "Briskly", "Brutally", "Calmly", "Carefully", "Casually",
    "Cautiously", "Cleverly", "Constantly", "Correctly", "Crazily", "Curiously", "Cynically", "Daily",
    "Dangerously", "Deliberately", "Delicately", "Desperately", "Discreetly", "Eagerly", "Easily", "Euphoricly",
    "Evenly", "Everywhere", "Exactly", "Expectantly", "Extensively", "FAIL", "Ferociously", "Fiercely", "Finely",
    "Flatly", "Frequently", "Frighteningly", "Gently", "Gloriously", "Grimly", "Guiltily", "Happily",
    "Hard", "Hastily", "Heroically", "High", "Highly", "Hourly", "Humbly", "Hysterically", "Immensely",
    "Impartially", "Impolitely", "Indifferently", "Intensely", "Jealously", "Jovially", "Kindly", "Lazily",
    "Lightly", "Loudly", "Lovingly", "Loyally", "Magnificently", "Malevolently", "Merrily", "Mightily", "Miserably",
    "Mysteriously", "NOT", "Nervously", "Nicely", "Nowhere", "Objectively", "Obnoxiously", "Obsessively",
    "Obviously", "Often", "Painfully", "Patiently", "Playfully", "Politely", "Poorly", "Precisely", "Promptly",
    "Quickly", "Quietly", "Randomly", "Rapidly", "Rarely", "Recklessly", "Regularly", "Remorsefully", "Responsibly",
    "Rudely", "Ruthlessly", "Sadly", "Scornfully", "Seamlessly", "Seldom", "Selfishly", "Seriously", "Shakily",
    "Sharply", "Sideways", "Silently", "Sleepily", "Slightly", "Slowly", "Slyly", "Smoothly", "Softly", "Solemnly", "Steadily", "Sternly", "Strangely", "Strongly", "Stunningly", "Surely", "Tenderly", "Thoughtfully",
    "Tightly", "Uneasily", "Vanishingly", "Violently", "Warmly", "Weakly", "Wearily", "Weekly", "Weirdly", "Well",
    "Well", "Wickedly", "Wildly", "Wisely", "Wonderfully", "Yearly"
];
var adjectives = [
    "Abominable", "Accurate", "Adorable", "All", "Alleged", "Ancient", "Angry", "Angry", "Anxious", "Appalling",
    "Apparent", "Astonishing", "Attractive", "Awesome", "Baby", "Bad", "Beautiful", "Benign", "Big", "Bitter",
    "Blind", "Blue", "Bold", "Brave", "Bright", "Brisk", "Calm", "Camouflaged", "Casual", "Cautious",
    "Choppy", "Chosen", "Clever", "Cold", "Cool", "Crawly", "Crazy", "Creepy", "Cruel", "Curious", "Cynical",
    "Dangerous", "Dark", "Delicate", "Desperate", "Difficult", "Discreet", "Disguised", "Dizzy",
    "Dumb", "Eager", "Easy", "Edgy", "Electric", "Elegant", "Emancipated", "Enormous", "Euphoric", "Evil",
    "FAIL", "Fast", "Ferocious", "Fierce", "Fine", "Flawed", "Flying", "Foolish", "Foxy",
    "Freezing", "Funny", "Furious", "Gentle", "Glorious", "Golden", "Good", "Green", "Green", "Guilty",
    "Hairy", "Happy", "Hard", "Hasty", "Hazy", "Heroic", "Hostile", "Hot", "Humble", "Humongous",
    "Humorous", "Hysterical", "Idealistic", "Ignorant", "Immense", "Impartial", "Impolite", "Indifferent",
    "Infuriated", "Insightful", "Intense", "Interesting", "Intimidated", "Intriguing", "Jealous", "Jolly", "Jovial",
    "Jumpy", "Kind", "Laughing", "Lazy", "Liquid", "Lonely", "Longing", "Loud", "Loving", "Loyal", "Macabre", "Mad",
    "Magical", "Magnificent", "Malevolent", "Medieval", "Memorable", "Mere", "Merry", "Mighty",
    "Mischievous", "Miserable", "Modified", "Moody", "Most", "Mysterious", "Mystical", "Needy",
    "Nervous", "Nice", "Objective", "Obnoxious", "Obsessive", "Obvious", "Opinionated", "Orange",
    "Painful", "Passionate", "Perfect", "Pink", "Playful", "Poisonous", "Polite", "Poor", "Popular", "Powerful",
    "Precise", "Preserved", "Pretty", "Purple", "Quick", "Quiet", "Random", "Rapid", "Rare", "Real",
    "Reassuring", "Reckless", "Red", "Regular", "Remorseful", "Responsible", "Rich", "Rude", "Ruthless",
    "Sad", "Scared", "Scary", "Scornful", "Screaming", "Selfish", "Serious", "Shady", "Shaky", "Sharp",
    "Shiny", "Shy", "Simple", "Sleepy", "Slow", "Sly", "Small", "Smart", "Smelly", "Smiling", "Smooth",
    "Smug", "Sober", "Soft", "Solemn", "Square", "Square", "Steady", "Strange", "Strong",
    "Stunning", "Subjective", "Successful", "Surly", "Sweet", "Tactful", "Tense",
    "Thoughtful", "Tight", "Tiny", "Tolerant", "Uneasy", "Unique", "Unseen", "Warm", "Weak",
    "Weird", "WellCooked", "Wild", "Wise", "Witty", "Wonderful", "Worried", "Yellow", "Young",
    "Zealous"
    ];
//var pronouns = [
//];
//var conjunctions = [
//"And", "Or", "For", "Above", "Before", "Against", "Between"
//];

/*
 * Maps a string (category name) to the array of words from that category.
 */
var CATEGORIES =
{
    //"_NOUN_": nouns,
    "_PLURALNOUN_": pluralNouns,
    //"_PLACE_": places,
    "_VERB_": verbs,
    "_ADVERB_": adverbs,
    "_ADJECTIVE_": adjectives
    //"_PRONOUN_": pronouns,
    //"_CONJUNCTION_": conjunctions,
};

var PATTERNS = [
    "_ADJECTIVE__PLURALNOUN__VERB__ADVERB_"

    // BeautifulFungiOrSpaghetti
    //"_ADJECTIVE__PLURALNOUN__CONJUNCTION__PLURALNOUN_",

    // AmazinglyScaryToy
    //"_ADVERB__ADJECTIVE__NOUN_",

    // NeitherTrashNorRifle
    //"Neither_NOUN_Nor_NOUN_",
    //"Either_NOUN_Or_NOUN_",

    // EitherCopulateOrInvestigate
    //"Either_VERB_Or_VERB_",
    //"Neither_VERB_Nor_VERB_",

    //"The_ADJECTIVE__ADJECTIVE__NOUN_",
    //"The_ADVERB__ADJECTIVE__NOUN_",
    //"The_ADVERB__ADJECTIVE__NOUN_s",
    //"The_ADVERB__ADJECTIVE__PLURALNOUN__VERB_",

    // WolvesComputeBadly
    //"_PLURALNOUN__VERB__ADVERB_",

    // UniteFacilitateAndMerge
    //"_VERB__VERB_And_VERB_",

    //NastyWitchesAtThePub
    //"_ADJECTIVE__PLURALNOUN_AtThe_PLACE_",
];


/*
 * Returns a random element from the array 'arr'
 */
function randomElement(arr)
{
    return arr[Math.floor(Math.random() * arr.length)];
}

/*
 * Returns true if the string 's' contains one of the
 * template strings.
 */
function hasTemplate(s)
{
    for (var template in CATEGORIES){
        if (s.indexOf(template) >= 0){
            return true;
        }
    }
}

/**
 * Generates new room name.
 */
var RoomNameGenerator = {
    generateRoomWithoutSeparator: function()
    {
        // Note that if more than one pattern is available, the choice of 'name' won't be random (names from patterns
        // with fewer options will have higher probability of being chosen that names from patterns with more options).
        var name = randomElement(PATTERNS);
        var word;
        while (hasTemplate(name)){
            for (var template in CATEGORIES){
                word = randomElement(CATEGORIES[template]);
                name = name.replace(template, word);
            }
        }

        return name;
    }
}

module.exports = RoomNameGenerator;

},{}],26:[function(require,module,exports){
var animateTimeout, updateTimeout;

var RoomNameGenerator = require("./RoomnameGenerator");

function enter_room()
{
    var val = $("#enter_room_field").val();
    if(!val) {
        val = $("#enter_room_field").attr("room_name");
    }
    if (val) {
        window.location.pathname = "/" + val;
    }
}

function animate(word) {
    var currentVal = $("#enter_room_field").attr("placeholder");
    $("#enter_room_field").attr("placeholder", currentVal + word.substr(0, 1));
    animateTimeout = setTimeout(function() {
        animate(word.substring(1, word.length))
    }, 70);
}

function update_roomname()
{
    var word = RoomNameGenerator.generateRoomWithoutSeparator();
    $("#enter_room_field").attr("room_name", word);
    $("#enter_room_field").attr("placeholder", "");
    clearTimeout(animateTimeout);
    animate(word);
    updateTimeout = setTimeout(update_roomname, 10000);
}


function setupWelcomePage()
{
    $("#videoconference_page").hide();
    $("#domain_name").text(
            window.location.protocol + "//" + window.location.host + "/");
    $("span[name='appName']").text(interfaceConfig.APP_NAME);

    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#welcome_page_header div[class='watermark leftwatermark']");
        if(leftWatermarkDiv && leftWatermarkDiv.length > 0)
        {
            leftWatermarkDiv.css({display: 'block'});
            leftWatermarkDiv.parent().get(0).href
                = interfaceConfig.JITSI_WATERMARK_LINK;
        }

    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#welcome_page_header div[class='watermark rightwatermark']");
        if(rightWatermarkDiv && rightWatermarkDiv.length > 0) {
            rightWatermarkDiv.css({display: 'block'});
            rightWatermarkDiv.parent().get(0).href
                = interfaceConfig.BRAND_WATERMARK_LINK;
            rightWatermarkDiv.get(0).style.backgroundImage
                = "url(images/rightwatermark.png)";
        }
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#welcome_page_header>a[class='poweredby']")
            .css({display: 'block'});
    }

    $("#enter_room_button").click(function()
    {
        enter_room();
    });

    $("#enter_room_field").keydown(function (event) {
        if (event.keyCode === 13 /* enter */) {
            enter_room();
        }
    });

    if (!(interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE === false)){
        var updateTimeout;
        var animateTimeout;
        $("#reload_roomname").click(function () {
            clearTimeout(updateTimeout);
            clearTimeout(animateTimeout);
            update_roomname();
        });
        $("#reload_roomname").show();


        update_roomname();
    }

    $("#disable_welcome").click(function () {
        window.localStorage.welcomePageDisabled
            = $("#disable_welcome").is(":checked");
    });

}

module.exports = setupWelcomePage;
},{"./RoomnameGenerator":25}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL1VJLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9hdWRpb19sZXZlbHMvQXVkaW9MZXZlbHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL2F1ZGlvX2xldmVscy9DYW52YXNVdGlscy5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvYXV0aGVudGljYXRpb24vQXV0aGVudGljYXRpb24uanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL2F2YXRhci9BdmF0YXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL2V0aGVycGFkL0V0aGVycGFkLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9wcmV6aS9QcmV6aS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL1NpZGVQYW5lbFRvZ2dsZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3NpZGVfcGFubmVscy9jaGF0L0NoYXQuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3NpZGVfcGFubmVscy9jaGF0L0NvbW1hbmRzLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9zaWRlX3Bhbm5lbHMvY2hhdC9SZXBsYWNlbWVudC5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL2NoYXQvc21pbGV5cy5qc29uIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9zaWRlX3Bhbm5lbHMvY29udGFjdGxpc3QvQ29udGFjdExpc3QuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3NpZGVfcGFubmVscy9zZXR0aW5ncy9TZXR0aW5ncy5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL3NldHRpbmdzL1NldHRpbmdzTWVudS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdG9vbGJhcnMvQm90dG9tVG9vbGJhci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdG9vbGJhcnMvVG9vbGJhclRvZ2dsZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3Rvb2xiYXJzL3Rvb2xiYXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3V0aWwvSml0c2lQb3BvdmVyLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS91dGlsL01lc3NhZ2VIYW5kbGVyLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS91dGlsL1VJVXRpbC5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdmlkZW9sYXlvdXQvQ29ubmVjdGlvbkluZGljYXRvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdmlkZW9sYXlvdXQvVmlkZW9MYXlvdXQuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3dlbGNvbWVfcGFnZS9Sb29tbmFtZUdlbmVyYXRvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvd2VsY29tZV9wYWdlL1dlbGNvbWVQYWdlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1ckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFVJID0ge307XG5cbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuL3ZpZGVvbGF5b3V0L1ZpZGVvTGF5b3V0LmpzXCIpO1xudmFyIEF1ZGlvTGV2ZWxzID0gcmVxdWlyZShcIi4vYXVkaW9fbGV2ZWxzL0F1ZGlvTGV2ZWxzLmpzXCIpO1xudmFyIFByZXppID0gcmVxdWlyZShcIi4vcHJlemkvUHJlemkuanNcIik7XG52YXIgRXRoZXJwYWQgPSByZXF1aXJlKFwiLi9ldGhlcnBhZC9FdGhlcnBhZC5qc1wiKTtcbnZhciBDaGF0ID0gcmVxdWlyZShcIi4vc2lkZV9wYW5uZWxzL2NoYXQvQ2hhdC5qc1wiKTtcbnZhciBUb29sYmFyID0gcmVxdWlyZShcIi4vdG9vbGJhcnMvdG9vbGJhclwiKTtcbnZhciBUb29sYmFyVG9nZ2xlciA9IHJlcXVpcmUoXCIuL3Rvb2xiYXJzL3Rvb2xiYXJ0b2dnbGVyXCIpO1xudmFyIEJvdHRvbVRvb2xiYXIgPSByZXF1aXJlKFwiLi90b29sYmFycy9Cb3R0b21Ub29sYmFyXCIpO1xudmFyIENvbnRhY3RMaXN0ID0gcmVxdWlyZShcIi4vc2lkZV9wYW5uZWxzL2NvbnRhY3RsaXN0L0NvbnRhY3RMaXN0XCIpO1xudmFyIEF2YXRhciA9IHJlcXVpcmUoXCIuL2F2YXRhci9BdmF0YXJcIik7XG4vL3ZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xudmFyIFNldHRpbmdzTWVudSA9IHJlcXVpcmUoXCIuL3NpZGVfcGFubmVscy9zZXR0aW5ncy9TZXR0aW5nc01lbnVcIik7XG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zaWRlX3Bhbm5lbHMvc2V0dGluZ3MvU2V0dGluZ3NcIik7XG52YXIgUGFuZWxUb2dnbGVyID0gcmVxdWlyZShcIi4vc2lkZV9wYW5uZWxzL1NpZGVQYW5lbFRvZ2dsZXJcIik7XG52YXIgUm9vbU5hbWVHZW5lcmF0b3IgPSByZXF1aXJlKFwiLi93ZWxjb21lX3BhZ2UvUm9vbW5hbWVHZW5lcmF0b3JcIik7XG5VSS5tZXNzYWdlSGFuZGxlciA9IHJlcXVpcmUoXCIuL3V0aWwvTWVzc2FnZUhhbmRsZXJcIik7XG52YXIgbWVzc2FnZUhhbmRsZXIgPSBVSS5tZXNzYWdlSGFuZGxlcjtcbnZhciBBdXRoZW50aWNhdGlvbiAgPSByZXF1aXJlKFwiLi9hdXRoZW50aWNhdGlvbi9BdXRoZW50aWNhdGlvblwiKTtcbnZhciBVSVV0aWwgPSByZXF1aXJlKFwiLi91dGlsL1VJVXRpbFwiKTtcblxuLy92YXIgZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xudmFyIHJvb21OYW1lID0gbnVsbDtcblxuXG5mdW5jdGlvbiBzZXR1cFByZXppKClcbntcbiAgICAkKFwiI3JlbG9hZFByZXNlbnRhdGlvbkxpbmtcIikuY2xpY2soZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgUHJlemkucmVsb2FkUHJlc2VudGF0aW9uKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwQ2hhdCgpXG57XG4gICAgQ2hhdC5pbml0KCk7XG4gICAgJChcIiN0b2dnbGVfc21pbGV5c1wiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgQ2hhdC50b2dnbGVTbWlsZXlzKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwVG9vbGJhcnMoKSB7XG4gICAgVG9vbGJhci5pbml0KFVJKTtcbiAgICBUb29sYmFyLnNldHVwQnV0dG9uc0Zyb21Db25maWcoKTtcbiAgICBCb3R0b21Ub29sYmFyLmluaXQoKTtcbn1cblxuZnVuY3Rpb24gc3RyZWFtSGFuZGxlcihzdHJlYW0pIHtcbiAgICBzd2l0Y2ggKHN0cmVhbS50eXBlKVxuICAgIHtcbiAgICAgICAgY2FzZSBcImF1ZGlvXCI6XG4gICAgICAgICAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbEF1ZGlvKHN0cmVhbSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInZpZGVvXCI6XG4gICAgICAgICAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbFZpZGVvKHN0cmVhbSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cmVhbVwiOlxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY2hhbmdlTG9jYWxTdHJlYW0oc3RyZWFtKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZGVza3RvcFwiOlxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY2hhbmdlTG9jYWxWaWRlbyhzdHJlYW0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvbkRpc3Bvc2VDb25mZXJlbmNlKHVubG9hZCkge1xuICAgIFRvb2xiYXIuc2hvd0F1dGhlbnRpY2F0ZUJ1dHRvbihmYWxzZSk7XG59O1xuXG5mdW5jdGlvbiBvbkRpc3BsYXlOYW1lQ2hhbmdlZChqaWQsIGRpc3BsYXlOYW1lKSB7XG4gICAgQ29udGFjdExpc3Qub25EaXNwbGF5TmFtZUNoYW5nZShqaWQsIGRpc3BsYXlOYW1lKTtcbiAgICBTZXR0aW5nc01lbnUub25EaXNwbGF5TmFtZUNoYW5nZShqaWQsIGRpc3BsYXlOYW1lKTtcbiAgICBWaWRlb0xheW91dC5vbkRpc3BsYXlOYW1lQ2hhbmdlZChqaWQsIGRpc3BsYXlOYW1lKTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJMaXN0ZW5lcnMoKSB7XG4gICAgUlRDLmFkZFN0cmVhbUxpc3RlbmVyKHN0cmVhbUhhbmRsZXIsIFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9MT0NBTF9DUkVBVEVEKTtcblxuICAgIFJUQy5hZGRTdHJlYW1MaXN0ZW5lcihzdHJlYW1IYW5kbGVyLCBTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfTE9DQUxfQ0hBTkdFRCk7XG4gICAgUlRDLmFkZFN0cmVhbUxpc3RlbmVyKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgVmlkZW9MYXlvdXQub25SZW1vdGVTdHJlYW1BZGRlZChzdHJlYW0pO1xuICAgIH0sIFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9SRU1PVEVfQ1JFQVRFRCk7XG5cbiAgICBWaWRlb0xheW91dC5pbml0KCk7XG5cbiAgICBzdGF0aXN0aWNzLmFkZEF1ZGlvTGV2ZWxMaXN0ZW5lcihmdW5jdGlvbihqaWQsIGF1ZGlvTGV2ZWwpXG4gICAge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQ7XG4gICAgICAgIGlmKGppZCA9PT0gc3RhdGlzdGljcy5MT0NBTF9KSUQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc291cmNlSmlkID0gQXVkaW9MZXZlbHMuTE9DQUxfTEVWRUw7XG4gICAgICAgICAgICBpZihSVEMubG9jYWxBdWRpby5pc011dGVkKCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYXVkaW9MZXZlbCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIH1cblxuICAgICAgICBBdWRpb0xldmVscy51cGRhdGVBdWRpb0xldmVsKHJlc291cmNlSmlkLCBhdWRpb0xldmVsLFxuICAgICAgICAgICAgVUkuZ2V0TGFyZ2VWaWRlb1N0YXRlKCkudXNlclJlc291cmNlSmlkKTtcbiAgICB9KTtcbiAgICBkZXNrdG9wc2hhcmluZy5hZGRMaXN0ZW5lcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIFRvb2xiYXJUb2dnbGVyLnNob3dEZXNrdG9wU2hhcmluZ0J1dHRvbigpO1xuICAgIH0sIERlc2t0b3BTaGFyaW5nRXZlbnRUeXBlcy5JTklUKTtcbiAgICBkZXNrdG9wc2hhcmluZy5hZGRMaXN0ZW5lcihcbiAgICAgICAgVG9vbGJhci5jaGFuZ2VEZXNrdG9wU2hhcmluZ0J1dHRvblN0YXRlLFxuICAgICAgICBEZXNrdG9wU2hhcmluZ0V2ZW50VHlwZXMuU1dJVENISU5HX0RPTkUpO1xuICAgIHhtcHAuYWRkTGlzdGVuZXIoWE1QUEV2ZW50cy5ESVNQT1NFX0NPTkZFUkVOQ0UsIG9uRGlzcG9zZUNvbmZlcmVuY2UpO1xuICAgIHhtcHAuYWRkTGlzdGVuZXIoWE1QUEV2ZW50cy5LSUNLRUQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWVzc2FnZUhhbmRsZXIub3Blbk1lc3NhZ2VEaWFsb2coXCJTZXNzaW9uIFRlcm1pbmF0ZWRcIixcbiAgICAgICAgICAgIFwiT3VjaCEgWW91IGhhdmUgYmVlbiBraWNrZWQgb3V0IG9mIHRoZSBtZWV0IVwiKTtcbiAgICB9KTtcbiAgICB4bXBwLmFkZExpc3RlbmVyKFhNUFBFdmVudHMuQlJJREdFX0RPV04sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKFwiRXJyb3JcIixcbiAgICAgICAgICAgIFwiSml0c2kgVmlkZW9icmlkZ2UgaXMgY3VycmVudGx5IHVuYXZhaWxhYmxlLiBQbGVhc2UgdHJ5IGFnYWluIGxhdGVyIVwiKTtcbiAgICB9KTtcbiAgICB4bXBwLmFkZExpc3RlbmVyKFhNUFBFdmVudHMuVVNFUl9JRF9DSEFOR0VELCBBdmF0YXIuc2V0VXNlckF2YXRhcik7XG4gICAgeG1wcC5hZGRMaXN0ZW5lcihYTVBQRXZlbnRzLkNIQU5HRURfU1RSRUFNUywgZnVuY3Rpb24gKGppZCwgY2hhbmdlZFN0cmVhbXMpIHtcbiAgICAgICAgZm9yKHN0cmVhbSBpbiBjaGFuZ2VkU3RyZWFtcylcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gbWlnaHQgbmVlZCB0byB1cGRhdGUgdGhlIGRpcmVjdGlvbiBpZiBwYXJ0aWNpcGFudCBqdXN0IHdlbnQgZnJvbSBzZW5kcmVjdiB0byByZWN2b25seVxuICAgICAgICAgICAgaWYgKHN0cmVhbS50eXBlID09PSAndmlkZW8nIHx8IHN0cmVhbS50eXBlID09PSAnc2NyZWVuJykge1xuICAgICAgICAgICAgICAgIHZhciBlbCA9ICQoJyNwYXJ0aWNpcGFudF8nICArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkgKyAnPnZpZGVvJyk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzdHJlYW0uZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NlbmRyZWN2JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdyZWN2b25seSc6XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTogQ2hlY2sgaWYgd2UgaGF2ZSB0byBjaGFuZ2UgbGFyZ2UgdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vVmlkZW9MYXlvdXQudXBkYXRlTGFyZ2VWaWRlbyhlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuICAgIHhtcHAuYWRkTGlzdGVuZXIoWE1QUEV2ZW50cy5ESVNQTEFZX05BTUVfQ0hBTkdFRCwgb25EaXNwbGF5TmFtZUNoYW5nZWQpO1xuICAgIHhtcHAuYWRkTGlzdGVuZXIoWE1QUEV2ZW50cy5NVUNfSk9JTkVELCBvbk11Y0pvaW5lZCk7XG59XG5cbmZ1bmN0aW9uIGJpbmRFdmVudHMoKVxue1xuICAgIC8qKlxuICAgICAqIFJlc2l6ZXMgYW5kIHJlcG9zaXRpb25zIHZpZGVvcyBpbiBmdWxsIHNjcmVlbiBtb2RlLlxuICAgICAqL1xuICAgICQoZG9jdW1lbnQpLm9uKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlIG1vemZ1bGxzY3JlZW5jaGFuZ2UgZnVsbHNjcmVlbmNoYW5nZScsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnJlc2l6ZUxhcmdlVmlkZW9Db250YWluZXIoKTtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnBvc2l0aW9uTGFyZ2UoKTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplTGFyZ2VWaWRlb0NvbnRhaW5lcigpO1xuICAgICAgICBWaWRlb0xheW91dC5wb3NpdGlvbkxhcmdlKCk7XG4gICAgfSk7XG59XG5cblVJLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIGRvY3VtZW50LnRpdGxlID0gaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FO1xuICAgIGlmKGNvbmZpZy5lbmFibGVXZWxjb21lUGFnZSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT0gXCIvXCIgJiZcbiAgICAgICAgKCF3aW5kb3cubG9jYWxTdG9yYWdlLndlbGNvbWVQYWdlRGlzYWJsZWQgfHwgd2luZG93LmxvY2FsU3RvcmFnZS53ZWxjb21lUGFnZURpc2FibGVkID09IFwiZmFsc2VcIikpXG4gICAge1xuICAgICAgICAkKFwiI3ZpZGVvY29uZmVyZW5jZV9wYWdlXCIpLmhpZGUoKTtcbiAgICAgICAgdmFyIHNldHVwV2VsY29tZVBhZ2UgPSByZXF1aXJlKFwiLi93ZWxjb21lX3BhZ2UvV2VsY29tZVBhZ2VcIik7XG4gICAgICAgIHNldHVwV2VsY29tZVBhZ2UoKTtcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5TSE9XX0pJVFNJX1dBVEVSTUFSSykge1xuICAgICAgICB2YXIgbGVmdFdhdGVybWFya0RpdlxuICAgICAgICAgICAgPSAkKFwiI2xhcmdlVmlkZW9Db250YWluZXIgZGl2W2NsYXNzPSd3YXRlcm1hcmsgbGVmdHdhdGVybWFyayddXCIpO1xuXG4gICAgICAgIGxlZnRXYXRlcm1hcmtEaXYuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgICAgIGxlZnRXYXRlcm1hcmtEaXYucGFyZW50KCkuZ2V0KDApLmhyZWZcbiAgICAgICAgICAgID0gaW50ZXJmYWNlQ29uZmlnLkpJVFNJX1dBVEVSTUFSS19MSU5LO1xuICAgIH1cblxuICAgIGlmIChpbnRlcmZhY2VDb25maWcuU0hPV19CUkFORF9XQVRFUk1BUkspIHtcbiAgICAgICAgdmFyIHJpZ2h0V2F0ZXJtYXJrRGl2XG4gICAgICAgICAgICA9ICQoXCIjbGFyZ2VWaWRlb0NvbnRhaW5lciBkaXZbY2xhc3M9J3dhdGVybWFyayByaWdodHdhdGVybWFyayddXCIpO1xuXG4gICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJ30pO1xuICAgICAgICByaWdodFdhdGVybWFya0Rpdi5wYXJlbnQoKS5nZXQoMCkuaHJlZlxuICAgICAgICAgICAgPSBpbnRlcmZhY2VDb25maWcuQlJBTkRfV0FURVJNQVJLX0xJTks7XG4gICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmdldCgwKS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICAgID0gXCJ1cmwoaW1hZ2VzL3JpZ2h0d2F0ZXJtYXJrLnBuZylcIjtcbiAgICB9XG5cbiAgICBpZiAoaW50ZXJmYWNlQ29uZmlnLlNIT1dfUE9XRVJFRF9CWSkge1xuICAgICAgICAkKFwiI2xhcmdlVmlkZW9Db250YWluZXI+YVtjbGFzcz0ncG93ZXJlZGJ5J11cIikuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgfVxuXG4gICAgJChcIiN3ZWxjb21lX3BhZ2VcIikuaGlkZSgpO1xuXG4gICAgJCgnYm9keScpLnBvcG92ZXIoeyBzZWxlY3RvcjogJ1tkYXRhLXRvZ2dsZT1wb3BvdmVyXScsXG4gICAgICAgIHRyaWdnZXI6ICdjbGljayBob3ZlcicsXG4gICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKSArXG4gICAgICAgICAgICAgICAgS2V5Ym9hcmRTaG9ydGN1dC5nZXRTaG9ydGN1dCh0aGlzLmdldEF0dHJpYnV0ZShcInNob3J0Y3V0XCIpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFZpZGVvTGF5b3V0LnJlc2l6ZUxhcmdlVmlkZW9Db250YWluZXIoKTtcbiAgICAkKFwiI3ZpZGVvc3BhY2VcIikubW91c2Vtb3ZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFRvb2xiYXJUb2dnbGVyLnNob3dUb29sYmFyKCk7XG4gICAgfSk7XG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3IgcHJvbXB0IGRpYWxvZ3MuXG4gICAgalF1ZXJ5LnByb21wdC5zZXREZWZhdWx0cyh7cGVyc2lzdGVudDogZmFsc2V9KTtcblxuLy8gICAgS2V5Ym9hcmRTaG9ydGN1dC5pbml0KCk7XG4gICAgcmVnaXN0ZXJMaXN0ZW5lcnMoKTtcbiAgICBiaW5kRXZlbnRzKCk7XG4gICAgc2V0dXBQcmV6aSgpO1xuICAgIHNldHVwVG9vbGJhcnMoKTtcbiAgICBzZXR1cENoYXQoKTtcblxuICAgIGRvY3VtZW50LnRpdGxlID0gaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FO1xuXG4gICAgJChcIiNkb3dubG9hZGxvZ1wiKS5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZHVtcChldmVudC50YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgaWYoY29uZmlnLmVuYWJsZVdlbGNvbWVQYWdlICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSBcIi9cIiAmJlxuICAgICAgICAoIXdpbmRvdy5sb2NhbFN0b3JhZ2Uud2VsY29tZVBhZ2VEaXNhYmxlZCB8fCB3aW5kb3cubG9jYWxTdG9yYWdlLndlbGNvbWVQYWdlRGlzYWJsZWQgPT0gXCJmYWxzZVwiKSlcbiAgICB7XG4gICAgICAgICQoXCIjdmlkZW9jb25mZXJlbmNlX3BhZ2VcIikuaGlkZSgpO1xuICAgICAgICB2YXIgc2V0dXBXZWxjb21lUGFnZSA9IHJlcXVpcmUoXCIuL3dlbGNvbWVfcGFnZS9XZWxjb21lUGFnZVwiKTtcbiAgICAgICAgc2V0dXBXZWxjb21lUGFnZSgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKFwiI3dlbGNvbWVfcGFnZVwiKS5oaWRlKCk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGFyZ2VWaWRlbycpLnZvbHVtZSA9IDA7XG5cbiAgICBpZiAoISQoJyNzZXR0aW5ncycpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdpbml0Jyk7XG4gICAgICAgIGluaXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2dpbkluZm8ub25zdWJtaXQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoJyNzZXR0aW5ncycpLmhpZGUoKTtcbiAgICAgICAgICAgIGluaXQoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB0b2FzdHIub3B0aW9ucyA9IHtcbiAgICAgICAgXCJjbG9zZUJ1dHRvblwiOiB0cnVlLFxuICAgICAgICBcImRlYnVnXCI6IGZhbHNlLFxuICAgICAgICBcInBvc2l0aW9uQ2xhc3NcIjogXCJub3RpZmljYXRpb24tYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIFwib25jbGlja1wiOiBudWxsLFxuICAgICAgICBcInNob3dEdXJhdGlvblwiOiBcIjMwMFwiLFxuICAgICAgICBcImhpZGVEdXJhdGlvblwiOiBcIjEwMDBcIixcbiAgICAgICAgXCJ0aW1lT3V0XCI6IFwiMjAwMFwiLFxuICAgICAgICBcImV4dGVuZGVkVGltZU91dFwiOiBcIjEwMDBcIixcbiAgICAgICAgXCJzaG93RWFzaW5nXCI6IFwic3dpbmdcIixcbiAgICAgICAgXCJoaWRlRWFzaW5nXCI6IFwibGluZWFyXCIsXG4gICAgICAgIFwic2hvd01ldGhvZFwiOiBcImZhZGVJblwiLFxuICAgICAgICBcImhpZGVNZXRob2RcIjogXCJmYWRlT3V0XCIsXG4gICAgICAgIFwicmVwb3NpdGlvblwiOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmKFBhbmVsVG9nZ2xlci5pc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWJvdHRvbS1yaWdodC1jZW50ZXJcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLnJlbW92ZUNsYXNzKFwibm90aWZpY2F0aW9uLWJvdHRvbS1yaWdodC1jZW50ZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibmV3ZXN0T25Ub3BcIjogZmFsc2VcbiAgICB9O1xuXG4gICAgJCgnI3NldHRpbmdzbWVudT5pbnB1dCcpLmtleXVwKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgaWYoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHsvL2VudGVyXG4gICAgICAgICAgICBTZXR0aW5nc01lbnUudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoXCIjdXBkYXRlU2V0dGluZ3NcIikuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBTZXR0aW5nc01lbnUudXBkYXRlKCk7XG4gICAgfSk7XG5cbn07XG5cblVJLnRvZ2dsZVNtaWxleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgQ2hhdC50b2dnbGVTbWlsZXlzKCk7XG59O1xuXG5VSS5jaGF0QWRkRXJyb3IgPSBmdW5jdGlvbihlcnJvck1lc3NhZ2UsIG9yaWdpbmFsVGV4dClcbntcbiAgICByZXR1cm4gQ2hhdC5jaGF0QWRkRXJyb3IoZXJyb3JNZXNzYWdlLCBvcmlnaW5hbFRleHQpO1xufTtcblxuVUkuY2hhdFNldFN1YmplY3QgPSBmdW5jdGlvbih0ZXh0KVxue1xuICAgIHJldHVybiBDaGF0LmNoYXRTZXRTdWJqZWN0KHRleHQpO1xufTtcblxuVUkudXBkYXRlQ2hhdENvbnZlcnNhdGlvbiA9IGZ1bmN0aW9uIChmcm9tLCBkaXNwbGF5TmFtZSwgbWVzc2FnZSkge1xuICAgIHJldHVybiBDaGF0LnVwZGF0ZUNoYXRDb252ZXJzYXRpb24oZnJvbSwgZGlzcGxheU5hbWUsIG1lc3NhZ2UpO1xufTtcblxuZnVuY3Rpb24gb25NdWNKb2luZWQoamlkLCBpbmZvKSB7XG4gICAgVG9vbGJhci51cGRhdGVSb29tVXJsKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9jYWxOaWNrJykuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkgKyAnIChtZSknKVxuICAgICk7XG5cbiAgICB2YXIgc2V0dGluZ3MgPSBTZXR0aW5ncy5nZXRTZXR0aW5ncygpO1xuICAgIC8vIEFkZCBteXNlbGYgdG8gdGhlIGNvbnRhY3QgbGlzdC5cbiAgICBDb250YWN0TGlzdC5hZGRDb250YWN0KGppZCwgc2V0dGluZ3MuZW1haWwgfHwgc2V0dGluZ3MudWlkKTtcblxuICAgIC8vIE9uY2Ugd2UndmUgam9pbmVkIHRoZSBtdWMgc2hvdyB0aGUgdG9vbGJhclxuICAgIFRvb2xiYXJUb2dnbGVyLnNob3dUb29sYmFyKCk7XG5cbiAgICAvLyBTaG93IGF1dGhlbnRpY2F0ZSBidXR0b24gaWYgbmVlZGVkXG4gICAgVG9vbGJhci5zaG93QXV0aGVudGljYXRlQnV0dG9uKFxuICAgICAgICAgICAgeG1wcC5pc0V4dGVybmFsQXV0aEVuYWJsZWQoKSAmJiAheG1wcC5pc01vZGVyYXRvcigpKTtcblxuICAgIHZhciBkaXNwbGF5TmFtZSA9ICFjb25maWcuZGlzcGxheUppZHNcbiAgICAgICAgPyBpbmZvLmRpc3BsYXlOYW1lIDogU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcblxuICAgIGlmIChkaXNwbGF5TmFtZSlcbiAgICAgICAgb25EaXNwbGF5TmFtZUNoYW5nZWQoJ2xvY2FsVmlkZW9Db250YWluZXInLCBkaXNwbGF5TmFtZSArICcgKG1lKScpO1xufVxuXG5VSS5pbml0RXRoZXJwYWQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIEV0aGVycGFkLmluaXQobmFtZSk7XG59O1xuXG5VSS5vbk11Y0xlZnQgPSBmdW5jdGlvbiAoamlkKSB7XG4gICAgY29uc29sZS5sb2coJ2xlZnQubXVjJywgamlkKTtcbiAgICB2YXIgZGlzcGxheU5hbWUgPSAkKCcjcGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkgK1xuICAgICAgICAnPi5kaXNwbGF5bmFtZScpLmh0bWwoKTtcbiAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoZGlzcGxheU5hbWUgfHwgJ1NvbWVib2R5JyxcbiAgICAgICAgJ2Rpc2Nvbm5lY3RlZCcsXG4gICAgICAgICdkaXNjb25uZWN0ZWQnKTtcbiAgICAvLyBOZWVkIHRvIGNhbGwgdGhpcyB3aXRoIGEgc2xpZ2h0IGRlbGF5LCBvdGhlcndpc2UgdGhlIGVsZW1lbnQgY291bGRuJ3QgYmVcbiAgICAvLyBmb3VuZCBmb3Igc29tZSByZWFzb24uXG4gICAgLy8gWFhYKGdwKSBpdCB3b3JrcyBmaW5lIHdpdGhvdXQgdGhlIHRpbWVvdXQgZm9yIG1lICh3aXRoIENocm9tZSAzOCkuXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gICAgICAgICAgICAgICAgJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgQ29udGFjdExpc3QucmVtb3ZlQ29udGFjdChqaWQpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVtb3ZlQ29ubmVjdGlvbkluZGljYXRvcihqaWQpO1xuICAgICAgICAgICAgLy8gaGlkZSBoZXJlLCB3YWl0IGZvciB2aWRlbyB0byBjbG9zZSBiZWZvcmUgcmVtb3ZpbmdcbiAgICAgICAgICAgICQoY29udGFpbmVyKS5oaWRlKCk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG4gICAgICAgIH1cbiAgICB9LCAxMCk7XG5cbiAgICAvLyBVbmxvY2sgbGFyZ2UgdmlkZW9cbiAgICBpZiAoZm9jdXNlZFZpZGVvSW5mbyAmJiBmb2N1c2VkVmlkZW9JbmZvLmppZCA9PT0gamlkKVxuICAgIHtcbiAgICAgICAgY29uc29sZS5pbmZvKFwiRm9jdXNlZCB2aWRlbyBvd25lciBoYXMgbGVmdCB0aGUgY29uZmVyZW5jZVwiKTtcbiAgICAgICAgZm9jdXNlZFZpZGVvSW5mbyA9IG51bGw7XG4gICAgfVxuXG59O1xuXG5VSS5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gU2V0dGluZ3MuZ2V0U2V0dGluZ3MoKTtcbn07XG5cblVJLnRvZ2dsZUZpbG1TdHJpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQm90dG9tVG9vbGJhci50b2dnbGVGaWxtU3RyaXAoKTtcbn07XG5cblVJLnRvZ2dsZUNoYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvdHRvbVRvb2xiYXIudG9nZ2xlQ2hhdCgpO1xufTtcblxuVUkudG9nZ2xlQ29udGFjdExpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvdHRvbVRvb2xiYXIudG9nZ2xlQ29udGFjdExpc3QoKTtcbn07XG5cblVJLm9uTG9jYWxSb2xlQ2hhbmdlID0gZnVuY3Rpb24gKGppZCwgaW5mbywgcHJlcykge1xuXG4gICAgY29uc29sZS5pbmZvKFwiTXkgcm9sZSBjaGFuZ2VkLCBuZXcgcm9sZTogXCIgKyBpbmZvLnJvbGUpO1xuICAgIHZhciBpc01vZGVyYXRvciA9IHhtcHAuaXNNb2RlcmF0b3IoKTtcblxuICAgIFZpZGVvTGF5b3V0LnNob3dNb2RlcmF0b3JJbmRpY2F0b3IoKTtcbiAgICBUb29sYmFyLnNob3dBdXRoZW50aWNhdGVCdXR0b24oXG4gICAgICAgICAgICB4bXBwLmlzRXh0ZXJuYWxBdXRoRW5hYmxlZCgpICYmICFpc01vZGVyYXRvcik7XG5cbiAgICBpZiAoaXNNb2RlcmF0b3IpIHtcbiAgICAgICAgQXV0aGVudGljYXRpb24uY2xvc2VBdXRoZW50aWNhdGlvbldpbmRvdygpO1xuICAgICAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoXG4gICAgICAgICAgICAnTWUnLCAnY29ubmVjdGVkJywgJ01vZGVyYXRvciByaWdodHMgZ3JhbnRlZCAhJyk7XG4gICAgfVxufTtcblxuVUkub25Nb2RlcmF0b3JTdGF0dXNDaGFuZ2VkID0gZnVuY3Rpb24gKGlzTW9kZXJhdG9yKSB7XG5cbiAgICBUb29sYmFyLnNob3dTaXBDYWxsQnV0dG9uKGlzTW9kZXJhdG9yKTtcbiAgICBUb29sYmFyLnNob3dSZWNvcmRpbmdCdXR0b24oXG4gICAgICAgIGlzTW9kZXJhdG9yKTsgLy8mJlxuICAgIC8vIEZJWE1FOlxuICAgIC8vIFJlY29yZGluZyB2aXNpYmxlIGlmXG4gICAgLy8gdGhlcmUgYXJlIGF0IGxlYXN0IDIoKyAxIGZvY3VzKSBwYXJ0aWNpcGFudHNcbiAgICAvL09iamVjdC5rZXlzKGNvbm5lY3Rpb24uZW11Yy5tZW1iZXJzKS5sZW5ndGggPj0gMyk7XG5cbiAgICBpZiAoaXNNb2RlcmF0b3IgJiYgY29uZmlnLmV0aGVycGFkX2Jhc2UpIHtcbiAgICAgICAgRXRoZXJwYWQuaW5pdCgpO1xuICAgIH1cbn07XG5cblVJLm9uUGFzc3dvcmRSZXFpdXJlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIC8vIHBhc3N3b3JkIGlzIHJlcXVpcmVkXG4gICAgVG9vbGJhci5sb2NrTG9ja0J1dHRvbigpO1xuXG4gICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhudWxsLFxuICAgICAgICAgICAgJzxoMj5QYXNzd29yZCByZXF1aXJlZDwvaDI+JyArXG4gICAgICAgICAgICAnPGlucHV0IGlkPVwibG9ja0tleVwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJwYXNzd29yZFwiIGF1dG9mb2N1cz4nLFxuICAgICAgICB0cnVlLFxuICAgICAgICBcIk9rXCIsXG4gICAgICAgIGZ1bmN0aW9uIChlLCB2LCBtLCBmKSB7fSxcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9ja0tleScpLmZvY3VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlLCB2LCBtLCBmKSB7XG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgIHZhciBsb2NrS2V5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tLZXknKTtcbiAgICAgICAgICAgICAgICBpZiAobG9ja0tleS52YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBUb29sYmFyLnNldFNoYXJlZEtleShsb2NrS2V5LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobG9ja0tleS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn07XG5cblVJLm9uQXV0aGVudGljYXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uIChpbnRlcnZhbENhbGxiYWNrKSB7XG4gICAgQXV0aGVudGljYXRpb24ub3BlbkF1dGhlbnRpY2F0aW9uRGlhbG9nKFxuICAgICAgICByb29tTmFtZSwgaW50ZXJ2YWxDYWxsYmFjaywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgVG9vbGJhci5hdXRoZW50aWNhdGVDbGlja2VkKCk7XG4gICAgICAgIH0pO1xufTtcblxuVUkuc2V0UmVjb3JkaW5nQnV0dG9uU3RhdGUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICBUb29sYmFyLnNldFJlY29yZGluZ0J1dHRvblN0YXRlKHN0YXRlKTtcbn07XG5cblVJLmlucHV0RGlzcGxheU5hbWVIYW5kbGVyID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgVmlkZW9MYXlvdXQuaW5wdXREaXNwbGF5TmFtZUhhbmRsZXIodmFsdWUpO1xufTtcblxuVUkub25NdWNFbnRlcmVkID0gZnVuY3Rpb24gKGppZCwgaWQsIGRpc3BsYXlOYW1lKSB7XG4gICAgbWVzc2FnZUhhbmRsZXIubm90aWZ5KGRpc3BsYXlOYW1lIHx8ICdTb21lYm9keScsXG4gICAgICAgICdjb25uZWN0ZWQnLFxuICAgICAgICAnY29ubmVjdGVkJyk7XG5cbiAgICAvLyBBZGQgUGVlcidzIGNvbnRhaW5lclxuICAgIFZpZGVvTGF5b3V0LmVuc3VyZVBlZXJDb250YWluZXJFeGlzdHMoamlkLGlkKTtcbn07XG5cblVJLm9uTXVjUHJlc2VuY2VTdGF0dXMgPSBmdW5jdGlvbiAoIGppZCwgaW5mbykge1xuICAgIFZpZGVvTGF5b3V0LnNldFByZXNlbmNlU3RhdHVzKFxuICAgICAgICAgICAgJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpLCBpbmZvLnN0YXR1cyk7XG59O1xuXG5VSS5vbk11Y1JvbGVDaGFuZ2VkID0gZnVuY3Rpb24gKHJvbGUsIGRpc3BsYXlOYW1lKSB7XG4gICAgVmlkZW9MYXlvdXQuc2hvd01vZGVyYXRvckluZGljYXRvcigpO1xuXG4gICAgaWYgKHJvbGUgPT09ICdtb2RlcmF0b3InKSB7XG4gICAgICAgIHZhciBkaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lO1xuICAgICAgICBpZiAoIWRpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9ICdTb21lYm9keSc7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZUhhbmRsZXIubm90aWZ5KFxuICAgICAgICAgICAgZGlzcGxheU5hbWUsXG4gICAgICAgICAgICAnY29ubmVjdGVkJyxcbiAgICAgICAgICAgICAgICAnTW9kZXJhdG9yIHJpZ2h0cyBncmFudGVkIHRvICcgKyBkaXNwbGF5TmFtZSArICchJyk7XG4gICAgfVxufTtcblxuVUkudXBkYXRlTG9jYWxDb25uZWN0aW9uU3RhdHMgPSBmdW5jdGlvbihwZXJjZW50LCBzdGF0cylcbntcbiAgICBWaWRlb0xheW91dC51cGRhdGVMb2NhbENvbm5lY3Rpb25TdGF0cyhwZXJjZW50LCBzdGF0cyk7XG59O1xuXG5VSS51cGRhdGVDb25uZWN0aW9uU3RhdHMgPSBmdW5jdGlvbihqaWQsIHBlcmNlbnQsIHN0YXRzKVxue1xuICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUNvbm5lY3Rpb25TdGF0cyhqaWQsIHBlcmNlbnQsIHN0YXRzKTtcbn07XG5cblVJLm9uU3RhdHNTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIFZpZGVvTGF5b3V0Lm9uU3RhdHNTdG9wKCk7XG59O1xuXG5VSS5nZXRMYXJnZVZpZGVvU3RhdGUgPSBmdW5jdGlvbigpXG57XG4gICAgcmV0dXJuIFZpZGVvTGF5b3V0LmdldExhcmdlVmlkZW9TdGF0ZSgpO1xufTtcblxuVUkuc2hvd0xvY2FsQXVkaW9JbmRpY2F0b3IgPSBmdW5jdGlvbiAobXV0ZSkge1xuICAgIFZpZGVvTGF5b3V0LnNob3dMb2NhbEF1ZGlvSW5kaWNhdG9yKG11dGUpO1xufTtcblxuVUkuZ2VuZXJhdGVSb29tTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmKHJvb21OYW1lKVxuICAgICAgICByZXR1cm4gcm9vbU5hbWU7XG4gICAgdmFyIHJvb21ub2RlID0gbnVsbDtcbiAgICB2YXIgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgIC8vIGRldGVybWluZGUgdGhlIHJvb20gbm9kZSBmcm9tIHRoZSB1cmxcbiAgICAvLyBUT0RPOiBqdXN0IHRoZSByb29tbm9kZSBvciB0aGUgd2hvbGUgYmFyZSBqaWQ/XG4gICAgaWYgKGNvbmZpZy5nZXRyb29tbm9kZSAmJiB0eXBlb2YgY29uZmlnLmdldHJvb21ub2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIGN1c3RvbSBmdW5jdGlvbiBtaWdodCBiZSByZXNwb25zaWJsZSBmb3IgZG9pbmcgdGhlIHB1c2hzdGF0ZVxuICAgICAgICByb29tbm9kZSA9IGNvbmZpZy5nZXRyb29tbm9kZShwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvKiBmYWxsIGJhY2sgdG8gZGVmYXVsdCBzdHJhdGVneVxuICAgICAgICAgKiB0aGlzIGlzIG1ha2luZyBhc3N1bXB0aW9ucyBhYm91dCBob3cgdGhlIFVSTC0+cm9vbSBtYXBwaW5nIGhhcHBlbnMuXG4gICAgICAgICAqIEl0IGN1cnJlbnRseSBhc3N1bWVzIGRlcGxveW1lbnQgYXQgcm9vdCwgd2l0aCBhIHJld3JpdGUgbGlrZSB0aGVcbiAgICAgICAgICogZm9sbG93aW5nIG9uZSAoZm9yIG5naW54KTpcbiAgICAgICAgIGxvY2F0aW9uIH4gXi8oW2EtekEtWjAtOV0rKSQge1xuICAgICAgICAgcmV3cml0ZSBeLyguKikkIC8gYnJlYWs7XG4gICAgICAgICB9XG4gICAgICAgICAqL1xuICAgICAgICBpZiAocGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICByb29tbm9kZSA9IHBhdGguc3Vic3RyKDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgd29yZCA9IFJvb21OYW1lR2VuZXJhdG9yLmdlbmVyYXRlUm9vbVdpdGhvdXRTZXBhcmF0b3IoKTtcbiAgICAgICAgICAgIHJvb21ub2RlID0gd29yZC50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoJ1ZpZGVvQ2hhdCcsXG4gICAgICAgICAgICAgICAgICAgICdSb29tOiAnICsgd29yZCwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgd29yZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByb29tTmFtZSA9IHJvb21ub2RlICsgJ0AnICsgY29uZmlnLmhvc3RzLm11YztcbiAgICByZXR1cm4gcm9vbU5hbWU7XG59O1xuXG5cblVJLmNvbm5lY3Rpb25JbmRpY2F0b3JTaG93TW9yZSA9IGZ1bmN0aW9uKGlkKVxue1xuICAgIHJldHVybiBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tpZF0uc2hvd01vcmUoKTtcbn07XG5cblVJLnNob3dUb29sYmFyID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBUb29sYmFyVG9nZ2xlci5zaG93VG9vbGJhcigpO1xufTtcblxuVUkuZG9ja1Rvb2xiYXIgPSBmdW5jdGlvbiAoaXNEb2NrKSB7XG4gICAgcmV0dXJuIFRvb2xiYXJUb2dnbGVyLmRvY2tUb29sYmFyKGlzRG9jayk7XG59O1xuXG5VSS5nZXRDcmVhZGVudGlhbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYm9zaDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvc2hVUkwnKS52YWx1ZSxcbiAgICAgICAgcGFzc3dvcmQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZCcpLnZhbHVlLFxuICAgICAgICBqaWQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdqaWQnKS52YWx1ZVxuICAgIH07XG59O1xuXG5VSS5kaXNhYmxlQ29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29ubmVjdCcpLmRpc2FibGVkID0gdHJ1ZTtcbn07XG5cblVJLnNob3dMb2dpblBvcHVwID0gZnVuY3Rpb24oY2FsbGJhY2spXG57XG4gICAgY29uc29sZS5sb2coJ3Bhc3N3b3JkIGlzIHJlcXVpcmVkJyk7XG5cbiAgICBVSS5tZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKG51bGwsXG4gICAgICAgICAgICAnPGgyPlBhc3N3b3JkIHJlcXVpcmVkPC9oMj4nICtcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJwYXNzd29yZHJlcXVpcmVkLnVzZXJuYW1lXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInVzZXJAZG9tYWluLm5ldFwiIGF1dG9mb2N1cz4nICtcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJwYXNzd29yZHJlcXVpcmVkLnBhc3N3b3JkXCIgdHlwZT1cInBhc3N3b3JkXCIgcGxhY2Vob2xkZXI9XCJ1c2VyIHBhc3N3b3JkXCI+JyxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgXCJPa1wiLFxuICAgICAgICBmdW5jdGlvbiAoZSwgdiwgbSwgZikge1xuICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlcm5hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRyZXF1aXJlZC51c2VybmFtZScpO1xuICAgICAgICAgICAgICAgIHZhciBwYXNzd29yZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZHJlcXVpcmVkLnBhc3N3b3JkJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUudmFsdWUgIT09IG51bGwgJiYgcGFzc3dvcmQudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh1c2VybmFtZS52YWx1ZSwgcGFzc3dvcmQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRyZXF1aXJlZC51c2VybmFtZScpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICApO1xufVxuXG5VSS5jaGVja0Zvck5pY2tuYW1lQW5kSm9pbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgIEF1dGhlbnRpY2F0aW9uLmNsb3NlQXV0aGVudGljYXRpb25EaWFsb2coKTtcbiAgICBBdXRoZW50aWNhdGlvbi5zdG9wSW50ZXJ2YWwoKTtcblxuICAgIHZhciBuaWNrID0gbnVsbDtcbiAgICBpZiAoY29uZmlnLnVzZU5pY2tzKSB7XG4gICAgICAgIG5pY2sgPSB3aW5kb3cucHJvbXB0KCdZb3VyIG5pY2tuYW1lIChvcHRpb25hbCknKTtcbiAgICB9XG4gICAgeG1wcC5qb2luUm9vb20ocm9vbU5hbWUsIGNvbmZpZy51c2VOaWNrcywgbmljayk7XG59XG5cblxuZnVuY3Rpb24gZHVtcChlbGVtLCBmaWxlbmFtZSkge1xuICAgIGVsZW0gPSBlbGVtLnBhcmVudE5vZGU7XG4gICAgZWxlbS5kb3dubG9hZCA9IGZpbGVuYW1lIHx8ICdtZWV0bG9nLmpzb24nO1xuICAgIGVsZW0uaHJlZiA9ICdkYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtOCxcXG4nO1xuICAgIHZhciBkYXRhID0geG1wcC5wb3B1bGF0ZURhdGEoKTtcbiAgICB2YXIgbWV0YWRhdGEgPSB7fTtcbiAgICBtZXRhZGF0YS50aW1lID0gbmV3IERhdGUoKTtcbiAgICBtZXRhZGF0YS51cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICBtZXRhZGF0YS51YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIGxvZyA9IHhtcHAuZ2V0TG9nZ2VyKCk7XG4gICAgaWYgKGxvZykge1xuICAgICAgICBtZXRhZGF0YS54bXBwID0gbG9nO1xuICAgIH1cbiAgICBkYXRhLm1ldGFkYXRhID0gbWV0YWRhdGE7XG4gICAgZWxlbS5ocmVmICs9IGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAnICAnKSk7XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5VSS5nZXRSb29tTmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcm9vbU5hbWU7XG59XG5cbi8qKlxuICogTXV0ZXMvdW5tdXRlcyB0aGUgbG9jYWwgdmlkZW8uXG4gKlxuICogQHBhcmFtIG11dGUgPHR0PnRydWU8L3R0PiB0byBtdXRlIHRoZSBsb2NhbCB2aWRlbzsgb3RoZXJ3aXNlLCA8dHQ+ZmFsc2U8L3R0PlxuICogQHBhcmFtIG9wdGlvbnMgYW4gb2JqZWN0IHdoaWNoIHNwZWNpZmllcyBvcHRpb25hbCBhcmd1bWVudHMgc3VjaCBhcyB0aGVcbiAqIDx0dD5ib29sZWFuPC90dD4ga2V5IDx0dD5ieVVzZXI8L3R0PiB3aXRoIGRlZmF1bHQgdmFsdWUgPHR0PnRydWU8L3R0PiB3aGljaFxuICogc3BlY2lmaWVzIHdoZXRoZXIgdGhlIG1ldGhvZCB3YXMgaW5pdGlhdGVkIGluIHJlc3BvbnNlIHRvIGEgdXNlciBjb21tYW5kIChpblxuICogY29udHJhc3QgdG8gYW4gYXV0b21hdGljIGRlY2lzaW9uIHRha2VuIGJ5IHRoZSBhcHBsaWNhdGlvbiBsb2dpYylcbiAqL1xuZnVuY3Rpb24gc2V0VmlkZW9NdXRlKG11dGUsIG9wdGlvbnMpIHtcbiAgICB4bXBwLnNldFZpZGVvTXV0ZShcbiAgICAgICAgbXV0ZSxcbiAgICAgICAgZnVuY3Rpb24gKG11dGUpIHtcbiAgICAgICAgICAgIHZhciB2aWRlbyA9ICQoJyN2aWRlbycpO1xuICAgICAgICAgICAgdmFyIGNvbW11bmljYXRpdmVDbGFzcyA9IFwiaWNvbi1jYW1lcmFcIjtcbiAgICAgICAgICAgIHZhciBtdXRlQ2xhc3MgPSBcImljb24tY2FtZXJhIGljb24tY2FtZXJhLWRpc2FibGVkXCI7XG5cbiAgICAgICAgICAgIGlmIChtdXRlKSB7XG4gICAgICAgICAgICAgICAgdmlkZW8ucmVtb3ZlQ2xhc3MoY29tbXVuaWNhdGl2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICB2aWRlby5hZGRDbGFzcyhtdXRlQ2xhc3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2aWRlby5yZW1vdmVDbGFzcyhtdXRlQ2xhc3MpO1xuICAgICAgICAgICAgICAgIHZpZGVvLmFkZENsYXNzKGNvbW11bmljYXRpdmVDbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIE11dGVzL3VubXV0ZXMgdGhlIGxvY2FsIHZpZGVvLlxuICovXG5VSS50b2dnbGVWaWRlbyA9IGZ1bmN0aW9uICgpIHtcbiAgICBVSVV0aWwuYnV0dG9uQ2xpY2soXCIjdmlkZW9cIiwgXCJpY29uLWNhbWVyYSBpY29uLWNhbWVyYS1kaXNhYmxlZFwiKTtcblxuICAgIHNldFZpZGVvTXV0ZSghUlRDLmxvY2FsVmlkZW8uaXNNdXRlZCgpKTtcbn07XG5cbi8qKlxuICogTXV0ZXMgLyB1bm11dGVzIGF1ZGlvIGZvciB0aGUgbG9jYWwgcGFydGljaXBhbnQuXG4gKi9cblVJLnRvZ2dsZUF1ZGlvID0gZnVuY3Rpb24oKSB7XG4gICAgVUkuc2V0QXVkaW9NdXRlZCghUlRDLmxvY2FsQXVkaW8uaXNNdXRlZCgpKTtcbn07XG5cbi8qKlxuICogU2V0cyBtdXRlZCBhdWRpbyBzdGF0ZSBmb3IgdGhlIGxvY2FsIHBhcnRpY2lwYW50LlxuICovXG5VSS5zZXRBdWRpb011dGVkID0gZnVuY3Rpb24gKG11dGUpIHtcblxuICAgIGlmKCF4bXBwLnNldEF1ZGlvTXV0ZShtdXRlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFVJLnNob3dMb2NhbEF1ZGlvSW5kaWNhdG9yKG11dGUpO1xuXG4gICAgICAgIFVJVXRpbC5idXR0b25DbGljayhcIiNtdXRlXCIsIFwiaWNvbi1taWNyb3Bob25lIGljb24tbWljLWRpc2FibGVkXCIpO1xuICAgIH0pKVxuICAgIHtcbiAgICAgICAgLy8gV2Ugc3RpbGwgY2xpY2sgdGhlIGJ1dHRvbi5cbiAgICAgICAgVUlVdGlsLmJ1dHRvbkNsaWNrKFwiI211dGVcIiwgXCJpY29uLW1pY3JvcGhvbmUgaWNvbi1taWMtZGlzYWJsZWRcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuVUkub25MYXN0TkNoYW5nZWQgPSBmdW5jdGlvbiAob2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKGNvbmZpZy5tdXRlTG9jYWxWaWRlb0lmTm90SW5MYXN0Tikge1xuICAgICAgICBzZXRWaWRlb011dGUoIW5ld1ZhbHVlLCB7ICdieVVzZXInOiBmYWxzZSB9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVUk7XG5cbiIsInZhciBDYW52YXNVdGlsID0gcmVxdWlyZShcIi4vQ2FudmFzVXRpbHNcIik7XG5cbi8qKlxuICogVGhlIGF1ZGlvIExldmVscyBwbHVnaW4uXG4gKi9cbnZhciBBdWRpb0xldmVscyA9IChmdW5jdGlvbihteSkge1xuICAgIHZhciBhdWRpb0xldmVsQ2FudmFzQ2FjaGUgPSB7fTtcblxuICAgIG15LkxPQ0FMX0xFVkVMID0gJ2xvY2FsJztcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGF1ZGlvIGxldmVsIGNhbnZhcyBmb3IgdGhlIGdpdmVuIHBlZXJKaWQuIElmIHRoZSBjYW52YXNcbiAgICAgKiBkaWRuJ3QgZXhpc3Qgd2UgY3JlYXRlIGl0LlxuICAgICAqL1xuICAgIG15LnVwZGF0ZUF1ZGlvTGV2ZWxDYW52YXMgPSBmdW5jdGlvbiAocGVlckppZCwgVmlkZW9MYXlvdXQpIHtcbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gbnVsbDtcbiAgICAgICAgdmFyIHZpZGVvU3BhbklkID0gbnVsbDtcbiAgICAgICAgaWYgKCFwZWVySmlkKVxuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb0NvbnRhaW5lcic7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKTtcblxuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAncGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHZpZGVvU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZpZGVvU3BhbklkKTtcblxuICAgICAgICBpZiAoIXZpZGVvU3Bhbikge1xuICAgICAgICAgICAgaWYgKHJlc291cmNlSmlkKVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyB2aWRlbyBlbGVtZW50IGZvciBqaWRcIiwgcmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyB2aWRlbyBlbGVtZW50IGZvciBsb2NhbCB2aWRlby5cIik7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdWRpb0xldmVsQ2FudmFzID0gJCgnIycgKyB2aWRlb1NwYW5JZCArICc+Y2FudmFzJyk7XG5cbiAgICAgICAgdmFyIHZpZGVvU3BhY2VXaWR0aCA9ICQoJyNyZW1vdGVWaWRlb3MnKS53aWR0aCgpO1xuICAgICAgICB2YXIgdGh1bWJuYWlsU2l6ZSA9IFZpZGVvTGF5b3V0LmNhbGN1bGF0ZVRodW1ibmFpbFNpemUodmlkZW9TcGFjZVdpZHRoKTtcbiAgICAgICAgdmFyIHRodW1ibmFpbFdpZHRoID0gdGh1bWJuYWlsU2l6ZVswXTtcbiAgICAgICAgdmFyIHRodW1ibmFpbEhlaWdodCA9IHRodW1ibmFpbFNpemVbMV07XG5cbiAgICAgICAgaWYgKCFhdWRpb0xldmVsQ2FudmFzIHx8IGF1ZGlvTGV2ZWxDYW52YXMubGVuZ3RoID09PSAwKSB7XG5cbiAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMuY2xhc3NOYW1lID0gXCJhdWRpb2xldmVsXCI7XG4gICAgICAgICAgICBhdWRpb0xldmVsQ2FudmFzLnN0eWxlLmJvdHRvbSA9IFwiLVwiICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yICsgXCJweFwiO1xuICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhcy5zdHlsZS5sZWZ0ID0gXCItXCIgKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBLzIgKyBcInB4XCI7XG4gICAgICAgICAgICByZXNpemVBdWRpb0xldmVsQ2FudmFzKCBhdWRpb0xldmVsQ2FudmFzLFxuICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsSGVpZ2h0KTtcblxuICAgICAgICAgICAgdmlkZW9TcGFuLmFwcGVuZENoaWxkKGF1ZGlvTGV2ZWxDYW52YXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhcyA9IGF1ZGlvTGV2ZWxDYW52YXMuZ2V0KDApO1xuXG4gICAgICAgICAgICByZXNpemVBdWRpb0xldmVsQ2FudmFzKCBhdWRpb0xldmVsQ2FudmFzLFxuICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBhdWRpbyBsZXZlbCBVSSBmb3IgdGhlIGdpdmVuIHJlc291cmNlSmlkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc291cmNlSmlkIHRoZSByZXNvdXJjZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZWxlbWVudCBmb3JcbiAgICAgKiB3aGljaCB3ZSBkcmF3IHRoZSBhdWRpbyBsZXZlbFxuICAgICAqIEBwYXJhbSBhdWRpb0xldmVsIHRoZSBuZXdBdWRpbyBsZXZlbCB0byByZW5kZXJcbiAgICAgKi9cbiAgICBteS51cGRhdGVBdWRpb0xldmVsID0gZnVuY3Rpb24gKHJlc291cmNlSmlkLCBhdWRpb0xldmVsLCBsYXJnZVZpZGVvUmVzb3VyY2VKaWQpIHtcbiAgICAgICAgZHJhd0F1ZGlvTGV2ZWxDYW52YXMocmVzb3VyY2VKaWQsIGF1ZGlvTGV2ZWwpO1xuXG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9IGdldFZpZGVvU3BhbklkKHJlc291cmNlSmlkKTtcblxuICAgICAgICB2YXIgYXVkaW9MZXZlbENhbnZhcyA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPmNhbnZhcycpLmdldCgwKTtcblxuICAgICAgICBpZiAoIWF1ZGlvTGV2ZWxDYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGRyYXdDb250ZXh0ID0gYXVkaW9MZXZlbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHZhciBjYW52YXNDYWNoZSA9IGF1ZGlvTGV2ZWxDYW52YXNDYWNoZVtyZXNvdXJjZUppZF07XG5cbiAgICAgICAgZHJhd0NvbnRleHQuY2xlYXJSZWN0ICgwLCAwLFxuICAgICAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMud2lkdGgsIGF1ZGlvTGV2ZWxDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgZHJhd0NvbnRleHQuZHJhd0ltYWdlKGNhbnZhc0NhY2hlLCAwLCAwKTtcblxuICAgICAgICBpZihyZXNvdXJjZUppZCA9PT0gQXVkaW9MZXZlbHMuTE9DQUxfTEVWRUwpIHtcbiAgICAgICAgICAgIGlmKCF4bXBwLm15SmlkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvdXJjZUppZCA9IHhtcHAubXlSZXNvdXJjZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYocmVzb3VyY2VKaWQgID09PSBsYXJnZVZpZGVvUmVzb3VyY2VKaWQpIHtcbiAgICAgICAgICAgIEF1ZGlvTGV2ZWxzLnVwZGF0ZUFjdGl2ZVNwZWFrZXJBdWRpb0xldmVsKGF1ZGlvTGV2ZWwpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG15LnVwZGF0ZUFjdGl2ZVNwZWFrZXJBdWRpb0xldmVsID0gZnVuY3Rpb24oYXVkaW9MZXZlbCkge1xuICAgICAgICB2YXIgZHJhd0NvbnRleHQgPSAkKCcjYWN0aXZlU3BlYWtlckF1ZGlvTGV2ZWwnKVswXS5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgciA9IGludGVyZmFjZUNvbmZpZy5BQ1RJVkVfU1BFQUtFUl9BVkFUQVJfU0laRSAvIDI7XG4gICAgICAgIHZhciBjZW50ZXIgPSAoaW50ZXJmYWNlQ29uZmlnLkFDVElWRV9TUEVBS0VSX0FWQVRBUl9TSVpFICsgcikgLyAyO1xuXG4gICAgICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIHN0YXRlIG9mIHRoZSBjb250ZXh0LlxuICAgICAgICBkcmF3Q29udGV4dC5zYXZlKCk7XG5cbiAgICAgICAgZHJhd0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIDMwMCwgMzAwKTtcblxuICAgICAgICAvLyBEcmF3IGEgY2lyY2xlLlxuICAgICAgICBkcmF3Q29udGV4dC5hcmMoY2VudGVyLCBjZW50ZXIsIHIsIDAsIDIgKiBNYXRoLlBJKTtcblxuICAgICAgICAvLyBBZGQgYSBzaGFkb3cgYXJvdW5kIHRoZSBjaXJjbGVcbiAgICAgICAgZHJhd0NvbnRleHQuc2hhZG93Q29sb3IgPSBpbnRlcmZhY2VDb25maWcuU0hBRE9XX0NPTE9SO1xuICAgICAgICBkcmF3Q29udGV4dC5zaGFkb3dCbHVyID0gZ2V0U2hhZG93TGV2ZWwoYXVkaW9MZXZlbCk7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd09mZnNldFggPSAwO1xuICAgICAgICBkcmF3Q29udGV4dC5zaGFkb3dPZmZzZXRZID0gMDtcblxuICAgICAgICAvLyBGaWxsIHRoZSBzaGFwZS5cbiAgICAgICAgZHJhd0NvbnRleHQuZmlsbCgpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LnNhdmUoKTtcblxuICAgICAgICBkcmF3Q29udGV4dC5yZXN0b3JlKCk7XG5cblxuICAgICAgICBkcmF3Q29udGV4dC5hcmMoY2VudGVyLCBjZW50ZXIsIHIsIDAsIDIgKiBNYXRoLlBJKTtcblxuICAgICAgICBkcmF3Q29udGV4dC5jbGlwKCk7XG4gICAgICAgIGRyYXdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCAyNzcsIDIwMCk7XG5cbiAgICAgICAgLy8gUmVzdG9yZSB0aGUgcHJldmlvdXMgY29udGV4dCBzdGF0ZS5cbiAgICAgICAgZHJhd0NvbnRleHQucmVzdG9yZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRoZSBnaXZlbiBhdWRpbyBsZXZlbCBjYW52YXMgdG8gbWF0Y2ggdGhlIGdpdmVuIHRodW1ibmFpbCBzaXplLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc2l6ZUF1ZGlvTGV2ZWxDYW52YXMoYXVkaW9MZXZlbENhbnZhcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsSGVpZ2h0KSB7XG4gICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMud2lkdGggPSB0aHVtYm5haWxXaWR0aCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkE7XG4gICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMuaGVpZ2h0ID0gdGh1bWJuYWlsSGVpZ2h0ICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEcmF3cyB0aGUgYXVkaW8gbGV2ZWwgY2FudmFzIGludG8gdGhlIGNhY2hlZCBjYW52YXMgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc291cmNlSmlkIHRoZSByZXNvdXJjZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZWxlbWVudCBmb3JcbiAgICAgKiB3aGljaCB3ZSBkcmF3IHRoZSBhdWRpbyBsZXZlbFxuICAgICAqIEBwYXJhbSBhdWRpb0xldmVsIHRoZSBuZXdBdWRpbyBsZXZlbCB0byByZW5kZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBkcmF3QXVkaW9MZXZlbENhbnZhcyhyZXNvdXJjZUppZCwgYXVkaW9MZXZlbCkge1xuICAgICAgICBpZiAoIWF1ZGlvTGV2ZWxDYW52YXNDYWNoZVtyZXNvdXJjZUppZF0pIHtcblxuICAgICAgICAgICAgdmFyIHZpZGVvU3BhbklkID0gZ2V0VmlkZW9TcGFuSWQocmVzb3VyY2VKaWQpO1xuXG4gICAgICAgICAgICB2YXIgYXVkaW9MZXZlbENhbnZhc09yaWcgPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5jYW52YXMnKS5nZXQoMCk7XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBGSVhNRSBUZXN0aW5nIGhhcyBzaG93biB0aGF0IGF1ZGlvTGV2ZWxDYW52YXNPcmlnIG1heSBub3QgZXhpc3QuXG4gICAgICAgICAgICAgKiBJbiBzdWNoIGEgY2FzZSwgdGhlIG1ldGhvZCBDYW52YXNVdGlsLmNsb25lQ2FudmFzIG1heSB0aHJvdyBhblxuICAgICAgICAgICAgICogZXJyb3IuIFNpbmNlIGF1ZGlvIGxldmVscyBhcmUgZnJlcXVlbnRseSB1cGRhdGVkLCB0aGUgZXJyb3JzIGhhdmVcbiAgICAgICAgICAgICAqIGJlZW4gb2JzZXJ2ZWQgdG8gcGlsZSBpbnRvIHRoZSBjb25zb2xlLCBzdHJhaW4gdGhlIENQVS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgaWYgKGF1ZGlvTGV2ZWxDYW52YXNPcmlnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXNDYWNoZVtyZXNvdXJjZUppZF1cbiAgICAgICAgICAgICAgICAgICAgPSBDYW52YXNVdGlsLmNsb25lQ2FudmFzKGF1ZGlvTGV2ZWxDYW52YXNPcmlnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjYW52YXMgPSBhdWRpb0xldmVsQ2FudmFzQ2FjaGVbcmVzb3VyY2VKaWRdO1xuXG4gICAgICAgIGlmICghY2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBkcmF3Q29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIHZhciBzaGFkb3dMZXZlbCA9IGdldFNoYWRvd0xldmVsKGF1ZGlvTGV2ZWwpO1xuXG4gICAgICAgIGlmIChzaGFkb3dMZXZlbCA+IDApXG4gICAgICAgICAgICAvLyBkcmF3Q29udGV4dCwgeCwgeSwgdywgaCwgciwgc2hhZG93Q29sb3IsIHNoYWRvd0xldmVsXG4gICAgICAgICAgICBDYW52YXNVdGlsLmRyYXdSb3VuZFJlY3RHbG93KCAgIGRyYXdDb250ZXh0LFxuICAgICAgICAgICAgICAgIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEvMiwgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yLFxuICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCAtIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEsXG4gICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCAtIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEsXG4gICAgICAgICAgICAgICAgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19SQURJVVMsXG4gICAgICAgICAgICAgICAgaW50ZXJmYWNlQ29uZmlnLlNIQURPV19DT0xPUixcbiAgICAgICAgICAgICAgICBzaGFkb3dMZXZlbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2hhZG93L2dsb3cgbGV2ZWwgZm9yIHRoZSBnaXZlbiBhdWRpbyBsZXZlbC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhdWRpb0xldmVsIHRoZSBhdWRpbyBsZXZlbCBmcm9tIHdoaWNoIHdlIGRldGVybWluZSB0aGUgc2hhZG93XG4gICAgICogbGV2ZWxcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRTaGFkb3dMZXZlbCAoYXVkaW9MZXZlbCkge1xuICAgICAgICB2YXIgc2hhZG93TGV2ZWwgPSAwO1xuXG4gICAgICAgIGlmIChhdWRpb0xldmVsIDw9IDAuMykge1xuICAgICAgICAgICAgc2hhZG93TGV2ZWwgPSBNYXRoLnJvdW5kKGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEvMiooYXVkaW9MZXZlbC8wLjMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChhdWRpb0xldmVsIDw9IDAuNikge1xuICAgICAgICAgICAgc2hhZG93TGV2ZWwgPSBNYXRoLnJvdW5kKGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEvMiooKGF1ZGlvTGV2ZWwgLSAwLjMpIC8gMC4zKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzaGFkb3dMZXZlbCA9IE1hdGgucm91bmQoaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yKigoYXVkaW9MZXZlbCAtIDAuNikgLyAwLjQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2hhZG93TGV2ZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmlkZW8gc3BhbiBpZCBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiByZXNvdXJjZUppZCBvciBsb2NhbFxuICAgICAqIHVzZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0VmlkZW9TcGFuSWQocmVzb3VyY2VKaWQpIHtcbiAgICAgICAgdmFyIHZpZGVvU3BhbklkID0gbnVsbDtcbiAgICAgICAgaWYgKHJlc291cmNlSmlkID09PSBBdWRpb0xldmVscy5MT0NBTF9MRVZFTFxuICAgICAgICAgICAgICAgIHx8ICh4bXBwLm15UmVzb3VyY2UoKSAmJiByZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgICAgICA9PT0geG1wcC5teVJlc291cmNlKCkpKVxuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb0NvbnRhaW5lcic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZDtcblxuICAgICAgICByZXR1cm4gdmlkZW9TcGFuSWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5kaWNhdGVzIHRoYXQgdGhlIHJlbW90ZSB2aWRlbyBoYXMgYmVlbiByZXNpemVkLlxuICAgICAqL1xuICAgICQoZG9jdW1lbnQpLmJpbmQoJ3JlbW90ZXZpZGVvLnJlc2l6ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIHJlc2l6ZWQgPSBmYWxzZTtcbiAgICAgICAgJCgnI3JlbW90ZVZpZGVvcz5zcGFuPmNhbnZhcycpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gJCh0aGlzKS5nZXQoMCk7XG4gICAgICAgICAgICBpZiAoY2FudmFzLndpZHRoICE9PSB3aWR0aCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEpIHtcbiAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkE7XG4gICAgICAgICAgICAgICAgcmVzaXplZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYW52YXMuaGVpZ2ggIT09IGhlaWdodCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEpIHtcbiAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0ICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQTtcbiAgICAgICAgICAgICAgICByZXNpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc2l6ZWQpXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhhdWRpb0xldmVsQ2FudmFzQ2FjaGUpLmZvckVhY2goZnVuY3Rpb24gKHJlc291cmNlSmlkKSB7XG4gICAgICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhc0NhY2hlW3Jlc291cmNlSmlkXS53aWR0aFxuICAgICAgICAgICAgICAgICAgICA9IHdpZHRoICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQTtcbiAgICAgICAgICAgICAgICBhdWRpb0xldmVsQ2FudmFzQ2FjaGVbcmVzb3VyY2VKaWRdLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICA9IGhlaWdodCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkE7XG4gICAgICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBteTtcblxufSkoQXVkaW9MZXZlbHMgfHwge30pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF1ZGlvTGV2ZWxzOyIsIi8qKlxuICogVXRpbGl0eSBjbGFzcyBmb3IgZHJhd2luZyBjYW52YXMgc2hhcGVzLlxuICovXG52YXIgQ2FudmFzVXRpbCA9IChmdW5jdGlvbihteSkge1xuXG4gICAgLyoqXG4gICAgICogRHJhd3MgYSByb3VuZCByZWN0YW5nbGUgd2l0aCBhIGdsb3cuIFRoZSBnbG93V2lkdGggaW5kaWNhdGVzIHRoZSBkZXB0aFxuICAgICAqIG9mIHRoZSBnbG93LlxuICAgICAqXG4gICAgICogQHBhcmFtIGRyYXdDb250ZXh0IHRoZSBjb250ZXh0IG9mIHRoZSBjYW52YXMgdG8gZHJhdyB0b1xuICAgICAqIEBwYXJhbSB4IHRoZSB4IGNvb3JkaW5hdGUgb2YgdGhlIHJvdW5kIHJlY3RhbmdsZVxuICAgICAqIEBwYXJhbSB5IHRoZSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJvdW5kIHJlY3RhbmdsZVxuICAgICAqIEBwYXJhbSB3IHRoZSB3aWR0aCBvZiB0aGUgcm91bmQgcmVjdGFuZ2xlXG4gICAgICogQHBhcmFtIGggdGhlIGhlaWdodCBvZiB0aGUgcm91bmQgcmVjdGFuZ2xlXG4gICAgICogQHBhcmFtIGdsb3dDb2xvciB0aGUgY29sb3Igb2YgdGhlIGdsb3dcbiAgICAgKiBAcGFyYW0gZ2xvd1dpZHRoIHRoZSB3aWR0aCBvZiB0aGUgZ2xvd1xuICAgICAqL1xuICAgIG15LmRyYXdSb3VuZFJlY3RHbG93XG4gICAgICAgID0gZnVuY3Rpb24oZHJhd0NvbnRleHQsIHgsIHksIHcsIGgsIHIsIGdsb3dDb2xvciwgZ2xvd1dpZHRoKSB7XG5cbiAgICAgICAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgc3RhdGUgb2YgdGhlIGNvbnRleHQuXG4gICAgICAgIGRyYXdDb250ZXh0LnNhdmUoKTtcblxuICAgICAgICBpZiAodyA8IDIgKiByKSByID0gdyAvIDI7XG4gICAgICAgIGlmIChoIDwgMiAqIHIpIHIgPSBoIC8gMjtcblxuICAgICAgICAvLyBEcmF3IGEgcm91bmQgcmVjdGFuZ2xlLlxuICAgICAgICBkcmF3Q29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgZHJhd0NvbnRleHQubW92ZVRvKHgrciwgeSk7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgrdywgeSwgICB4K3csIHkraCwgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgrdywgeStoLCB4LCAgIHkraCwgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgsICAgeStoLCB4LCAgIHksICAgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgsICAgeSwgICB4K3csIHksICAgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIC8vIEFkZCBhIHNoYWRvdyBhcm91bmQgdGhlIHJlY3RhbmdsZVxuICAgICAgICBkcmF3Q29udGV4dC5zaGFkb3dDb2xvciA9IGdsb3dDb2xvcjtcbiAgICAgICAgZHJhd0NvbnRleHQuc2hhZG93Qmx1ciA9IGdsb3dXaWR0aDtcbiAgICAgICAgZHJhd0NvbnRleHQuc2hhZG93T2Zmc2V0WCA9IDA7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd09mZnNldFkgPSAwO1xuXG4gICAgICAgIC8vIEZpbGwgdGhlIHNoYXBlLlxuICAgICAgICBkcmF3Q29udGV4dC5maWxsKCk7XG5cbiAgICAgICAgZHJhd0NvbnRleHQuc2F2ZSgpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LnJlc3RvcmUoKTtcblxuLy8gICAgICAxKSBVbmNvbW1lbnQgdGhpcyBsaW5lIHRvIHVzZSBDb21wb3NpdGUgT3BlcmF0aW9uLCB3aGljaCBpcyBkb2luZyB0aGVcbi8vICAgICAgc2FtZSBhcyB0aGUgY2xpcCBmdW5jdGlvbiBiZWxvdyBhbmQgaXMgYWxzbyBhbnRpYWxpYXNpbmcgdGhlIHJvdW5kXG4vLyAgICAgIGJvcmRlciwgYnV0IGlzIHNhaWQgdG8gYmUgbGVzcyBmYXN0IHBlcmZvcm1hbmNlIHdpc2UuXG5cbi8vICAgICAgZHJhd0NvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uPSdkZXN0aW5hdGlvbi1vdXQnO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBkcmF3Q29udGV4dC5tb3ZlVG8oeCtyLCB5KTtcbiAgICAgICAgZHJhd0NvbnRleHQuYXJjVG8oeCt3LCB5LCAgIHgrdywgeStoLCByKTtcbiAgICAgICAgZHJhd0NvbnRleHQuYXJjVG8oeCt3LCB5K2gsIHgsICAgeStoLCByKTtcbiAgICAgICAgZHJhd0NvbnRleHQuYXJjVG8oeCwgICB5K2gsIHgsICAgeSwgICByKTtcbiAgICAgICAgZHJhd0NvbnRleHQuYXJjVG8oeCwgICB5LCAgIHgrdywgeSwgICByKTtcbiAgICAgICAgZHJhd0NvbnRleHQuY2xvc2VQYXRoKCk7XG5cbi8vICAgICAgMikgVW5jb21tZW50IHRoaXMgbGluZSB0byB1c2UgQ29tcG9zaXRlIE9wZXJhdGlvbiwgd2hpY2ggaXMgZG9pbmcgdGhlXG4vLyAgICAgIHNhbWUgYXMgdGhlIGNsaXAgZnVuY3Rpb24gYmVsb3cgYW5kIGlzIGFsc28gYW50aWFsaWFzaW5nIHRoZSByb3VuZFxuLy8gICAgICBib3JkZXIsIGJ1dCBpcyBzYWlkIHRvIGJlIGxlc3MgZmFzdCBwZXJmb3JtYW5jZSB3aXNlLlxuXG4vLyAgICAgIGRyYXdDb250ZXh0LmZpbGwoKTtcblxuICAgICAgICAvLyBDb21tZW50IHRoZXNlIHR3byBsaW5lcyBpZiBjaG9vc2luZyB0byBkbyB0aGUgc2FtZSB3aXRoIGNvbXBvc2l0ZVxuICAgICAgICAvLyBvcGVyYXRpb24gYWJvdmUgMSBhbmQgMi5cbiAgICAgICAgZHJhd0NvbnRleHQuY2xpcCgpO1xuICAgICAgICBkcmF3Q29udGV4dC5jbGVhclJlY3QoMCwgMCwgMjc3LCAyMDApO1xuXG4gICAgICAgIC8vIFJlc3RvcmUgdGhlIHByZXZpb3VzIGNvbnRleHQgc3RhdGUuXG4gICAgICAgIGRyYXdDb250ZXh0LnJlc3RvcmUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xvbmVzIHRoZSBnaXZlbiBjYW52YXMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHRoZSBuZXcgY2xvbmVkIGNhbnZhcy5cbiAgICAgKi9cbiAgICBteS5jbG9uZUNhbnZhcyA9IGZ1bmN0aW9uIChvbGRDYW52YXMpIHtcbiAgICAgICAgLypcbiAgICAgICAgICogRklYTUUgVGVzdGluZyBoYXMgc2hvd24gdGhhdCBvbGRDYW52YXMgbWF5IG5vdCBleGlzdC4gSW4gc3VjaCBhIGNhc2UsXG4gICAgICAgICAqIHRoZSBtZXRob2QgQ2FudmFzVXRpbC5jbG9uZUNhbnZhcyBtYXkgdGhyb3cgYW4gZXJyb3IuIFNpbmNlIGF1ZGlvXG4gICAgICAgICAqIGxldmVscyBhcmUgZnJlcXVlbnRseSB1cGRhdGVkLCB0aGUgZXJyb3JzIGhhdmUgYmVlbiBvYnNlcnZlZCB0byBwaWxlXG4gICAgICAgICAqIGludG8gdGhlIGNvbnNvbGUsIHN0cmFpbiB0aGUgQ1BVLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFvbGRDYW52YXMpXG4gICAgICAgICAgICByZXR1cm4gb2xkQ2FudmFzO1xuXG4gICAgICAgIC8vY3JlYXRlIGEgbmV3IGNhbnZhc1xuICAgICAgICB2YXIgbmV3Q2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHZhciBjb250ZXh0ID0gbmV3Q2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgLy9zZXQgZGltZW5zaW9uc1xuICAgICAgICBuZXdDYW52YXMud2lkdGggPSBvbGRDYW52YXMud2lkdGg7XG4gICAgICAgIG5ld0NhbnZhcy5oZWlnaHQgPSBvbGRDYW52YXMuaGVpZ2h0O1xuXG4gICAgICAgIC8vYXBwbHkgdGhlIG9sZCBjYW52YXMgdG8gdGhlIG5ldyBvbmVcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2Uob2xkQ2FudmFzLCAwLCAwKTtcblxuICAgICAgICAvL3JldHVybiB0aGUgbmV3IGNhbnZhc1xuICAgICAgICByZXR1cm4gbmV3Q2FudmFzO1xuICAgIH07XG5cbiAgICByZXR1cm4gbXk7XG59KShDYW52YXNVdGlsIHx8IHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW52YXNVdGlsOyIsIi8qIEluaXRpYWwgXCJhdXRoZW50aWNhdGlvbiByZXF1aXJlZFwiIGRpYWxvZyAqL1xudmFyIGF1dGhEaWFsb2cgPSBudWxsO1xuLyogTG9vcCByZXRyeSBJRCB0aGF0IHdpdHMgZm9yIG90aGVyIHVzZXIgdG8gY3JlYXRlIHRoZSByb29tICovXG52YXIgYXV0aFJldHJ5SWQgPSBudWxsO1xudmFyIGF1dGhlbnRpY2F0aW9uV2luZG93ID0gbnVsbDtcblxudmFyIEF1dGhlbnRpY2F0aW9uID0ge1xuICAgIG9wZW5BdXRoZW50aWNhdGlvbkRpYWxvZzogZnVuY3Rpb24gKHJvb21OYW1lLCBpbnRlcnZhbENhbGxiYWNrLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb29wIHRoYXQgd2lsbCB3YWl0IGZvciB0aGUgcm9vbSB0byBiZSBjcmVhdGVkIGJ5XG4gICAgICAgIC8vIHNvbWVvbmUgZWxzZS4gJ2F1dGhfcmVxdWlyZWQubW9kZXJhdG9yJyB3aWxsIGJyaW5nIHVzIGJhY2sgaGVyZS5cbiAgICAgICAgYXV0aFJldHJ5SWQgPSB3aW5kb3cuc2V0VGltZW91dChpbnRlcnZhbENhbGxiYWNrICwgNTAwMCk7XG4gICAgICAgIC8vIFNob3cgcHJvbXB0IG9ubHkgaWYgaXQncyBub3Qgb3BlblxuICAgICAgICBpZiAoYXV0aERpYWxvZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV4dHJhY3Qgcm9vbSBuYW1lIGZyb20gJ3Jvb21AbXVjLnNlcnZlci5uZXQnXG4gICAgICAgIHZhciByb29tID0gcm9vbU5hbWUuc3Vic3RyKDAsIHJvb21OYW1lLmluZGV4T2YoJ0AnKSk7XG5cbiAgICAgICAgYXV0aERpYWxvZyA9IG1lc3NhZ2VIYW5kbGVyLm9wZW5EaWFsb2coXG4gICAgICAgICAgICAnU3RvcCcsXG4gICAgICAgICAgICAgICAgJ0F1dGhlbnRpY2F0aW9uIGlzIHJlcXVpcmVkIHRvIGNyZWF0ZSByb29tOjxici8+PGI+JyArIHJvb20gK1xuICAgICAgICAgICAgICAgICc8L2I+PC9icj4gWW91IGNhbiBlaXRoZXIgYXV0aGVudGljYXRlIHRvIGNyZWF0ZSB0aGUgcm9vbSBvciAnICtcbiAgICAgICAgICAgICAgICAnanVzdCB3YWl0IGZvciBzb21lb25lIGVsc2UgdG8gZG8gc28uJyxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQXV0aGVudGljYXRlOiAnYXV0aE5vdydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAob25TdWJtaXRFdmVudCwgc3VibWl0VmFsdWUpIHtcblxuICAgICAgICAgICAgICAgIC8vIERvIG5vdCBjbG9zZSB0aGUgZGlhbG9nIHlldFxuICAgICAgICAgICAgICAgIG9uU3VibWl0RXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgIC8vIE9wZW4gbG9naW4gcG9wdXBcbiAgICAgICAgICAgICAgICBpZiAoc3VibWl0VmFsdWUgPT09ICdhdXRoTm93Jykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9LFxuICAgIGNsb3NlQXV0aGVudGljYXRpb25XaW5kb3c6ZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYXV0aGVudGljYXRpb25XaW5kb3cpIHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uV2luZG93LmNsb3NlKCk7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvbldpbmRvdyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGZvY3VzQXV0aGVudGljYXRpb25XaW5kb3c6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gSWYgYXV0aCB3aW5kb3cgZXhpc3RzIGp1c3QgYnJpbmcgaXQgdG8gdGhlIGZyb250XG4gICAgICAgIGlmIChhdXRoZW50aWNhdGlvbldpbmRvdykge1xuICAgICAgICAgICAgYXV0aGVudGljYXRpb25XaW5kb3cuZm9jdXMoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2VBdXRoZW50aWNhdGlvbkRpYWxvZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBDbG9zZSBhdXRoZW50aWNhdGlvbiBkaWFsb2cgaWYgb3BlbmVkXG4gICAgICAgIGlmIChhdXRoRGlhbG9nKSB7XG4gICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5jbG9zZURpYWxvZygpO1xuICAgICAgICAgICAgYXV0aERpYWxvZyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNyZWF0ZUF1dGhlbnRpY2F0aW9uV2luZG93OiBmdW5jdGlvbiAoY2FsbGJhY2ssIHVybCkge1xuICAgICAgICBhdXRoZW50aWNhdGlvbldpbmRvdyA9IG1lc3NhZ2VIYW5kbGVyLm9wZW5DZW50ZXJlZFBvcHVwKFxuICAgICAgICAgICAgdXJsLCA5MTAsIDY2MCxcbiAgICAgICAgICAgIC8vIE9uIGNsb3NlZFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIENsb3NlIGF1dGhlbnRpY2F0aW9uIGRpYWxvZyBpZiBvcGVuZWRcbiAgICAgICAgICAgICAgICBpZiAoYXV0aERpYWxvZykge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5jbG9zZURpYWxvZygpO1xuICAgICAgICAgICAgICAgICAgICBhdXRoRGlhbG9nID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGlvbldpbmRvdyA9IG51bGw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGF1dGhlbnRpY2F0aW9uV2luZG93O1xuICAgIH0sXG4gICAgc3RvcEludGVydmFsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIENsZWFyIHJldHJ5IGludGVydmFsLCBzbyB0aGF0IHdlIGRvbid0IGNhbGwgJ2RvSm9pbkFmdGVyRm9jdXMnIHR3aWNlXG4gICAgICAgIGlmIChhdXRoUmV0cnlJZCkge1xuICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dChhdXRoUmV0cnlJZCk7XG4gICAgICAgICAgICBhdXRoUmV0cnlJZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhlbnRpY2F0aW9uOyIsInZhciBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuLi9zaWRlX3Bhbm5lbHMvc2V0dGluZ3MvU2V0dGluZ3NcIik7XG5cbnZhciB1c2VycyA9IHt9O1xudmFyIGFjdGl2ZVNwZWFrZXJKaWQ7XG5cbmZ1bmN0aW9uIHNldFZpc2liaWxpdHkoc2VsZWN0b3IsIHNob3cpIHtcbiAgICBpZiAoc2VsZWN0b3IgJiYgc2VsZWN0b3IubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxlY3Rvci5jc3MoXCJ2aXNpYmlsaXR5XCIsIHNob3cgPyBcInZpc2libGVcIiA6IFwiaGlkZGVuXCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNVc2VyTXV0ZWQoamlkKSB7XG4gICAgLy8gWFhYKGdwKSB3ZSBtYXkgd2FudCB0byByZW5hbWUgdGhpcyBtZXRob2QgdG8gc29tZXRoaW5nIGxpa2VcbiAgICAvLyBpc1VzZXJTdHJlYW1pbmcsIGZvciBleGFtcGxlLlxuICAgIGlmIChqaWQgJiYgamlkICE9IHhtcHAubXlKaWQoKSkge1xuICAgICAgICB2YXIgcmVzb3VyY2UgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuICAgICAgICBpZiAoIXJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKS5pc0luTGFzdE4ocmVzb3VyY2UpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghUlRDLnJlbW90ZVN0cmVhbXNbamlkXSB8fCAhUlRDLnJlbW90ZVN0cmVhbXNbamlkXVtNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRV0pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBSVEMucmVtb3RlU3RyZWFtc1tqaWRdW01lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFXS5tdXRlZDtcbn1cblxuZnVuY3Rpb24gZ2V0R3JhdmF0YXJVcmwoaWQsIHNpemUpIHtcbiAgICBpZihpZCA9PT0geG1wcC5teUppZCgpIHx8ICFpZCkge1xuICAgICAgICBpZCA9IFNldHRpbmdzLmdldFNldHRpbmdzKCkudWlkO1xuICAgIH1cbiAgICByZXR1cm4gJ2h0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvJyArXG4gICAgICAgIE1ENS5oZXhkaWdlc3QoaWQudHJpbSgpLnRvTG93ZXJDYXNlKCkpICtcbiAgICAgICAgXCI/ZD13YXZhdGFyJnNpemU9XCIgKyAoc2l6ZSB8fCBcIjMwXCIpO1xufVxuXG52YXIgQXZhdGFyID0ge1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdXNlcidzIGF2YXRhciBpbiB0aGUgc2V0dGluZ3MgbWVudShpZiBsb2NhbCB1c2VyKSwgY29udGFjdCBsaXN0XG4gICAgICogYW5kIHRodW1ibmFpbFxuICAgICAqIEBwYXJhbSBqaWQgamlkIG9mIHRoZSB1c2VyXG4gICAgICogQHBhcmFtIGlkIGVtYWlsIG9yIHVzZXJJRCB0byBiZSB1c2VkIGFzIGEgaGFzaFxuICAgICAqL1xuICAgIHNldFVzZXJBdmF0YXI6IGZ1bmN0aW9uIChqaWQsIGlkKSB7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgaWYgKHVzZXJzW2ppZF0gPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXNlcnNbamlkXSA9IGlkO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aHVtYlVybCA9IGdldEdyYXZhdGFyVXJsKHVzZXJzW2ppZF0gfHwgamlkLCAxMDApO1xuICAgICAgICB2YXIgY29udGFjdExpc3RVcmwgPSBnZXRHcmF2YXRhclVybCh1c2Vyc1tqaWRdIHx8IGppZCk7XG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIHZhciB0aHVtYm5haWwgPSAkKCcjcGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkKTtcbiAgICAgICAgdmFyIGF2YXRhciA9ICQoJyNhdmF0YXJfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICAvLyBzZXQgdGhlIGF2YXRhciBpbiB0aGUgc2V0dGluZ3MgbWVudSBpZiBpdCBpcyBsb2NhbCB1c2VyIGFuZCBnZXQgdGhlXG4gICAgICAgIC8vIGxvY2FsIHZpZGVvIGNvbnRhaW5lclxuICAgICAgICBpZiAoamlkID09PSB4bXBwLm15SmlkKCkpIHtcbiAgICAgICAgICAgICQoJyNhdmF0YXInKS5nZXQoMCkuc3JjID0gdGh1bWJVcmw7XG4gICAgICAgICAgICB0aHVtYm5haWwgPSAkKCcjbG9jYWxWaWRlb0NvbnRhaW5lcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHRoZSBhdmF0YXIgaW4gdGhlIGNvbnRhY3QgbGlzdFxuICAgICAgICB2YXIgY29udGFjdCA9ICQoJyMnICsgcmVzb3VyY2VKaWQgKyAnPmltZycpO1xuICAgICAgICBpZiAoY29udGFjdCAmJiBjb250YWN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnRhY3QuZ2V0KDApLnNyYyA9IGNvbnRhY3RMaXN0VXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2V0IHRoZSBhdmF0YXIgaW4gdGhlIHRodW1ibmFpbFxuICAgICAgICBpZiAoYXZhdGFyICYmIGF2YXRhci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhdmF0YXJbMF0uc3JjID0gdGh1bWJVcmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGh1bWJuYWlsICYmIHRodW1ibmFpbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgYXZhdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgICAgICAgICAgYXZhdGFyLmlkID0gJ2F2YXRhcl8nICsgcmVzb3VyY2VKaWQ7XG4gICAgICAgICAgICAgICAgYXZhdGFyLmNsYXNzTmFtZSA9ICd1c2VyQXZhdGFyJztcbiAgICAgICAgICAgICAgICBhdmF0YXIuc3JjID0gdGh1bWJVcmw7XG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsLmFwcGVuZChhdmF0YXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy9pZiB0aGUgdXNlciBpcyB0aGUgY3VycmVudCBhY3RpdmUgc3BlYWtlciAtIHVwZGF0ZSB0aGUgYWN0aXZlIHNwZWFrZXJcbiAgICAgICAgLy8gYXZhdGFyXG4gICAgICAgIGlmIChqaWQgPT09IGFjdGl2ZVNwZWFrZXJKaWQpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQWN0aXZlU3BlYWtlckF2YXRhclNyYyhqaWQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEhpZGVzIG9yIHNob3dzIHRoZSB1c2VyJ3MgYXZhdGFyXG4gICAgICogQHBhcmFtIGppZCBqaWQgb2YgdGhlIHVzZXJcbiAgICAgKiBAcGFyYW0gc2hvdyB3aGV0aGVyIHdlIHNob3VsZCBzaG93IHRoZSBhdmF0YXIgb3Igbm90XG4gICAgICogdmlkZW8gYmVjYXVzZSB0aGVyZSBpcyBubyBkb21pbmFudCBzcGVha2VyIGFuZCBubyBmb2N1c2VkIHNwZWFrZXJcbiAgICAgKi9cbiAgICBzaG93VXNlckF2YXRhcjogZnVuY3Rpb24gKGppZCwgc2hvdykge1xuICAgICAgICBpZiAodXNlcnNbamlkXSkge1xuICAgICAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcbiAgICAgICAgICAgIHZhciB2aWRlbyA9ICQoJyNwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQgKyAnPnZpZGVvJyk7XG4gICAgICAgICAgICB2YXIgYXZhdGFyID0gJCgnI2F2YXRhcl8nICsgcmVzb3VyY2VKaWQpO1xuXG4gICAgICAgICAgICBpZiAoamlkID09PSB4bXBwLm15SmlkKCkpIHtcbiAgICAgICAgICAgICAgICB2aWRlbyA9ICQoJyNsb2NhbFZpZGVvV3JhcHBlcj52aWRlbycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNob3cgPT09IHVuZGVmaW5lZCB8fCBzaG93ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2hvdyA9IGlzVXNlck11dGVkKGppZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vaWYgdGhlIHVzZXIgaXMgdGhlIGN1cnJlbnRseSBmb2N1c2VkLCB0aGUgZG9taW5hbnQgc3BlYWtlciBvciBpZlxuICAgICAgICAgICAgLy90aGVyZSBpcyBubyBmb2N1c2VkIGFuZCBubyBkb21pbmFudCBzcGVha2VyIGFuZCB0aGUgbGFyZ2UgdmlkZW8gaXNcbiAgICAgICAgICAgIC8vY3VycmVudGx5IHNob3duXG4gICAgICAgICAgICBpZiAoYWN0aXZlU3BlYWtlckppZCA9PT0gamlkICYmIHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKS5pc0xhcmdlVmlkZW9PblRvcCgpKSB7XG4gICAgICAgICAgICAgICAgc2V0VmlzaWJpbGl0eSgkKFwiI2xhcmdlVmlkZW9cIiksICFzaG93KTtcbiAgICAgICAgICAgICAgICBzZXRWaXNpYmlsaXR5KCQoJyNhY3RpdmVTcGVha2VyJyksIHNob3cpO1xuICAgICAgICAgICAgICAgIHNldFZpc2liaWxpdHkoYXZhdGFyLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgc2V0VmlzaWJpbGl0eSh2aWRlbywgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmlkZW8gJiYgdmlkZW8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZXRWaXNpYmlsaXR5KHZpZGVvLCAhc2hvdyk7XG4gICAgICAgICAgICAgICAgICAgIHNldFZpc2liaWxpdHkoYXZhdGFyLCBzaG93KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgc3JjIG9mIHRoZSBhY3RpdmUgc3BlYWtlciBhdmF0YXJcbiAgICAgKiBAcGFyYW0gamlkIG9mIHRoZSBjdXJyZW50IGFjdGl2ZSBzcGVha2VyXG4gICAgICovXG4gICAgdXBkYXRlQWN0aXZlU3BlYWtlckF2YXRhclNyYzogZnVuY3Rpb24gKGppZCkge1xuICAgICAgICBpZiAoIWppZCkge1xuICAgICAgICAgICAgamlkID0geG1wcC5maW5kSmlkRnJvbVJlc291cmNlKFxuICAgICAgICAgICAgICAgIHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKS5nZXRMYXJnZVZpZGVvU3RhdGUoKS51c2VyUmVzb3VyY2VKaWQpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhdmF0YXIgPSAkKFwiI2FjdGl2ZVNwZWFrZXJBdmF0YXJcIilbMF07XG4gICAgICAgIHZhciB1cmwgPSBnZXRHcmF2YXRhclVybCh1c2Vyc1tqaWRdLFxuICAgICAgICAgICAgaW50ZXJmYWNlQ29uZmlnLkFDVElWRV9TUEVBS0VSX0FWQVRBUl9TSVpFKTtcbiAgICAgICAgaWYgKGppZCA9PT0gYWN0aXZlU3BlYWtlckppZCAmJiBhdmF0YXIuc3JjID09PSB1cmwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhY3RpdmVTcGVha2VySmlkID0gamlkO1xuICAgICAgICB2YXIgaXNNdXRlZCA9IGlzVXNlck11dGVkKGppZCk7XG4gICAgICAgIGlmIChqaWQgJiYgaXNNdXRlZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgYXZhdGFyLnNyYyA9IHVybDtcbiAgICAgICAgICAgIHNldFZpc2liaWxpdHkoJChcIiNsYXJnZVZpZGVvXCIpLCAhaXNNdXRlZCk7XG4gICAgICAgICAgICBBdmF0YXIuc2hvd1VzZXJBdmF0YXIoamlkLCBpc011dGVkKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEF2YXRhcjsiLCIvKiBnbG9iYWwgJCwgY29uZmlnLCBkb2NrVG9vbGJhcixcbiAgIHNldExhcmdlVmlkZW9WaXNpYmxlLCBVdGlsICovXG5cbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKTtcbnZhciBQcmV6aSA9IHJlcXVpcmUoXCIuLi9wcmV6aS9QcmV6aVwiKTtcbnZhciBVSVV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9VSVV0aWxcIik7XG5cbnZhciBldGhlcnBhZE5hbWUgPSBudWxsO1xudmFyIGV0aGVycGFkSUZyYW1lID0gbnVsbDtcbnZhciBkb21haW4gPSBudWxsO1xudmFyIG9wdGlvbnMgPSBcIj9zaG93Q29udHJvbHM9dHJ1ZSZzaG93Q2hhdD1mYWxzZSZzaG93TGluZU51bWJlcnM9dHJ1ZSZ1c2VNb25vc3BhY2VGb250PWZhbHNlXCI7XG5cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBldGhlcnBhZC5cbiAqL1xuZnVuY3Rpb24gcmVzaXplKCkge1xuICAgIGlmICgkKCcjZXRoZXJwYWQ+aWZyYW1lJykubGVuZ3RoKSB7XG4gICAgICAgIHZhciByZW1vdGVWaWRlb3MgPSAkKCcjcmVtb3RlVmlkZW9zJyk7XG4gICAgICAgIHZhciBhdmFpbGFibGVIZWlnaHRcbiAgICAgICAgICAgID0gd2luZG93LmlubmVySGVpZ2h0IC0gcmVtb3RlVmlkZW9zLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IFVJVXRpbC5nZXRBdmFpbGFibGVWaWRlb1dpZHRoKCk7XG5cbiAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLndpZHRoKGF2YWlsYWJsZVdpZHRoKTtcbiAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmhlaWdodChhdmFpbGFibGVIZWlnaHQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTaGFyZXMgdGhlIEV0aGVycGFkIG5hbWUgd2l0aCBvdGhlciBwYXJ0aWNpcGFudHMuXG4gKi9cbmZ1bmN0aW9uIHNoYXJlRXRoZXJwYWQoKSB7XG4gICAgeG1wcC5hZGRUb1ByZXNlbmNlKFwiZXRoZXJwYWRcIiwgZXRoZXJwYWROYW1lKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBFdGhlcnBhZCBidXR0b24gYW5kIGFkZHMgaXQgdG8gdGhlIHRvb2xiYXIuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUV0aGVycGFkQnV0dG9uKCkge1xuICAgIGlmICghJCgnI2V0aGVycGFkQnV0dG9uJykuaXMoXCI6dmlzaWJsZVwiKSlcbiAgICAgICAgJCgnI2V0aGVycGFkQnV0dG9uJykuY3NzKHtkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIElGcmFtZSBmb3IgdGhlIGV0aGVycGFkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVJRnJhbWUoKSB7XG4gICAgZXRoZXJwYWRJRnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBldGhlcnBhZElGcmFtZS5zcmMgPSBkb21haW4gKyBldGhlcnBhZE5hbWUgKyBvcHRpb25zO1xuICAgIGV0aGVycGFkSUZyYW1lLmZyYW1lQm9yZGVyID0gMDtcbiAgICBldGhlcnBhZElGcmFtZS5zY3JvbGxpbmcgPSBcIm5vXCI7XG4gICAgZXRoZXJwYWRJRnJhbWUud2lkdGggPSAkKCcjbGFyZ2VWaWRlb0NvbnRhaW5lcicpLndpZHRoKCkgfHwgNjQwO1xuICAgIGV0aGVycGFkSUZyYW1lLmhlaWdodCA9ICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykuaGVpZ2h0KCkgfHwgNDgwO1xuICAgIGV0aGVycGFkSUZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAndmlzaWJpbGl0eTogaGlkZGVuOycpO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0aGVycGFkJykuYXBwZW5kQ2hpbGQoZXRoZXJwYWRJRnJhbWUpO1xuXG4gICAgZXRoZXJwYWRJRnJhbWUub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZG9jdW1lbnQuZG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuICAgICAgICBidWJibGVJZnJhbWVNb3VzZU1vdmUoZXRoZXJwYWRJRnJhbWUpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gdGhlIGlmcmFtZXMgaW5zaWRlIG9mIHRoZSBldGhlcnBhZCBhcmVcbiAgICAgICAgICAgIC8vIG5vdCB5ZXQgbG9hZGVkIHdoZW4gdGhlIGV0aGVycGFkIGlmcmFtZSBpcyBsb2FkZWRcbiAgICAgICAgICAgIHZhciBvdXRlciA9IGV0aGVycGFkSUZyYW1lLlxuICAgICAgICAgICAgICAgIGNvbnRlbnREb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZShcImFjZV9vdXRlclwiKVswXTtcbiAgICAgICAgICAgIGJ1YmJsZUlmcmFtZU1vdXNlTW92ZShvdXRlcik7XG4gICAgICAgICAgICB2YXIgaW5uZXIgPSBvdXRlci5cbiAgICAgICAgICAgICAgICBjb250ZW50RG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoXCJhY2VfaW5uZXJcIilbMF07XG4gICAgICAgICAgICBidWJibGVJZnJhbWVNb3VzZU1vdmUoaW5uZXIpO1xuICAgICAgICB9LCAyMDAwKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBidWJibGVJZnJhbWVNb3VzZU1vdmUoaWZyYW1lKXtcbiAgICB2YXIgZXhpc3RpbmdPbk1vdXNlTW92ZSA9IGlmcmFtZS5jb250ZW50V2luZG93Lm9ubW91c2Vtb3ZlO1xuICAgIGlmcmFtZS5jb250ZW50V2luZG93Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSl7XG4gICAgICAgIGlmKGV4aXN0aW5nT25Nb3VzZU1vdmUpIGV4aXN0aW5nT25Nb3VzZU1vdmUoZSk7XG4gICAgICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICB2YXIgYm91bmRpbmdDbGllbnRSZWN0ID0gaWZyYW1lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBldnQuaW5pdE1vdXNlRXZlbnQoXG4gICAgICAgICAgICBcIm1vdXNlbW92ZVwiLFxuICAgICAgICAgICAgdHJ1ZSwgLy8gYnViYmxlc1xuICAgICAgICAgICAgZmFsc2UsIC8vIG5vdCBjYW5jZWxhYmxlXG4gICAgICAgICAgICB3aW5kb3csXG4gICAgICAgICAgICBlLmRldGFpbCxcbiAgICAgICAgICAgIGUuc2NyZWVuWCxcbiAgICAgICAgICAgIGUuc2NyZWVuWSxcbiAgICAgICAgICAgICAgICBlLmNsaWVudFggKyBib3VuZGluZ0NsaWVudFJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICBlLmNsaWVudFkgKyBib3VuZGluZ0NsaWVudFJlY3QudG9wLFxuICAgICAgICAgICAgZS5jdHJsS2V5LFxuICAgICAgICAgICAgZS5hbHRLZXksXG4gICAgICAgICAgICBlLnNoaWZ0S2V5LFxuICAgICAgICAgICAgZS5tZXRhS2V5LFxuICAgICAgICAgICAgZS5idXR0b24sXG4gICAgICAgICAgICBudWxsIC8vIG5vIHJlbGF0ZWQgZWxlbWVudFxuICAgICAgICApO1xuICAgICAgICBpZnJhbWUuZGlzcGF0Y2hFdmVudChldnQpO1xuICAgIH07XG59XG5cblxuLyoqXG4gKiBPbiB2aWRlbyBzZWxlY3RlZCBldmVudC5cbiAqL1xuJChkb2N1bWVudCkuYmluZCgndmlkZW8uc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGlzUHJlc2VudGF0aW9uKSB7XG4gICAgaWYgKGNvbmZpZy5ldGhlcnBhZF9iYXNlICYmIGV0aGVycGFkSUZyYW1lICYmIGV0aGVycGFkSUZyYW1lLnN0eWxlLnZpc2liaWxpdHkgIT09ICdoaWRkZW4nKVxuICAgICAgICBFdGhlcnBhZC50b2dnbGVFdGhlcnBhZChpc1ByZXNlbnRhdGlvbik7XG59KTtcblxuXG52YXIgRXRoZXJwYWQgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGV0aGVycGFkLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uIChuYW1lKSB7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5ldGhlcnBhZF9iYXNlICYmICFldGhlcnBhZE5hbWUpIHtcblxuICAgICAgICAgICAgZG9tYWluID0gY29uZmlnLmV0aGVycGFkX2Jhc2U7XG5cbiAgICAgICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UncmUgdGhlIGZvY3VzIHdlIGdlbmVyYXRlIHRoZSBuYW1lLlxuICAgICAgICAgICAgICAgIGV0aGVycGFkTmFtZSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdfJyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBzaGFyZUV0aGVycGFkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZXRoZXJwYWROYW1lID0gbmFtZTtcblxuICAgICAgICAgICAgZW5hYmxlRXRoZXJwYWRCdXR0b24oKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXNpemVzIHRoZSBldGhlcnBhZCwgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc2l6ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbnMvaGlkZXMgdGhlIEV0aGVycGFkLlxuICAgICAqL1xuICAgIHRvZ2dsZUV0aGVycGFkOiBmdW5jdGlvbiAoaXNQcmVzZW50YXRpb24pIHtcbiAgICAgICAgaWYgKCFldGhlcnBhZElGcmFtZSlcbiAgICAgICAgICAgIGNyZWF0ZUlGcmFtZSgpO1xuXG4gICAgICAgIHZhciBsYXJnZVZpZGVvID0gbnVsbDtcbiAgICAgICAgaWYgKFByZXppLmlzUHJlc2VudGF0aW9uVmlzaWJsZSgpKVxuICAgICAgICAgICAgbGFyZ2VWaWRlbyA9ICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhcmdlVmlkZW8gPSAkKCcjbGFyZ2VWaWRlbycpO1xuXG4gICAgICAgIGlmICgkKCcjZXRoZXJwYWQ+aWZyYW1lJykuY3NzKCd2aXNpYmlsaXR5JykgPT09ICdoaWRkZW4nKSB7XG4gICAgICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIGxhcmdlVmlkZW8uZmFkZU91dCgzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoUHJlemkuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlby5jc3Moe29wYWNpdHk6ICcwJ30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNldExhcmdlVmlkZW9WaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmZhZGVJbigzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmQgPSAnI2VlZWVlZSc7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkJykuY3NzKHt6SW5kZXg6IDJ9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCQoJyNldGhlcnBhZD5pZnJhbWUnKSkge1xuICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmZhZGVPdXQoMzAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcbiAgICAgICAgICAgICAgICAkKCcjZXRoZXJwYWQnKS5jc3Moe3pJbmRleDogMH0pO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFpc1ByZXNlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICQoJyNsYXJnZVZpZGVvJykuZmFkZUluKDMwMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zZXRMYXJnZVZpZGVvVmlzaWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXNpemUoKTtcbiAgICB9LFxuXG4gICAgaXNWaXNpYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV0aGVycGFkSWZyYW1lID0gJCgnI2V0aGVycGFkPmlmcmFtZScpO1xuICAgICAgICByZXR1cm4gZXRoZXJwYWRJZnJhbWUgJiYgZXRoZXJwYWRJZnJhbWUuaXMoJzp2aXNpYmxlJyk7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV0aGVycGFkO1xuIiwidmFyIFRvb2xiYXJUb2dnbGVyID0gcmVxdWlyZShcIi4uL3Rvb2xiYXJzL1Rvb2xiYXJUb2dnbGVyXCIpO1xudmFyIFVJVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL1VJVXRpbFwiKTtcbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKTtcbnZhciBtZXNzYWdlSGFuZGxlciA9IHJlcXVpcmUoXCIuLi91dGlsL01lc3NhZ2VIYW5kbGVyXCIpO1xuXG52YXIgcHJlemlQbGF5ZXIgPSBudWxsO1xuXG52YXIgUHJlemkgPSB7XG5cblxuICAgIC8qKlxuICAgICAqIFJlbG9hZHMgdGhlIGN1cnJlbnQgcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHJlbG9hZFByZXNlbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcmV6aVBsYXllci5vcHRpb25zLnByZXppSWQpO1xuICAgICAgICBpZnJhbWUuc3JjID0gaWZyYW1lLnNyYztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyA8dHQ+dHJ1ZTwvdHQ+IGlmIHRoZSBwcmVzZW50YXRpb24gaXMgdmlzaWJsZSwgPHR0PmZhbHNlPC90dD4gLVxuICAgICAqIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBpc1ByZXNlbnRhdGlvblZpc2libGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICgkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpICE9IG51bGxcbiAgICAgICAgICAgICAgICAmJiAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLmNzcygnb3BhY2l0eScpID09IDEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgUHJlemkgZGlhbG9nLCBmcm9tIHdoaWNoIHRoZSB1c2VyIGNvdWxkIGNob29zZSBhIHByZXNlbnRhdGlvblxuICAgICAqIHRvIGxvYWQuXG4gICAgICovXG4gICAgb3BlblByZXppRGlhbG9nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15cHJlemkgPSB4bXBwLmdldFByZXppKCk7XG4gICAgICAgIGlmIChteXByZXppKSB7XG4gICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKFwiUmVtb3ZlIFByZXppXCIsXG4gICAgICAgICAgICAgICAgXCJBcmUgeW91IHN1cmUgeW91IHdvdWxkIGxpa2UgdG8gcmVtb3ZlIHlvdXIgUHJlemk/XCIsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJSZW1vdmVcIixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlLHYsbSxmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtcHAucmVtb3ZlUHJlemlGcm9tUHJlc2VuY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJlemlQbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhcIlNoYXJlIGEgUHJlemlcIixcbiAgICAgICAgICAgICAgICBcIkFub3RoZXIgcGFydGljaXBhbnQgaXMgYWxyZWFkeSBzaGFyaW5nIGEgUHJlemkuXCIgK1xuICAgICAgICAgICAgICAgICAgICBcIlRoaXMgY29uZmVyZW5jZSBhbGxvd3Mgb25seSBvbmUgUHJlemkgYXQgYSB0aW1lLlwiLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIFwiT2tcIixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlLHYsbSxmKSB7XG4gICAgICAgICAgICAgICAgICAgICQucHJvbXB0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvcGVuUHJlemlTdGF0ZSA9IHtcbiAgICAgICAgICAgICAgICBzdGF0ZTA6IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogICAnPGgyPlNoYXJlIGEgUHJlemk8L2gyPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJwcmV6aVVybFwiIHR5cGU9XCJ0ZXh0XCIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3BsYWNlaG9sZGVyPVwiZS5nLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaHR0cDovL3ByZXppLmNvbS93ejd2aGp5Y2w3ZTYvbXktcHJlemlcIiBhdXRvZm9jdXM+JyxcbiAgICAgICAgICAgICAgICAgICAgcGVyc2lzdGVudDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IHsgXCJTaGFyZVwiOiB0cnVlICwgXCJDYW5jZWxcIjogZmFsc2V9LFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0QnV0dG9uOiAxLFxuICAgICAgICAgICAgICAgICAgICBzdWJtaXQ6IGZ1bmN0aW9uKGUsdixtLGYpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYodilcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJlemlVcmwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJlemlVcmwnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcmV6aVVybC52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cmxWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBlbmNvZGVVUkkoVXRpbC5lc2NhcGVIdG1sKHByZXppVXJsLnZhbHVlKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVybFZhbHVlLmluZGV4T2YoJ2h0dHA6Ly9wcmV6aS5jb20vJykgIT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgdXJsVmFsdWUuaW5kZXhPZignaHR0cHM6Ly9wcmV6aS5jb20vJykgIT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuZ29Ub1N0YXRlKCdzdGF0ZTEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVzSWRUbXAgPSB1cmxWYWx1ZS5zdWJzdHJpbmcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybFZhbHVlLmluZGV4T2YoXCJwcmV6aS5jb20vXCIpICsgMTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0FscGhhbnVtZXJpYyhwcmVzSWRUbXApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHByZXNJZFRtcC5pbmRleE9mKCcvJykgPCAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuZ29Ub1N0YXRlKCdzdGF0ZTEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4bXBwLmFkZFRvUHJlc2VuY2UoXCJwcmV6aVwiLCB1cmxWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGF0ZTE6IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogICAnPGgyPlNoYXJlIGEgUHJlemk8L2gyPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQbGVhc2UgcHJvdmlkZSBhIGNvcnJlY3QgcHJlemkgbGluay4nLFxuICAgICAgICAgICAgICAgICAgICBwZXJzaXN0ZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogeyBcIkJhY2tcIjogdHJ1ZSwgXCJDYW5jZWxcIjogZmFsc2UgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdEJ1dHRvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0OmZ1bmN0aW9uKGUsdixtLGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHY9PTApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5nb1RvU3RhdGUoJ3N0YXRlMCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBmb2N1c1ByZXppVXJsID0gIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ByZXppVXJsJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlbkRpYWxvZ1dpdGhTdGF0ZXMob3BlblByZXppU3RhdGUsIGZvY3VzUHJlemlVcmwsIGZvY3VzUHJlemlVcmwpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIEEgbmV3IHByZXNlbnRhdGlvbiBoYXMgYmVlbiBhZGRlZC5cbiAqXG4gKiBAcGFyYW0gZXZlbnQgdGhlIGV2ZW50IGluZGljYXRpbmcgdGhlIGFkZCBvZiBhIHByZXNlbnRhdGlvblxuICogQHBhcmFtIGppZCB0aGUgamlkIGZyb20gd2hpY2ggdGhlIHByZXNlbnRhdGlvbiB3YXMgYWRkZWRcbiAqIEBwYXJhbSBwcmVzVXJsIHVybCBvZiB0aGUgcHJlc2VudGF0aW9uXG4gKiBAcGFyYW0gY3VycmVudFNsaWRlIHRoZSBjdXJyZW50IHNsaWRlIHRvIHdoaWNoIHdlIHNob3VsZCBtb3ZlXG4gKi9cbmZ1bmN0aW9uIHByZXNlbnRhdGlvbkFkZGVkKGV2ZW50LCBqaWQsIHByZXNVcmwsIGN1cnJlbnRTbGlkZSkge1xuICAgIGNvbnNvbGUubG9nKFwicHJlc2VudGF0aW9uIGFkZGVkXCIsIHByZXNVcmwpO1xuXG4gICAgdmFyIHByZXNJZCA9IGdldFByZXNlbnRhdGlvbklkKHByZXNVcmwpO1xuXG4gICAgdmFyIGVsZW1lbnRJZCA9ICdwYXJ0aWNpcGFudF8nXG4gICAgICAgICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKVxuICAgICAgICArICdfJyArIHByZXNJZDtcblxuICAgIC8vIFdlIGV4cGxpY2l0bHkgZG9uJ3Qgc3BlY2lmeSB0aGUgcGVlciBqaWQgaGVyZSwgYmVjYXVzZSB3ZSBkb24ndCB3YW50XG4gICAgLy8gdGhpcyB2aWRlbyB0byBiZSBkZWFsdCB3aXRoIGFzIGEgcGVlciByZWxhdGVkIG9uZSAoZm9yIGV4YW1wbGUgd2VcbiAgICAvLyBkb24ndCB3YW50IHRvIHNob3cgYSBtdXRlL2tpY2sgbWVudSBmb3IgdGhpcyBvbmUsIGV0Yy4pLlxuICAgIFZpZGVvTGF5b3V0LmFkZFJlbW90ZVZpZGVvQ29udGFpbmVyKG51bGwsIGVsZW1lbnRJZCk7XG4gICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuXG4gICAgdmFyIGNvbnRyb2xzRW5hYmxlZCA9IGZhbHNlO1xuICAgIGlmIChqaWQgPT09IHhtcHAubXlKaWQoKSlcbiAgICAgICAgY29udHJvbHNFbmFibGVkID0gdHJ1ZTtcblxuICAgIHNldFByZXNlbnRhdGlvblZpc2libGUodHJ1ZSk7XG4gICAgJCgnI2xhcmdlVmlkZW9Db250YWluZXInKS5ob3ZlcihcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoUHJlemkuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVsb2FkQnV0dG9uUmlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aFxuICAgICAgICAgICAgICAgICAgICAtICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJykub2Zmc2V0KCkubGVmdFxuICAgICAgICAgICAgICAgICAgICAtICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJykud2lkdGgoKTtcblxuICAgICAgICAgICAgICAgICQoJyNyZWxvYWRQcmVzZW50YXRpb24nKS5jc3MoeyAgcmlnaHQ6IHJlbG9hZEJ1dHRvblJpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OidpbmxpbmUtYmxvY2snfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKCFQcmV6aS5pc1ByZXNlbnRhdGlvblZpc2libGUoKSlcbiAgICAgICAgICAgICAgICAkKCcjcmVsb2FkUHJlc2VudGF0aW9uJykuY3NzKHtkaXNwbGF5Oidub25lJ30pO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBldmVudC50b0VsZW1lbnQgfHwgZXZlbnQucmVsYXRlZFRhcmdldDtcblxuICAgICAgICAgICAgICAgIGlmIChlICYmIGUuaWQgIT0gJ3JlbG9hZFByZXNlbnRhdGlvbicgJiYgZS5pZCAhPSAnaGVhZGVyJylcbiAgICAgICAgICAgICAgICAgICAgJCgnI3JlbG9hZFByZXNlbnRhdGlvbicpLmNzcyh7ZGlzcGxheTonbm9uZSd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICBwcmV6aVBsYXllciA9IG5ldyBQcmV6aVBsYXllcihcbiAgICAgICAgJ3ByZXNlbnRhdGlvbicsXG4gICAgICAgIHtwcmV6aUlkOiBwcmVzSWQsXG4gICAgICAgICAgICB3aWR0aDogZ2V0UHJlc2VudGF0aW9uV2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodDogZ2V0UHJlc2VudGF0aW9uSGVpaGd0KCksXG4gICAgICAgICAgICBjb250cm9sczogY29udHJvbHNFbmFibGVkLFxuICAgICAgICAgICAgZGVidWc6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLmF0dHIoJ2lkJywgcHJlemlQbGF5ZXIub3B0aW9ucy5wcmV6aUlkKTtcblxuICAgIHByZXppUGxheWVyLm9uKFByZXppUGxheWVyLkVWRU5UX1NUQVRVUywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJwcmV6aSBzdGF0dXNcIiwgZXZlbnQudmFsdWUpO1xuICAgICAgICBpZiAoZXZlbnQudmFsdWUgPT0gUHJlemlQbGF5ZXIuU1RBVFVTX0NPTlRFTlRfUkVBRFkpIHtcbiAgICAgICAgICAgIGlmIChqaWQgIT0geG1wcC5teUppZCgpKVxuICAgICAgICAgICAgICAgIHByZXppUGxheWVyLmZseVRvU3RlcChjdXJyZW50U2xpZGUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBwcmV6aVBsYXllci5vbihQcmV6aVBsYXllci5FVkVOVF9DVVJSRU5UX1NURVAsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiZXZlbnQgdmFsdWVcIiwgZXZlbnQudmFsdWUpO1xuICAgICAgICB4bXBwLmFkZFRvUHJlc2VuY2UoXCJwcmV6aVNsaWRlXCIsIGV2ZW50LnZhbHVlKTtcbiAgICB9KTtcblxuICAgICQoXCIjXCIgKyBlbGVtZW50SWQpLmNzcyggJ2JhY2tncm91bmQtaW1hZ2UnLFxuICAgICAgICAndXJsKC4uL2ltYWdlcy9hdmF0YXJwcmV6aS5wbmcpJyk7XG4gICAgJChcIiNcIiArIGVsZW1lbnRJZCkuY2xpY2soXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFByZXNlbnRhdGlvblZpc2libGUodHJ1ZSk7XG4gICAgICAgIH1cbiAgICApO1xufTtcblxuLyoqXG4gKiBBIHByZXNlbnRhdGlvbiBoYXMgYmVlbiByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSBldmVudCB0aGUgZXZlbnQgaW5kaWNhdGluZyB0aGUgcmVtb3ZlIG9mIGEgcHJlc2VudGF0aW9uXG4gKiBAcGFyYW0gamlkIHRoZSBqaWQgZm9yIHdoaWNoIHRoZSBwcmVzZW50YXRpb24gd2FzIHJlbW92ZWRcbiAqIEBwYXJhbSB0aGUgdXJsIG9mIHRoZSBwcmVzZW50YXRpb25cbiAqL1xuZnVuY3Rpb24gcHJlc2VudGF0aW9uUmVtb3ZlZChldmVudCwgamlkLCBwcmVzVXJsKSB7XG4gICAgY29uc29sZS5sb2coJ3ByZXNlbnRhdGlvbiByZW1vdmVkJywgcHJlc1VybCk7XG4gICAgdmFyIHByZXNJZCA9IGdldFByZXNlbnRhdGlvbklkKHByZXNVcmwpO1xuICAgIHNldFByZXNlbnRhdGlvblZpc2libGUoZmFsc2UpO1xuICAgICQoJyNwYXJ0aWNpcGFudF8nXG4gICAgICAgICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKVxuICAgICAgICArICdfJyArIHByZXNJZCkucmVtb3ZlKCk7XG4gICAgJCgnI3ByZXNlbnRhdGlvbj5pZnJhbWUnKS5yZW1vdmUoKTtcbiAgICBpZiAocHJlemlQbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICBwcmV6aVBsYXllci5kZXN0cm95KCk7XG4gICAgICAgIHByZXppUGxheWVyID0gbnVsbDtcbiAgICB9XG59O1xuXG4vKipcbiAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGFuIGFscGhhbnVtZXJpYyBzdHJpbmcuXG4gKiBOb3RlIHRoYXQgc29tZSBzcGVjaWFsIGNoYXJhY3RlcnMgYXJlIGFsc28gYWxsb3dlZCAoLSwgXyAsIC8sICYsID8sID0sIDspIGZvciB0aGVcbiAqIHB1cnBvc2Ugb2YgY2hlY2tpbmcgVVJJcy5cbiAqL1xuZnVuY3Rpb24gaXNBbHBoYW51bWVyaWModW5zYWZlVGV4dCkge1xuICAgIHZhciByZWdleCA9IC9eW2EtejAtOS1fXFwvJlxcPz07XSskL2k7XG4gICAgcmV0dXJuIHJlZ2V4LnRlc3QodW5zYWZlVGV4dCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJlc2VudGF0aW9uIGlkIGZyb20gdGhlIGdpdmVuIHVybC5cbiAqL1xuZnVuY3Rpb24gZ2V0UHJlc2VudGF0aW9uSWQgKHByZXNVcmwpIHtcbiAgICB2YXIgcHJlc0lkVG1wID0gcHJlc1VybC5zdWJzdHJpbmcocHJlc1VybC5pbmRleE9mKFwicHJlemkuY29tL1wiKSArIDEwKTtcbiAgICByZXR1cm4gcHJlc0lkVG1wLnN1YnN0cmluZygwLCBwcmVzSWRUbXAuaW5kZXhPZignLycpKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwcmVzZW50YXRpb24gd2lkdGguXG4gKi9cbmZ1bmN0aW9uIGdldFByZXNlbnRhdGlvbldpZHRoKCkge1xuICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IFVJVXRpbC5nZXRBdmFpbGFibGVWaWRlb1dpZHRoKCk7XG4gICAgdmFyIGF2YWlsYWJsZUhlaWdodCA9IGdldFByZXNlbnRhdGlvbkhlaWhndCgpO1xuXG4gICAgdmFyIGFzcGVjdFJhdGlvID0gMTYuMCAvIDkuMDtcbiAgICBpZiAoYXZhaWxhYmxlSGVpZ2h0IDwgYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbykge1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IE1hdGguZmxvb3IoYXZhaWxhYmxlSGVpZ2h0ICogYXNwZWN0UmF0aW8pO1xuICAgIH1cbiAgICByZXR1cm4gYXZhaWxhYmxlV2lkdGg7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJlc2VudGF0aW9uIGhlaWdodC5cbiAqL1xuZnVuY3Rpb24gZ2V0UHJlc2VudGF0aW9uSGVpaGd0KCkge1xuICAgIHZhciByZW1vdGVWaWRlb3MgPSAkKCcjcmVtb3RlVmlkZW9zJyk7XG4gICAgcmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCAtIHJlbW90ZVZpZGVvcy5vdXRlckhlaWdodCgpO1xufVxuXG4vKipcbiAqIFJlc2l6ZXMgdGhlIHByZXNlbnRhdGlvbiBpZnJhbWUuXG4gKi9cbmZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICBpZiAoJCgnI3ByZXNlbnRhdGlvbj5pZnJhbWUnKSkge1xuICAgICAgICAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLndpZHRoKGdldFByZXNlbnRhdGlvbldpZHRoKCkpO1xuICAgICAgICAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLmhlaWdodChnZXRQcmVzZW50YXRpb25IZWloZ3QoKSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFNob3dzL2hpZGVzIGEgcHJlc2VudGF0aW9uLlxuICovXG5mdW5jdGlvbiBzZXRQcmVzZW50YXRpb25WaXNpYmxlKHZpc2libGUpIHtcbiAgICB2YXIgcHJlemkgPSAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpO1xuICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgIC8vIFRyaWdnZXIgdGhlIHZpZGVvLnNlbGVjdGVkIGV2ZW50IHRvIGluZGljYXRlIGEgY2hhbmdlIGluIHRoZVxuICAgICAgICAvLyBsYXJnZSB2aWRlby5cbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInZpZGVvLnNlbGVjdGVkXCIsIFt0cnVlXSk7XG5cbiAgICAgICAgJCgnI2xhcmdlVmlkZW8nKS5mYWRlT3V0KDMwMCk7XG4gICAgICAgIHByZXppLmZhZGVJbigzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcHJlemkuY3NzKHtvcGFjaXR5OicxJ30pO1xuICAgICAgICAgICAgVG9vbGJhclRvZ2dsZXIuZG9ja1Rvb2xiYXIodHJ1ZSk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5zZXRMYXJnZVZpZGVvVmlzaWJsZShmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChwcmV6aS5jc3MoJ29wYWNpdHknKSA9PSAnMScpIHtcbiAgICAgICAgICAgIHByZXppLmZhZGVPdXQoMzAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJlemkuY3NzKHtvcGFjaXR5OicwJ30pO1xuICAgICAgICAgICAgICAgICQoJyNyZWxvYWRQcmVzZW50YXRpb24nKS5jc3Moe2Rpc3BsYXk6J25vbmUnfSk7XG4gICAgICAgICAgICAgICAgJCgnI2xhcmdlVmlkZW8nKS5mYWRlSW4oMzAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2V0TGFyZ2VWaWRlb1Zpc2libGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIFRvb2xiYXJUb2dnbGVyLmRvY2tUb29sYmFyKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIFByZXNlbnRhdGlvbiBoYXMgYmVlbiByZW1vdmVkLlxuICovXG4kKGRvY3VtZW50KS5iaW5kKCdwcmVzZW50YXRpb25yZW1vdmVkLm11YycsIHByZXNlbnRhdGlvblJlbW92ZWQpO1xuXG4vKipcbiAqIFByZXNlbnRhdGlvbiBoYXMgYmVlbiBhZGRlZC5cbiAqL1xuJChkb2N1bWVudCkuYmluZCgncHJlc2VudGF0aW9uYWRkZWQubXVjJywgcHJlc2VudGF0aW9uQWRkZWQpO1xuXG4vKlxuICogSW5kaWNhdGVzIHByZXNlbnRhdGlvbiBzbGlkZSBjaGFuZ2UuXG4gKi9cbiQoZG9jdW1lbnQpLmJpbmQoJ2dvdG9zbGlkZS5tdWMnLCBmdW5jdGlvbiAoZXZlbnQsIGppZCwgcHJlc1VybCwgY3VycmVudCkge1xuICAgIGlmIChwcmV6aVBsYXllciAmJiBwcmV6aVBsYXllci5nZXRDdXJyZW50U3RlcCgpICE9IGN1cnJlbnQpIHtcbiAgICAgICAgcHJlemlQbGF5ZXIuZmx5VG9TdGVwKGN1cnJlbnQpO1xuXG4gICAgICAgIHZhciBhbmltYXRpb25TdGVwc0FycmF5ID0gcHJlemlQbGF5ZXIuZ2V0QW5pbWF0aW9uQ291bnRPblN0ZXBzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyc2VJbnQoYW5pbWF0aW9uU3RlcHNBcnJheVtjdXJyZW50XSk7IGkrKykge1xuICAgICAgICAgICAgcHJlemlQbGF5ZXIuZmx5VG9TdGVwKGN1cnJlbnQsIGkpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogT24gdmlkZW8gc2VsZWN0ZWQgZXZlbnQuXG4gKi9cbiQoZG9jdW1lbnQpLmJpbmQoJ3ZpZGVvLnNlbGVjdGVkJywgZnVuY3Rpb24gKGV2ZW50LCBpc1ByZXNlbnRhdGlvbikge1xuICAgIGlmICghaXNQcmVzZW50YXRpb24gJiYgJCgnI3ByZXNlbnRhdGlvbj5pZnJhbWUnKSkge1xuICAgICAgICBzZXRQcmVzZW50YXRpb25WaXNpYmxlKGZhbHNlKTtcbiAgICB9XG59KTtcblxuJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgcmVzaXplKCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcmV6aTtcbiIsInZhciBDaGF0ID0gcmVxdWlyZShcIi4vY2hhdC9DaGF0XCIpO1xudmFyIENvbnRhY3RMaXN0ID0gcmVxdWlyZShcIi4vY29udGFjdGxpc3QvQ29udGFjdExpc3RcIik7XG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5ncy9TZXR0aW5nc1wiKTtcbnZhciBTZXR0aW5nc01lbnUgPSByZXF1aXJlKFwiLi9zZXR0aW5ncy9TZXR0aW5nc01lbnVcIik7XG52YXIgVmlkZW9MYXlvdXQgPSByZXF1aXJlKFwiLi4vdmlkZW9sYXlvdXQvVmlkZW9MYXlvdXRcIik7XG52YXIgVG9vbGJhclRvZ2dsZXIgPSByZXF1aXJlKFwiLi4vdG9vbGJhcnMvVG9vbGJhclRvZ2dsZXJcIik7XG52YXIgVUlVdGlsID0gcmVxdWlyZShcIi4uL3V0aWwvVUlVdGlsXCIpO1xuXG4vKipcbiAqIFRvZ2dsZXIgZm9yIHRoZSBjaGF0LCBjb250YWN0IGxpc3QsIHNldHRpbmdzIG1lbnUsIGV0Yy4uXG4gKi9cbnZhciBQYW5lbFRvZ2dsZXIgPSAoZnVuY3Rpb24obXkpIHtcblxuICAgIHZhciBjdXJyZW50bHlPcGVuID0gbnVsbDtcbiAgICB2YXIgYnV0dG9ucyA9IHtcbiAgICAgICAgJyNjaGF0c3BhY2UnOiAnI2NoYXRCb3R0b21CdXR0b24nLFxuICAgICAgICAnI2NvbnRhY3RsaXN0JzogJyNjb250YWN0TGlzdEJ1dHRvbicsXG4gICAgICAgICcjc2V0dGluZ3NtZW51JzogJyNzZXR0aW5nc0J1dHRvbidcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzaXplcyB0aGUgdmlkZW8gYXJlYVxuICAgICAqIEBwYXJhbSBpc0Nsb3Npbmcgd2hldGhlciB0aGUgc2lkZSBwYW5lbCBpcyBnb2luZyB0byBiZSBjbG9zZWQgb3IgaXMgZ29pbmcgdG8gb3BlbiAvIHJlbWFpbiBvcGVuZWRcbiAgICAgKiBAcGFyYW0gY29tcGxldGVGdW5jdGlvbiBhIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSB2aWRlbyBzcGFjZSBpcyByZXNpemVkXG4gICAgICovXG4gICAgdmFyIHJlc2l6ZVZpZGVvQXJlYSA9IGZ1bmN0aW9uKGlzQ2xvc2luZywgY29tcGxldGVGdW5jdGlvbikge1xuICAgICAgICB2YXIgdmlkZW9zcGFjZSA9ICQoJyN2aWRlb3NwYWNlJyk7XG5cbiAgICAgICAgdmFyIHBhbmVsU2l6ZSA9IGlzQ2xvc2luZyA/IFswLCAwXSA6IFBhbmVsVG9nZ2xlci5nZXRQYW5lbFNpemUoKTtcbiAgICAgICAgdmFyIHZpZGVvc3BhY2VXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gcGFuZWxTaXplWzBdO1xuICAgICAgICB2YXIgdmlkZW9zcGFjZUhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgdmFyIHZpZGVvU2l6ZVxuICAgICAgICAgICAgPSBWaWRlb0xheW91dC5nZXRWaWRlb1NpemUobnVsbCwgbnVsbCwgdmlkZW9zcGFjZVdpZHRoLCB2aWRlb3NwYWNlSGVpZ2h0KTtcbiAgICAgICAgdmFyIHZpZGVvV2lkdGggPSB2aWRlb1NpemVbMF07XG4gICAgICAgIHZhciB2aWRlb0hlaWdodCA9IHZpZGVvU2l6ZVsxXTtcbiAgICAgICAgdmFyIHZpZGVvUG9zaXRpb24gPSBWaWRlb0xheW91dC5nZXRWaWRlb1Bvc2l0aW9uKHZpZGVvV2lkdGgsXG4gICAgICAgICAgICB2aWRlb0hlaWdodCxcbiAgICAgICAgICAgIHZpZGVvc3BhY2VXaWR0aCxcbiAgICAgICAgICAgIHZpZGVvc3BhY2VIZWlnaHQpO1xuICAgICAgICB2YXIgaG9yaXpvbnRhbEluZGVudCA9IHZpZGVvUG9zaXRpb25bMF07XG4gICAgICAgIHZhciB2ZXJ0aWNhbEluZGVudCA9IHZpZGVvUG9zaXRpb25bMV07XG5cbiAgICAgICAgdmFyIHRodW1ibmFpbFNpemUgPSBWaWRlb0xheW91dC5jYWxjdWxhdGVUaHVtYm5haWxTaXplKHZpZGVvc3BhY2VXaWR0aCk7XG4gICAgICAgIHZhciB0aHVtYm5haWxzV2lkdGggPSB0aHVtYm5haWxTaXplWzBdO1xuICAgICAgICB2YXIgdGh1bWJuYWlsc0hlaWdodCA9IHRodW1ibmFpbFNpemVbMV07XG4gICAgICAgIC8vZm9yIGNoYXRcblxuICAgICAgICB2aWRlb3NwYWNlLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIHJpZ2h0OiBwYW5lbFNpemVbMF0sXG4gICAgICAgICAgICAgICAgd2lkdGg6IHZpZGVvc3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHZpZGVvc3BhY2VIZWlnaHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA1MDAsXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlRnVuY3Rpb25cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICQoJyNyZW1vdGVWaWRlb3MnKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRodW1ibmFpbHNIZWlnaHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA1MDBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICQoJyNyZW1vdGVWaWRlb3M+c3BhbicpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIGhlaWdodDogdGh1bWJuYWlsc0hlaWdodCxcbiAgICAgICAgICAgICAgICB3aWR0aDogdGh1bWJuYWlsc1dpZHRoXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBcInJlbW90ZXZpZGVvLnJlc2l6ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFt0aHVtYm5haWxzV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsc0hlaWdodF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHZpZGVvc3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHZpZGVvc3BhY2VIZWlnaHRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA1MDBcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICQoJyNsYXJnZVZpZGVvJykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHZpZGVvV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB2aWRlb0hlaWdodCxcbiAgICAgICAgICAgICAgICB0b3A6IHZlcnRpY2FsSW5kZW50LFxuICAgICAgICAgICAgICAgIGJvdHRvbTogdmVydGljYWxJbmRlbnQsXG4gICAgICAgICAgICAgICAgbGVmdDogaG9yaXpvbnRhbEluZGVudCxcbiAgICAgICAgICAgICAgICByaWdodDogaG9yaXpvbnRhbEluZGVudFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDUwMFxuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZXMgdGhlIHdpbmRvd3MgaW4gdGhlIHNpZGUgcGFuZWxcbiAgICAgKiBAcGFyYW0gb2JqZWN0IHRoZSB3aW5kb3cgdGhhdCBzaG91bGQgYmUgc2hvd25cbiAgICAgKiBAcGFyYW0gc2VsZWN0b3IgdGhlIHNlbGVjdG9yIGZvciB0aGUgZWxlbWVudCBjb250YWluaW5nIHRoZSBwYW5lbFxuICAgICAqIEBwYXJhbSBvbk9wZW5Db21wbGV0ZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgcGFuZWwgaXMgb3BlbmVkXG4gICAgICogQHBhcmFtIG9uT3BlbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaWYgdGhlIHdpbmRvdyBpcyBnb2luZyB0byBiZSBvcGVuZWRcbiAgICAgKiBAcGFyYW0gb25DbG9zZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgaWYgdGhlIHdpbmRvdyBpcyBnb2luZyB0byBiZSBjbG9zZWRcbiAgICAgKi9cbiAgICB2YXIgdG9nZ2xlID0gZnVuY3Rpb24ob2JqZWN0LCBzZWxlY3Rvciwgb25PcGVuQ29tcGxldGUsIG9uT3Blbiwgb25DbG9zZSkge1xuICAgICAgICBVSVV0aWwuYnV0dG9uQ2xpY2soYnV0dG9uc1tzZWxlY3Rvcl0sIFwiYWN0aXZlXCIpO1xuXG4gICAgICAgIGlmIChvYmplY3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICByaWdodDogJzVweCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHNlbGVjdG9yKS5oaWRlKFwic2xpZGVcIiwge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHR5cGVvZiBvbkNsb3NlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBvbkNsb3NlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJlbnRseU9wZW4gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVW5kb2NrIHRoZSB0b29sYmFyIHdoZW4gdGhlIGNoYXQgaXMgc2hvd24gYW5kIGlmIHdlJ3JlIGluIGFcbiAgICAgICAgICAgIC8vIHZpZGVvIG1vZGUuXG4gICAgICAgICAgICBpZiAoVmlkZW9MYXlvdXQuaXNMYXJnZVZpZGVvVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgVG9vbGJhclRvZ2dsZXIuZG9ja1Rvb2xiYXIoZmFsc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjdXJyZW50bHlPcGVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSAkKGN1cnJlbnRseU9wZW4pO1xuICAgICAgICAgICAgICAgIFVJVXRpbC5idXR0b25DbGljayhidXR0b25zW2N1cnJlbnRseU9wZW5dLCBcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50LmNzcygnei1pbmRleCcsIDQpO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50LmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuY3NzKCd6LWluZGV4JywgNSk7XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgJChcIiN0b2FzdC1jb250YWluZXJcIikuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0OiAoUGFuZWxUb2dnbGVyLmdldFBhbmVsU2l6ZSgpWzBdICsgNSkgKyAncHgnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDUwMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJChzZWxlY3Rvcikuc2hvdyhcInNsaWRlXCIsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwicmlnaHRcIixcbiAgICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDUwMCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogb25PcGVuQ29tcGxldGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYodHlwZW9mIG9uT3BlbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgb25PcGVuKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJlbnRseU9wZW4gPSBzZWxlY3RvcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyAvIGNsb3NlcyB0aGUgY2hhdCBhcmVhLlxuICAgICAqL1xuICAgIG15LnRvZ2dsZUNoYXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNoYXRDb21wbGV0ZUZ1bmN0aW9uID0gQ2hhdC5pc1Zpc2libGUoKSA/XG4gICAgICAgICAgICBmdW5jdGlvbigpIHt9IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgQ2hhdC5zY3JvbGxDaGF0VG9Cb3R0b20oKTtcbiAgICAgICAgICAgICQoJyNjaGF0c3BhY2UnKS50cmlnZ2VyKCdzaG93bicpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJlc2l6ZVZpZGVvQXJlYShDaGF0LmlzVmlzaWJsZSgpLCBjaGF0Q29tcGxldGVGdW5jdGlvbik7XG5cbiAgICAgICAgdG9nZ2xlKENoYXQsXG4gICAgICAgICAgICAnI2NoYXRzcGFjZScsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVxdWVzdCB0aGUgZm9jdXMgaW4gdGhlIG5pY2tuYW1lIGZpZWxkIG9yIHRoZSBjaGF0IGlucHV0IGZpZWxkLlxuICAgICAgICAgICAgICAgIGlmICgkKCcjbmlja25hbWUnKS5jc3MoJ3Zpc2liaWxpdHknKSA9PT0gJ3Zpc2libGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyNuaWNraW5wdXQnKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyN1c2VybXNnJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIENoYXQucmVzaXplQ2hhdCxcbiAgICAgICAgICAgIG51bGwpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyAvIGNsb3NlcyB0aGUgY29udGFjdCBsaXN0IGFyZWEuXG4gICAgICovXG4gICAgbXkudG9nZ2xlQ29udGFjdExpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb21wbGV0ZUZ1bmN0aW9uID0gQ29udGFjdExpc3QuaXNWaXNpYmxlKCkgP1xuICAgICAgICAgICAgZnVuY3Rpb24oKSB7fSA6IGZ1bmN0aW9uICgpIHsgJCgnI2NvbnRhY3RsaXN0JykudHJpZ2dlcignc2hvd24nKTt9O1xuICAgICAgICByZXNpemVWaWRlb0FyZWEoQ29udGFjdExpc3QuaXNWaXNpYmxlKCksIGNvbXBsZXRlRnVuY3Rpb24pO1xuXG4gICAgICAgIHRvZ2dsZShDb250YWN0TGlzdCxcbiAgICAgICAgICAgICcjY29udGFjdGxpc3QnLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIENvbnRhY3RMaXN0LnNldFZpc3VhbE5vdGlmaWNhdGlvbihmYWxzZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVsbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wZW5zIC8gY2xvc2VzIHRoZSBzZXR0aW5ncyBtZW51XG4gICAgICovXG4gICAgbXkudG9nZ2xlU2V0dGluZ3NNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc2l6ZVZpZGVvQXJlYShTZXR0aW5nc01lbnUuaXNWaXNpYmxlKCksIGZ1bmN0aW9uICgpe30pO1xuICAgICAgICB0b2dnbGUoU2V0dGluZ3NNZW51LFxuICAgICAgICAgICAgJyNzZXR0aW5nc21lbnUnLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzZXR0aW5ncyA9IFNldHRpbmdzLmdldFNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgJCgnI3NldERpc3BsYXlOYW1lJykuZ2V0KDApLnZhbHVlID0gc2V0dGluZ3MuZGlzcGxheU5hbWU7XG4gICAgICAgICAgICAgICAgJCgnI3NldEVtYWlsJykuZ2V0KDApLnZhbHVlID0gc2V0dGluZ3MuZW1haWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbnVsbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNpemUgb2YgdGhlIHNpZGUgcGFuZWwuXG4gICAgICovXG4gICAgbXkuZ2V0UGFuZWxTaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICB2YXIgYXZhaWxhYmxlV2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcblxuICAgICAgICB2YXIgcGFuZWxXaWR0aCA9IDIwMDtcbiAgICAgICAgaWYgKGF2YWlsYWJsZVdpZHRoICogMC4yIDwgMjAwKSB7XG4gICAgICAgICAgICBwYW5lbFdpZHRoID0gYXZhaWxhYmxlV2lkdGggKiAwLjI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3BhbmVsV2lkdGgsIGF2YWlsYWJsZUhlaWdodF07XG4gICAgfTtcblxuICAgIG15LmlzVmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gKENoYXQuaXNWaXNpYmxlKCkgfHwgQ29udGFjdExpc3QuaXNWaXNpYmxlKCkgfHwgU2V0dGluZ3NNZW51LmlzVmlzaWJsZSgpKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG15O1xuXG59KFBhbmVsVG9nZ2xlciB8fCB7fSkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsVG9nZ2xlcjsiLCIvKiBnbG9iYWwgJCwgVXRpbCwgbmlja25hbWU6dHJ1ZSwgc2hvd1Rvb2xiYXIgKi9cbnZhciBSZXBsYWNlbWVudCA9IHJlcXVpcmUoXCIuL1JlcGxhY2VtZW50XCIpO1xudmFyIENvbW1hbmRzUHJvY2Vzc29yID0gcmVxdWlyZShcIi4vQ29tbWFuZHNcIik7XG52YXIgVG9vbGJhclRvZ2dsZXIgPSByZXF1aXJlKFwiLi4vLi4vdG9vbGJhcnMvVG9vbGJhclRvZ2dsZXJcIik7XG52YXIgc21pbGV5cyA9IHJlcXVpcmUoXCIuL3NtaWxleXMuanNvblwiKS5zbWlsZXlzO1xuXG52YXIgbm90aWZpY2F0aW9uSW50ZXJ2YWwgPSBmYWxzZTtcbnZhciB1bnJlYWRNZXNzYWdlcyA9IDA7XG5cblxuLyoqXG4gKiBTaG93cy9oaWRlcyBhIHZpc3VhbCBub3RpZmljYXRpb24sIGluZGljYXRpbmcgdGhhdCBhIG1lc3NhZ2UgaGFzIGFycml2ZWQuXG4gKi9cbmZ1bmN0aW9uIHNldFZpc3VhbE5vdGlmaWNhdGlvbihzaG93KSB7XG4gICAgdmFyIHVucmVhZE1zZ0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndW5yZWFkTWVzc2FnZXMnKTtcbiAgICB2YXIgdW5yZWFkTXNnQm90dG9tRWxlbWVudFxuICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib3R0b21VbnJlYWRNZXNzYWdlcycpO1xuXG4gICAgdmFyIGdsb3dlciA9ICQoJyNjaGF0QnV0dG9uJyk7XG4gICAgdmFyIGJvdHRvbUdsb3dlciA9ICQoJyNjaGF0Qm90dG9tQnV0dG9uJyk7XG5cbiAgICBpZiAodW5yZWFkTWVzc2FnZXMpIHtcbiAgICAgICAgdW5yZWFkTXNnRWxlbWVudC5pbm5lckhUTUwgPSB1bnJlYWRNZXNzYWdlcy50b1N0cmluZygpO1xuICAgICAgICB1bnJlYWRNc2dCb3R0b21FbGVtZW50LmlubmVySFRNTCA9IHVucmVhZE1lc3NhZ2VzLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgVG9vbGJhclRvZ2dsZXIuZG9ja1Rvb2xiYXIodHJ1ZSk7XG5cbiAgICAgICAgdmFyIGNoYXRCdXR0b25FbGVtZW50XG4gICAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGF0QnV0dG9uJykucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGxlZnRJbmRlbnQgPSAoVXRpbC5nZXRUZXh0V2lkdGgoY2hhdEJ1dHRvbkVsZW1lbnQpIC1cbiAgICAgICAgICAgIFV0aWwuZ2V0VGV4dFdpZHRoKHVucmVhZE1zZ0VsZW1lbnQpKSAvIDI7XG4gICAgICAgIHZhciB0b3BJbmRlbnQgPSAoVXRpbC5nZXRUZXh0SGVpZ2h0KGNoYXRCdXR0b25FbGVtZW50KSAtXG4gICAgICAgICAgICBVdGlsLmdldFRleHRIZWlnaHQodW5yZWFkTXNnRWxlbWVudCkpIC8gMiAtIDM7XG5cbiAgICAgICAgdW5yZWFkTXNnRWxlbWVudC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgICd0b3A6JyArIHRvcEluZGVudCArXG4gICAgICAgICAgICAgICAgJzsgbGVmdDonICsgbGVmdEluZGVudCArICc7Jyk7XG5cbiAgICAgICAgdmFyIGNoYXRCb3R0b21CdXR0b25FbGVtZW50XG4gICAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGF0Qm90dG9tQnV0dG9uJykucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGJvdHRvbUxlZnRJbmRlbnQgPSAoVXRpbC5nZXRUZXh0V2lkdGgoY2hhdEJvdHRvbUJ1dHRvbkVsZW1lbnQpIC1cbiAgICAgICAgICAgIFV0aWwuZ2V0VGV4dFdpZHRoKHVucmVhZE1zZ0JvdHRvbUVsZW1lbnQpKSAvIDI7XG4gICAgICAgIHZhciBib3R0b21Ub3BJbmRlbnQgPSAoVXRpbC5nZXRUZXh0SGVpZ2h0KGNoYXRCb3R0b21CdXR0b25FbGVtZW50KSAtXG4gICAgICAgICAgICBVdGlsLmdldFRleHRIZWlnaHQodW5yZWFkTXNnQm90dG9tRWxlbWVudCkpIC8gMiAtIDI7XG5cbiAgICAgICAgdW5yZWFkTXNnQm90dG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnc3R5bGUnLFxuICAgICAgICAgICAgICAgICd0b3A6JyArIGJvdHRvbVRvcEluZGVudCArXG4gICAgICAgICAgICAgICAgJzsgbGVmdDonICsgYm90dG9tTGVmdEluZGVudCArICc7Jyk7XG5cblxuICAgICAgICBpZiAoIWdsb3dlci5oYXNDbGFzcygnaWNvbi1jaGF0LXNpbXBsZScpKSB7XG4gICAgICAgICAgICBnbG93ZXIucmVtb3ZlQ2xhc3MoJ2ljb24tY2hhdCcpO1xuICAgICAgICAgICAgZ2xvd2VyLmFkZENsYXNzKCdpY29uLWNoYXQtc2ltcGxlJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHVucmVhZE1zZ0VsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHVucmVhZE1zZ0JvdHRvbUVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGdsb3dlci5yZW1vdmVDbGFzcygnaWNvbi1jaGF0LXNpbXBsZScpO1xuICAgICAgICBnbG93ZXIuYWRkQ2xhc3MoJ2ljb24tY2hhdCcpO1xuICAgIH1cblxuICAgIGlmIChzaG93ICYmICFub3RpZmljYXRpb25JbnRlcnZhbCkge1xuICAgICAgICBub3RpZmljYXRpb25JbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnbG93ZXIudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYm90dG9tR2xvd2VyLnRvZ2dsZUNsYXNzKCdhY3RpdmUgZ2xvd2luZycpO1xuICAgICAgICB9LCA4MDApO1xuICAgIH1cbiAgICBlbHNlIGlmICghc2hvdyAmJiBub3RpZmljYXRpb25JbnRlcnZhbCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChub3RpZmljYXRpb25JbnRlcnZhbCk7XG4gICAgICAgIG5vdGlmaWNhdGlvbkludGVydmFsID0gZmFsc2U7XG4gICAgICAgIGdsb3dlci5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgIGJvdHRvbUdsb3dlci5yZW1vdmVDbGFzcygnZ2xvd2luZycpO1xuICAgICAgICBib3R0b21HbG93ZXIuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgIH1cbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgdGltZSBpbiB0aGUgZm9ybWF0IGl0IGlzIHNob3duIHRvIHRoZSB1c2VyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRDdXJyZW50VGltZSgpIHtcbiAgICB2YXIgbm93ICAgICA9IG5ldyBEYXRlKCk7XG4gICAgdmFyIGhvdXIgICAgPSBub3cuZ2V0SG91cnMoKTtcbiAgICB2YXIgbWludXRlICA9IG5vdy5nZXRNaW51dGVzKCk7XG4gICAgdmFyIHNlY29uZCAgPSBub3cuZ2V0U2Vjb25kcygpO1xuICAgIGlmKGhvdXIudG9TdHJpbmcoKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaG91ciA9ICcwJytob3VyO1xuICAgIH1cbiAgICBpZihtaW51dGUudG9TdHJpbmcoKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgbWludXRlID0gJzAnK21pbnV0ZTtcbiAgICB9XG4gICAgaWYoc2Vjb25kLnRvU3RyaW5nKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlY29uZCA9ICcwJytzZWNvbmQ7XG4gICAgfVxuICAgIHJldHVybiBob3VyKyc6JyttaW51dGUrJzonK3NlY29uZDtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlU21pbGV5cygpXG57XG4gICAgdmFyIHNtaWxleXMgPSAkKCcjc21pbGV5c0NvbnRhaW5lcicpO1xuICAgIGlmKCFzbWlsZXlzLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgIHNtaWxleXMuc2hvdyhcInNsaWRlXCIsIHsgZGlyZWN0aW9uOiBcImRvd25cIiwgZHVyYXRpb246IDMwMH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNtaWxleXMuaGlkZShcInNsaWRlXCIsIHsgZGlyZWN0aW9uOiBcImRvd25cIiwgZHVyYXRpb246IDMwMH0pO1xuICAgIH1cbiAgICAkKCcjdXNlcm1zZycpLmZvY3VzKCk7XG59XG5cbmZ1bmN0aW9uIGFkZENsaWNrRnVuY3Rpb24oc21pbGV5LCBudW1iZXIpIHtcbiAgICBzbWlsZXkub25jbGljayA9IGZ1bmN0aW9uIGFkZFNtaWxleVRvTWVzc2FnZSgpIHtcbiAgICAgICAgdmFyIHVzZXJtc2cgPSAkKCcjdXNlcm1zZycpO1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHVzZXJtc2cudmFsKCk7XG4gICAgICAgIG1lc3NhZ2UgKz0gc21pbGV5c1snc21pbGV5JyArIG51bWJlcl07XG4gICAgICAgIHVzZXJtc2cudmFsKG1lc3NhZ2UpO1xuICAgICAgICB1c2VybXNnLmdldCgwKS5zZXRTZWxlY3Rpb25SYW5nZShtZXNzYWdlLmxlbmd0aCwgbWVzc2FnZS5sZW5ndGgpO1xuICAgICAgICB0b2dnbGVTbWlsZXlzKCk7XG4gICAgICAgIHVzZXJtc2cuZm9jdXMoKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIEFkZHMgdGhlIHNtaWxleXMgY29udGFpbmVyIHRvIHRoZSBjaGF0XG4gKi9cbmZ1bmN0aW9uIGFkZFNtaWxleXMoKSB7XG4gICAgdmFyIHNtaWxleXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBzbWlsZXlzQ29udGFpbmVyLmlkID0gJ3NtaWxleXNDb250YWluZXInO1xuICAgIGZvcih2YXIgaSA9IDE7IGkgPD0gMjE7IGkrKykge1xuICAgICAgICB2YXIgc21pbGV5Q29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHNtaWxleUNvbnRhaW5lci5pZCA9ICdzbWlsZXknICsgaTtcbiAgICAgICAgc21pbGV5Q29udGFpbmVyLmNsYXNzTmFtZSA9ICdzbWlsZXlDb250YWluZXInO1xuICAgICAgICB2YXIgc21pbGV5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gICAgICAgIHNtaWxleS5zcmMgPSAnaW1hZ2VzL3NtaWxleXMvc21pbGV5JyArIGkgKyAnLnN2Zyc7XG4gICAgICAgIHNtaWxleS5jbGFzc05hbWUgPSAgJ3NtaWxleSc7XG4gICAgICAgIGFkZENsaWNrRnVuY3Rpb24oc21pbGV5LCBpKTtcbiAgICAgICAgc21pbGV5Q29udGFpbmVyLmFwcGVuZENoaWxkKHNtaWxleSk7XG4gICAgICAgIHNtaWxleXNDb250YWluZXIuYXBwZW5kQ2hpbGQoc21pbGV5Q29udGFpbmVyKTtcbiAgICB9XG5cbiAgICAkKFwiI2NoYXRzcGFjZVwiKS5hcHBlbmQoc21pbGV5c0NvbnRhaW5lcik7XG59XG5cbi8qKlxuICogUmVzaXplcyB0aGUgY2hhdCBjb252ZXJzYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHJlc2l6ZUNoYXRDb252ZXJzYXRpb24oKSB7XG4gICAgdmFyIG1zZ2FyZWFIZWlnaHQgPSAkKCcjdXNlcm1zZycpLm91dGVySGVpZ2h0KCk7XG4gICAgdmFyIGNoYXRzcGFjZSA9ICQoJyNjaGF0c3BhY2UnKTtcbiAgICB2YXIgd2lkdGggPSBjaGF0c3BhY2Uud2lkdGgoKTtcbiAgICB2YXIgY2hhdCA9ICQoJyNjaGF0Y29udmVyc2F0aW9uJyk7XG4gICAgdmFyIHNtaWxleXMgPSAkKCcjc21pbGV5c2FyZWEnKTtcblxuICAgIHNtaWxleXMuaGVpZ2h0KG1zZ2FyZWFIZWlnaHQpO1xuICAgICQoXCIjc21pbGV5c1wiKS5jc3MoJ2JvdHRvbScsIChtc2dhcmVhSGVpZ2h0IC0gMjYpIC8gMik7XG4gICAgJCgnI3NtaWxleXNDb250YWluZXInKS5jc3MoJ2JvdHRvbScsIG1zZ2FyZWFIZWlnaHQpO1xuICAgIGNoYXQud2lkdGgod2lkdGggLSAxMCk7XG4gICAgY2hhdC5oZWlnaHQod2luZG93LmlubmVySGVpZ2h0IC0gMTUgLSBtc2dhcmVhSGVpZ2h0KTtcbn1cblxuLyoqXG4gKiBDaGF0IHJlbGF0ZWQgdXNlciBpbnRlcmZhY2UuXG4gKi9cbnZhciBDaGF0ID0gKGZ1bmN0aW9uIChteSkge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIGNoYXQgcmVsYXRlZCBpbnRlcmZhY2UuXG4gICAgICovXG4gICAgbXkuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0b3JlZERpc3BsYXlOYW1lID0gd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZTtcbiAgICAgICAgaWYgKHN0b3JlZERpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICBuaWNrbmFtZSA9IHN0b3JlZERpc3BsYXlOYW1lO1xuXG4gICAgICAgICAgICBDaGF0LnNldENoYXRDb252ZXJzYXRpb25Nb2RlKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnI25pY2tpbnB1dCcpLmtleWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBVdGlsLmVzY2FwZUh0bWwodGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmICghbmlja25hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgbmlja25hbWUgPSB2YWw7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZGlzcGxheW5hbWUgPSBuaWNrbmFtZTtcblxuICAgICAgICAgICAgICAgICAgICB4bXBwLmFkZFRvUHJlc2VuY2UoXCJkaXNwbGF5TmFtZVwiLCBuaWNrbmFtZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgQ2hhdC5zZXRDaGF0Q29udmVyc2F0aW9uTW9kZSh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcjdXNlcm1zZycpLmtleWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgJCgnI3VzZXJtc2cnKS52YWwoJycpLnRyaWdnZXIoJ2F1dG9zaXplLnJlc2l6ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWFuZCA9IG5ldyBDb21tYW5kc1Byb2Nlc3Nvcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYoY29tbWFuZC5pc0NvbW1hbmQoKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQucHJvY2Vzc0NvbW1hbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBVdGlsLmVzY2FwZUh0bWwodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB4bXBwLnNlbmRDaGF0TWVzc2FnZShtZXNzYWdlLCBuaWNrbmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgb25UZXh0QXJlYVJlc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc2l6ZUNoYXRDb252ZXJzYXRpb24oKTtcbiAgICAgICAgICAgIENoYXQuc2Nyb2xsQ2hhdFRvQm90dG9tKCk7XG4gICAgICAgIH07XG4gICAgICAgICQoJyN1c2VybXNnJykuYXV0b3NpemUoe2NhbGxiYWNrOiBvblRleHRBcmVhUmVzaXplfSk7XG5cbiAgICAgICAgJChcIiNjaGF0c3BhY2VcIikuYmluZChcInNob3duXCIsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdW5yZWFkTWVzc2FnZXMgPSAwO1xuICAgICAgICAgICAgICAgIHNldFZpc3VhbE5vdGlmaWNhdGlvbihmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBhZGRTbWlsZXlzKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgdGhlIGdpdmVuIG1lc3NhZ2UgdG8gdGhlIGNoYXQgY29udmVyc2F0aW9uLlxuICAgICAqL1xuICAgIG15LnVwZGF0ZUNoYXRDb252ZXJzYXRpb24gPSBmdW5jdGlvbiAoZnJvbSwgZGlzcGxheU5hbWUsIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIGRpdkNsYXNzTmFtZSA9ICcnO1xuXG4gICAgICAgIGlmICh4bXBwLm15SmlkKCkgPT09IGZyb20pIHtcbiAgICAgICAgICAgIGRpdkNsYXNzTmFtZSA9IFwibG9jYWx1c2VyXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkaXZDbGFzc05hbWUgPSBcInJlbW90ZXVzZXJcIjtcblxuICAgICAgICAgICAgaWYgKCFDaGF0LmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgdW5yZWFkTWVzc2FnZXMrKztcbiAgICAgICAgICAgICAgICBVdGlsLnBsYXlTb3VuZE5vdGlmaWNhdGlvbignY2hhdE5vdGlmaWNhdGlvbicpO1xuICAgICAgICAgICAgICAgIHNldFZpc3VhbE5vdGlmaWNhdGlvbih0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlcGxhY2UgbGlua3MgYW5kIHNtaWxleXNcbiAgICAgICAgLy8gU3Ryb3BoZSBhbHJlYWR5IGVzY2FwZXMgc3BlY2lhbCBzeW1ib2xzIG9uIHNlbmRpbmcsXG4gICAgICAgIC8vIHNvIHdlIGVzY2FwZSBoZXJlIG9ubHkgdGFncyB0byBhdm9pZCBkb3VibGUgJmFtcDtcbiAgICAgICAgdmFyIGVzY01lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5cbiAgICAgICAgICAgIHJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC9cXG4vZywgJzxici8+Jyk7XG4gICAgICAgIHZhciBlc2NEaXNwbGF5TmFtZSA9IFV0aWwuZXNjYXBlSHRtbChkaXNwbGF5TmFtZSk7XG4gICAgICAgIG1lc3NhZ2UgPSBSZXBsYWNlbWVudC5wcm9jZXNzUmVwbGFjZW1lbnRzKGVzY01lc3NhZ2UpO1xuXG4gICAgICAgIHZhciBtZXNzYWdlQ29udGFpbmVyID1cbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY2hhdG1lc3NhZ2VcIj4nK1xuICAgICAgICAgICAgICAgICc8aW1nIHNyYz1cIi4uL2ltYWdlcy9jaGF0QXJyb3cuc3ZnXCIgY2xhc3M9XCJjaGF0QXJyb3dcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInVzZXJuYW1lICcgKyBkaXZDbGFzc05hbWUgKydcIj4nICsgZXNjRGlzcGxheU5hbWUgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICsgJzxkaXYgY2xhc3M9XCJ0aW1lc3RhbXBcIj4nICsgZ2V0Q3VycmVudFRpbWUoKSArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgKyAnPGRpdiBjbGFzcz1cInVzZXJtZXNzYWdlXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JztcblxuICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpLmFwcGVuZChtZXNzYWdlQ29udGFpbmVyKTtcbiAgICAgICAgJCgnI2NoYXRjb252ZXJzYXRpb24nKS5hbmltYXRlKFxuICAgICAgICAgICAgICAgIHsgc2Nyb2xsVG9wOiAkKCcjY2hhdGNvbnZlcnNhdGlvbicpWzBdLnNjcm9sbEhlaWdodH0sIDEwMDApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIGVycm9yIG1lc3NhZ2UgdG8gdGhlIGNvbnZlcnNhdGlvblxuICAgICAqIEBwYXJhbSBlcnJvck1lc3NhZ2UgdGhlIHJlY2VpdmVkIGVycm9yIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIG9yaWdpbmFsVGV4dCB0aGUgb3JpZ2luYWwgbWVzc2FnZS5cbiAgICAgKi9cbiAgICBteS5jaGF0QWRkRXJyb3IgPSBmdW5jdGlvbihlcnJvck1lc3NhZ2UsIG9yaWdpbmFsVGV4dClcbiAgICB7XG4gICAgICAgIGVycm9yTWVzc2FnZSA9IFV0aWwuZXNjYXBlSHRtbChlcnJvck1lc3NhZ2UpO1xuICAgICAgICBvcmlnaW5hbFRleHQgPSBVdGlsLmVzY2FwZUh0bWwob3JpZ2luYWxUZXh0KTtcblxuICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpLmFwcGVuZChcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZXJyb3JNZXNzYWdlXCI+PGI+RXJyb3I6IDwvYj4nICsgJ1lvdXIgbWVzc2FnZScgK1xuICAgICAgICAgICAgKG9yaWdpbmFsVGV4dD8gKCcgXFxcIicrIG9yaWdpbmFsVGV4dCArICdcXFwiJykgOiBcIlwiKSArXG4gICAgICAgICAgICAnIHdhcyBub3Qgc2VudC4nICtcbiAgICAgICAgICAgIChlcnJvck1lc3NhZ2U/ICgnIFJlYXNvbjogJyArIGVycm9yTWVzc2FnZSkgOiAnJykgKyAgJzwvZGl2PicpO1xuICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpLmFuaW1hdGUoXG4gICAgICAgICAgICB7IHNjcm9sbFRvcDogJCgnI2NoYXRjb252ZXJzYXRpb24nKVswXS5zY3JvbGxIZWlnaHR9LCAxMDAwKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgc3ViamVjdCB0byB0aGUgVUlcbiAgICAgKiBAcGFyYW0gc3ViamVjdCB0aGUgc3ViamVjdFxuICAgICAqL1xuICAgIG15LmNoYXRTZXRTdWJqZWN0ID0gZnVuY3Rpb24oc3ViamVjdClcbiAgICB7XG4gICAgICAgIGlmKHN1YmplY3QpXG4gICAgICAgICAgICBzdWJqZWN0ID0gc3ViamVjdC50cmltKCk7XG4gICAgICAgICQoJyNzdWJqZWN0JykuaHRtbChSZXBsYWNlbWVudC5saW5raWZ5KFV0aWwuZXNjYXBlSHRtbChzdWJqZWN0KSkpO1xuICAgICAgICBpZihzdWJqZWN0ID09PSBcIlwiKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKFwiI3N1YmplY3RcIikuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgJChcIiNzdWJqZWN0XCIpLmNzcyh7ZGlzcGxheTogXCJibG9ja1wifSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGNoYXQgY29udmVyc2F0aW9uIG1vZGUuXG4gICAgICovXG4gICAgbXkuc2V0Q2hhdENvbnZlcnNhdGlvbk1vZGUgPSBmdW5jdGlvbiAoaXNDb252ZXJzYXRpb25Nb2RlKSB7XG4gICAgICAgIGlmIChpc0NvbnZlcnNhdGlvbk1vZGUpIHtcbiAgICAgICAgICAgICQoJyNuaWNrbmFtZScpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcbiAgICAgICAgICAgICQoJyNjaGF0Y29udmVyc2F0aW9uJykuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcbiAgICAgICAgICAgICQoJyN1c2VybXNnJykuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcbiAgICAgICAgICAgICQoJyNzbWlsZXlzYXJlYScpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG4gICAgICAgICAgICAkKCcjdXNlcm1zZycpLmZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVzaXplcyB0aGUgY2hhdCBhcmVhLlxuICAgICAqL1xuICAgIG15LnJlc2l6ZUNoYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjaGF0U2l6ZSA9IHJlcXVpcmUoXCIuLi9TaWRlUGFuZWxUb2dnbGVyXCIpLmdldFBhbmVsU2l6ZSgpO1xuXG4gICAgICAgICQoJyNjaGF0c3BhY2UnKS53aWR0aChjaGF0U2l6ZVswXSk7XG4gICAgICAgICQoJyNjaGF0c3BhY2UnKS5oZWlnaHQoY2hhdFNpemVbMV0pO1xuXG4gICAgICAgIHJlc2l6ZUNoYXRDb252ZXJzYXRpb24oKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSW5kaWNhdGVzIGlmIHRoZSBjaGF0IGlzIGN1cnJlbnRseSB2aXNpYmxlLlxuICAgICAqL1xuICAgIG15LmlzVmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICQoJyNjaGF0c3BhY2UnKS5pcyhcIjp2aXNpYmxlXCIpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogU2hvd3MgYW5kIGhpZGVzIHRoZSB3aW5kb3cgd2l0aCB0aGUgc21pbGV5c1xuICAgICAqL1xuICAgIG15LnRvZ2dsZVNtaWxleXMgPSB0b2dnbGVTbWlsZXlzO1xuXG4gICAgLyoqXG4gICAgICogU2Nyb2xscyBjaGF0IHRvIHRoZSBib3R0b20uXG4gICAgICovXG4gICAgbXkuc2Nyb2xsQ2hhdFRvQm90dG9tID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnI2NoYXRjb252ZXJzYXRpb24nKS5zY3JvbGxUb3AoXG4gICAgICAgICAgICAgICAgJCgnI2NoYXRjb252ZXJzYXRpb24nKVswXS5zY3JvbGxIZWlnaHQpO1xuICAgICAgICB9LCA1KTtcbiAgICB9O1xuXG5cbiAgICByZXR1cm4gbXk7XG59KENoYXQgfHwge30pKTtcbm1vZHVsZS5leHBvcnRzID0gQ2hhdDsiLCIvKipcbiAqIExpc3Qgd2l0aCBzdXBwb3J0ZWQgY29tbWFuZHMuIFRoZSBrZXlzIGFyZSB0aGUgbmFtZXMgb2YgdGhlIGNvbW1hbmRzIGFuZFxuICogdGhlIHZhbHVlIGlzIHRoZSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyB0aGUgbWVzc2FnZS5cbiAqIEB0eXBlIHt7U3RyaW5nOiBmdW5jdGlvbn19XG4gKi9cbnZhciBjb21tYW5kcyA9IHtcbiAgICBcInRvcGljXCIgOiBwcm9jZXNzVG9waWNcbn07XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIGNvbW1hbmQgZnJvbSB0aGUgbWVzc2FnZS5cbiAqIEBwYXJhbSBtZXNzYWdlIHRoZSByZWNlaXZlZCBtZXNzYWdlXG4gKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgY29tbWFuZFxuICovXG5mdW5jdGlvbiBnZXRDb21tYW5kKG1lc3NhZ2UpXG57XG4gICAgaWYobWVzc2FnZSlcbiAgICB7XG4gICAgICAgIGZvcih2YXIgY29tbWFuZCBpbiBjb21tYW5kcylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYobWVzc2FnZS5pbmRleE9mKFwiL1wiICsgY29tbWFuZCkgPT0gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gY29tbWFuZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gXCJcIjtcbn07XG5cbi8qKlxuICogUHJvY2Vzc2VzIHRoZSBkYXRhIGZvciB0b3BpYyBjb21tYW5kLlxuICogQHBhcmFtIGNvbW1hbmRBcmd1bWVudHMgdGhlIGFyZ3VtZW50cyBvZiB0aGUgdG9waWMgY29tbWFuZC5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1RvcGljKGNvbW1hbmRBcmd1bWVudHMpXG57XG4gICAgdmFyIHRvcGljID0gVXRpbC5lc2NhcGVIdG1sKGNvbW1hbmRBcmd1bWVudHMpO1xuICAgIHhtcHAuc2V0U3ViamVjdCh0b3BpYyk7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBuZXcgQ29tbWFuZFByb2NjZXNzb3IgaW5zdGFuY2UgZnJvbSBhIG1lc3NhZ2UgdGhhdFxuICogaGFuZGxlcyBjb21tYW5kcyByZWNlaXZlZCB2aWEgY2hhdCBtZXNzYWdlcy5cbiAqIEBwYXJhbSBtZXNzYWdlIHRoZSBtZXNzYWdlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29tbWFuZHNQcm9jZXNzb3IobWVzc2FnZSlcbntcblxuXG4gICAgdmFyIGNvbW1hbmQgPSBnZXRDb21tYW5kKG1lc3NhZ2UpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbmFtZSBvZiB0aGUgY29tbWFuZC5cbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSB0aGUgY29tbWFuZFxuICAgICAqL1xuICAgIHRoaXMuZ2V0Q29tbWFuZCA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHJldHVybiBjb21tYW5kO1xuICAgIH07XG5cblxuICAgIHZhciBtZXNzYWdlQXJndW1lbnQgPSBtZXNzYWdlLnN1YnN0cihjb21tYW5kLmxlbmd0aCArIDIpO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYXJndW1lbnRzIG9mIHRoZSBjb21tYW5kLlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5nZXRBcmd1bWVudCA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHJldHVybiBtZXNzYWdlQXJndW1lbnQ7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGlzIGluc3RhbmNlIGlzIHZhbGlkIGNvbW1hbmQgb3Igbm90LlxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkNvbW1hbmRzUHJvY2Vzc29yLnByb3RvdHlwZS5pc0NvbW1hbmQgPSBmdW5jdGlvbigpXG57XG4gICAgaWYodGhpcy5nZXRDb21tYW5kKCkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUHJvY2Vzc2VzIHRoZSBjb21tYW5kLlxuICovXG5Db21tYW5kc1Byb2Nlc3Nvci5wcm90b3R5cGUucHJvY2Vzc0NvbW1hbmQgPSBmdW5jdGlvbigpXG57XG4gICAgaWYoIXRoaXMuaXNDb21tYW5kKCkpXG4gICAgICAgIHJldHVybjtcblxuICAgIGNvbW1hbmRzW3RoaXMuZ2V0Q29tbWFuZCgpXSh0aGlzLmdldEFyZ3VtZW50KCkpO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbW1hbmRzUHJvY2Vzc29yOyIsInZhciBTbWlsZXlzID0gcmVxdWlyZShcIi4vc21pbGV5cy5qc29uXCIpO1xuLyoqXG4gKiBQcm9jZXNzZXMgbGlua3MgYW5kIHNtaWxleXMgaW4gXCJib2R5XCJcbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1JlcGxhY2VtZW50cyhib2R5KVxue1xuICAgIC8vbWFrZSBsaW5rcyBjbGlja2FibGVcbiAgICBib2R5ID0gbGlua2lmeShib2R5KTtcblxuICAgIC8vYWRkIHNtaWxleXNcbiAgICBib2R5ID0gc21pbGlmeShib2R5KTtcblxuICAgIHJldHVybiBib2R5O1xufVxuXG4vKipcbiAqIEZpbmRzIGFuZCByZXBsYWNlcyBhbGwgbGlua3MgaW4gdGhlIGxpbmtzIGluIFwiYm9keVwiXG4gKiB3aXRoIHRoZWlyIDxhIGhyZWY9XCJcIj48L2E+XG4gKi9cbmZ1bmN0aW9uIGxpbmtpZnkoaW5wdXRUZXh0KVxue1xuICAgIHZhciByZXBsYWNlZFRleHQsIHJlcGxhY2VQYXR0ZXJuMSwgcmVwbGFjZVBhdHRlcm4yLCByZXBsYWNlUGF0dGVybjM7XG5cbiAgICAvL1VSTHMgc3RhcnRpbmcgd2l0aCBodHRwOi8vLCBodHRwczovLywgb3IgZnRwOi8vXG4gICAgcmVwbGFjZVBhdHRlcm4xID0gLyhcXGIoaHR0cHM/fGZ0cCk6XFwvXFwvWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvZ2ltO1xuICAgIHJlcGxhY2VkVGV4dCA9IGlucHV0VGV4dC5yZXBsYWNlKHJlcGxhY2VQYXR0ZXJuMSwgJzxhIGhyZWY9XCIkMVwiIHRhcmdldD1cIl9ibGFua1wiPiQxPC9hPicpO1xuXG4gICAgLy9VUkxzIHN0YXJ0aW5nIHdpdGggXCJ3d3cuXCIgKHdpdGhvdXQgLy8gYmVmb3JlIGl0LCBvciBpdCdkIHJlLWxpbmsgdGhlIG9uZXMgZG9uZSBhYm92ZSkuXG4gICAgcmVwbGFjZVBhdHRlcm4yID0gLyhefFteXFwvXSkod3d3XFwuW1xcU10rKFxcYnwkKSkvZ2ltO1xuICAgIHJlcGxhY2VkVGV4dCA9IHJlcGxhY2VkVGV4dC5yZXBsYWNlKHJlcGxhY2VQYXR0ZXJuMiwgJyQxPGEgaHJlZj1cImh0dHA6Ly8kMlwiIHRhcmdldD1cIl9ibGFua1wiPiQyPC9hPicpO1xuXG4gICAgLy9DaGFuZ2UgZW1haWwgYWRkcmVzc2VzIHRvIG1haWx0bzo6IGxpbmtzLlxuICAgIHJlcGxhY2VQYXR0ZXJuMyA9IC8oKFthLXpBLVowLTlcXC1cXF9cXC5dKStAW2EtekEtWlxcX10rPyhcXC5bYS16QS1aXXsyLDZ9KSspL2dpbTtcbiAgICByZXBsYWNlZFRleHQgPSByZXBsYWNlZFRleHQucmVwbGFjZShyZXBsYWNlUGF0dGVybjMsICc8YSBocmVmPVwibWFpbHRvOiQxXCI+JDE8L2E+Jyk7XG5cbiAgICByZXR1cm4gcmVwbGFjZWRUZXh0O1xufVxuXG4vKipcbiAqIFJlcGxhY2VzIGNvbW1vbiBzbWlsZXkgc3RyaW5ncyB3aXRoIGltYWdlc1xuICovXG5mdW5jdGlvbiBzbWlsaWZ5KGJvZHkpXG57XG4gICAgaWYoIWJvZHkpIHtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuXG4gICAgdmFyIHJlZ2V4cyA9IFNtaWxleXNbXCJyZWdleHNcIl07XG4gICAgZm9yKHZhciBzbWlsZXkgaW4gcmVnZXhzKSB7XG4gICAgICAgIGlmKHJlZ2V4cy5oYXNPd25Qcm9wZXJ0eShzbWlsZXkpKSB7XG4gICAgICAgICAgICBib2R5ID0gYm9keS5yZXBsYWNlKHJlZ2V4c1tzbWlsZXldLFxuICAgICAgICAgICAgICAgICAgICAnPGltZyBjbGFzcz1cInNtaWxleVwiIHNyYz1cImltYWdlcy9zbWlsZXlzLycgKyBzbWlsZXkgKyAnLnN2Z1wiPicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGJvZHk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHByb2Nlc3NSZXBsYWNlbWVudHM6IHByb2Nlc3NSZXBsYWNlbWVudHMsXG4gICAgbGlua2lmeTogbGlua2lmeVxufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcInNtaWxleXNcIjoge1xuICAgICAgICBcInNtaWxleTFcIjogXCI6KVwiLFxuICAgICAgICBcInNtaWxleTJcIjogXCI6KFwiLFxuICAgICAgICBcInNtaWxleTNcIjogXCI6RFwiLFxuICAgICAgICBcInNtaWxleTRcIjogXCIoeSlcIixcbiAgICAgICAgXCJzbWlsZXk1XCI6IFwiIDpQXCIsXG4gICAgICAgIFwic21pbGV5NlwiOiBcIih3YXZlKVwiLFxuICAgICAgICBcInNtaWxleTdcIjogXCIoYmx1c2gpXCIsXG4gICAgICAgIFwic21pbGV5OFwiOiBcIihjaHVja2xlKVwiLFxuICAgICAgICBcInNtaWxleTlcIjogXCIoc2hvY2tlZClcIixcbiAgICAgICAgXCJzbWlsZXkxMFwiOiBcIjoqXCIsXG4gICAgICAgIFwic21pbGV5MTFcIjogXCIobilcIixcbiAgICAgICAgXCJzbWlsZXkxMlwiOiBcIihzZWFyY2gpXCIsXG4gICAgICAgIFwic21pbGV5MTNcIjogXCIgPDNcIixcbiAgICAgICAgXCJzbWlsZXkxNFwiOiBcIihvb3BzKVwiLFxuICAgICAgICBcInNtaWxleTE1XCI6IFwiKGFuZ3J5KVwiLFxuICAgICAgICBcInNtaWxleTE2XCI6IFwiKGFuZ2VsKVwiLFxuICAgICAgICBcInNtaWxleTE3XCI6IFwiKHNpY2spXCIsXG4gICAgICAgIFwic21pbGV5MThcIjogXCI7KFwiLFxuICAgICAgICBcInNtaWxleTE5XCI6IFwiKGJvbWIpXCIsXG4gICAgICAgIFwic21pbGV5MjBcIjogXCIoY2xhcClcIixcbiAgICAgICAgXCJzbWlsZXkyMVwiOiBcIiA7KVwiXG4gICAgfSxcbiAgICBcInJlZ2V4c1wiOiB7XG4gICAgICAgIFwic21pbGV5MlwiOiAvKDotXFwoXFwofDotXFwofDpcXChcXCh8OlxcKHxcXChzYWRcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTNcIjogLyg6LVxcKVxcKXw6XFwpXFwpfFxcKGxvbFxcKXw6LUR8OkQpL2dpLFxuICAgICAgICBcInNtaWxleTFcIjogLyg6LVxcKXw6XFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXk0XCI6IC8oXFwoeVxcKXxcXChZXFwpfFxcKG9rXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXk1XCI6IC8oOi1QfDpQfDotcHw6cCkvZ2ksXG4gICAgICAgIFwic21pbGV5NlwiOiAvKFxcKHdhdmVcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTdcIjogLyhcXChibHVzaFxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5OFwiOiAvKFxcKGNodWNrbGVcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTlcIjogLyg6LTB8XFwoc2hvY2tlZFxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTBcIjogLyg6LVxcKnw6XFwqfFxcKGtpc3NcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTExXCI6IC8oXFwoblxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTJcIjogLyhcXChzZWFyY2hcXCkpL2csXG4gICAgICAgIFwic21pbGV5MTNcIjogLyg8M3wmbHQ7M3wmYW1wO2x0OzN8XFwoTFxcKXxcXChsXFwpfFxcKEhcXCl8XFwoaFxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTRcIjogLyhcXChvb3BzXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkxNVwiOiAvKFxcKGFuZ3J5XFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkxNlwiOiAvKFxcKGFuZ2VsXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkxN1wiOiAvKFxcKHNpY2tcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTE4XCI6IC8oOy1cXChcXCh8O1xcKFxcKHw7LVxcKHw7XFwofDpcIlxcKHw6XCItXFwofDp+LVxcKHw6flxcKHxcXCh1cHNldFxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTlcIjogLyhcXChib21iXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkyMFwiOiAvKFxcKGNsYXBcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTIxXCI6IC8oOy1cXCl8O1xcKXw7LVxcKVxcKXw7XFwpXFwpfDstRHw7RHxcXCh3aW5rXFwpKS9naVxuICAgIH1cbn1cbiIsIlxudmFyIG51bWJlck9mQ29udGFjdHMgPSAwO1xudmFyIG5vdGlmaWNhdGlvbkludGVydmFsO1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIG51bWJlciBvZiBwYXJ0aWNpcGFudHMgaW4gdGhlIGNvbnRhY3QgbGlzdCBidXR0b24gYW5kIHNldHNcbiAqIHRoZSBnbG93XG4gKiBAcGFyYW0gZGVsdGEgaW5kaWNhdGVzIHdoZXRoZXIgYSBuZXcgdXNlciBoYXMgam9pbmVkICgxKSBvciBzb21lb25lIGhhc1xuICogbGVmdCgtMSlcbiAqL1xuZnVuY3Rpb24gdXBkYXRlTnVtYmVyT2ZQYXJ0aWNpcGFudHMoZGVsdGEpIHtcbiAgICAvL3doZW4gdGhlIHVzZXIgaXMgYWxvbmUgd2UgZG9uJ3Qgc2hvdyB0aGUgbnVtYmVyIG9mIHBhcnRpY2lwYW50c1xuICAgIGlmKG51bWJlck9mQ29udGFjdHMgPT09IDApIHtcbiAgICAgICAgJChcIiNudW1iZXJPZlBhcnRpY2lwYW50c1wiKS50ZXh0KCcnKTtcbiAgICAgICAgbnVtYmVyT2ZDb250YWN0cyArPSBkZWx0YTtcbiAgICB9IGVsc2UgaWYobnVtYmVyT2ZDb250YWN0cyAhPT0gMCAmJiAhQ29udGFjdExpc3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgQ29udGFjdExpc3Quc2V0VmlzdWFsTm90aWZpY2F0aW9uKHRydWUpO1xuICAgICAgICBudW1iZXJPZkNvbnRhY3RzICs9IGRlbHRhO1xuICAgICAgICAkKFwiI251bWJlck9mUGFydGljaXBhbnRzXCIpLnRleHQobnVtYmVyT2ZDb250YWN0cyk7XG4gICAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGF2YXRhciBlbGVtZW50LlxuICpcbiAqIEByZXR1cm4gdGhlIG5ld2x5IGNyZWF0ZWQgYXZhdGFyIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQXZhdGFyKGlkKSB7XG4gICAgdmFyIGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgIGF2YXRhci5jbGFzc05hbWUgPSBcImljb24tYXZhdGFyIGF2YXRhclwiO1xuICAgIGF2YXRhci5zcmMgPSBcImh0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvXCIgKyBpZCArIFwiP2Q9d2F2YXRhciZzaXplPTMwXCI7XG5cbiAgICByZXR1cm4gYXZhdGFyO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGRpc3BsYXkgbmFtZSBwYXJhZ3JhcGguXG4gKlxuICogQHBhcmFtIGRpc3BsYXlOYW1lIHRoZSBkaXNwbGF5IG5hbWUgdG8gc2V0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpc3BsYXlOYW1lUGFyYWdyYXBoKGRpc3BsYXlOYW1lKSB7XG4gICAgdmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgcC5pbm5lclRleHQgPSBkaXNwbGF5TmFtZTtcblxuICAgIHJldHVybiBwO1xufVxuXG5cbmZ1bmN0aW9uIHN0b3BHbG93aW5nKGdsb3dlcikge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKG5vdGlmaWNhdGlvbkludGVydmFsKTtcbiAgICBub3RpZmljYXRpb25JbnRlcnZhbCA9IGZhbHNlO1xuICAgIGdsb3dlci5yZW1vdmVDbGFzcygnZ2xvd2luZycpO1xuICAgIGlmICghQ29udGFjdExpc3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgZ2xvd2VyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBDb250YWN0IGxpc3QuXG4gKi9cbnZhciBDb250YWN0TGlzdCA9IHtcbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNoYXQgaXMgY3VycmVudGx5IHZpc2libGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIDx0dD50cnVlPC90dD4gaWYgdGhlIGNoYXQgaXMgY3VycmVudGx5IHZpc2libGUsIDx0dD5mYWxzZTwvdHQ+IC1cbiAgICAgKiBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBpc1Zpc2libGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICQoJyNjb250YWN0bGlzdCcpLmlzKFwiOnZpc2libGVcIik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBjb250YWN0IGZvciB0aGUgZ2l2ZW4gcGVlckppZCBpZiBzdWNoIGRvZXNuJ3QgeWV0IGV4aXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlZXJKaWQgdGhlIHBlZXJKaWQgY29ycmVzcG9uZGluZyB0byB0aGUgY29udGFjdFxuICAgICAqIEBwYXJhbSBpZCB0aGUgdXNlcidzIGVtYWlsIG9yIHVzZXJJZCB1c2VkIHRvIGdldCB0aGUgdXNlcidzIGF2YXRhclxuICAgICAqL1xuICAgIGVuc3VyZUFkZENvbnRhY3Q6IGZ1bmN0aW9uIChwZWVySmlkLCBpZCkge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKTtcblxuICAgICAgICB2YXIgY29udGFjdCA9ICQoJyNjb250YWN0bGlzdD51bD5saVtpZD1cIicgKyByZXNvdXJjZUppZCArICdcIl0nKTtcblxuICAgICAgICBpZiAoIWNvbnRhY3QgfHwgY29udGFjdC5sZW5ndGggPD0gMClcbiAgICAgICAgICAgIENvbnRhY3RMaXN0LmFkZENvbnRhY3QocGVlckppZCwgaWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgY29udGFjdCBmb3IgdGhlIGdpdmVuIHBlZXIgamlkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlZXJKaWQgdGhlIGppZCBvZiB0aGUgY29udGFjdCB0byBhZGRcbiAgICAgKiBAcGFyYW0gaWQgdGhlIGVtYWlsIG9yIHVzZXJJZCBvZiB0aGUgdXNlclxuICAgICAqL1xuICAgIGFkZENvbnRhY3Q6IGZ1bmN0aW9uIChwZWVySmlkLCBpZCkge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKTtcblxuICAgICAgICB2YXIgY29udGFjdGxpc3QgPSAkKCcjY29udGFjdGxpc3Q+dWwnKTtcblxuICAgICAgICB2YXIgbmV3Q29udGFjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIG5ld0NvbnRhY3QuaWQgPSByZXNvdXJjZUppZDtcbiAgICAgICAgbmV3Q29udGFjdC5jbGFzc05hbWUgPSBcImNsaWNrYWJsZVwiO1xuICAgICAgICBuZXdDb250YWN0Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZSA9PT0gXCJjbGlja2FibGVcIikge1xuICAgICAgICAgICAgICAgICQoQ29udGFjdExpc3QpLnRyaWdnZXIoJ2NvbnRhY3RjbGlja2VkJywgW3BlZXJKaWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBuZXdDb250YWN0LmFwcGVuZENoaWxkKGNyZWF0ZUF2YXRhcihpZCkpO1xuICAgICAgICBuZXdDb250YWN0LmFwcGVuZENoaWxkKGNyZWF0ZURpc3BsYXlOYW1lUGFyYWdyYXBoKFwiUGFydGljaXBhbnRcIikpO1xuXG4gICAgICAgIHZhciBjbEVsZW1lbnQgPSBjb250YWN0bGlzdC5nZXQoMCk7XG5cbiAgICAgICAgaWYgKHJlc291cmNlSmlkID09PSB4bXBwLm15UmVzb3VyY2UoKVxuICAgICAgICAgICAgJiYgJCgnI2NvbnRhY3RsaXN0PnVsIC50aXRsZScpWzBdLm5leHRTaWJsaW5nLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBjbEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5ld0NvbnRhY3QsXG4gICAgICAgICAgICAgICAgJCgnI2NvbnRhY3RsaXN0PnVsIC50aXRsZScpWzBdLm5leHRTaWJsaW5nLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsRWxlbWVudC5hcHBlbmRDaGlsZChuZXdDb250YWN0KTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVOdW1iZXJPZlBhcnRpY2lwYW50cygxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIGNvbnRhY3QgZm9yIHRoZSBnaXZlbiBwZWVyIGppZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwZWVySmlkIHRoZSBwZWVySmlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNvbnRhY3QgdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlQ29udGFjdDogZnVuY3Rpb24gKHBlZXJKaWQpIHtcbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCk7XG5cbiAgICAgICAgdmFyIGNvbnRhY3QgPSAkKCcjY29udGFjdGxpc3Q+dWw+bGlbaWQ9XCInICsgcmVzb3VyY2VKaWQgKyAnXCJdJyk7XG5cbiAgICAgICAgaWYgKGNvbnRhY3QgJiYgY29udGFjdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgY29udGFjdGxpc3QgPSAkKCcjY29udGFjdGxpc3Q+dWwnKTtcblxuICAgICAgICAgICAgY29udGFjdGxpc3QuZ2V0KDApLnJlbW92ZUNoaWxkKGNvbnRhY3QuZ2V0KDApKTtcblxuICAgICAgICAgICAgdXBkYXRlTnVtYmVyT2ZQYXJ0aWNpcGFudHMoLTEpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFZpc3VhbE5vdGlmaWNhdGlvbjogZnVuY3Rpb24gKHNob3csIHN0b3BHbG93aW5nSW4pIHtcbiAgICAgICAgdmFyIGdsb3dlciA9ICQoJyNjb250YWN0TGlzdEJ1dHRvbicpO1xuXG4gICAgICAgIGlmIChzaG93ICYmICFub3RpZmljYXRpb25JbnRlcnZhbCkge1xuICAgICAgICAgICAgbm90aWZpY2F0aW9uSW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGdsb3dlci50b2dnbGVDbGFzcygnYWN0aXZlIGdsb3dpbmcnKTtcbiAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXNob3cgJiYgbm90aWZpY2F0aW9uSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHN0b3BHbG93aW5nKGdsb3dlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BHbG93aW5nSW4pIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN0b3BHbG93aW5nKGdsb3dlcik7XG4gICAgICAgICAgICB9LCBzdG9wR2xvd2luZ0luKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRDbGlja2FibGU6IGZ1bmN0aW9uIChyZXNvdXJjZUppZCwgaXNDbGlja2FibGUpIHtcbiAgICAgICAgdmFyIGNvbnRhY3QgPSAkKCcjY29udGFjdGxpc3Q+dWw+bGlbaWQ9XCInICsgcmVzb3VyY2VKaWQgKyAnXCJdJyk7XG4gICAgICAgIGlmIChpc0NsaWNrYWJsZSkge1xuICAgICAgICAgICAgY29udGFjdC5hZGRDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250YWN0LnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkRpc3BsYXlOYW1lQ2hhbmdlOiBmdW5jdGlvbiAocGVlckppZCwgZGlzcGxheU5hbWUpIHtcbiAgICAgICAgaWYgKHBlZXJKaWQgPT09ICdsb2NhbFZpZGVvQ29udGFpbmVyJylcbiAgICAgICAgICAgIHBlZXJKaWQgPSB4bXBwLm15SmlkKCk7XG5cbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCk7XG5cbiAgICAgICAgdmFyIGNvbnRhY3ROYW1lID0gJCgnI2NvbnRhY3RsaXN0ICMnICsgcmVzb3VyY2VKaWQgKyAnPnAnKTtcblxuICAgICAgICBpZiAoY29udGFjdE5hbWUgJiYgZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoID4gMClcbiAgICAgICAgICAgIGNvbnRhY3ROYW1lLmh0bWwoZGlzcGxheU5hbWUpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdExpc3Q7IiwidmFyIGVtYWlsID0gJyc7XG52YXIgZGlzcGxheU5hbWUgPSAnJztcbnZhciB1c2VySWQ7XG5cblxuZnVuY3Rpb24gc3VwcG9ydHNMb2NhbFN0b3JhZ2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuICdsb2NhbFN0b3JhZ2UnIGluIHdpbmRvdyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlICE9PSBudWxsO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2NhbHN0b3JhZ2UgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZVVuaXF1ZUlkKCkge1xuICAgIGZ1bmN0aW9uIF9wOCgpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KStcIjAwMDAwMDAwMFwiKS5zdWJzdHIoMiw4KTtcbiAgICB9XG4gICAgcmV0dXJuIF9wOCgpICsgX3A4KCkgKyBfcDgoKSArIF9wOCgpO1xufVxuXG5pZihzdXBwb3J0c0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2Uuaml0c2lNZWV0SWQpIHtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5qaXRzaU1lZXRJZCA9IGdlbmVyYXRlVW5pcXVlSWQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJnZW5lcmF0ZWQgaWRcIiwgd2luZG93LmxvY2FsU3RvcmFnZS5qaXRzaU1lZXRJZCk7XG4gICAgfVxuICAgIHVzZXJJZCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2Uuaml0c2lNZWV0SWQgfHwgJyc7XG4gICAgZW1haWwgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmVtYWlsIHx8ICcnO1xuICAgIGRpc3BsYXlOYW1lID0gd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSB8fCAnJztcbn0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coXCJsb2NhbCBzdG9yYWdlIGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgdXNlcklkID0gZ2VuZXJhdGVVbmlxdWVJZCgpO1xufVxuXG52YXIgU2V0dGluZ3MgPVxue1xuICAgIHNldERpc3BsYXlOYW1lOiBmdW5jdGlvbiAobmV3RGlzcGxheU5hbWUpIHtcbiAgICAgICAgZGlzcGxheU5hbWUgPSBuZXdEaXNwbGF5TmFtZTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSA9IGRpc3BsYXlOYW1lO1xuICAgICAgICByZXR1cm4gZGlzcGxheU5hbWU7XG4gICAgfSxcbiAgICBzZXRFbWFpbDogZnVuY3Rpb24obmV3RW1haWwpXG4gICAge1xuICAgICAgICBlbWFpbCA9IG5ld0VtYWlsO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLmVtYWlsID0gbmV3RW1haWw7XG4gICAgICAgIHJldHVybiBlbWFpbDtcbiAgICB9LFxuICAgIGdldFNldHRpbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbWFpbDogZW1haWwsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogZGlzcGxheU5hbWUsXG4gICAgICAgICAgICB1aWQ6IHVzZXJJZFxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3M7XG4iLCJ2YXIgQXZhdGFyID0gcmVxdWlyZShcIi4uLy4uL2F2YXRhci9BdmF0YXJcIik7XG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9TZXR0aW5nc1wiKTtcblxuXG52YXIgU2V0dGluZ3NNZW51ID0ge1xuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5ld0Rpc3BsYXlOYW1lID0gVXRpbC5lc2NhcGVIdG1sKCQoJyNzZXREaXNwbGF5TmFtZScpLmdldCgwKS52YWx1ZSk7XG4gICAgICAgIHZhciBuZXdFbWFpbCA9IFV0aWwuZXNjYXBlSHRtbCgkKCcjc2V0RW1haWwnKS5nZXQoMCkudmFsdWUpO1xuXG4gICAgICAgIGlmKG5ld0Rpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheU5hbWUgPSBTZXR0aW5ncy5zZXREaXNwbGF5TmFtZShuZXdEaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICB4bXBwLmFkZFRvUHJlc2VuY2UoXCJkaXNwbGF5TmFtZVwiLCBkaXNwbGF5TmFtZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHhtcHAuYWRkVG9QcmVzZW5jZShcImVtYWlsXCIsIG5ld0VtYWlsKTtcbiAgICAgICAgdmFyIGVtYWlsID0gU2V0dGluZ3Muc2V0RW1haWwobmV3RW1haWwpO1xuXG5cbiAgICAgICAgQXZhdGFyLnNldFVzZXJBdmF0YXIoeG1wcC5teUppZCgpLCBlbWFpbCk7XG4gICAgfSxcblxuICAgIGlzVmlzaWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKCcjc2V0dGluZ3NtZW51JykuaXMoJzp2aXNpYmxlJyk7XG4gICAgfSxcblxuICAgIHNldERpc3BsYXlOYW1lOiBmdW5jdGlvbihuZXdEaXNwbGF5TmFtZSkge1xuICAgICAgICB2YXIgZGlzcGxheU5hbWUgPSBTZXR0aW5ncy5zZXREaXNwbGF5TmFtZShuZXdEaXNwbGF5TmFtZSk7XG4gICAgICAgICQoJyNzZXREaXNwbGF5TmFtZScpLmdldCgwKS52YWx1ZSA9IGRpc3BsYXlOYW1lO1xuICAgIH0sXG5cbiAgICBvbkRpc3BsYXlOYW1lQ2hhbmdlOiBmdW5jdGlvbihwZWVySmlkLCBuZXdEaXNwbGF5TmFtZSkge1xuICAgICAgICBpZihwZWVySmlkID09PSAnbG9jYWxWaWRlb0NvbnRhaW5lcicgfHxcbiAgICAgICAgICAgIHBlZXJKaWQgPT09IHhtcHAubXlKaWQoKSkge1xuICAgICAgICAgICAgdGhpcy5zZXREaXNwbGF5TmFtZShuZXdEaXNwbGF5TmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3NNZW51OyIsInZhciBQYW5lbFRvZ2dsZXIgPSByZXF1aXJlKFwiLi4vc2lkZV9wYW5uZWxzL1NpZGVQYW5lbFRvZ2dsZXJcIik7XG5cbnZhciBidXR0b25IYW5kbGVycyA9IHtcbiAgICBcImJvdHRvbV90b29sYmFyX2NvbnRhY3RfbGlzdFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEJvdHRvbVRvb2xiYXIudG9nZ2xlQ29udGFjdExpc3QoKTtcbiAgICB9LFxuICAgIFwiYm90dG9tX3Rvb2xiYXJfZmlsbV9zdHJpcFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEJvdHRvbVRvb2xiYXIudG9nZ2xlRmlsbVN0cmlwKCk7XG4gICAgfSxcbiAgICBcImJvdHRvbV90b29sYmFyX2NoYXRcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICBCb3R0b21Ub29sYmFyLnRvZ2dsZUNoYXQoKTtcbiAgICB9XG59O1xuXG52YXIgQm90dG9tVG9vbGJhciA9IChmdW5jdGlvbiAobXkpIHtcbiAgICBteS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IodmFyIGsgaW4gYnV0dG9uSGFuZGxlcnMpXG4gICAgICAgICAgICAkKFwiI1wiICsgaykuY2xpY2soYnV0dG9uSGFuZGxlcnNba10pO1xuICAgIH07XG5cbiAgICBteS50b2dnbGVDaGF0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFBhbmVsVG9nZ2xlci50b2dnbGVDaGF0KCk7XG4gICAgfTtcblxuICAgIG15LnRvZ2dsZUNvbnRhY3RMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFBhbmVsVG9nZ2xlci50b2dnbGVDb250YWN0TGlzdCgpO1xuICAgIH07XG5cbiAgICBteS50b2dnbGVGaWxtU3RyaXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZpbG1zdHJpcCA9ICQoXCIjcmVtb3RlVmlkZW9zXCIpO1xuICAgICAgICBmaWxtc3RyaXAudG9nZ2xlQ2xhc3MoXCJoaWRkZW5cIik7XG4gICAgfTtcblxuICAgICQoZG9jdW1lbnQpLmJpbmQoXCJyZW1vdGV2aWRlby5yZXNpemVkXCIsIGZ1bmN0aW9uIChldmVudCwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgYm90dG9tID0gKGhlaWdodCAtICQoJyNib3R0b21Ub29sYmFyJykub3V0ZXJIZWlnaHQoKSkvMiArIDE4O1xuXG4gICAgICAgICQoJyNib3R0b21Ub29sYmFyJykuY3NzKHtib3R0b206IGJvdHRvbSArICdweCd9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBteTtcbn0oQm90dG9tVG9vbGJhciB8fCB7fSkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvdHRvbVRvb2xiYXI7XG4iLCIvKiBnbG9iYWwgJCwgaW50ZXJmYWNlQ29uZmlnLCBNb2RlcmF0b3IsIERlc2t0b3BTdHJlYW1pbmcuc2hvd0Rlc2t0b3BTaGFyaW5nQnV0dG9uICovXG5cbnZhciB0b29sYmFyVGltZW91dE9iamVjdCxcbiAgICB0b29sYmFyVGltZW91dCA9IGludGVyZmFjZUNvbmZpZy5JTklUSUFMX1RPT0xCQVJfVElNRU9VVDtcblxuZnVuY3Rpb24gc2hvd0Rlc2t0b3BTaGFyaW5nQnV0dG9uKCkge1xuICAgIGlmIChkZXNrdG9wc2hhcmluZy5pc0Rlc2t0b3BTaGFyaW5nRW5hYmxlZCgpKSB7XG4gICAgICAgICQoJyNkZXNrdG9wc2hhcmluZycpLmNzcyh7ZGlzcGxheTogXCJpbmxpbmVcIn0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICQoJyNkZXNrdG9wc2hhcmluZycpLmNzcyh7ZGlzcGxheTogXCJub25lXCJ9KTtcbiAgICB9XG59XG5cbi8qKlxuICogSGlkZXMgdGhlIHRvb2xiYXIuXG4gKi9cbmZ1bmN0aW9uIGhpZGVUb29sYmFyKCkge1xuICAgIHZhciBoZWFkZXIgPSAkKFwiI2hlYWRlclwiKSxcbiAgICAgICAgYm90dG9tVG9vbGJhciA9ICQoXCIjYm90dG9tVG9vbGJhclwiKTtcbiAgICB2YXIgaXNUb29sYmFySG92ZXIgPSBmYWxzZTtcbiAgICBoZWFkZXIuZmluZCgnKicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaWQgPSAkKHRoaXMpLmF0dHIoJ2lkJyk7XG4gICAgICAgIGlmICgkKFwiI1wiICsgaWQgKyBcIjpob3ZlclwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpc1Rvb2xiYXJIb3ZlciA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoJChcIiNib3R0b21Ub29sYmFyOmhvdmVyXCIpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgaXNUb29sYmFySG92ZXIgPSB0cnVlO1xuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0b29sYmFyVGltZW91dE9iamVjdCk7XG4gICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBudWxsO1xuXG4gICAgaWYgKCFpc1Rvb2xiYXJIb3Zlcikge1xuICAgICAgICBoZWFkZXIuaGlkZShcInNsaWRlXCIsIHsgZGlyZWN0aW9uOiBcInVwXCIsIGR1cmF0aW9uOiAzMDB9KTtcbiAgICAgICAgJCgnI3N1YmplY3QnKS5hbmltYXRlKHt0b3A6IFwiLT00MFwifSwgMzAwKTtcbiAgICAgICAgaWYgKCQoXCIjcmVtb3RlVmlkZW9zXCIpLmhhc0NsYXNzKFwiaGlkZGVuXCIpKSB7XG4gICAgICAgICAgICBib3R0b21Ub29sYmFyLmhpZGUoXG4gICAgICAgICAgICAgICAgXCJzbGlkZVwiLCB7ZGlyZWN0aW9uOiBcInJpZ2h0XCIsIGR1cmF0aW9uOiAzMDB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBzZXRUaW1lb3V0KGhpZGVUb29sYmFyLCB0b29sYmFyVGltZW91dCk7XG4gICAgfVxufVxuXG52YXIgVG9vbGJhclRvZ2dsZXIgPSB7XG4gICAgLyoqXG4gICAgICogU2hvd3MgdGhlIG1haW4gdG9vbGJhci5cbiAgICAgKi9cbiAgICBzaG93VG9vbGJhcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaGVhZGVyID0gJChcIiNoZWFkZXJcIiksXG4gICAgICAgICAgICBib3R0b21Ub29sYmFyID0gJChcIiNib3R0b21Ub29sYmFyXCIpO1xuICAgICAgICBpZiAoIWhlYWRlci5pcygnOnZpc2libGUnKSB8fCAhYm90dG9tVG9vbGJhci5pcyhcIjp2aXNpYmxlXCIpKSB7XG4gICAgICAgICAgICBoZWFkZXIuc2hvdyhcInNsaWRlXCIsIHsgZGlyZWN0aW9uOiBcInVwXCIsIGR1cmF0aW9uOiAzMDB9KTtcbiAgICAgICAgICAgICQoJyNzdWJqZWN0JykuYW5pbWF0ZSh7dG9wOiBcIis9NDBcIn0sIDMwMCk7XG4gICAgICAgICAgICBpZiAoIWJvdHRvbVRvb2xiYXIuaXMoXCI6dmlzaWJsZVwiKSkge1xuICAgICAgICAgICAgICAgIGJvdHRvbVRvb2xiYXIuc2hvdyhcbiAgICAgICAgICAgICAgICAgICAgXCJzbGlkZVwiLCB7ZGlyZWN0aW9uOiBcInJpZ2h0XCIsIGR1cmF0aW9uOiAzMDB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvb2xiYXJUaW1lb3V0T2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRvb2xiYXJUaW1lb3V0T2JqZWN0KTtcbiAgICAgICAgICAgICAgICB0b29sYmFyVGltZW91dE9iamVjdCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b29sYmFyVGltZW91dE9iamVjdCA9IHNldFRpbWVvdXQoaGlkZVRvb2xiYXIsIHRvb2xiYXJUaW1lb3V0KTtcbiAgICAgICAgICAgIHRvb2xiYXJUaW1lb3V0ID0gaW50ZXJmYWNlQ29uZmlnLlRPT0xCQVJfVElNRU9VVDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh4bXBwLmlzTW9kZXJhdG9yKCkpXG4gICAgICAgIHtcbi8vICAgICAgICAgICAgVE9ETzogRW5hYmxlIHNldHRpbmdzIGZ1bmN0aW9uYWxpdHkuXG4vLyAgICAgICAgICAgICAgICAgIE5lZWQgdG8gdW5jb21tZW50IHRoZSBzZXR0aW5ncyBidXR0b24gaW4gaW5kZXguaHRtbC5cbi8vICAgICAgICAgICAgJCgnI3NldHRpbmdzQnV0dG9uJykuY3NzKHt2aXNpYmlsaXR5OlwidmlzaWJsZVwifSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93L2hpZGUgZGVza3RvcCBzaGFyaW5nIGJ1dHRvblxuICAgICAgICBzaG93RGVza3RvcFNoYXJpbmdCdXR0b24oKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBEb2Nrcy91bmRvY2tzIHRoZSB0b29sYmFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRG9jayBpbmRpY2F0ZXMgd2hhdCBvcGVyYXRpb24gdG8gcGVyZm9ybVxuICAgICAqL1xuICAgIGRvY2tUb29sYmFyOiBmdW5jdGlvbiAoaXNEb2NrKSB7XG4gICAgICAgIGlmIChpc0RvY2spIHtcbiAgICAgICAgICAgIC8vIEZpcnN0IG1ha2Ugc3VyZSB0aGUgdG9vbGJhciBpcyBzaG93bi5cbiAgICAgICAgICAgIGlmICghJCgnI2hlYWRlcicpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93VG9vbGJhcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGVuIGNsZWFyIHRoZSB0aW1lIG91dCwgdG8gZG9jayB0aGUgdG9vbGJhci5cbiAgICAgICAgICAgIGlmICh0b29sYmFyVGltZW91dE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0b29sYmFyVGltZW91dE9iamVjdCk7XG4gICAgICAgICAgICAgICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCEkKCcjaGVhZGVyJykuaXMoJzp2aXNpYmxlJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dUb29sYmFyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b29sYmFyVGltZW91dE9iamVjdCA9IHNldFRpbWVvdXQoaGlkZVRvb2xiYXIsIHRvb2xiYXJUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzaG93RGVza3RvcFNoYXJpbmdCdXR0b246IHNob3dEZXNrdG9wU2hhcmluZ0J1dHRvblxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvb2xiYXJUb2dnbGVyOyIsIi8qIGdsb2JhbCAkLCBidXR0b25DbGljaywgY29uZmlnLCBsb2NrUm9vbSxcbiAgIHNldFNoYXJlZEtleSwgVXRpbCAqL1xudmFyIG1lc3NhZ2VIYW5kbGVyID0gcmVxdWlyZShcIi4uL3V0aWwvTWVzc2FnZUhhbmRsZXJcIik7XG52YXIgQm90dG9tVG9vbGJhciA9IHJlcXVpcmUoXCIuL0JvdHRvbVRvb2xiYXJcIik7XG52YXIgUHJlemkgPSByZXF1aXJlKFwiLi4vcHJlemkvUHJlemlcIik7XG52YXIgRXRoZXJwYWQgPSByZXF1aXJlKFwiLi4vZXRoZXJwYWQvRXRoZXJwYWRcIik7XG52YXIgUGFuZWxUb2dnbGVyID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9TaWRlUGFuZWxUb2dnbGVyXCIpO1xudmFyIEF1dGhlbnRpY2F0aW9uID0gcmVxdWlyZShcIi4uL2F1dGhlbnRpY2F0aW9uL0F1dGhlbnRpY2F0aW9uXCIpO1xudmFyIFVJVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL1VJVXRpbFwiKTtcblxudmFyIHJvb21VcmwgPSBudWxsO1xudmFyIHNoYXJlZEtleSA9ICcnO1xudmFyIFVJID0gbnVsbDtcblxudmFyIGJ1dHRvbkhhbmRsZXJzID1cbntcbiAgICBcInRvb2xiYXJfYnV0dG9uX211dGVcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVUkudG9nZ2xlQXVkaW8oKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fY2FtZXJhXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFVJLnRvZ2dsZVZpZGVvKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX2F1dGhlbnRpY2F0aW9uXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFRvb2xiYXIuYXV0aGVudGljYXRlQ2xpY2tlZCgpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9yZWNvcmRcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdG9nZ2xlUmVjb3JkaW5nKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX3NlY3VyaXR5XCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFRvb2xiYXIub3BlbkxvY2tEaWFsb2coKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fbGlua1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBUb29sYmFyLm9wZW5MaW5rRGlhbG9nKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX2NoYXRcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gQm90dG9tVG9vbGJhci50b2dnbGVDaGF0KCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX3ByZXppXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFByZXppLm9wZW5QcmV6aURpYWxvZygpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9ldGhlcnBhZFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBFdGhlcnBhZC50b2dnbGVFdGhlcnBhZCgwKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fZGVza3RvcHNoYXJpbmdcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZGVza3RvcHNoYXJpbmcudG9nZ2xlU2NyZWVuU2hhcmluZygpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9mdWxsU2NyZWVuXCI6IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIFVJVXRpbC5idXR0b25DbGljayhcIiNmdWxsU2NyZWVuXCIsIFwiaWNvbi1mdWxsLXNjcmVlbiBpY29uLWV4aXQtZnVsbC1zY3JlZW5cIik7XG4gICAgICAgIHJldHVybiBUb29sYmFyLnRvZ2dsZUZ1bGxTY3JlZW4oKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fc2lwXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxTaXBCdXR0b25DbGlja2VkKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX3NldHRpbmdzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUGFuZWxUb2dnbGVyLnRvZ2dsZVNldHRpbmdzTWVudSgpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9oYW5ndXBcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaGFuZ3VwKCk7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gaGFuZ3VwKCkge1xuICAgIHhtcHAuZGlzcG9zZUNvbmZlcmVuY2UoKTtcbiAgICBpZihjb25maWcuZW5hYmxlV2VsY29tZVBhZ2UpXG4gICAge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS53ZWxjb21lUGFnZURpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPSBcIi9cIjtcbiAgICAgICAgfSwgMTAwMDApO1xuXG4gICAgfVxuXG4gICAgVUkubWVzc2FnZUhhbmRsZXIub3BlbkRpYWxvZyhcbiAgICAgICAgXCJTZXNzaW9uIFRlcm1pbmF0ZWRcIixcbiAgICAgICAgXCJZb3UgaHVuZyB1cCB0aGUgY2FsbFwiLFxuICAgICAgICB0cnVlLFxuICAgICAgICB7IFwiSm9pbiBhZ2FpblwiOiB0cnVlIH0sXG4gICAgICAgIGZ1bmN0aW9uKGV2ZW50LCB2YWx1ZSwgbWVzc2FnZSwgZm9ybVZhbHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cbi8qKlxuICogU3RhcnRzIG9yIHN0b3BzIHRoZSByZWNvcmRpbmcgZm9yIHRoZSBjb25mZXJlbmNlLlxuICovXG5cbmZ1bmN0aW9uIHRvZ2dsZVJlY29yZGluZygpIHtcbiAgICB4bXBwLnRvZ2dsZVJlY29yZGluZyhmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICc8aDI+RW50ZXIgcmVjb3JkaW5nIHRva2VuPC9oMj4nICtcbiAgICAgICAgICAgICAgICAnPGlucHV0IGlkPVwicmVjb3JkaW5nVG9rZW5cIiB0eXBlPVwidGV4dFwiICcgK1xuICAgICAgICAgICAgICAgICdwbGFjZWhvbGRlcj1cInRva2VuXCIgYXV0b2ZvY3VzPicsXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIFwiU2F2ZVwiLFxuICAgICAgICAgICAgZnVuY3Rpb24gKGUsIHYsIG0sIGYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9rZW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjb3JkaW5nVG9rZW4nKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKFV0aWwuZXNjYXBlSHRtbCh0b2tlbi52YWx1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNvcmRpbmdUb2tlbicpLmZvY3VzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH0sIFRvb2xiYXIuc2V0UmVjb3JkaW5nQnV0dG9uU3RhdGUsIFRvb2xiYXIuc2V0UmVjb3JkaW5nQnV0dG9uU3RhdGUpO1xufVxuXG4vKipcbiAqIExvY2tzIC8gdW5sb2NrcyB0aGUgcm9vbS5cbiAqL1xuZnVuY3Rpb24gbG9ja1Jvb20obG9jaykge1xuICAgIHZhciBjdXJyZW50U2hhcmVkS2V5ID0gJyc7XG4gICAgaWYgKGxvY2spXG4gICAgICAgIGN1cnJlbnRTaGFyZWRLZXkgPSBzaGFyZWRLZXk7XG5cbiAgICB4bXBwLmxvY2tSb29tKGN1cnJlbnRTaGFyZWRLZXksIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgLy8gcGFzc3dvcmQgaXMgcmVxdWlyZWRcbiAgICAgICAgaWYgKHNoYXJlZEtleSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldCByb29tIHBhc3N3b3JkJyk7XG4gICAgICAgICAgICBUb29sYmFyLmxvY2tMb2NrQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVtb3ZlZCByb29tIHBhc3N3b3JkJyk7XG4gICAgICAgICAgICBUb29sYmFyLnVubG9ja0xvY2tCdXR0b24oKTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdzZXR0aW5nIHBhc3N3b3JkIGZhaWxlZCcsIGVycik7XG4gICAgICAgIG1lc3NhZ2VIYW5kbGVyLnNob3dFcnJvcignTG9jayBmYWlsZWQnLFxuICAgICAgICAgICAgJ0ZhaWxlZCB0byBsb2NrIGNvbmZlcmVuY2UuJyxcbiAgICAgICAgICAgIGVycik7XG4gICAgICAgIFRvb2xiYXIuc2V0U2hhcmVkS2V5KCcnKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybigncm9vbSBwYXNzd29yZHMgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgICBtZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoJ1dhcm5pbmcnLFxuICAgICAgICAgICAgJ1Jvb20gcGFzc3dvcmRzIGFyZSBjdXJyZW50bHkgbm90IHN1cHBvcnRlZC4nKTtcbiAgICAgICAgVG9vbGJhci5zZXRTaGFyZWRLZXkoJycpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBJbnZpdGUgcGFydGljaXBhbnRzIHRvIGNvbmZlcmVuY2UuXG4gKi9cbmZ1bmN0aW9uIGludml0ZVBhcnRpY2lwYW50cygpIHtcbiAgICBpZiAocm9vbVVybCA9PT0gbnVsbClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIHNoYXJlZEtleVRleHQgPSBcIlwiO1xuICAgIGlmIChzaGFyZWRLZXkgJiYgc2hhcmVkS2V5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2hhcmVkS2V5VGV4dCA9XG4gICAgICAgICAgICBcIlRoaXMgY29uZmVyZW5jZSBpcyBwYXNzd29yZCBwcm90ZWN0ZWQuIFBsZWFzZSB1c2UgdGhlIFwiICtcbiAgICAgICAgICAgIFwiZm9sbG93aW5nIHBpbiB3aGVuIGpvaW5pbmc6JTBEJTBBJTBEJTBBXCIgK1xuICAgICAgICAgICAgc2hhcmVkS2V5ICsgXCIlMEQlMEElMEQlMEFcIjtcbiAgICB9XG5cbiAgICB2YXIgY29uZmVyZW5jZU5hbWUgPSByb29tVXJsLnN1YnN0cmluZyhyb29tVXJsLmxhc3RJbmRleE9mKCcvJykgKyAxKTtcbiAgICB2YXIgc3ViamVjdCA9IFwiSW52aXRhdGlvbiB0byBhIFwiICsgaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FICsgXCIgKFwiICsgY29uZmVyZW5jZU5hbWUgKyBcIilcIjtcbiAgICB2YXIgYm9keSA9IFwiSGV5IHRoZXJlLCBJJTI3ZCBsaWtlIHRvIGludml0ZSB5b3UgdG8gYSBcIiArIGludGVyZmFjZUNvbmZpZy5BUFBfTkFNRSArXG4gICAgICAgIFwiIGNvbmZlcmVuY2UgSSUyN3ZlIGp1c3Qgc2V0IHVwLiUwRCUwQSUwRCUwQVwiICtcbiAgICAgICAgXCJQbGVhc2UgY2xpY2sgb24gdGhlIGZvbGxvd2luZyBsaW5rIGluIG9yZGVyXCIgK1xuICAgICAgICBcIiB0byBqb2luIHRoZSBjb25mZXJlbmNlLiUwRCUwQSUwRCUwQVwiICtcbiAgICAgICAgcm9vbVVybCArXG4gICAgICAgIFwiJTBEJTBBJTBEJTBBXCIgK1xuICAgICAgICBzaGFyZWRLZXlUZXh0ICtcbiAgICAgICAgXCJOb3RlIHRoYXQgXCIgKyBpbnRlcmZhY2VDb25maWcuQVBQX05BTUUgKyBcIiBpcyBjdXJyZW50bHlcIiArXG4gICAgICAgIFwiIG9ubHkgc3VwcG9ydGVkIGJ5IENocm9taXVtLFwiICtcbiAgICAgICAgXCIgR29vZ2xlIENocm9tZSBhbmQgT3BlcmEsIHNvIHlvdSBuZWVkXCIgK1xuICAgICAgICBcIiB0byBiZSB1c2luZyBvbmUgb2YgdGhlc2UgYnJvd3NlcnMuJTBEJTBBJTBEJTBBXCIgK1xuICAgICAgICBcIlRhbGsgdG8geW91IGluIGEgc2VjIVwiO1xuXG4gICAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UuZGlzcGxheW5hbWUpIHtcbiAgICAgICAgYm9keSArPSBcIiUwRCUwQSUwRCUwQVwiICsgd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZTtcbiAgICB9XG5cbiAgICBpZiAoaW50ZXJmYWNlQ29uZmlnLklOVklUQVRJT05fUE9XRVJFRF9CWSkge1xuICAgICAgICBib2R5ICs9IFwiJTBEJTBBJTBEJTBBLS0lMEQlMEFwb3dlcmVkIGJ5IGppdHNpLm9yZ1wiO1xuICAgIH1cblxuICAgIHdpbmRvdy5vcGVuKFwibWFpbHRvOj9zdWJqZWN0PVwiICsgc3ViamVjdCArIFwiJmJvZHk9XCIgKyBib2R5LCAnX2JsYW5rJyk7XG59XG5cbmZ1bmN0aW9uIGNhbGxTaXBCdXR0b25DbGlja2VkKClcbntcbiAgICB2YXIgZGVmYXVsdE51bWJlclxuICAgICAgICA9IGNvbmZpZy5kZWZhdWx0U2lwTnVtYmVyID8gY29uZmlnLmRlZmF1bHRTaXBOdW1iZXIgOiAnJztcblxuICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5Ud29CdXR0b25EaWFsb2cobnVsbCxcbiAgICAgICAgJzxoMj5FbnRlciBTSVAgbnVtYmVyPC9oMj4nICtcbiAgICAgICAgJzxpbnB1dCBpZD1cInNpcE51bWJlclwiIHR5cGU9XCJ0ZXh0XCInICtcbiAgICAgICAgJyB2YWx1ZT1cIicgKyBkZWZhdWx0TnVtYmVyICsgJ1wiIGF1dG9mb2N1cz4nLFxuICAgICAgICBmYWxzZSxcbiAgICAgICAgXCJEaWFsXCIsXG4gICAgICAgIGZ1bmN0aW9uIChlLCB2LCBtLCBmKSB7XG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgIHZhciBudW1iZXJJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaXBOdW1iZXInKTtcbiAgICAgICAgICAgICAgICBpZiAobnVtYmVySW5wdXQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgeG1wcC5kaWFsKG51bWJlcklucHV0LnZhbHVlLCAnZnJvbW51bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBVSS5nZXRSb29tTmFtZSgpLCBzaGFyZWRLZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2lwTnVtYmVyJykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cbnZhciBUb29sYmFyID0gKGZ1bmN0aW9uIChteSkge1xuXG4gICAgbXkuaW5pdCA9IGZ1bmN0aW9uICh1aSkge1xuICAgICAgICBmb3IodmFyIGsgaW4gYnV0dG9uSGFuZGxlcnMpXG4gICAgICAgICAgICAkKFwiI1wiICsgaykuY2xpY2soYnV0dG9uSGFuZGxlcnNba10pO1xuICAgICAgICBVSSA9IHVpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldHMgc2hhcmVkIGtleVxuICAgICAqIEBwYXJhbSBzS2V5IHRoZSBzaGFyZWQga2V5XG4gICAgICovXG4gICAgbXkuc2V0U2hhcmVkS2V5ID0gZnVuY3Rpb24gKHNLZXkpIHtcbiAgICAgICAgc2hhcmVkS2V5ID0gc0tleTtcbiAgICB9O1xuXG4gICAgbXkuYXV0aGVudGljYXRlQ2xpY2tlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQXV0aGVudGljYXRpb24uZm9jdXNBdXRoZW50aWNhdGlvbldpbmRvdygpO1xuICAgICAgICAvLyBHZXQgYXV0aGVudGljYXRpb24gVVJMXG4gICAgICAgIHhtcHAuZ2V0QXV0aFVybChVSS5nZXRSb29tTmFtZSgpLCBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICAvLyBPcGVuIHBvcHVwIHdpdGggYXV0aGVudGljYXRpb24gVVJMXG4gICAgICAgICAgICB2YXIgYXV0aGVudGljYXRpb25XaW5kb3cgPSBBdXRoZW50aWNhdGlvbi5jcmVhdGVBdXRoZW50aWNhdGlvbldpbmRvdyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gT24gcG9wdXAgY2xvc2VkIC0gcmV0cnkgcm9vbSBhbGxvY2F0aW9uXG4gICAgICAgICAgICAgICAgeG1wcC5hbGxvY2F0ZUNvbmZlcmVuY2VGb2N1cyhVSS5nZXRSb29tTmFtZSgpLCBVSS5jaGVja0Zvck5pY2tuYW1lQW5kSm9pbik7XG4gICAgICAgICAgICB9LCB1cmwpO1xuICAgICAgICAgICAgaWYgKCFhdXRoZW50aWNhdGlvbldpbmRvdykge1xuICAgICAgICAgICAgICAgIFRvb2xiYXIuc2hvd0F1dGhlbnRpY2F0ZUJ1dHRvbih0cnVlKTtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuTWVzc2FnZURpYWxvZyhcbiAgICAgICAgICAgICAgICAgICAgbnVsbCwgXCJZb3VyIGJyb3dzZXIgaXMgYmxvY2tpbmcgcG9wdXAgd2luZG93cyBmcm9tIHRoaXMgc2l0ZS5cIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBQbGVhc2UgZW5hYmxlIHBvcHVwcyBpbiB5b3VyIGJyb3dzZXIgc2VjdXJpdHkgc2V0dGluZ3NcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBhbmQgdHJ5IGFnYWluLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHJvb20gaW52aXRlIHVybC5cbiAgICAgKi9cbiAgICBteS51cGRhdGVSb29tVXJsID0gZnVuY3Rpb24gKG5ld1Jvb21VcmwpIHtcbiAgICAgICAgcm9vbVVybCA9IG5ld1Jvb21Vcmw7XG5cbiAgICAgICAgLy8gSWYgdGhlIGludml0ZSBkaWFsb2cgaGFzIGJlZW4gYWxyZWFkeSBvcGVuZWQgd2UgdXBkYXRlIHRoZSBpbmZvcm1hdGlvbi5cbiAgICAgICAgdmFyIGludml0ZUxpbmsgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW52aXRlTGlua1JlZicpO1xuICAgICAgICBpZiAoaW52aXRlTGluaykge1xuICAgICAgICAgICAgaW52aXRlTGluay52YWx1ZSA9IHJvb21Vcmw7XG4gICAgICAgICAgICBpbnZpdGVMaW5rLnNlbGVjdCgpO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pxaV9zdGF0ZTBfYnV0dG9uSW52aXRlJykuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlcyBhbmQgZW5hYmxlcyBzb21lIG9mIHRoZSBidXR0b25zLlxuICAgICAqL1xuICAgIG15LnNldHVwQnV0dG9uc0Zyb21Db25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb25maWcuZGlzYWJsZVByZXppKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKFwiI3ByZXppX2J1dHRvblwiKS5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIGxvY2sgcm9vbSBkaWFsb2cuXG4gICAgICovXG4gICAgbXkub3BlbkxvY2tEaWFsb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIE9ubHkgdGhlIGZvY3VzIGlzIGFibGUgdG8gc2V0IGEgc2hhcmVkIGtleS5cbiAgICAgICAgaWYgKCF4bXBwLmlzTW9kZXJhdG9yKCkpIHtcbiAgICAgICAgICAgIGlmIChzaGFyZWRLZXkpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuTWVzc2FnZURpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGNvbnZlcnNhdGlvbiBpcyBjdXJyZW50bHkgcHJvdGVjdGVkIGJ5XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIgYSBwYXNzd29yZC4gT25seSB0aGUgb3duZXIgb2YgdGhlIGNvbmZlcmVuY2VcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBjb3VsZCBzZXQgYSBwYXNzd29yZC5cIixcbiAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiUGFzc3dvcmRcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5NZXNzYWdlRGlhbG9nKG51bGwsXG4gICAgICAgICAgICAgICAgICAgIFwiVGhpcyBjb252ZXJzYXRpb24gaXNuJ3QgY3VycmVudGx5IHByb3RlY3RlZCBieVwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiIGEgcGFzc3dvcmQuIE9ubHkgdGhlIG93bmVyIG9mIHRoZSBjb25mZXJlbmNlXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIgY291bGQgc2V0IGEgcGFzc3dvcmQuXCIsXG4gICAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcIlBhc3N3b3JkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHNoYXJlZEtleSkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5Ud29CdXR0b25EaWFsb2cobnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJBcmUgeW91IHN1cmUgeW91IHdvdWxkIGxpa2UgdG8gcmVtb3ZlIHlvdXIgcGFzc3dvcmQ/XCIsXG4gICAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcIlJlbW92ZVwiLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZSwgdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUb29sYmFyLnNldFNoYXJlZEtleSgnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9ja1Jvb20oZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICAgICAnPGgyPlNldCBhIHBhc3N3b3JkIHRvIGxvY2sgeW91ciByb29tPC9oMj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJsb2NrS2V5XCIgdHlwZT1cInRleHRcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3BsYWNlaG9sZGVyPVwieW91ciBwYXNzd29yZFwiIGF1dG9mb2N1cz4nLFxuICAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJTYXZlXCIsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2NrS2V5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tLZXknKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NrS2V5LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRvb2xiYXIuc2V0U2hhcmVkS2V5KFV0aWwuZXNjYXBlSHRtbChsb2NrS2V5LnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2tSb29tKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tLZXknKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgaW52aXRlIGxpbmsgZGlhbG9nLlxuICAgICAqL1xuICAgIG15Lm9wZW5MaW5rRGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW52aXRlTGluaztcbiAgICAgICAgaWYgKHJvb21VcmwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGludml0ZUxpbmsgPSBcIllvdXIgY29uZmVyZW5jZSBpcyBjdXJyZW50bHkgYmVpbmcgY3JlYXRlZC4uLlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW52aXRlTGluayA9IGVuY29kZVVSSShyb29tVXJsKTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKFxuICAgICAgICAgICAgXCJTaGFyZSB0aGlzIGxpbmsgd2l0aCBldmVyeW9uZSB5b3Ugd2FudCB0byBpbnZpdGVcIixcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJpbnZpdGVMaW5rUmVmXCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIicgK1xuICAgICAgICAgICAgICAgIGludml0ZUxpbmsgKyAnXCIgb25jbGljaz1cInRoaXMuc2VsZWN0KCk7XCIgcmVhZG9ubHk+JyxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgXCJJbnZpdGVcIixcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlLCB2KSB7XG4gICAgICAgICAgICAgICAgaWYgKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJvb21VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludml0ZVBhcnRpY2lwYW50cygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocm9vbVVybCkge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW52aXRlTGlua1JlZicpLnNlbGVjdCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdqcWlfc3RhdGUwX2J1dHRvbkludml0ZScpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIHNldHRpbmdzIGRpYWxvZy5cbiAgICAgKi9cbiAgICBteS5vcGVuU2V0dGluZ3NEaWFsb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5Ud29CdXR0b25EaWFsb2coXG4gICAgICAgICAgICAnPGgyPkNvbmZpZ3VyZSB5b3VyIGNvbmZlcmVuY2U8L2gyPicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJpbml0TXV0ZWRcIj4nICtcbiAgICAgICAgICAgICAgICAnUGFydGljaXBhbnRzIGpvaW4gbXV0ZWQ8YnIvPicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJyZXF1aXJlTmlja25hbWVzXCI+JyArXG4gICAgICAgICAgICAgICAgJ1JlcXVpcmUgbmlja25hbWVzPGJyLz48YnIvPicgK1xuICAgICAgICAgICAgICAgICdTZXQgYSBwYXNzd29yZCB0byBsb2NrIHlvdXIgcm9vbTonICtcbiAgICAgICAgICAgICAgICAnPGlucHV0IGlkPVwibG9ja0tleVwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJ5b3VyIHBhc3N3b3JkXCInICtcbiAgICAgICAgICAgICAgICAnYXV0b2ZvY3VzPicsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBcIlNhdmVcIixcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9ja0tleScpLmZvY3VzKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKGUsIHYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJCgnI2luaXRNdXRlZCcpLmlzKFwiOmNoZWNrZWRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0IGlzIGNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKCcjcmVxdWlyZU5pY2tuYW1lcycpLmlzKFwiOmNoZWNrZWRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGl0IGlzIGNoZWNrZWRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9ja0tleSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2NrS2V5Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2tLZXkudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNoYXJlZEtleShsb2NrS2V5LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2tSb29tKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSBhcHBsaWNhdGlvbiBpbiBhbmQgb3V0IG9mIGZ1bGwgc2NyZWVuIG1vZGVcbiAgICAgKiAoYS5rLmEuIHByZXNlbnRhdGlvbiBtb2RlIGluIENocm9tZSkuXG4gICAgICovXG4gICAgbXkudG9nZ2xlRnVsbFNjcmVlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZzRWxlbWVudCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICBpZiAoIWRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gJiYgIWRvY3VtZW50LndlYmtpdElzRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgLy9FbnRlciBGdWxsIFNjcmVlblxuICAgICAgICAgICAgaWYgKGZzRWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGZzRWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZnNFbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKEVsZW1lbnQuQUxMT1dfS0VZQk9BUkRfSU5QVVQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9FeGl0IEZ1bGwgU2NyZWVuXG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQud2Via2l0Q2FuY2VsRnVsbFNjcmVlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBVbmxvY2tzIHRoZSBsb2NrIGJ1dHRvbiBzdGF0ZS5cbiAgICAgKi9cbiAgICBteS51bmxvY2tMb2NrQnV0dG9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJChcIiNsb2NrSWNvblwiKS5oYXNDbGFzcyhcImljb24tc2VjdXJpdHktbG9ja2VkXCIpKVxuICAgICAgICAgICAgVUlVdGlsLmJ1dHRvbkNsaWNrKFwiI2xvY2tJY29uXCIsIFwiaWNvbi1zZWN1cml0eSBpY29uLXNlY3VyaXR5LWxvY2tlZFwiKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxvY2sgYnV0dG9uIHN0YXRlIHRvIGxvY2tlZC5cbiAgICAgKi9cbiAgICBteS5sb2NrTG9ja0J1dHRvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoXCIjbG9ja0ljb25cIikuaGFzQ2xhc3MoXCJpY29uLXNlY3VyaXR5XCIpKVxuICAgICAgICAgICAgVUlVdGlsLmJ1dHRvbkNsaWNrKFwiI2xvY2tJY29uXCIsIFwiaWNvbi1zZWN1cml0eSBpY29uLXNlY3VyaXR5LWxvY2tlZFwiKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvd3Mgb3IgaGlkZXMgYXV0aGVudGljYXRpb24gYnV0dG9uXG4gICAgICogQHBhcmFtIHNob3cgPHR0PnRydWU8L3R0PiB0byBzaG93IG9yIDx0dD5mYWxzZTwvdHQ+IHRvIGhpZGVcbiAgICAgKi9cbiAgICBteS5zaG93QXV0aGVudGljYXRlQnV0dG9uID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgICQoJyNhdXRoZW50aWNhdGlvbicpLmNzcyh7ZGlzcGxheTogXCJpbmxpbmVcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCgnI2F1dGhlbnRpY2F0aW9uJykuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNob3dzIG9yIGhpZGVzIHRoZSAncmVjb3JkaW5nJyBidXR0b24uXG4gICAgbXkuc2hvd1JlY29yZGluZ0J1dHRvbiA9IGZ1bmN0aW9uIChzaG93KSB7XG4gICAgICAgIGlmICghY29uZmlnLmVuYWJsZVJlY29yZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRpbmcnKS5jc3Moe2Rpc3BsYXk6IFwiaW5saW5lXCJ9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRpbmcnKS5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2V0cyB0aGUgc3RhdGUgb2YgdGhlIHJlY29yZGluZyBidXR0b25cbiAgICBteS5zZXRSZWNvcmRpbmdCdXR0b25TdGF0ZSA9IGZ1bmN0aW9uIChpc1JlY29yZGluZykge1xuICAgICAgICBpZiAoaXNSZWNvcmRpbmcpIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRCdXR0b24nKS5yZW1vdmVDbGFzcyhcImljb24tcmVjRW5hYmxlXCIpO1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLmFkZENsYXNzKFwiaWNvbi1yZWNFbmFibGUgYWN0aXZlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLnJlbW92ZUNsYXNzKFwiaWNvbi1yZWNFbmFibGUgYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLmFkZENsYXNzKFwiaWNvbi1yZWNFbmFibGVcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2hvd3Mgb3IgaGlkZXMgU0lQIGNhbGxzIGJ1dHRvblxuICAgIG15LnNob3dTaXBDYWxsQnV0dG9uID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKHhtcHAuaXNTaXBHYXRld2F5RW5hYmxlZCgpICYmIHNob3cpIHtcbiAgICAgICAgICAgICQoJyNzaXBDYWxsQnV0dG9uJykuY3NzKHtkaXNwbGF5OiBcImlubGluZVwifSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjc2lwQ2FsbEJ1dHRvbicpLmNzcyh7ZGlzcGxheTogXCJub25lXCJ9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBzdGF0ZSBvZiB0aGUgYnV0dG9uLiBUaGUgYnV0dG9uIGhhcyBibHVlIGdsb3cgaWYgZGVza3RvcFxuICAgICAqIHN0cmVhbWluZyBpcyBhY3RpdmUuXG4gICAgICogQHBhcmFtIGFjdGl2ZSB0aGUgc3RhdGUgb2YgdGhlIGRlc2t0b3Agc3RyZWFtaW5nLlxuICAgICAqL1xuICAgIG15LmNoYW5nZURlc2t0b3BTaGFyaW5nQnV0dG9uU3RhdGUgPSBmdW5jdGlvbiAoYWN0aXZlKSB7XG4gICAgICAgIHZhciBidXR0b24gPSAkKFwiI2Rlc2t0b3BzaGFyaW5nID4gYVwiKTtcbiAgICAgICAgaWYgKGFjdGl2ZSlcbiAgICAgICAge1xuICAgICAgICAgICAgYnV0dG9uLmFkZENsYXNzKFwiZ2xvd1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJ1dHRvbi5yZW1vdmVDbGFzcyhcImdsb3dcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIG15O1xufShUb29sYmFyIHx8IHt9KSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9vbGJhcjsiLCJ2YXIgSml0c2lQb3BvdmVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIG5ldyBKaXRzaVBvcG92ZXIgYW5kIGF0dGFjaGVzIGl0IHRvIHRoZSBlbGVtZW50XG4gICAgICogQHBhcmFtIGVsZW1lbnQganF1ZXJ5IHNlbGVjdG9yXG4gICAgICogQHBhcmFtIG9wdGlvbnMgdGhlIG9wdGlvbnMgZm9yIHRoZSBwb3BvdmVyLlxuICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEppdHNpUG9wb3ZlcihlbGVtZW50LCBvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgICAgICAgc2tpbjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgY29udGVudDogXCJcIlxuICAgICAgICB9O1xuICAgICAgICBpZihvcHRpb25zKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZihvcHRpb25zLnNraW4pXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnNraW4gPSBvcHRpb25zLnNraW47XG5cbiAgICAgICAgICAgIGlmKG9wdGlvbnMuY29udGVudClcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY29udGVudCA9IG9wdGlvbnMuY29udGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudElzSG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBvcG92ZXJJc0hvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wb3BvdmVyU2hvd24gPSBmYWxzZTtcblxuICAgICAgICBlbGVtZW50LmRhdGEoXCJqaXRzaV9wb3BvdmVyXCIsIHRoaXMpO1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gJyA8ZGl2IGNsYXNzPVwiaml0c2lwb3BvdmVyICcgKyB0aGlzLm9wdGlvbnMuc2tpbiArXG4gICAgICAgICAgICAnXCI+PGRpdiBjbGFzcz1cImFycm93XCI+PC9kaXY+PGRpdiBjbGFzcz1cImppdHNpcG9wb3Zlci1jb250ZW50XCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImppdHNpUG9wdXBtZW51UGFkZGluZ1wiPjwvZGl2PjwvZGl2Pic7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5lbGVtZW50Lm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmVsZW1lbnRJc0hvdmVyZWQgPSB0cnVlO1xuICAgICAgICAgICAgc2VsZi5zaG93KCk7XG4gICAgICAgIH0pLm9uKFwibW91c2VsZWF2ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmVsZW1lbnRJc0hvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgICAgICAgfSwgMTApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyB0aGUgcG9wb3ZlclxuICAgICAqL1xuICAgIEppdHNpUG9wb3Zlci5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jcmVhdGVQb3BvdmVyKCk7XG4gICAgICAgIHRoaXMucG9wb3ZlclNob3duID0gdHJ1ZTtcblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBIaWRlcyB0aGUgcG9wb3ZlclxuICAgICAqL1xuICAgIEppdHNpUG9wb3Zlci5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoIXRoaXMuZWxlbWVudElzSG92ZXJlZCAmJiAhdGhpcy5wb3BvdmVySXNIb3ZlcmVkICYmIHRoaXMucG9wb3ZlclNob3duKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmZvcmNlSGlkZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEhpZGVzIHRoZSBwb3BvdmVyXG4gICAgICovXG4gICAgSml0c2lQb3BvdmVyLnByb3RvdHlwZS5mb3JjZUhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIuaml0c2lwb3BvdmVyXCIpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnBvcG92ZXJTaG93biA9IGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIHRoZSBwb3BvdmVyIGh0bWxcbiAgICAgKi9cbiAgICBKaXRzaVBvcG92ZXIucHJvdG90eXBlLmNyZWF0ZVBvcG92ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLnRlbXBsYXRlKTtcbiAgICAgICAgJChcIi5qaXRzaXBvcG92ZXIgPiAuaml0c2lwb3BvdmVyLWNvbnRlbnRcIikuaHRtbCh0aGlzLm9wdGlvbnMuY29udGVudCk7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJChcIi5qaXRzaXBvcG92ZXJcIikub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYucG9wb3ZlcklzSG92ZXJlZCA9IHRydWU7XG4gICAgICAgIH0pLm9uKFwibW91c2VsZWF2ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnBvcG92ZXJJc0hvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHNlbGYuaGlkZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJlZnJlc2hQb3NpdGlvbigpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBwb3BvdmVyXG4gICAgICovXG4gICAgSml0c2lQb3BvdmVyLnByb3RvdHlwZS5yZWZyZXNoUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoXCIuaml0c2lwb3BvdmVyXCIpLnBvc2l0aW9uKHtcbiAgICAgICAgICAgIG15OiBcImJvdHRvbVwiLFxuICAgICAgICAgICAgYXQ6IFwidG9wXCIsXG4gICAgICAgICAgICBjb2xsaXNpb246IFwiZml0XCIsXG4gICAgICAgICAgICBvZjogdGhpcy5lbGVtZW50LFxuICAgICAgICAgICAgdXNpbmc6IGZ1bmN0aW9uIChwb3NpdGlvbiwgZWxlbWVudHMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2FsY0xlZnQgPSBlbGVtZW50cy50YXJnZXQubGVmdCAtIGVsZW1lbnRzLmVsZW1lbnQubGVmdCArIGVsZW1lbnRzLnRhcmdldC53aWR0aC8yO1xuICAgICAgICAgICAgICAgICQoXCIuaml0c2lwb3BvdmVyXCIpLmNzcyh7dG9wOiBwb3NpdGlvbi50b3AsIGxlZnQ6IHBvc2l0aW9uLmxlZnQsIGRpc3BsYXk6IFwidGFibGVcIn0pO1xuICAgICAgICAgICAgICAgICQoXCIuaml0c2lwb3BvdmVyID4gLmFycm93XCIpLmNzcyh7bGVmdDogY2FsY0xlZnR9KTtcbiAgICAgICAgICAgICAgICAkKFwiLmppdHNpcG9wb3ZlciA+IC5qaXRzaVBvcHVwbWVudVBhZGRpbmdcIikuY3NzKHtsZWZ0OiBjYWxjTGVmdCAtIDUwfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBjb250ZW50IG9mIHBvcG92ZXIuXG4gICAgICogQHBhcmFtIGNvbnRlbnQgbmV3IGNvbnRlbnRcbiAgICAgKi9cbiAgICBKaXRzaVBvcG92ZXIucHJvdG90eXBlLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIGlmKCF0aGlzLnBvcG92ZXJTaG93bilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgJChcIi5qaXRzaXBvcG92ZXJcIikucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlUG9wb3ZlcigpO1xuICAgIH07XG5cbiAgICByZXR1cm4gSml0c2lQb3BvdmVyO1xuXG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gSml0c2lQb3BvdmVyOyIsIi8qIGdsb2JhbCAkLCBqUXVlcnkgKi9cbnZhciBtZXNzYWdlSGFuZGxlciA9IChmdW5jdGlvbihteSkge1xuXG4gICAgLyoqXG4gICAgICogU2hvd3MgYSBtZXNzYWdlIHRvIHRoZSB1c2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlU3RyaW5nIHRoZSB0aXRsZSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZXNzYWdlU3RyaW5nIHRoZSB0ZXh0IG9mIHRoZSBtZXNzYWdlXG4gICAgICovXG4gICAgbXkub3Blbk1lc3NhZ2VEaWFsb2cgPSBmdW5jdGlvbih0aXRsZVN0cmluZywgbWVzc2FnZVN0cmluZykge1xuICAgICAgICAkLnByb21wdChtZXNzYWdlU3RyaW5nLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZVN0cmluZyxcbiAgICAgICAgICAgICAgICBwZXJzaXN0ZW50OiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXIgd2l0aCB0d28gYnV0dG9uczogZmlyc3QgaXMgZ2l2ZW4gYXMgYSBwYXJhbWV0ZXIgYW5kIHRoZSBzZWNvbmQgaXMgQ2FuY2VsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlU3RyaW5nIHRoZSB0aXRsZSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtc2dTdHJpbmcgdGhlIHRleHQgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gcGVyc2lzdGVudCBib29sZWFuIHZhbHVlIHdoaWNoIGRldGVybWluZXMgd2hldGhlciB0aGUgbWVzc2FnZSBpcyBwZXJzaXN0ZW50IG9yIG5vdFxuICAgICAqIEBwYXJhbSBsZWZ0QnV0dG9uIHRoZSBmaXN0IGJ1dHRvbidzIHRleHRcbiAgICAgKiBAcGFyYW0gc3VibWl0RnVuY3Rpb24gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHN1Ym1pdFxuICAgICAqIEBwYXJhbSBsb2FkZWRGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHByb21wdCBpcyBmdWxseSBsb2FkZWRcbiAgICAgKiBAcGFyYW0gY2xvc2VGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHByb21wdCBpcyBjbG9zZWRcbiAgICAgKi9cbiAgICBteS5vcGVuVHdvQnV0dG9uRGlhbG9nID0gZnVuY3Rpb24odGl0bGVTdHJpbmcsIG1zZ1N0cmluZywgcGVyc2lzdGVudCwgbGVmdEJ1dHRvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWl0RnVuY3Rpb24sIGxvYWRlZEZ1bmN0aW9uLCBjbG9zZUZ1bmN0aW9uKSB7XG4gICAgICAgIHZhciBidXR0b25zID0ge307XG4gICAgICAgIGJ1dHRvbnNbbGVmdEJ1dHRvbl0gPSB0cnVlO1xuICAgICAgICBidXR0b25zLkNhbmNlbCA9IGZhbHNlO1xuICAgICAgICAkLnByb21wdChtc2dTdHJpbmcsIHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZVN0cmluZyxcbiAgICAgICAgICAgIHBlcnNpc3RlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgYnV0dG9uczogYnV0dG9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRCdXR0b246IDEsXG4gICAgICAgICAgICBsb2FkZWQ6IGxvYWRlZEZ1bmN0aW9uLFxuICAgICAgICAgICAgc3VibWl0OiBzdWJtaXRGdW5jdGlvbixcbiAgICAgICAgICAgIGNsb3NlOiBjbG9zZUZ1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXIgd2l0aCB0d28gYnV0dG9uczogZmlyc3QgaXMgZ2l2ZW4gYXMgYSBwYXJhbWV0ZXIgYW5kIHRoZSBzZWNvbmQgaXMgQ2FuY2VsLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlU3RyaW5nIHRoZSB0aXRsZSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtc2dTdHJpbmcgdGhlIHRleHQgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gcGVyc2lzdGVudCBib29sZWFuIHZhbHVlIHdoaWNoIGRldGVybWluZXMgd2hldGhlciB0aGUgbWVzc2FnZSBpcyBwZXJzaXN0ZW50IG9yIG5vdFxuICAgICAqIEBwYXJhbSBidXR0b25zIG9iamVjdCB3aXRoIHRoZSBidXR0b25zLiBUaGUga2V5cyBtdXN0IGJlIHRoZSBuYW1lIG9mIHRoZSBidXR0b24gYW5kIHZhbHVlIGlzIHRoZSB2YWx1ZVxuICAgICAqIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gc3VibWl0RnVuY3Rpb25cbiAgICAgKiBAcGFyYW0gc3VibWl0RnVuY3Rpb24gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHN1Ym1pdFxuICAgICAqIEBwYXJhbSBsb2FkZWRGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHByb21wdCBpcyBmdWxseSBsb2FkZWRcbiAgICAgKi9cbiAgICBteS5vcGVuRGlhbG9nID0gZnVuY3Rpb24gKHRpdGxlU3RyaW5nLCAgICBtc2dTdHJpbmcsIHBlcnNpc3RlbnQsIGJ1dHRvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtaXRGdW5jdGlvbiwgbG9hZGVkRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSB7XG4gICAgICAgICAgICB0aXRsZTogdGl0bGVTdHJpbmcsXG4gICAgICAgICAgICBwZXJzaXN0ZW50OiBwZXJzaXN0ZW50LFxuICAgICAgICAgICAgYnV0dG9uczogYnV0dG9ucyxcbiAgICAgICAgICAgIGRlZmF1bHRCdXR0b246IDEsXG4gICAgICAgICAgICBsb2FkZWQ6IGxvYWRlZEZ1bmN0aW9uLFxuICAgICAgICAgICAgc3VibWl0OiBzdWJtaXRGdW5jdGlvblxuICAgICAgICB9O1xuICAgICAgICBpZiAocGVyc2lzdGVudCkge1xuICAgICAgICAgICAgYXJncy5jbG9zZVRleHQgPSAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJC5wcm9tcHQobXNnU3RyaW5nLCBhcmdzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2xvc2VzIGN1cnJlbnRseSBvcGVuZWQgZGlhbG9nLlxuICAgICAqL1xuICAgIG15LmNsb3NlRGlhbG9nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkLnByb21wdC5jbG9zZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIGRpYWxvZyB3aXRoIGRpZmZlcmVudCBzdGF0ZXMgdG8gdGhlIHVzZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdGVzT2JqZWN0IG9iamVjdCBjb250YWluaW5nIGFsbCB0aGUgc3RhdGVzIG9mIHRoZSBkaWFsb2dcbiAgICAgKiBAcGFyYW0gbG9hZGVkRnVuY3Rpb24gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBwcm9tcHQgaXMgZnVsbHkgbG9hZGVkXG4gICAgICogQHBhcmFtIHN0YXRlQ2hhbmdlZEZ1bmN0aW9uIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBzdGF0ZSBvZiB0aGUgZGlhbG9nIGlzIGNoYW5nZWRcbiAgICAgKi9cbiAgICBteS5vcGVuRGlhbG9nV2l0aFN0YXRlcyA9IGZ1bmN0aW9uKHN0YXRlc09iamVjdCwgbG9hZGVkRnVuY3Rpb24sIHN0YXRlQ2hhbmdlZEZ1bmN0aW9uKSB7XG5cblxuICAgICAgICB2YXIgbXlQcm9tcHQgPSAkLnByb21wdChzdGF0ZXNPYmplY3QpO1xuXG4gICAgICAgIG15UHJvbXB0Lm9uKCdpbXByb21wdHU6bG9hZGVkJywgbG9hZGVkRnVuY3Rpb24pO1xuICAgICAgICBteVByb21wdC5vbignaW1wcm9tcHR1OnN0YXRlY2hhbmdlZCcsIHN0YXRlQ2hhbmdlZEZ1bmN0aW9uKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3BlbnMgbmV3IHBvcHVwIHdpbmRvdyBmb3IgZ2l2ZW4gPHR0PnVybDwvdHQ+IGNlbnRlcmVkIG92ZXIgY3VycmVudFxuICAgICAqIHdpbmRvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1cmwgdGhlIFVSTCB0byBiZSBkaXNwbGF5ZWQgaW4gdGhlIHBvcHVwIHdpbmRvd1xuICAgICAqIEBwYXJhbSB3IHRoZSB3aWR0aCBvZiB0aGUgcG9wdXAgd2luZG93XG4gICAgICogQHBhcmFtIGggdGhlIGhlaWdodCBvZiB0aGUgcG9wdXAgd2luZG93XG4gICAgICogQHBhcmFtIG9uUG9wdXBDbG9zZWQgb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gY2FsbGVkIHdoZW4gcG9wdXAgd2luZG93XG4gICAgICogICAgICAgIGhhcyBiZWVuIGNsb3NlZC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHBvcHVwIHdpbmRvdyBvYmplY3QgaWYgb3BlbmVkIHN1Y2Nlc3NmdWxseSBvciB1bmRlZmluZWRcbiAgICAgKiAgICAgICAgICBpbiBjYXNlIHdlIGZhaWxlZCB0byBvcGVuIGl0KHBvcHVwIGJsb2NrZWQpXG4gICAgICovXG4gICAgbXkub3BlbkNlbnRlcmVkUG9wdXAgPSBmdW5jdGlvbiAodXJsLCB3LCBoLCBvblBvcHVwQ2xvc2VkKSB7XG4gICAgICAgIHZhciBsID0gd2luZG93LnNjcmVlblggKyAod2luZG93LmlubmVyV2lkdGggLyAyKSAtICh3IC8gMik7XG4gICAgICAgIHZhciB0ID0gd2luZG93LnNjcmVlblkgKyAod2luZG93LmlubmVySGVpZ2h0IC8gMikgLSAoaCAvIDIpO1xuICAgICAgICB2YXIgcG9wdXAgPSB3aW5kb3cub3BlbihcbiAgICAgICAgICAgIHVybCwgJ19ibGFuaycsXG4gICAgICAgICAgICAndG9wPScgKyB0ICsgJywgbGVmdD0nICsgbCArICcsIHdpZHRoPScgKyB3ICsgJywgaGVpZ2h0PScgKyBoICsgJycpO1xuICAgICAgICBpZiAocG9wdXAgJiYgb25Qb3B1cENsb3NlZCkge1xuICAgICAgICAgICAgdmFyIHBvbGxUaW1lciA9IHdpbmRvdy5zZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBvcHVwLmNsb3NlZCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwocG9sbFRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgb25Qb3B1cENsb3NlZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBvcHVwO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIGRpYWxvZyBwcm9tcHRpbmcgdGhlIHVzZXIgdG8gc2VuZCBhbiBlcnJvciByZXBvcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGVTdHJpbmcgdGhlIHRpdGxlIG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1zZ1N0cmluZyB0aGUgdGV4dCBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBlcnJvciB0aGUgZXJyb3IgdGhhdCBpcyBiZWluZyByZXBvcnRlZFxuICAgICAqL1xuICAgIG15Lm9wZW5SZXBvcnREaWFsb2cgPSBmdW5jdGlvbih0aXRsZVN0cmluZywgbXNnU3RyaW5nLCBlcnJvcikge1xuICAgICAgICBteS5vcGVuTWVzc2FnZURpYWxvZyh0aXRsZVN0cmluZywgbXNnU3RyaW5nKTtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAvL0ZJWE1FIHNlbmQgdGhlIGVycm9yIHRvIHRoZSBzZXJ2ZXJcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIFNob3dzIGFuIGVycm9yIGRpYWxvZyB0byB0aGUgdXNlci5cbiAgICAgKiBAcGFyYW0gdGl0bGUgdGhlIHRpdGxlIG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgdGhlIHRleHQgb2YgdGhlIG1lc3NhZmVcbiAgICAgKi9cbiAgICBteS5zaG93RXJyb3IgPSBmdW5jdGlvbih0aXRsZSwgbWVzc2FnZSkge1xuICAgICAgICBpZighKHRpdGxlIHx8IG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICB0aXRsZSA9IHRpdGxlIHx8IFwiT29wcyFcIjtcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiVGhlcmUgd2FzIHNvbWUga2luZCBvZiBlcnJvclwiO1xuICAgICAgICB9XG4gICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5NZXNzYWdlRGlhbG9nKHRpdGxlLCBtZXNzYWdlKTtcbiAgICB9O1xuXG4gICAgbXkubm90aWZ5ID0gZnVuY3Rpb24oZGlzcGxheU5hbWUsIGNscywgbWVzc2FnZSkge1xuICAgICAgICB0b2FzdHIuaW5mbyhcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cIm5pY2tuYW1lXCI+JyArXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWUgK1xuICAgICAgICAgICAgJzwvc3Bhbj48YnI+JyArXG4gICAgICAgICAgICAnPHNwYW4gY2xhc3M9JyArIGNscyArICc+JyArXG4gICAgICAgICAgICAgICAgbWVzc2FnZSArXG4gICAgICAgICAgICAnPC9zcGFuPicpO1xuICAgIH07XG5cbiAgICByZXR1cm4gbXk7XG59KG1lc3NhZ2VIYW5kbGVyIHx8IHt9KSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbWVzc2FnZUhhbmRsZXI7XG5cblxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IGhyaXN0byBvbiAxMi8yMi8xNC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYXZhaWxhYmxlIHZpZGVvIHdpZHRoLlxuICAgICAqL1xuICAgIGdldEF2YWlsYWJsZVZpZGVvV2lkdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIFBhbmVsVG9nZ2xlciA9IHJlcXVpcmUoXCIuLi9zaWRlX3Bhbm5lbHMvU2lkZVBhbmVsVG9nZ2xlclwiKTtcbiAgICAgICAgdmFyIHJpZ2h0UGFuZWxXaWR0aFxuICAgICAgICAgICAgPSBQYW5lbFRvZ2dsZXIuaXNWaXNpYmxlKCkgPyBQYW5lbFRvZ2dsZXIuZ2V0UGFuZWxTaXplKClbMF0gOiAwO1xuXG4gICAgICAgIHJldHVybiB3aW5kb3cuaW5uZXJXaWR0aCAtIHJpZ2h0UGFuZWxXaWR0aDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHN0eWxlIGNsYXNzIG9mIHRoZSBlbGVtZW50IGdpdmVuIGJ5IGlkLlxuICAgICAqL1xuICAgIGJ1dHRvbkNsaWNrOiBmdW5jdGlvbihpZCwgY2xhc3NuYW1lKSB7XG4gICAgICAgICQoaWQpLnRvZ2dsZUNsYXNzKGNsYXNzbmFtZSk7IC8vIGFkZCB0aGUgY2xhc3MgdG8gdGhlIGNsaWNrZWQgZWxlbWVudFxuICAgIH1cblxuXG59OyIsInZhciBKaXRzaVBvcG92ZXIgPSByZXF1aXJlKFwiLi4vdXRpbC9KaXRzaVBvcG92ZXJcIik7XG5cbi8qKlxuICogQ29uc3RydWN0cyBuZXcgY29ubmVjdGlvbiBpbmRpY2F0b3IuXG4gKiBAcGFyYW0gdmlkZW9Db250YWluZXIgdGhlIHZpZGVvIGNvbnRhaW5lciBhc3NvY2lhdGVkIHdpdGggdGhlIGluZGljYXRvci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDb25uZWN0aW9uSW5kaWNhdG9yKHZpZGVvQ29udGFpbmVyLCBqaWQsIFZpZGVvTGF5b3V0KVxue1xuICAgIHRoaXMudmlkZW9Db250YWluZXIgPSB2aWRlb0NvbnRhaW5lcjtcbiAgICB0aGlzLmJhbmR3aWR0aCA9IG51bGw7XG4gICAgdGhpcy5wYWNrZXRMb3NzID0gbnVsbDtcbiAgICB0aGlzLmJpdHJhdGUgPSBudWxsO1xuICAgIHRoaXMuc2hvd01vcmVWYWx1ZSA9IGZhbHNlO1xuICAgIHRoaXMucmVzb2x1dGlvbiA9IG51bGw7XG4gICAgdGhpcy50cmFuc3BvcnQgPSBbXTtcbiAgICB0aGlzLnBvcG92ZXIgPSBudWxsO1xuICAgIHRoaXMuamlkID0gamlkO1xuICAgIHRoaXMuY3JlYXRlKCk7XG4gICAgdGhpcy52aWRlb0xheW91dCA9IFZpZGVvTGF5b3V0O1xufVxuXG4vKipcbiAqIFZhbHVlcyBmb3IgdGhlIGNvbm5lY3Rpb24gcXVhbGl0eVxuICogQHR5cGUge3s5ODogc3RyaW5nLFxuICogICAgICAgICA4MTogc3RyaW5nLFxuICogICAgICAgICA2NDogc3RyaW5nLFxuICogICAgICAgICA0Nzogc3RyaW5nLFxuICogICAgICAgICAzMDogc3RyaW5nLFxuICogICAgICAgICAwOiBzdHJpbmd9fVxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLmNvbm5lY3Rpb25RdWFsaXR5VmFsdWVzID0ge1xuICAgIDk4OiBcIjE4cHhcIiwgLy9mdWxsXG4gICAgODE6IFwiMTVweFwiLC8vNCBiYXJzXG4gICAgNjQ6IFwiMTFweFwiLC8vMyBiYXJzXG4gICAgNDc6IFwiN3B4XCIsLy8yIGJhcnNcbiAgICAzMDogXCIzcHhcIiwvLzEgYmFyXG4gICAgMDogXCIwcHhcIi8vZW1wdHlcbn07XG5cbkNvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0SVAgPSBmdW5jdGlvbih2YWx1ZSlcbntcbiAgICByZXR1cm4gdmFsdWUuc3Vic3RyaW5nKDAsIHZhbHVlLmxhc3RJbmRleE9mKFwiOlwiKSk7XG59O1xuXG5Db25uZWN0aW9uSW5kaWNhdG9yLmdldFBvcnQgPSBmdW5jdGlvbih2YWx1ZSlcbntcbiAgICByZXR1cm4gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmxhc3RJbmRleE9mKFwiOlwiKSArIDEsIHZhbHVlLmxlbmd0aCk7XG59O1xuXG5Db25uZWN0aW9uSW5kaWNhdG9yLmdldFN0cmluZ0Zyb21BcnJheSA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgIHZhciByZXMgPSBcIlwiO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKylcbiAgICB7XG4gICAgICAgIHJlcyArPSAoaSA9PT0gMD8gXCJcIiA6IFwiLCBcIikgKyBhcnJheVtpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBodG1sIGNvbnRlbnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSB0aGUgaHRtbCBjb250ZW50LlxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS5nZW5lcmF0ZVRleHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRvd25sb2FkQml0cmF0ZSwgdXBsb2FkQml0cmF0ZSwgcGFja2V0TG9zcywgcmVzb2x1dGlvbiwgaTtcblxuICAgIGlmKHRoaXMuYml0cmF0ZSA9PT0gbnVsbClcbiAgICB7XG4gICAgICAgIGRvd25sb2FkQml0cmF0ZSA9IFwiTi9BXCI7XG4gICAgICAgIHVwbG9hZEJpdHJhdGUgPSBcIk4vQVwiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBkb3dubG9hZEJpdHJhdGUgPVxuICAgICAgICAgICAgdGhpcy5iaXRyYXRlLmRvd25sb2FkPyB0aGlzLmJpdHJhdGUuZG93bmxvYWQgKyBcIiBLYnBzXCIgOiBcIk4vQVwiO1xuICAgICAgICB1cGxvYWRCaXRyYXRlID1cbiAgICAgICAgICAgIHRoaXMuYml0cmF0ZS51cGxvYWQ/IHRoaXMuYml0cmF0ZS51cGxvYWQgKyBcIiBLYnBzXCIgOiBcIk4vQVwiO1xuICAgIH1cblxuICAgIGlmKHRoaXMucGFja2V0TG9zcyA9PT0gbnVsbClcbiAgICB7XG4gICAgICAgIHBhY2tldExvc3MgPSBcIk4vQVwiO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuXG4gICAgICAgIHBhY2tldExvc3MgPSBcIjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfZ3JlZW4nPiZkYXJyOzwvc3Bhbj5cIiArXG4gICAgICAgICAgICAodGhpcy5wYWNrZXRMb3NzLmRvd25sb2FkICE9PSBudWxsPyB0aGlzLnBhY2tldExvc3MuZG93bmxvYWQgOiBcIk4vQVwiKSArXG4gICAgICAgICAgICBcIiUgPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9vcmFuZ2UnPiZ1YXJyOzwvc3Bhbj5cIiArXG4gICAgICAgICAgICAodGhpcy5wYWNrZXRMb3NzLnVwbG9hZCAhPT0gbnVsbD8gdGhpcy5wYWNrZXRMb3NzLnVwbG9hZCA6IFwiTi9BXCIpICsgXCIlXCI7XG4gICAgfVxuXG4gICAgdmFyIHJlc29sdXRpb25WYWx1ZSA9IG51bGw7XG4gICAgaWYodGhpcy5yZXNvbHV0aW9uICYmIHRoaXMuamlkICE9IG51bGwpXG4gICAge1xuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMucmVzb2x1dGlvbik7XG4gICAgICAgIGlmKGtleXMubGVuZ3RoID09IDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvcih2YXIgc3NyYyBpbiB0aGlzLnJlc29sdXRpb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvblZhbHVlID0gdGhpcy5yZXNvbHV0aW9uW3NzcmNdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoa2V5cy5sZW5ndGggPiAxKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheWVkU3NyYyA9IHNpbXVsY2FzdC5nZXRSZWNlaXZpbmdTU1JDKHRoaXMuamlkKTtcbiAgICAgICAgICAgIHJlc29sdXRpb25WYWx1ZSA9IHRoaXMucmVzb2x1dGlvbltkaXNwbGF5ZWRTc3JjXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmKHRoaXMuamlkID09PSBudWxsKVxuICAgIHtcbiAgICAgICAgcmVzb2x1dGlvbiA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucmVzb2x1dGlvbiA9PT0gbnVsbCB8fCAhT2JqZWN0LmtleXModGhpcy5yZXNvbHV0aW9uKSB8fFxuICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5yZXNvbHV0aW9uKS5sZW5ndGggPT09IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJlc29sdXRpb24gPSBcIk4vQVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGZvcihpIGluIHRoaXMucmVzb2x1dGlvbilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uVmFsdWUgPSB0aGlzLnJlc29sdXRpb25baV07XG4gICAgICAgICAgICAgICAgaWYocmVzb2x1dGlvblZhbHVlKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzb2x1dGlvblZhbHVlLmhlaWdodCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvblZhbHVlLndpZHRoKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uICs9IChyZXNvbHV0aW9uID09PSBcIlwiPyBcIlwiIDogXCIsIFwiKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvblZhbHVlLndpZHRoICsgXCJ4XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdXRpb25WYWx1ZS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYoIXJlc29sdXRpb25WYWx1ZSB8fFxuICAgICAgICAhcmVzb2x1dGlvblZhbHVlLmhlaWdodCB8fFxuICAgICAgICAhcmVzb2x1dGlvblZhbHVlLndpZHRoKVxuICAgIHtcbiAgICAgICAgcmVzb2x1dGlvbiA9IFwiTi9BXCI7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHJlc29sdXRpb24gPSByZXNvbHV0aW9uVmFsdWUud2lkdGggKyBcInhcIiArIHJlc29sdXRpb25WYWx1ZS5oZWlnaHQ7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9IFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz5cIiArXG4gICAgICAgIFwiPHRyPlwiICtcbiAgICAgICAgXCI8dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5CaXRyYXRlOjwvc3Bhbj48L3RkPlwiICtcbiAgICAgICAgXCI8dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ncmVlbic+JmRhcnI7PC9zcGFuPlwiICtcbiAgICAgICAgZG93bmxvYWRCaXRyYXRlICsgXCIgPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9vcmFuZ2UnPiZ1YXJyOzwvc3Bhbj5cIiArXG4gICAgICAgIHVwbG9hZEJpdHJhdGUgKyBcIjwvdGQ+XCIgK1xuICAgICAgICBcIjwvdHI+PHRyPlwiICtcbiAgICAgICAgXCI8dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5QYWNrZXQgbG9zczogPC9zcGFuPjwvdGQ+XCIgK1xuICAgICAgICBcIjx0ZD5cIiArIHBhY2tldExvc3MgICsgXCI8L3RkPlwiICtcbiAgICAgICAgXCI8L3RyPjx0cj5cIiArXG4gICAgICAgIFwiPHRkPjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+UmVzb2x1dGlvbjo8L3NwYW4+PC90ZD5cIiArXG4gICAgICAgIFwiPHRkPlwiICsgcmVzb2x1dGlvbiArIFwiPC90ZD48L3RyPjwvdGFibGU+XCI7XG5cbiAgICBpZih0aGlzLnZpZGVvQ29udGFpbmVyLmlkID09IFwibG9jYWxWaWRlb0NvbnRhaW5lclwiKVxuICAgICAgICByZXN1bHQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJqaXRzaXBvcG92ZXJfc2hvd21vcmVcXFwiIFwiICtcbiAgICAgICAgICAgIFwib25jbGljayA9IFxcXCJVSS5jb25uZWN0aW9uSW5kaWNhdG9yU2hvd01vcmUoJ1wiICtcbiAgICAgICAgICAgIHRoaXMudmlkZW9Db250YWluZXIuaWQgKyBcIicpXFxcIj5cIiArXG4gICAgICAgICAgICAodGhpcy5zaG93TW9yZVZhbHVlPyBcIlNob3cgbGVzc1wiIDogXCJTaG93IE1vcmVcIikgKyBcIjwvZGl2PjxiciAvPlwiO1xuXG4gICAgaWYodGhpcy5zaG93TW9yZVZhbHVlKVxuICAgIHtcbiAgICAgICAgdmFyIGRvd25sb2FkQmFuZHdpZHRoLCB1cGxvYWRCYW5kd2lkdGgsIHRyYW5zcG9ydDtcbiAgICAgICAgaWYodGhpcy5iYW5kd2lkdGggPT09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGRvd25sb2FkQmFuZHdpZHRoID0gXCJOL0FcIjtcbiAgICAgICAgICAgIHVwbG9hZEJhbmR3aWR0aCA9IFwiTi9BXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBkb3dubG9hZEJhbmR3aWR0aCA9IHRoaXMuYmFuZHdpZHRoLmRvd25sb2FkP1xuICAgICAgICAgICAgICAgIHRoaXMuYmFuZHdpZHRoLmRvd25sb2FkICsgXCIgS2Jwc1wiIDpcbiAgICAgICAgICAgICAgICBcIk4vQVwiO1xuICAgICAgICAgICAgdXBsb2FkQmFuZHdpZHRoID0gdGhpcy5iYW5kd2lkdGgudXBsb2FkP1xuICAgICAgICAgICAgICAgIHRoaXMuYmFuZHdpZHRoLnVwbG9hZCArIFwiIEticHNcIiA6XG4gICAgICAgICAgICAgICAgXCJOL0FcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCF0aGlzLnRyYW5zcG9ydCB8fCB0aGlzLnRyYW5zcG9ydC5sZW5ndGggPT09IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9IFwiPHRyPlwiICtcbiAgICAgICAgICAgICAgICBcIjx0ZD48c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkFkZHJlc3M6PC9zcGFuPjwvdGQ+XCIgK1xuICAgICAgICAgICAgICAgIFwiPHRkPiBOL0E8L3RkPjwvdHI+XCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHtyZW1vdGVJUDogW10sIGxvY2FsSVA6W10sIHJlbW90ZVBvcnQ6W10sIGxvY2FsUG9ydDpbXX07XG4gICAgICAgICAgICBmb3IoaSA9IDA7IGkgPCB0aGlzLnRyYW5zcG9ydC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgaXAgPSAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRJUCh0aGlzLnRyYW5zcG9ydFtpXS5pcCk7XG4gICAgICAgICAgICAgICAgdmFyIHBvcnQgPSBDb25uZWN0aW9uSW5kaWNhdG9yLmdldFBvcnQodGhpcy50cmFuc3BvcnRbaV0uaXApO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhbElQID1cbiAgICAgICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRJUCh0aGlzLnRyYW5zcG9ydFtpXS5sb2NhbGlwKTtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYWxQb3J0ID1cbiAgICAgICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRQb3J0KHRoaXMudHJhbnNwb3J0W2ldLmxvY2FsaXApO1xuICAgICAgICAgICAgICAgIGlmKGRhdGEucmVtb3RlSVAuaW5kZXhPZihpcCkgPT0gLTEpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnJlbW90ZUlQLnB1c2goaXApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKGRhdGEucmVtb3RlUG9ydC5pbmRleE9mKHBvcnQpID09IC0xKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5yZW1vdGVQb3J0LnB1c2gocG9ydCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYoZGF0YS5sb2NhbElQLmluZGV4T2YobG9jYWxJUCkgPT0gLTEpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLmxvY2FsSVAucHVzaChsb2NhbElQKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihkYXRhLmxvY2FsUG9ydC5pbmRleE9mKGxvY2FsUG9ydCkgPT0gLTEpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLmxvY2FsUG9ydC5wdXNoKGxvY2FsUG9ydCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbG9jYWxUcmFuc3BvcnQgPVxuICAgICAgICAgICAgICAgIFwiPHRyPjx0ZD48c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkxvY2FsIGFkZHJlc3NcIiArXG4gICAgICAgICAgICAgICAgKGRhdGEubG9jYWxJUC5sZW5ndGggPiAxPyBcImVzXCIgOiBcIlwiKSArIFwiOiA8L3NwYW4+PC90ZD48dGQ+IFwiICtcbiAgICAgICAgICAgICAgICBDb25uZWN0aW9uSW5kaWNhdG9yLmdldFN0cmluZ0Zyb21BcnJheShkYXRhLmxvY2FsSVApICtcbiAgICAgICAgICAgICAgICBcIjwvdGQ+PC90cj5cIjtcbiAgICAgICAgICAgIHRyYW5zcG9ydCA9XG4gICAgICAgICAgICAgICAgXCI8dHI+PHRkPjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+UmVtb3RlIGFkZHJlc3NcIitcbiAgICAgICAgICAgICAgICAoZGF0YS5yZW1vdGVJUC5sZW5ndGggPiAxPyBcImVzXCIgOiBcIlwiKSArIFwiOjwvc3Bhbj48L3RkPjx0ZD4gXCIgK1xuICAgICAgICAgICAgICAgIENvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0U3RyaW5nRnJvbUFycmF5KGRhdGEucmVtb3RlSVApICtcbiAgICAgICAgICAgICAgICBcIjwvdGQ+PC90cj5cIjtcbiAgICAgICAgICAgIGlmKHRoaXMudHJhbnNwb3J0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0ICs9IFwiPHRyPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8dGQ+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+UmVtb3RlIHBvcnRzOjwvc3Bhbj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPC90ZD48dGQ+XCI7XG4gICAgICAgICAgICAgICAgbG9jYWxUcmFuc3BvcnQgKz0gXCI8dHI+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjx0ZD5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5Mb2NhbCBwb3J0czo8L3NwYW4+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjwvdGQ+PHRkPlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRyYW5zcG9ydCArPVxuICAgICAgICAgICAgICAgICAgICBcIjx0cj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHRkPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPlJlbW90ZSBwb3J0Ojwvc3Bhbj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPC90ZD48dGQ+XCI7XG4gICAgICAgICAgICAgICAgbG9jYWxUcmFuc3BvcnQgKz1cbiAgICAgICAgICAgICAgICAgICAgXCI8dHI+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjx0ZD5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5Mb2NhbCBwb3J0Ojwvc3Bhbj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPC90ZD48dGQ+XCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYW5zcG9ydCArPVxuICAgICAgICAgICAgICAgIENvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0U3RyaW5nRnJvbUFycmF5KGRhdGEucmVtb3RlUG9ydCk7XG4gICAgICAgICAgICBsb2NhbFRyYW5zcG9ydCArPVxuICAgICAgICAgICAgICAgIENvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0U3RyaW5nRnJvbUFycmF5KGRhdGEubG9jYWxQb3J0KTtcbiAgICAgICAgICAgIHRyYW5zcG9ydCArPSBcIjwvdGQ+PC90cj5cIjtcbiAgICAgICAgICAgIHRyYW5zcG9ydCArPSBsb2NhbFRyYW5zcG9ydCArIFwiPC90ZD48L3RyPlwiO1xuICAgICAgICAgICAgdHJhbnNwb3J0ICs9XCI8dHI+XCIgK1xuICAgICAgICAgICAgICAgIFwiPHRkPjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+VHJhbnNwb3J0Ojwvc3Bhbj48L3RkPlwiICtcbiAgICAgICAgICAgICAgICBcIjx0ZD5cIiArIHRoaXMudHJhbnNwb3J0WzBdLnR5cGUgKyBcIjwvdGQ+PC90cj5cIjtcblxuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ICs9IFwiPHRhYmxlICBzdHlsZT0nd2lkdGg6MTAwJSc+XCIgK1xuICAgICAgICAgICAgXCI8dHI+XCIgK1xuICAgICAgICAgICAgXCI8dGQ+XCIgK1xuICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkVzdGltYXRlZCBiYW5kd2lkdGg6PC9zcGFuPlwiICtcbiAgICAgICAgICAgIFwiPC90ZD48dGQ+XCIgK1xuICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2dyZWVuJz4mZGFycjs8L3NwYW4+XCIgK1xuICAgICAgICAgICAgZG93bmxvYWRCYW5kd2lkdGggK1xuICAgICAgICAgICAgXCIgPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9vcmFuZ2UnPiZ1YXJyOzwvc3Bhbj5cIiArXG4gICAgICAgICAgICB1cGxvYWRCYW5kd2lkdGggKyBcIjwvdGQ+PC90cj5cIjtcblxuICAgICAgICByZXN1bHQgKz0gdHJhbnNwb3J0ICsgXCI8L3RhYmxlPlwiO1xuXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogU2hvd3Mgb3IgaGlkZSB0aGUgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUuc2hvd01vcmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zaG93TW9yZVZhbHVlID0gIXRoaXMuc2hvd01vcmVWYWx1ZTtcbiAgICB0aGlzLnVwZGF0ZVBvcG92ZXJEYXRhKCk7XG59O1xuXG5cbmZ1bmN0aW9uIGNyZWF0ZUljb24oY2xhc3NlcylcbntcbiAgICB2YXIgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIGZvcih2YXIgaSBpbiBjbGFzc2VzKVxuICAgIHtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKGNsYXNzZXNbaV0pO1xuICAgIH1cbiAgICBpY29uLmFwcGVuZENoaWxkKFxuICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaVwiKSkuY2xhc3NMaXN0LmFkZChcImljb24tY29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gaWNvbjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBpbmRpY2F0b3JcbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLmNsYXNzTmFtZSA9IFwiY29ubmVjdGlvbmluZGljYXRvclwiO1xuICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgdGhpcy52aWRlb0NvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIpO1xuICAgIHRoaXMucG9wb3ZlciA9IG5ldyBKaXRzaVBvcG92ZXIoXG4gICAgICAgICQoXCIjXCIgKyB0aGlzLnZpZGVvQ29udGFpbmVyLmlkICsgXCIgPiAuY29ubmVjdGlvbmluZGljYXRvclwiKSxcbiAgICAgICAge2NvbnRlbnQ6IFwiPGRpdiBjbGFzcz1cXFwiY29ubmVjdGlvbl9pbmZvXFxcIj5Db21lIGJhY2sgaGVyZSBmb3IgXCIgK1xuICAgICAgICAgICAgXCJjb25uZWN0aW9uIGluZm9ybWF0aW9uIG9uY2UgdGhlIGNvbmZlcmVuY2Ugc3RhcnRzPC9kaXY+XCIsXG4gICAgICAgICAgICBza2luOiBcImJsYWNrXCJ9KTtcblxuICAgIHRoaXMuZW1wdHlJY29uID0gdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLmFwcGVuZENoaWxkKFxuICAgICAgICBjcmVhdGVJY29uKFtcImNvbm5lY3Rpb25cIiwgXCJjb25uZWN0aW9uX2VtcHR5XCJdKSk7XG4gICAgdGhpcy5mdWxsSWNvbiA9IHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5hcHBlbmRDaGlsZChcbiAgICAgICAgY3JlYXRlSWNvbihbXCJjb25uZWN0aW9uXCIsIFwiY29ubmVjdGlvbl9mdWxsXCJdKSk7XG5cbn07XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgaW5kaWNhdG9yXG4gKi9cbkNvbm5lY3Rpb25JbmRpY2F0b3IucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKClcbntcbiAgICB0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIucmVtb3ZlKCk7XG4gICAgdGhpcy5wb3BvdmVyLmZvcmNlSGlkZSgpO1xuXG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGRhdGEgb2YgdGhlIGluZGljYXRvclxuICogQHBhcmFtIHBlcmNlbnQgdGhlIHBlcmNlbnQgb2YgY29ubmVjdGlvbiBxdWFsaXR5XG4gKiBAcGFyYW0gb2JqZWN0IHRoZSBzdGF0aXN0aWNzIGRhdGEuXG4gKi9cbkNvbm5lY3Rpb25JbmRpY2F0b3IucHJvdG90eXBlLnVwZGF0ZUNvbm5lY3Rpb25RdWFsaXR5ID1cbmZ1bmN0aW9uIChwZXJjZW50LCBvYmplY3QpIHtcblxuICAgIGlmKHBlcmNlbnQgPT09IG51bGwpXG4gICAge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB0aGlzLnBvcG92ZXIuZm9yY2VIaWRlKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgaWYodGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICAgICAgdGhpcy52aWRlb0xheW91dC51cGRhdGVNdXRlUG9zaXRpb24odGhpcy52aWRlb0NvbnRhaW5lci5pZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5iYW5kd2lkdGggPSBvYmplY3QuYmFuZHdpZHRoO1xuICAgIHRoaXMuYml0cmF0ZSA9IG9iamVjdC5iaXRyYXRlO1xuICAgIHRoaXMucGFja2V0TG9zcyA9IG9iamVjdC5wYWNrZXRMb3NzO1xuICAgIHRoaXMudHJhbnNwb3J0ID0gb2JqZWN0LnRyYW5zcG9ydDtcbiAgICBpZihvYmplY3QucmVzb2x1dGlvbilcbiAgICB7XG4gICAgICAgIHRoaXMucmVzb2x1dGlvbiA9IG9iamVjdC5yZXNvbHV0aW9uO1xuICAgIH1cbiAgICBmb3IodmFyIHF1YWxpdHkgaW4gQ29ubmVjdGlvbkluZGljYXRvci5jb25uZWN0aW9uUXVhbGl0eVZhbHVlcylcbiAgICB7XG4gICAgICAgIGlmKHBlcmNlbnQgPj0gcXVhbGl0eSlcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5mdWxsSWNvbi5zdHlsZS53aWR0aCA9XG4gICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5jb25uZWN0aW9uUXVhbGl0eVZhbHVlc1txdWFsaXR5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZVBvcG92ZXJEYXRhKCk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHJlc29sdXRpb25cbiAqIEBwYXJhbSByZXNvbHV0aW9uIHRoZSBuZXcgcmVzb2x1dGlvblxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS51cGRhdGVSZXNvbHV0aW9uID0gZnVuY3Rpb24gKHJlc29sdXRpb24pIHtcbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uO1xuICAgIHRoaXMudXBkYXRlUG9wb3ZlckRhdGEoKTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgY29udGVudCBvZiB0aGUgcG9wb3ZlclxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS51cGRhdGVQb3BvdmVyRGF0YSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBvcG92ZXIudXBkYXRlQ29udGVudChcbiAgICAgICAgICAgIFwiPGRpdiBjbGFzcz1cXFwiY29ubmVjdGlvbl9pbmZvXFxcIj5cIiArIHRoaXMuZ2VuZXJhdGVUZXh0KCkgKyBcIjwvZGl2PlwiKTtcbn07XG5cbi8qKlxuICogSGlkZXMgdGhlIHBvcG92ZXJcbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnBvcG92ZXIuZm9yY2VIaWRlKCk7XG59O1xuXG4vKipcbiAqIEhpZGVzIHRoZSBpbmRpY2F0b3JcbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUuaGlkZUluZGljYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGlmKHRoaXMucG9wb3ZlcilcbiAgICAgICAgdGhpcy5wb3BvdmVyLmZvcmNlSGlkZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uSW5kaWNhdG9yOyIsInZhciBBdWRpb0xldmVscyA9IHJlcXVpcmUoXCIuLi9hdWRpb19sZXZlbHMvQXVkaW9MZXZlbHNcIik7XG52YXIgQXZhdGFyID0gcmVxdWlyZShcIi4uL2F2YXRhci9BdmF0YXJcIik7XG52YXIgQ2hhdCA9IHJlcXVpcmUoXCIuLi9zaWRlX3Bhbm5lbHMvY2hhdC9DaGF0XCIpO1xudmFyIENvbnRhY3RMaXN0ID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9jb250YWN0bGlzdC9Db250YWN0TGlzdFwiKTtcbnZhciBVSVV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9VSVV0aWxcIik7XG52YXIgQ29ubmVjdGlvbkluZGljYXRvciA9IHJlcXVpcmUoXCIuL0Nvbm5lY3Rpb25JbmRpY2F0b3JcIik7XG5cbnZhciBjdXJyZW50RG9taW5hbnRTcGVha2VyID0gbnVsbDtcbnZhciBsYXN0TkNvdW50ID0gY29uZmlnLmNoYW5uZWxMYXN0TjtcbnZhciBsb2NhbExhc3ROQ291bnQgPSBjb25maWcuY2hhbm5lbExhc3ROO1xudmFyIGxvY2FsTGFzdE5TZXQgPSBbXTtcbnZhciBsYXN0TkVuZHBvaW50c0NhY2hlID0gW107XG52YXIgbGFzdE5QaWNrdXBKaWQgPSBudWxsO1xudmFyIGxhcmdlVmlkZW9TdGF0ZSA9IHtcbiAgICB1cGRhdGVJblByb2dyZXNzOiBmYWxzZSxcbiAgICBuZXdTcmM6ICcnXG59O1xuXG4vKipcbiAqIEluZGljYXRlcyBpZiB3ZSBoYXZlIG11dGVkIG91ciBhdWRpbyBiZWZvcmUgdGhlIGNvbmZlcmVuY2UgaGFzIHN0YXJ0ZWQuXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xudmFyIHByZU11dGVkID0gZmFsc2U7XG5cbnZhciBtdXRlZEF1ZGlvcyA9IHt9O1xuXG52YXIgZmxpcFhMb2NhbFZpZGVvID0gdHJ1ZTtcbnZhciBjdXJyZW50VmlkZW9XaWR0aCA9IG51bGw7XG52YXIgY3VycmVudFZpZGVvSGVpZ2h0ID0gbnVsbDtcblxudmFyIGxvY2FsVmlkZW9TcmMgPSBudWxsO1xuXG52YXIgZGVmYXVsdExvY2FsRGlzcGxheU5hbWUgPSBcIk1lXCI7XG5cbmZ1bmN0aW9uIHZpZGVvYWN0aXZlKCB2aWRlb2VsZW0pIHtcbiAgICBpZiAodmlkZW9lbGVtLmF0dHIoJ2lkJykuaW5kZXhPZignbWl4ZWRtc2xhYmVsJykgPT09IC0xKSB7XG4gICAgICAgIC8vIGlnbm9yZSBtaXhlZG1zbGFiZWxhMCBhbmQgdjBcblxuICAgICAgICB2aWRlb2VsZW0uc2hvdygpO1xuICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG5cbiAgICAgICAgdmFyIHZpZGVvUGFyZW50ID0gdmlkZW9lbGVtLnBhcmVudCgpO1xuICAgICAgICB2YXIgcGFyZW50UmVzb3VyY2VKaWQgPSBudWxsO1xuICAgICAgICBpZiAodmlkZW9QYXJlbnQpXG4gICAgICAgICAgICBwYXJlbnRSZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgID0gVmlkZW9MYXlvdXQuZ2V0UGVlckNvbnRhaW5lclJlc291cmNlSmlkKHZpZGVvUGFyZW50WzBdKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGxhcmdlIHZpZGVvIHRvIHRoZSBsYXN0IGFkZGVkIHZpZGVvIG9ubHkgaWYgdGhlcmUncyBub1xuICAgICAgICAvLyBjdXJyZW50IGRvbWluYW50LCBmb2N1c2VkIHNwZWFrZXIgb3IgcHJlemkgcGxheWluZyBvciB1cGRhdGUgaXQgdG9cbiAgICAgICAgLy8gdGhlIGN1cnJlbnQgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgaWYgKCghZm9jdXNlZFZpZGVvSW5mbyAmJlxuICAgICAgICAgICAgIVZpZGVvTGF5b3V0LmdldERvbWluYW50U3BlYWtlclJlc291cmNlSmlkKCkgJiZcbiAgICAgICAgICAgICFyZXF1aXJlKFwiLi4vcHJlemkvUHJlemlcIikuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpIHx8XG4gICAgICAgICAgICAocGFyZW50UmVzb3VyY2VKaWQgJiZcbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5nZXREb21pbmFudFNwZWFrZXJSZXNvdXJjZUppZCgpID09PSBwYXJlbnRSZXNvdXJjZUppZCkpIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oXG4gICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKHZpZGVvZWxlbVswXSksXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICBwYXJlbnRSZXNvdXJjZUppZCk7XG4gICAgICAgIH1cblxuICAgICAgICBWaWRlb0xheW91dC5zaG93TW9kZXJhdG9ySW5kaWNhdG9yKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3YWl0Rm9yUmVtb3RlVmlkZW8oc2VsZWN0b3IsIHNzcmMsIHN0cmVhbSwgamlkKSB7XG4gICAgLy8gWFhYKGdwKSBzbywgZXZlcnkgY2FsbCB0byB0aGlzIGZ1bmN0aW9uIGlzICphbHdheXMqIHByZWNlZGVkIGJ5IGEgY2FsbFxuICAgIC8vIHRvIHRoZSBSVEMuYXR0YWNoTWVkaWFTdHJlYW0oKSBmdW5jdGlvbiBidXQgdGhhdCBjYWxsIGlzICpub3QqIGZvbGxvd2VkXG4gICAgLy8gYnkgYW4gdXBkYXRlIHRvIHRoZSB2aWRlb1NyY1RvU3NyYyBtYXAhXG4gICAgLy9cbiAgICAvLyBUaGUgYWJvdmUgd2F5IG9mIGRvaW5nIHRoaW5ncyByZXN1bHRzIGluIHZpZGVvIFNSQ3MgdGhhdCBkb24ndCBjb3JyZXNwb25kXG4gICAgLy8gdG8gYW55IFNTUkMgZm9yIGEgc2hvcnQgcGVyaW9kIG9mIHRpbWUgKHRvIGJlIG1vcmUgcHJlY2lzZSwgZm9yIGFzIGxvbmdcbiAgICAvLyB0aGUgd2FpdEZvclJlbW90ZVZpZGVvIHRha2VzIHRvIGNvbXBsZXRlKS4gVGhpcyBjYXVzZXMgcHJvYmxlbXMgKHNlZVxuICAgIC8vIGJlbGxvdykuXG4gICAgLy9cbiAgICAvLyBJJ20gd29uZGVyaW5nIHdoeSB3ZSBuZWVkIHRvIGRvIHRoYXQ7IGkuZS4gd2h5IGNhbGwgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKClcbiAgICAvLyBhIHNlY29uZCB0aW1lIGluIGhlcmUgYW5kIG9ubHkgdGhlbiB1cGRhdGUgdGhlIHZpZGVvU3JjVG9Tc3JjIG1hcD8gV2h5XG4gICAgLy8gbm90IHNpbXBseSB1cGRhdGUgdGhlIHZpZGVvU3JjVG9Tc3JjIG1hcCB3aGVuIHRoZSBSVEMuYXR0YWNoTWVkaWFTdHJlYW0oKVxuICAgIC8vIGlzIGNhbGxlZCB0aGUgZmlyc3QgdGltZT8gSSBhY3R1YWxseSBkbyB0aGF0IGluIHRoZSBsYXN0TiBjaGFuZ2VkIGV2ZW50XG4gICAgLy8gaGFuZGxlciBiZWNhdXNlIHRoZSBcIm9ycGhhblwiIHZpZGVvIFNSQyBpcyBjYXVzaW5nIHRyb3VibGVzIHRoZXJlLiBUaGVcbiAgICAvLyBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIHdvdWxkIHRoZW4gYmUgdG8gZmlyZSB0aGUgXCJ2aWRlb2FjdGl2ZS5qaW5nbGVcIi5cbiAgICAvL1xuICAgIC8vIEZvb2QgZm9yIHRob3VnaCBJIGd1ZXNzIDotKVxuXG4gICAgaWYgKHNlbGVjdG9yLnJlbW92ZWQgfHwgIXNlbGVjdG9yLnBhcmVudCgpLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTWVkaWEgcmVtb3ZlZCBiZWZvcmUgaGFkIHN0YXJ0ZWRcIiwgc2VsZWN0b3IpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHN0cmVhbS5pZCA9PT0gJ21peGVkbXNsYWJlbCcpIHJldHVybjtcblxuICAgIGlmIChzZWxlY3RvclswXS5jdXJyZW50VGltZSA+IDApIHtcbiAgICAgICAgdmFyIHZpZGVvU3RyZWFtID0gc2ltdWxjYXN0LmdldFJlY2VpdmluZ1ZpZGVvU3RyZWFtKHN0cmVhbSk7XG4gICAgICAgIFJUQy5hdHRhY2hNZWRpYVN0cmVhbShzZWxlY3RvciwgdmlkZW9TdHJlYW0pOyAvLyBGSVhNRTogd2h5IGRvIGkgaGF2ZSB0byBkbyB0aGlzIGZvciBGRj9cblxuICAgICAgICAvLyBGSVhNRTogYWRkIGEgY2xhc3MgdGhhdCB3aWxsIGFzc29jaWF0ZSBwZWVyIEppZCwgdmlkZW8uc3JjLCBpdCdzIHNzcmMgYW5kIHZpZGVvIHR5cGVcbiAgICAgICAgLy8gICAgICAgIGluIG9yZGVyIHRvIGdldCByaWQgb2YgdG9vIG1hbnkgbWFwc1xuICAgICAgICBpZiAoc3NyYyAmJiBqaWQpIHtcbiAgICAgICAgICAgIGppZDJTc3JjW1N0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCldID0gc3NyYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIHNzcmMgZ2l2ZW4gZm9yIGppZFwiLCBqaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmlkZW9hY3RpdmUoc2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2FpdEZvclJlbW90ZVZpZGVvKHNlbGVjdG9yLCBzc3JjLCBzdHJlYW0sIGppZCk7XG4gICAgICAgIH0sIDI1MCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHZpZGVvIGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGluZGVudHMsXG4gKiBzbyB0aGF0IGlmIGZpdHMgaXRzIHBhcmVudC5cbiAqXG4gKiBAcmV0dXJuIGFuIGFycmF5IHdpdGggMiBlbGVtZW50cywgdGhlIGhvcml6b250YWwgaW5kZW50IGFuZCB0aGUgdmVydGljYWxcbiAqIGluZGVudFxuICovXG5mdW5jdGlvbiBnZXRDYW1lcmFWaWRlb1Bvc2l0aW9uKHZpZGVvV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VIZWlnaHQpIHtcbiAgICAvLyBQYXJlbnQgaGVpZ2h0IGlzbid0IGNvbXBsZXRlbHkgY2FsY3VsYXRlZCB3aGVuIHdlIHBvc2l0aW9uIHRoZSB2aWRlbyBpblxuICAgIC8vIGZ1bGwgc2NyZWVuIG1vZGUgYW5kIHRoaXMgaXMgd2h5IHdlIHVzZSB0aGUgc2NyZWVuIGhlaWdodCBpbiB0aGlzIGNhc2UuXG4gICAgLy8gTmVlZCB0byB0aGluayBpdCBmdXJ0aGVyIGF0IHNvbWUgcG9pbnQgYW5kIGltcGxlbWVudCBpdCBwcm9wZXJseS5cbiAgICB2YXIgaXNGdWxsU2NyZWVuID0gZG9jdW1lbnQuZnVsbFNjcmVlbiB8fFxuICAgICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuIHx8XG4gICAgICAgIGRvY3VtZW50LndlYmtpdElzRnVsbFNjcmVlbjtcbiAgICBpZiAoaXNGdWxsU2NyZWVuKVxuICAgICAgICB2aWRlb1NwYWNlSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgdmFyIGhvcml6b250YWxJbmRlbnQgPSAodmlkZW9TcGFjZVdpZHRoIC0gdmlkZW9XaWR0aCkgLyAyO1xuICAgIHZhciB2ZXJ0aWNhbEluZGVudCA9ICh2aWRlb1NwYWNlSGVpZ2h0IC0gdmlkZW9IZWlnaHQpIC8gMjtcblxuICAgIHJldHVybiBbaG9yaXpvbnRhbEluZGVudCwgdmVydGljYWxJbmRlbnRdO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHZpZGVvIGhvcml6b250YWwgYW5kIHZlcnRpY2FsIGluZGVudHMuXG4gKiBDZW50ZXJzIGhvcml6b250YWxseSBhbmQgdG9wIGFsaWducyB2ZXJ0aWNhbGx5LlxuICpcbiAqIEByZXR1cm4gYW4gYXJyYXkgd2l0aCAyIGVsZW1lbnRzLCB0aGUgaG9yaXpvbnRhbCBpbmRlbnQgYW5kIHRoZSB2ZXJ0aWNhbFxuICogaW5kZW50XG4gKi9cbmZ1bmN0aW9uIGdldERlc2t0b3BWaWRlb1Bvc2l0aW9uKHZpZGVvV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb0hlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VIZWlnaHQpIHtcblxuICAgIHZhciBob3Jpem9udGFsSW5kZW50ID0gKHZpZGVvU3BhY2VXaWR0aCAtIHZpZGVvV2lkdGgpIC8gMjtcblxuICAgIHZhciB2ZXJ0aWNhbEluZGVudCA9IDA7Ly8gVG9wIGFsaWduZWRcblxuICAgIHJldHVybiBbaG9yaXpvbnRhbEluZGVudCwgdmVydGljYWxJbmRlbnRdO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgdmlkZW8gZGltZW5zaW9ucywgc28gdGhhdCBpdCBjb3ZlcnMgdGhlIHNjcmVlbi5cbiAqIEl0IGxlYXZlcyBubyBlbXB0eSBhcmVhcywgYnV0IHNvbWUgcGFydHMgb2YgdGhlIHZpZGVvIG1pZ2h0IG5vdCBiZSB2aXNpYmxlLlxuICpcbiAqIEByZXR1cm4gYW4gYXJyYXkgd2l0aCAyIGVsZW1lbnRzLCB0aGUgdmlkZW8gd2lkdGggYW5kIHRoZSB2aWRlbyBoZWlnaHRcbiAqL1xuZnVuY3Rpb24gZ2V0Q2FtZXJhVmlkZW9TaXplKHZpZGVvV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9TcGFjZVdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VIZWlnaHQpIHtcbiAgICBpZiAoIXZpZGVvV2lkdGgpXG4gICAgICAgIHZpZGVvV2lkdGggPSBjdXJyZW50VmlkZW9XaWR0aDtcbiAgICBpZiAoIXZpZGVvSGVpZ2h0KVxuICAgICAgICB2aWRlb0hlaWdodCA9IGN1cnJlbnRWaWRlb0hlaWdodDtcblxuICAgIHZhciBhc3BlY3RSYXRpbyA9IHZpZGVvV2lkdGggLyB2aWRlb0hlaWdodDtcblxuICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KHZpZGVvV2lkdGgsIHZpZGVvU3BhY2VXaWR0aCk7XG4gICAgdmFyIGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KHZpZGVvSGVpZ2h0LCB2aWRlb1NwYWNlSGVpZ2h0KTtcblxuICAgIGlmIChhdmFpbGFibGVXaWR0aCAvIGFzcGVjdFJhdGlvIDwgdmlkZW9TcGFjZUhlaWdodCkge1xuICAgICAgICBhdmFpbGFibGVIZWlnaHQgPSB2aWRlb1NwYWNlSGVpZ2h0O1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IGF2YWlsYWJsZUhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgIH1cblxuICAgIGlmIChhdmFpbGFibGVIZWlnaHQgKiBhc3BlY3RSYXRpbyA8IHZpZGVvU3BhY2VXaWR0aCkge1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IHZpZGVvU3BhY2VXaWR0aDtcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0ID0gYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbztcbiAgICB9XG5cbiAgICByZXR1cm4gW2F2YWlsYWJsZVdpZHRoLCBhdmFpbGFibGVIZWlnaHRdO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGRpc3BsYXkgbmFtZSBmb3IgdGhlIGdpdmVuIHZpZGVvIHNwYW4gaWQuXG4gKi9cbmZ1bmN0aW9uIHNldERpc3BsYXlOYW1lKHZpZGVvU3BhbklkLCBkaXNwbGF5TmFtZSkge1xuICAgIHZhciBuYW1lU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4uZGlzcGxheW5hbWUnKTtcbiAgICB2YXIgZGVmYXVsdExvY2FsRGlzcGxheU5hbWUgPSBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9MT0NBTF9ESVNQTEFZX05BTUU7XG5cbiAgICAvLyBJZiB3ZSBhbHJlYWR5IGhhdmUgYSBkaXNwbGF5IG5hbWUgZm9yIHRoaXMgdmlkZW8uXG4gICAgaWYgKG5hbWVTcGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdmFyIG5hbWVTcGFuRWxlbWVudCA9IG5hbWVTcGFuLmdldCgwKTtcblxuICAgICAgICBpZiAobmFtZVNwYW5FbGVtZW50LmlkID09PSAnbG9jYWxEaXNwbGF5TmFtZScgJiZcbiAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJykudGV4dCgpICE9PSBkaXNwbGF5TmFtZSkge1xuICAgICAgICAgICAgaWYgKGRpc3BsYXlOYW1lICYmIGRpc3BsYXlOYW1lLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgJCgnI2xvY2FsRGlzcGxheU5hbWUnKS5odG1sKGRpc3BsYXlOYW1lICsgJyAobWUpJyk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgJCgnI2xvY2FsRGlzcGxheU5hbWUnKS50ZXh0KGRlZmF1bHRMb2NhbERpc3BsYXlOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkaXNwbGF5TmFtZSAmJiBkaXNwbGF5TmFtZS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnX25hbWUnKS5odG1sKGRpc3BsYXlOYW1lKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkICsgJ19uYW1lJykudGV4dChpbnRlcmZhY2VDb25maWcuREVGQVVMVF9SRU1PVEVfRElTUExBWV9OQU1FKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBlZGl0QnV0dG9uID0gbnVsbDtcblxuICAgICAgICBuYW1lU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgbmFtZVNwYW4uY2xhc3NOYW1lID0gJ2Rpc3BsYXluYW1lJztcbiAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZClbMF0uYXBwZW5kQ2hpbGQobmFtZVNwYW4pO1xuXG4gICAgICAgIGlmICh2aWRlb1NwYW5JZCA9PT0gJ2xvY2FsVmlkZW9Db250YWluZXInKSB7XG4gICAgICAgICAgICBlZGl0QnV0dG9uID0gY3JlYXRlRWRpdERpc3BsYXlOYW1lQnV0dG9uKCk7XG4gICAgICAgICAgICBuYW1lU3Bhbi5pbm5lclRleHQgPSBkZWZhdWx0TG9jYWxEaXNwbGF5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5hbWVTcGFuLmlubmVyVGV4dCA9IGludGVyZmFjZUNvbmZpZy5ERUZBVUxUX1JFTU9URV9ESVNQTEFZX05BTUU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbmFtZVNwYW4uaW5uZXJUZXh0ID0gZGlzcGxheU5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWVkaXRCdXR0b24pIHtcbiAgICAgICAgICAgIG5hbWVTcGFuLmlkID0gdmlkZW9TcGFuSWQgKyAnX25hbWUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZVNwYW4uaWQgPSAnbG9jYWxEaXNwbGF5TmFtZSc7XG4gICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkKVswXS5hcHBlbmRDaGlsZChlZGl0QnV0dG9uKTtcblxuICAgICAgICAgICAgdmFyIGVkaXRhYmxlVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICBlZGl0YWJsZVRleHQuY2xhc3NOYW1lID0gJ2Rpc3BsYXluYW1lJztcbiAgICAgICAgICAgIGVkaXRhYmxlVGV4dC50eXBlID0gJ3RleHQnO1xuICAgICAgICAgICAgZWRpdGFibGVUZXh0LmlkID0gJ2VkaXREaXNwbGF5TmFtZSc7XG5cbiAgICAgICAgICAgIGlmIChkaXNwbGF5TmFtZSAmJiBkaXNwbGF5TmFtZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBlZGl0YWJsZVRleHQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgPSBkaXNwbGF5TmFtZS5zdWJzdHJpbmcoMCwgZGlzcGxheU5hbWUuaW5kZXhPZignIChtZSknKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVkaXRhYmxlVGV4dC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZTsnKTtcbiAgICAgICAgICAgIGVkaXRhYmxlVGV4dC5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgJ2V4LiBKYW5lIFBpbmsnKTtcbiAgICAgICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQpWzBdLmFwcGVuZENoaWxkKGVkaXRhYmxlVGV4dCk7XG5cbiAgICAgICAgICAgICQoJyNsb2NhbFZpZGVvQ29udGFpbmVyIC5kaXNwbGF5bmFtZScpXG4gICAgICAgICAgICAgICAgLmJpbmQoXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xvY2FsRGlzcGxheU5hbWUnKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgICAgICQoJyNlZGl0RGlzcGxheU5hbWUnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICQoJyNlZGl0RGlzcGxheU5hbWUnKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjZWRpdERpc3BsYXlOYW1lJykuc2VsZWN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnI2VkaXREaXNwbGF5TmFtZScpLm9uZShcImZvY3Vzb3V0XCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5pbnB1dERpc3BsYXlOYW1lSGFuZGxlcih0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgJCgnI2VkaXREaXNwbGF5TmFtZScpLm9uKCdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmlucHV0RGlzcGxheU5hbWVIYW5kbGVyKHRoaXMudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBzZWxlY3RvciBvZiB2aWRlbyB0aHVtYm5haWwgY29udGFpbmVyIGZvciB0aGUgdXNlciBpZGVudGlmaWVkIGJ5XG4gKiBnaXZlbiA8dHQ+dXNlckppZDwvdHQ+XG4gKiBAcGFyYW0gcmVzb3VyY2VKaWQgdXNlcidzIEppZCBmb3Igd2hvbSB3ZSB3YW50IHRvIGdldCB0aGUgdmlkZW8gY29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBnZXRQYXJ0aWNpcGFudENvbnRhaW5lcihyZXNvdXJjZUppZClcbntcbiAgICBpZiAoIXJlc291cmNlSmlkKVxuICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgIGlmIChyZXNvdXJjZUppZCA9PT0geG1wcC5teVJlc291cmNlKCkpXG4gICAgICAgIHJldHVybiAkKFwiI2xvY2FsVmlkZW9Db250YWluZXJcIik7XG4gICAgZWxzZVxuICAgICAgICByZXR1cm4gJChcIiNwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlSmlkKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBzaXplIGFuZCBwb3NpdGlvbiBvZiB0aGUgZ2l2ZW4gdmlkZW8gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gdmlkZW8gdGhlIHZpZGVvIGVsZW1lbnQgdG8gcG9zaXRpb25cbiAqIEBwYXJhbSB3aWR0aCB0aGUgZGVzaXJlZCB2aWRlbyB3aWR0aFxuICogQHBhcmFtIGhlaWdodCB0aGUgZGVzaXJlZCB2aWRlbyBoZWlnaHRcbiAqIEBwYXJhbSBob3Jpem9udGFsSW5kZW50IHRoZSBsZWZ0IGFuZCByaWdodCBpbmRlbnRcbiAqIEBwYXJhbSB2ZXJ0aWNhbEluZGVudCB0aGUgdG9wIGFuZCBib3R0b20gaW5kZW50XG4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uVmlkZW8odmlkZW8sXG4gICAgICAgICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWxJbmRlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsSW5kZW50KSB7XG4gICAgdmlkZW8ud2lkdGgod2lkdGgpO1xuICAgIHZpZGVvLmhlaWdodChoZWlnaHQpO1xuICAgIHZpZGVvLmNzcyh7ICB0b3A6IHZlcnRpY2FsSW5kZW50ICsgJ3B4JyxcbiAgICAgICAgYm90dG9tOiB2ZXJ0aWNhbEluZGVudCArICdweCcsXG4gICAgICAgIGxlZnQ6IGhvcml6b250YWxJbmRlbnQgKyAncHgnLFxuICAgICAgICByaWdodDogaG9yaXpvbnRhbEluZGVudCArICdweCd9KTtcbn1cblxuLyoqXG4gKiBBZGRzIHRoZSByZW1vdGUgdmlkZW8gbWVudSBlbGVtZW50IGZvciB0aGUgZ2l2ZW4gPHR0PmppZDwvdHQ+IGluIHRoZVxuICogZ2l2ZW4gPHR0PnBhcmVudEVsZW1lbnQ8L3R0Pi5cbiAqXG4gKiBAcGFyYW0gamlkIHRoZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZm9yIHdoaWNoIHdlJ3JlIGFkZGluZyBhIG1lbnUuXG4gKiBAcGFyYW0gcGFyZW50RWxlbWVudCB0aGUgcGFyZW50IGVsZW1lbnQgd2hlcmUgdGhpcyBtZW51IHdpbGwgYmUgYWRkZWRcbiAqL1xuZnVuY3Rpb24gYWRkUmVtb3RlVmlkZW9NZW51KGppZCwgcGFyZW50RWxlbWVudCkge1xuICAgIHZhciBzcGFuRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBzcGFuRWxlbWVudC5jbGFzc05hbWUgPSAncmVtb3RldmlkZW9tZW51JztcblxuICAgIHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoc3BhbkVsZW1lbnQpO1xuXG4gICAgdmFyIG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIG1lbnVFbGVtZW50LmNsYXNzTmFtZSA9ICdmYSBmYS1hbmdsZS1kb3duJztcbiAgICBtZW51RWxlbWVudC50aXRsZSA9ICdSZW1vdGUgdXNlciBjb250cm9scyc7XG4gICAgc3BhbkVsZW1lbnQuYXBwZW5kQ2hpbGQobWVudUVsZW1lbnQpO1xuXG4vLyAgICAgICAgPHVsIGNsYXNzPVwicG9wdXBtZW51XCI+XG4vLyAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TXV0ZTwvYT48L2xpPlxuLy8gICAgICAgIDxsaT48YSBocmVmPVwiI1wiPkVqZWN0PC9hPjwvbGk+XG4vLyAgICAgICAgPC91bD5cblxuICAgIHZhciBwb3B1cG1lbnVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBwb3B1cG1lbnVFbGVtZW50LmNsYXNzTmFtZSA9ICdwb3B1cG1lbnUnO1xuICAgIHBvcHVwbWVudUVsZW1lbnQuaWRcbiAgICAgICAgPSAncmVtb3RlX3BvcHVwbWVudV8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcbiAgICBzcGFuRWxlbWVudC5hcHBlbmRDaGlsZChwb3B1cG1lbnVFbGVtZW50KTtcblxuICAgIHZhciBtdXRlTWVudUl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIHZhciBtdXRlTGlua0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgICB2YXIgbXV0ZWRJbmRpY2F0b3IgPSBcIjxpIGNsYXNzPSdpY29uLW1pYy1kaXNhYmxlZCc+PC9pPlwiO1xuXG4gICAgaWYgKCFtdXRlZEF1ZGlvc1tqaWRdKSB7XG4gICAgICAgIG11dGVMaW5rSXRlbS5pbm5lckhUTUwgPSBtdXRlZEluZGljYXRvciArICdNdXRlJztcbiAgICAgICAgbXV0ZUxpbmtJdGVtLmNsYXNzTmFtZSA9ICdtdXRlbGluayc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBtdXRlTGlua0l0ZW0uaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnIE11dGVkJztcbiAgICAgICAgbXV0ZUxpbmtJdGVtLmNsYXNzTmFtZSA9ICdtdXRlbGluayBkaXNhYmxlZCc7XG4gICAgfVxuXG4gICAgbXV0ZUxpbmtJdGVtLm9uY2xpY2sgPSBmdW5jdGlvbigpe1xuICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCdkaXNhYmxlZCcpICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNNdXRlID0gbXV0ZWRBdWRpb3NbamlkXSA9PSB0cnVlO1xuICAgICAgICB4bXBwLnNldE11dGUoamlkLCAhaXNNdXRlKTtcblxuICAgICAgICBwb3B1cG1lbnVFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lOycpO1xuXG4gICAgICAgIGlmIChpc011dGUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnIE11dGVkJztcbiAgICAgICAgICAgIHRoaXMuY2xhc3NOYW1lID0gJ211dGVsaW5rIGRpc2FibGVkJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnIE11dGUnO1xuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgPSAnbXV0ZWxpbmsnO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG11dGVNZW51SXRlbS5hcHBlbmRDaGlsZChtdXRlTGlua0l0ZW0pO1xuICAgIHBvcHVwbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQobXV0ZU1lbnVJdGVtKTtcblxuICAgIHZhciBlamVjdEluZGljYXRvciA9IFwiPGkgY2xhc3M9J2ZhIGZhLWVqZWN0Jz48L2k+XCI7XG5cbiAgICB2YXIgZWplY3RNZW51SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgdmFyIGVqZWN0TGlua0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgZWplY3RMaW5rSXRlbS5pbm5lckhUTUwgPSBlamVjdEluZGljYXRvciArICcgS2ljayBvdXQnO1xuICAgIGVqZWN0TGlua0l0ZW0ub25jbGljayA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHhtcHAuZWplY3QoamlkKTtcbiAgICAgICAgcG9wdXBtZW51RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgJ2Rpc3BsYXk6bm9uZTsnKTtcbiAgICB9O1xuXG4gICAgZWplY3RNZW51SXRlbS5hcHBlbmRDaGlsZChlamVjdExpbmtJdGVtKTtcbiAgICBwb3B1cG1lbnVFbGVtZW50LmFwcGVuZENoaWxkKGVqZWN0TWVudUl0ZW0pO1xuXG4gICAgdmFyIHBhZGRpbmdTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHBhZGRpbmdTcGFuLmNsYXNzTmFtZSA9ICdwb3B1cG1lbnVQYWRkaW5nJztcbiAgICBwb3B1cG1lbnVFbGVtZW50LmFwcGVuZENoaWxkKHBhZGRpbmdTcGFuKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHJlbW90ZSB2aWRlbyBtZW51IGVsZW1lbnQgZnJvbSB2aWRlbyBlbGVtZW50IGlkZW50aWZpZWQgYnlcbiAqIGdpdmVuIDx0dD52aWRlb0VsZW1lbnRJZDwvdHQ+LlxuICpcbiAqIEBwYXJhbSB2aWRlb0VsZW1lbnRJZCB0aGUgaWQgb2YgbG9jYWwgb3IgcmVtb3RlIHZpZGVvIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZVJlbW90ZVZpZGVvTWVudSh2aWRlb0VsZW1lbnRJZCkge1xuICAgIHZhciBtZW51U3BhbiA9ICQoJyMnICsgdmlkZW9FbGVtZW50SWQgKyAnPnNwYW4ucmVtb3RldmlkZW9tZW51Jyk7XG4gICAgaWYgKG1lbnVTcGFuLmxlbmd0aCkge1xuICAgICAgICBtZW51U3Bhbi5yZW1vdmUoKTtcbiAgICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZGF0YSBmb3IgdGhlIGluZGljYXRvclxuICogQHBhcmFtIGlkIHRoZSBpZCBvZiB0aGUgaW5kaWNhdG9yXG4gKiBAcGFyYW0gcGVyY2VudCB0aGUgcGVyY2VudCBmb3IgY29ubmVjdGlvbiBxdWFsaXR5XG4gKiBAcGFyYW0gb2JqZWN0IHRoZSBkYXRhXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRzSW5kaWNhdG9yKGlkLCBwZXJjZW50LCBvYmplY3QpIHtcbiAgICBpZihWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tpZF0pXG4gICAgICAgIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW2lkXS51cGRhdGVDb25uZWN0aW9uUXVhbGl0eShwZXJjZW50LCBvYmplY3QpO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhbiBhcnJheSBvZiB0aGUgdmlkZW8gZGltZW5zaW9ucywgc28gdGhhdCBpdCBrZWVwcyBpdCdzIGFzcGVjdFxuICogcmF0aW8gYW5kIGZpdHMgYXZhaWxhYmxlIGFyZWEgd2l0aCBpdCdzIGxhcmdlciBkaW1lbnNpb24uIFRoaXMgbWV0aG9kXG4gKiBlbnN1cmVzIHRoYXQgd2hvbGUgdmlkZW8gd2lsbCBiZSB2aXNpYmxlIGFuZCBjYW4gbGVhdmUgZW1wdHkgYXJlYXMuXG4gKlxuICogQHJldHVybiBhbiBhcnJheSB3aXRoIDIgZWxlbWVudHMsIHRoZSB2aWRlbyB3aWR0aCBhbmQgdGhlIHZpZGVvIGhlaWdodFxuICovXG5mdW5jdGlvbiBnZXREZXNrdG9wVmlkZW9TaXplKHZpZGVvV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VIZWlnaHQpIHtcbiAgICBpZiAoIXZpZGVvV2lkdGgpXG4gICAgICAgIHZpZGVvV2lkdGggPSBjdXJyZW50VmlkZW9XaWR0aDtcbiAgICBpZiAoIXZpZGVvSGVpZ2h0KVxuICAgICAgICB2aWRlb0hlaWdodCA9IGN1cnJlbnRWaWRlb0hlaWdodDtcblxuICAgIHZhciBhc3BlY3RSYXRpbyA9IHZpZGVvV2lkdGggLyB2aWRlb0hlaWdodDtcblxuICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KHZpZGVvV2lkdGgsIHZpZGVvU3BhY2VXaWR0aCk7XG4gICAgdmFyIGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KHZpZGVvSGVpZ2h0LCB2aWRlb1NwYWNlSGVpZ2h0KTtcblxuICAgIHZpZGVvU3BhY2VIZWlnaHQgLT0gJCgnI3JlbW90ZVZpZGVvcycpLm91dGVySGVpZ2h0KCk7XG5cbiAgICBpZiAoYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbyA+PSB2aWRlb1NwYWNlSGVpZ2h0KVxuICAgIHtcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0ID0gdmlkZW9TcGFjZUhlaWdodDtcbiAgICAgICAgYXZhaWxhYmxlV2lkdGggPSBhdmFpbGFibGVIZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICB9XG5cbiAgICBpZiAoYXZhaWxhYmxlSGVpZ2h0ICogYXNwZWN0UmF0aW8gPj0gdmlkZW9TcGFjZVdpZHRoKVxuICAgIHtcbiAgICAgICAgYXZhaWxhYmxlV2lkdGggPSB2aWRlb1NwYWNlV2lkdGg7XG4gICAgICAgIGF2YWlsYWJsZUhlaWdodCA9IGF2YWlsYWJsZVdpZHRoIC8gYXNwZWN0UmF0aW87XG4gICAgfVxuXG4gICAgcmV0dXJuIFthdmFpbGFibGVXaWR0aCwgYXZhaWxhYmxlSGVpZ2h0XTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBlZGl0IGRpc3BsYXkgbmFtZSBidXR0b24uXG4gKlxuICogQHJldHVybnMgdGhlIGVkaXQgYnV0dG9uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUVkaXREaXNwbGF5TmFtZUJ1dHRvbigpIHtcbiAgICB2YXIgZWRpdEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBlZGl0QnV0dG9uLmNsYXNzTmFtZSA9ICdkaXNwbGF5bmFtZSc7XG4gICAgVXRpbC5zZXRUb29sdGlwKGVkaXRCdXR0b24sXG4gICAgICAgICdDbGljayB0byBlZGl0IHlvdXI8YnIvPmRpc3BsYXkgbmFtZScsXG4gICAgICAgIFwidG9wXCIpO1xuICAgIGVkaXRCdXR0b24uaW5uZXJIVE1MID0gJzxpIGNsYXNzPVwiZmEgZmEtcGVuY2lsXCI+PC9pPic7XG5cbiAgICByZXR1cm4gZWRpdEJ1dHRvbjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBlbGVtZW50IGluZGljYXRpbmcgdGhlIG1vZGVyYXRvcihvd25lcikgb2YgdGhlIGNvbmZlcmVuY2UuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIHBhcmVudCBlbGVtZW50IHdoZXJlIHRoZSBvd25lciBpbmRpY2F0b3Igd2lsbFxuICogYmUgYWRkZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTW9kZXJhdG9ySW5kaWNhdG9yRWxlbWVudChwYXJlbnRFbGVtZW50KSB7XG4gICAgdmFyIG1vZGVyYXRvckluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBtb2RlcmF0b3JJbmRpY2F0b3IuY2xhc3NOYW1lID0gJ2ZhIGZhLXN0YXInO1xuICAgIHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQobW9kZXJhdG9ySW5kaWNhdG9yKTtcblxuICAgIFV0aWwuc2V0VG9vbHRpcChwYXJlbnRFbGVtZW50LFxuICAgICAgICBcIlRoZSBvd25lciBvZjxici8+dGhpcyBjb25mZXJlbmNlXCIsXG4gICAgICAgIFwidG9wXCIpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIGlmIHZpZGVvIGlkZW50aWZpZWQgYnkgZ2l2ZW4gc3JjIGlzIGRlc2t0b3Agc3RyZWFtLlxuICogQHBhcmFtIHZpZGVvU3JjIGVnLlxuICogYmxvYjpodHRwcyUzQS8vcGF3ZWwuaml0c2kubmV0LzlhNDZlMGJkLTEzMWUtNGQxOC05YzE0LWE5MjY0ZThkYjM5NVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzVmlkZW9TcmNEZXNrdG9wKGppZCkge1xuICAgIC8vIEZJWE1FOiBmaXggdGhpcyBtYXBwaW5nIG1lc3MuLi5cbiAgICAvLyBmaWd1cmUgb3V0IGlmIGxhcmdlIHZpZGVvIGlzIGRlc2t0b3Agc3RyZWFtIG9yIGp1c3QgYSBjYW1lcmFcblxuICAgIGlmKCFqaWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB2YXIgaXNEZXNrdG9wID0gZmFsc2U7XG4gICAgaWYgKHhtcHAubXlKaWQoKSAmJlxuICAgICAgICB4bXBwLm15UmVzb3VyY2UoKSA9PT0gamlkKSB7XG4gICAgICAgIC8vIGxvY2FsIHZpZGVvXG4gICAgICAgIGlzRGVza3RvcCA9IGRlc2t0b3BzaGFyaW5nLmlzVXNpbmdTY3JlZW5TdHJlYW0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBEbyB3ZSBoYXZlIGFzc29jaWF0aW9ucy4uLlxuICAgICAgICB2YXIgdmlkZW9Tc3JjID0gamlkMlNzcmNbamlkXTtcbiAgICAgICAgaWYgKHZpZGVvU3NyYykge1xuICAgICAgICAgICAgdmFyIHZpZGVvVHlwZSA9IHNzcmMydmlkZW9UeXBlW3ZpZGVvU3NyY107XG4gICAgICAgICAgICBpZiAodmlkZW9UeXBlKSB7XG4gICAgICAgICAgICAgICAgLy8gRmluYWxseSB0aGVyZS4uLlxuICAgICAgICAgICAgICAgIGlzRGVza3RvcCA9IHZpZGVvVHlwZSA9PT0gJ3NjcmVlbic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyB2aWRlbyB0eXBlIGZvciBzc3JjOiBcIiArIHZpZGVvU3NyYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3NyYyBmb3IgamlkOiBcIiArIGppZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlzRGVza3RvcDtcbn1cblxuXG5cbnZhciBWaWRlb0xheW91dCA9IChmdW5jdGlvbiAobXkpIHtcbiAgICBteS5jb25uZWN0aW9uSW5kaWNhdG9ycyA9IHt9O1xuXG4gICAgLy8gQnkgZGVmYXVsdCB3ZSB1c2UgY2FtZXJhXG4gICAgbXkuZ2V0VmlkZW9TaXplID0gZ2V0Q2FtZXJhVmlkZW9TaXplO1xuICAgIG15LmdldFZpZGVvUG9zaXRpb24gPSBnZXRDYW1lcmFWaWRlb1Bvc2l0aW9uO1xuXG4gICAgbXkuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTGlzdGVuIGZvciBsYXJnZSB2aWRlbyBzaXplIHVwZGF0ZXNcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKVxuICAgICAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlZG1ldGFkYXRhJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50VmlkZW9XaWR0aCA9IHRoaXMudmlkZW9XaWR0aDtcbiAgICAgICAgICAgICAgICBjdXJyZW50VmlkZW9IZWlnaHQgPSB0aGlzLnZpZGVvSGVpZ2h0O1xuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnBvc2l0aW9uTGFyZ2UoY3VycmVudFZpZGVvV2lkdGgsIGN1cnJlbnRWaWRlb0hlaWdodCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbXkuaXNJbkxhc3ROID0gZnVuY3Rpb24ocmVzb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIGxhc3ROQ291bnQgPCAwIC8vIGxhc3ROIGlzIGRpc2FibGVkLCByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfHwgKGxhc3ROQ291bnQgPiAwICYmIGxhc3RORW5kcG9pbnRzQ2FjaGUubGVuZ3RoID09IDApIC8vIGxhc3RORW5kcG9pbnRzIGNhY2hlIG5vdCBidWlsdCB5ZXQsIHJldHVybiB0cnVlXG4gICAgICAgICAgICB8fCAobGFzdE5FbmRwb2ludHNDYWNoZSAmJiBsYXN0TkVuZHBvaW50c0NhY2hlLmluZGV4T2YocmVzb3VyY2UpICE9PSAtMSk7XG4gICAgfTtcblxuICAgIG15LmNoYW5nZUxvY2FsU3RyZWFtID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbFZpZGVvKHN0cmVhbSk7XG4gICAgfTtcblxuICAgIG15LmNoYW5nZUxvY2FsQXVkaW8gPSBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKCQoJyNsb2NhbEF1ZGlvJyksIHN0cmVhbS5nZXRPcmlnaW5hbFN0cmVhbSgpKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2FsQXVkaW8nKS5hdXRvcGxheSA9IHRydWU7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2NhbEF1ZGlvJykudm9sdW1lID0gMDtcbiAgICAgICAgaWYgKHByZU11dGVkKSB7XG4gICAgICAgICAgICBpZighVUkuc2V0QXVkaW9NdXRlZCh0cnVlKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcmVNdXRlZCA9IG11dGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmVNdXRlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG15LmNoYW5nZUxvY2FsVmlkZW8gPSBmdW5jdGlvbihzdHJlYW0pIHtcbiAgICAgICAgdmFyIGZsaXBYID0gdHJ1ZTtcbiAgICAgICAgaWYoc3RyZWFtLnR5cGUgPT0gXCJkZXNrdG9wXCIpXG4gICAgICAgICAgICBmbGlwWCA9IGZhbHNlO1xuICAgICAgICB2YXIgbG9jYWxWaWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG4gICAgICAgIGxvY2FsVmlkZW8uaWQgPSAnbG9jYWxWaWRlb18nICtcbiAgICAgICAgICAgIFJUQy5nZXRTdHJlYW1JRChzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKSk7XG4gICAgICAgIGxvY2FsVmlkZW8uYXV0b3BsYXkgPSB0cnVlO1xuICAgICAgICBsb2NhbFZpZGVvLnZvbHVtZSA9IDA7IC8vIGlzIGl0IHJlcXVpcmVkIGlmIGF1ZGlvIGlzIHNlcGFyYXRlZCA/XG4gICAgICAgIGxvY2FsVmlkZW8ub25jb250ZXh0bWVudSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXG4gICAgICAgIHZhciBsb2NhbFZpZGVvQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2FsVmlkZW9XcmFwcGVyJyk7XG4gICAgICAgIGxvY2FsVmlkZW9Db250YWluZXIuYXBwZW5kQ2hpbGQobG9jYWxWaWRlbyk7XG5cbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgZGlzcGxheSBuYW1lLlxuICAgICAgICBzZXREaXNwbGF5TmFtZSgnbG9jYWxWaWRlb0NvbnRhaW5lcicpO1xuXG4gICAgICAgIGlmKCFWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tcImxvY2FsVmlkZW9Db250YWluZXJcIl0pIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW1wibG9jYWxWaWRlb0NvbnRhaW5lclwiXVxuICAgICAgICAgICAgICAgID0gbmV3IENvbm5lY3Rpb25JbmRpY2F0b3IoJChcIiNsb2NhbFZpZGVvQ29udGFpbmVyXCIpWzBdLCBudWxsLCBWaWRlb0xheW91dCk7XG4gICAgICAgIH1cblxuICAgICAgICBBdWRpb0xldmVscy51cGRhdGVBdWRpb0xldmVsQ2FudmFzKG51bGwsIFZpZGVvTGF5b3V0KTtcblxuICAgICAgICB2YXIgbG9jYWxWaWRlb1NlbGVjdG9yID0gJCgnIycgKyBsb2NhbFZpZGVvLmlkKTtcbiAgICAgICAgLy8gQWRkIGNsaWNrIGhhbmRsZXIgdG8gYm90aCB2aWRlbyBhbmQgdmlkZW8gd3JhcHBlciBlbGVtZW50cyBpbiBjYXNlXG4gICAgICAgIC8vIHRoZXJlJ3Mgbm8gdmlkZW8uXG4gICAgICAgIGxvY2FsVmlkZW9TZWxlY3Rvci5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuaGFuZGxlVmlkZW9UaHVtYkNsaWNrZWQoXG4gICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKGxvY2FsVmlkZW8pLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIHhtcHAubXlSZXNvdXJjZSgpKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJyNsb2NhbFZpZGVvQ29udGFpbmVyJykuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LmhhbmRsZVZpZGVvVGh1bWJDbGlja2VkKFxuICAgICAgICAgICAgICAgIFJUQy5nZXRWaWRlb1NyYyhsb2NhbFZpZGVvKSxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICB4bXBwLm15UmVzb3VyY2UoKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEFkZCBob3ZlciBoYW5kbGVyXG4gICAgICAgICQoJyNsb2NhbFZpZGVvQ29udGFpbmVyJykuaG92ZXIoXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zaG93RGlzcGxheU5hbWUoJ2xvY2FsVmlkZW9Db250YWluZXInLCB0cnVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIVZpZGVvTGF5b3V0LmlzTGFyZ2VWaWRlb1Zpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgUlRDLmdldFZpZGVvU3JjKGxvY2FsVmlkZW8pICE9PSBSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkpXG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dEaXNwbGF5TmFtZSgnbG9jYWxWaWRlb0NvbnRhaW5lcicsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgLy8gQWRkIHN0cmVhbSBlbmRlZCBoYW5kbGVyXG4gICAgICAgIHN0cmVhbS5nZXRPcmlnaW5hbFN0cmVhbSgpLm9uZW5kZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2NhbFZpZGVvQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvY2FsVmlkZW8pO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlUmVtb3ZlZFZpZGVvKFJUQy5nZXRWaWRlb1NyYyhsb2NhbFZpZGVvKSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZsaXAgdmlkZW8geCBheGlzIGlmIG5lZWRlZFxuICAgICAgICBmbGlwWExvY2FsVmlkZW8gPSBmbGlwWDtcbiAgICAgICAgaWYgKGZsaXBYKSB7XG4gICAgICAgICAgICBsb2NhbFZpZGVvU2VsZWN0b3IuYWRkQ2xhc3MoXCJmbGlwVmlkZW9YXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEF0dGFjaCBXZWJSVEMgc3RyZWFtXG4gICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IHNpbXVsY2FzdC5nZXRMb2NhbFZpZGVvU3RyZWFtKCk7XG4gICAgICAgIFJUQy5hdHRhY2hNZWRpYVN0cmVhbShsb2NhbFZpZGVvU2VsZWN0b3IsIHZpZGVvU3RyZWFtKTtcblxuICAgICAgICBsb2NhbFZpZGVvU3JjID0gUlRDLmdldFZpZGVvU3JjKGxvY2FsVmlkZW8pO1xuXG4gICAgICAgIHZhciBteVJlc291cmNlSmlkID0geG1wcC5teVJlc291cmNlKCk7XG5cbiAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTGFyZ2VWaWRlbyhsb2NhbFZpZGVvU3JjLCAwLFxuICAgICAgICAgICAgbXlSZXNvdXJjZUppZCk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHJlbW92ZWQgdmlkZW8gaXMgY3VycmVudGx5IGRpc3BsYXllZCBhbmQgdHJpZXMgdG8gZGlzcGxheVxuICAgICAqIGFub3RoZXIgb25lIGluc3RlYWQuXG4gICAgICogQHBhcmFtIHJlbW92ZWRWaWRlb1NyYyBzcmMgc3RyZWFtIGlkZW50aWZpZXIgb2YgdGhlIHZpZGVvLlxuICAgICAqL1xuICAgIG15LnVwZGF0ZVJlbW92ZWRWaWRlbyA9IGZ1bmN0aW9uKHJlbW92ZWRWaWRlb1NyYykge1xuICAgICAgICBpZiAocmVtb3ZlZFZpZGVvU3JjID09PSBSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgY3VycmVudGx5IGRpc3BsYXllZCBhcyBsYXJnZVxuICAgICAgICAgICAgLy8gcGljayB0aGUgbGFzdCB2aXNpYmxlIHZpZGVvIGluIHRoZSByb3dcbiAgICAgICAgICAgIC8vIGlmIG5vYm9keSBlbHNlIGlzIGxlZnQsIHRoaXMgcGlja3MgdGhlIGxvY2FsIHZpZGVvXG4gICAgICAgICAgICB2YXIgcGlja1xuICAgICAgICAgICAgICAgID0gJCgnI3JlbW90ZVZpZGVvcz5zcGFuW2lkIT1cIm1peGVkc3RyZWFtXCJdOnZpc2libGU6bGFzdD52aWRlbycpXG4gICAgICAgICAgICAgICAgICAgIC5nZXQoMCk7XG5cbiAgICAgICAgICAgIGlmICghcGljaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkxhc3QgdmlzaWJsZSB2aWRlbyBubyBsb25nZXIgZXhpc3RzXCIpO1xuICAgICAgICAgICAgICAgIHBpY2sgPSAkKCcjcmVtb3RlVmlkZW9zPnNwYW5baWQhPVwibWl4ZWRzdHJlYW1cIl0+dmlkZW8nKS5nZXQoMCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXBpY2sgfHwgIVJUQy5nZXRWaWRlb1NyYyhwaWNrKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgbG9jYWwgdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRmFsbGJhY2sgdG8gbG9jYWwgdmlkZW8uLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHBpY2sgPSAkKCcjcmVtb3RlVmlkZW9zPnNwYW4+c3Bhbj52aWRlbycpLmdldCgwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG11dGUgaWYgbG9jYWx2aWRlb1xuICAgICAgICAgICAgaWYgKHBpY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gcGljay5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHZhciBqaWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmKGNvbnRhaW5lcilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNvbnRhaW5lci5pZCA9PSBcImxvY2FsVmlkZW9XcmFwcGVyXCIpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGppZCA9IHhtcHAubXlSZXNvdXJjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgamlkID0gVmlkZW9MYXlvdXQuZ2V0UGVlckNvbnRhaW5lclJlc291cmNlSmlkKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVMYXJnZVZpZGVvKFJUQy5nZXRWaWRlb1NyYyhwaWNrKSwgcGljay52b2x1bWUsIGppZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZhaWxlZCB0byBlbGVjdCBsYXJnZSB2aWRlb1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgbXkub25SZW1vdGVTdHJlYW1BZGRlZCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lcjtcbiAgICAgICAgdmFyIHJlbW90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVtb3RlVmlkZW9zJyk7XG5cbiAgICAgICAgaWYgKHN0cmVhbS5wZWVyamlkKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbnN1cmVQZWVyQ29udGFpbmVyRXhpc3RzKHN0cmVhbS5wZWVyamlkKTtcblxuICAgICAgICAgICAgY29udGFpbmVyICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxuICAgICAgICAgICAgICAgICAgICAncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKHN0cmVhbS5wZWVyamlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKS5pZDtcbiAgICAgICAgICAgIGlmIChpZCAhPT0gJ21peGVkbXNsYWJlbCdcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogZGVmYXVsdCBzdHJlYW0gaXMgYWRkZWQgYWx3YXlzIHdpdGggbmV3IGZvY3VzXG4gICAgICAgICAgICAgICAgLy8gKHRvIGJlIGludmVzdGlnYXRlZClcbiAgICAgICAgICAgICAgICAmJiBpZCAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignY2FuIG5vdCBhc3NvY2lhdGUgc3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICd3aXRoIGEgcGFydGljaXBhbnQnKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIGFkZCBpdCBoZXJlIHNpbmNlIGl0IHdpbGwgY2F1c2UgdHJvdWJsZXNcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGSVhNRTogZm9yIHRoZSBtaXhlZCBtcyB3ZSBkb250IG5lZWQgYSB2aWRlbyAtLSBjdXJyZW50bHlcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pZCA9ICdtaXhlZHN0cmVhbSc7XG4gICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3ZpZGVvY29udGFpbmVyJztcbiAgICAgICAgICAgIHJlbW90ZXMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgICAgIFV0aWwucGxheVNvdW5kTm90aWZpY2F0aW9uKCd1c2VySm9pbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5hZGRSZW1vdGVTdHJlYW1FbGVtZW50KCBjb250YWluZXIsXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNpZCxcbiAgICAgICAgICAgICAgICBzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKSxcbiAgICAgICAgICAgICAgICBzdHJlYW0ucGVlcmppZCxcbiAgICAgICAgICAgICAgICBzdHJlYW0uc3NyYyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBteS5nZXRMYXJnZVZpZGVvU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBsYXJnZVZpZGVvU3RhdGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxhcmdlIHZpZGVvIHdpdGggdGhlIGdpdmVuIG5ldyB2aWRlbyBzb3VyY2UuXG4gICAgICovXG4gICAgbXkudXBkYXRlTGFyZ2VWaWRlbyA9IGZ1bmN0aW9uKG5ld1NyYywgdm9sLCByZXNvdXJjZUppZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnaG92ZXIgaW4nLCBuZXdTcmMpO1xuXG4gICAgICAgIGlmIChSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkgIT09IG5ld1NyYykge1xuXG4gICAgICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIC8vIER1ZSB0byB0aGUgc2ltdWxjYXN0IHRoZSBsb2NhbFZpZGVvU3JjIG1heSBoYXZlIGNoYW5nZWQgd2hlbiB0aGVcbiAgICAgICAgICAgIC8vIGZhZGVPdXQgZXZlbnQgdHJpZ2dlcnMuIEluIHRoYXQgY2FzZSB0aGUgZ2V0SmlkRnJvbVZpZGVvU3JjIGFuZFxuICAgICAgICAgICAgLy8gaXNWaWRlb1NyY0Rlc2t0b3AgbWV0aG9kcyB3aWxsIG5vdCBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWxzbywgYWdhaW4gZHVlIHRvIHRoZSBzaW11bGNhc3QsIHRoZSB1cGRhdGVMYXJnZVZpZGVvIG1ldGhvZCBjYW5cbiAgICAgICAgICAgIC8vIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBhbG1vc3Qgc2ltdWx0YW5lb3VzbHkuIFRoZXJlZm9yZSwgd2VcbiAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBzdGF0ZSBoZXJlIGFuZCB1cGRhdGUgb25seSBvbmNlLlxuXG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUubmV3U3JjID0gbmV3U3JjO1xuICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLmlzVmlzaWJsZSA9ICQoJyNsYXJnZVZpZGVvJykuaXMoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUuaXNEZXNrdG9wID0gaXNWaWRlb1NyY0Rlc2t0b3AocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgaWYoamlkMlNzcmNbbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZF0gfHxcbiAgICAgICAgICAgICAgICAoeG1wcC5teVJlc291cmNlKCkgJiZcbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCA9PT1cbiAgICAgICAgICAgICAgICAgICAgeG1wcC5teVJlc291cmNlKCkpKSB7XG4gICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkID0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQgPSByZXNvdXJjZUppZDtcblxuICAgICAgICAgICAgLy8gU2NyZWVuIHN0cmVhbSBpcyBhbHJlYWR5IHJvdGF0ZWRcbiAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5mbGlwWCA9IChuZXdTcmMgPT09IGxvY2FsVmlkZW9TcmMpICYmIGZsaXBYTG9jYWxWaWRlbztcblxuICAgICAgICAgICAgdmFyIHVzZXJDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkICE9PSBsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkKSB7XG4gICAgICAgICAgICAgICAgdXNlckNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIHdlIHdhbnQgdGhlIG5vdGlmaWNhdGlvbiB0byB0cmlnZ2VyIGV2ZW4gaWYgdXNlckppZCBpcyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgLy8gb3IgbnVsbC5cbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwic2VsZWN0ZWRlbmRwb2ludGNoYW5nZWRcIiwgW2xhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWRdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFsYXJnZVZpZGVvU3RhdGUudXBkYXRlSW5Qcm9ncmVzcykge1xuICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51cGRhdGVJblByb2dyZXNzID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHZhciBkb1VwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICBBdmF0YXIudXBkYXRlQWN0aXZlU3BlYWtlckF2YXRhclNyYyhcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtcHAuZmluZEppZEZyb21SZXNvdXJjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1c2VyQ2hhbmdlZCAmJiBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIFJUQy5nZXRWaWRlb1NyYygkKGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkKVswXSkgPT09IG5ld1NyYylcbiAgICAgICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1N3aXRjaGluZyB0byBwcmVsb2FkZWQgdmlkZW8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVzID0gJCgnI2xhcmdlVmlkZW8nKS5wcm9wKFwiYXR0cmlidXRlc1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGxhcmdlVmlkZW8gYXR0cmlidXRlcyBhbmQgYXBwbHkgdGhlbSBvblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJlbG9hZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhdHRyaWJ1dGVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmFtZSAhPT0gJ2lkJyAmJiB0aGlzLm5hbWUgIT09ICdzcmMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkLmF0dHIodGhpcy5uYW1lLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQuYXBwZW5kVG8oJCgnI2xhcmdlVmlkZW9Db250YWluZXInKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmF0dHIoJ2lkJywgJ3ByZXZpb3VzTGFyZ2VWaWRlbycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQuYXR0cignaWQnLCAnbGFyZ2VWaWRlbycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3ByZXZpb3VzTGFyZ2VWaWRlbycpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZC5vbignbG9hZGVkbWV0YWRhdGEnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWRlb1dpZHRoID0gdGhpcy52aWRlb1dpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWRlb0hlaWdodCA9IHRoaXMudmlkZW9IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQucG9zaXRpb25MYXJnZShjdXJyZW50VmlkZW9XaWR0aCwgY3VycmVudFZpZGVvSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRfc3NyYyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSVEMuc2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSwgbGFyZ2VWaWRlb1N0YXRlLm5ld1NyYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlkZW9UcmFuc2Zvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGFyZ2VWaWRlbycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3R5bGUud2Via2l0VHJhbnNmb3JtO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXJnZVZpZGVvU3RhdGUuZmxpcFggJiYgdmlkZW9UcmFuc2Zvcm0gIT09ICdzY2FsZVgoLTEpJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IFwic2NhbGVYKC0xKVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFsYXJnZVZpZGVvU3RhdGUuZmxpcFggJiYgdmlkZW9UcmFuc2Zvcm0gPT09ICdzY2FsZVgoLTEpJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSB3YXkgd2UnbGwgYmUgbWVhc3VyaW5nIGFuZCBwb3NpdGlvbmluZyBsYXJnZSB2aWRlb1xuXG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmdldFZpZGVvU2l6ZSA9IGxhcmdlVmlkZW9TdGF0ZS5pc0Rlc2t0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0RGVza3RvcFZpZGVvU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBnZXRDYW1lcmFWaWRlb1NpemU7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmdldFZpZGVvUG9zaXRpb24gPSBsYXJnZVZpZGVvU3RhdGUuaXNEZXNrdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldERlc2t0b3BWaWRlb1Bvc2l0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGdldENhbWVyYVZpZGVvUG9zaXRpb247XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGlmIHRoZSBsYXJnZSB2aWRlbyBpcyBjdXJyZW50bHkgdmlzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzYWJsZSBwcmV2aW91cyBkb21pbmFudCBzcGVha2VyIHZpZGVvLlxuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5lbmFibGVEb21pbmFudFNwZWFrZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVuYWJsZSBuZXcgZG9taW5hbnQgc3BlYWtlciBpbiB0aGUgcmVtb3RlIHZpZGVvcyBzZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuZW5hYmxlRG9taW5hbnRTcGVha2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlckNoYW5nZWQgJiYgbGFyZ2VWaWRlb1N0YXRlLmlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXNpbmcgXCJ0aGlzXCIgc2hvdWxkIGJlIG9rIGJlY2F1c2Ugd2UncmUgY2FsbGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHdpdGhpbiB0aGUgZmFkZU91dCBldmVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuZmFkZUluKDMwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZih1c2VyQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHhtcHAuZmluZEppZEZyb21SZXNvdXJjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUudXBkYXRlSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBpZiAodXNlckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2xhcmdlVmlkZW8nKS5mYWRlT3V0KDMwMCwgZG9VcGRhdGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRvVXBkYXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKFxuICAgICAgICAgICAgICAgIHhtcHAuZmluZEppZEZyb21SZXNvdXJjZShcbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCkpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgbXkuaGFuZGxlVmlkZW9UaHVtYkNsaWNrZWQgPSBmdW5jdGlvbih2aWRlb1NyYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vUGlubmVkRW5kcG9pbnRDaGFuZ2VkRXZlbnQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VKaWQpIHtcbiAgICAgICAgLy8gUmVzdG9yZSBzdHlsZSBmb3IgcHJldmlvdXNseSBmb2N1c2VkIHZpZGVvXG4gICAgICAgIHZhciBvbGRDb250YWluZXIgPSBudWxsO1xuICAgICAgICBpZihmb2N1c2VkVmlkZW9JbmZvKSB7XG4gICAgICAgICAgICB2YXIgZm9jdXNSZXNvdXJjZUppZCA9IGZvY3VzZWRWaWRlb0luZm8ucmVzb3VyY2VKaWQ7XG4gICAgICAgICAgICBvbGRDb250YWluZXIgPSBnZXRQYXJ0aWNpcGFudENvbnRhaW5lcihmb2N1c1Jlc291cmNlSmlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvbGRDb250YWluZXIpIHtcbiAgICAgICAgICAgIG9sZENvbnRhaW5lci5yZW1vdmVDbGFzcyhcInZpZGVvQ29udGFpbmVyRm9jdXNlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVubG9jayBjdXJyZW50IGZvY3VzZWQuXG4gICAgICAgIGlmIChmb2N1c2VkVmlkZW9JbmZvICYmIGZvY3VzZWRWaWRlb0luZm8uc3JjID09PSB2aWRlb1NyYylcbiAgICAgICAge1xuICAgICAgICAgICAgZm9jdXNlZFZpZGVvSW5mbyA9IG51bGw7XG4gICAgICAgICAgICB2YXIgZG9taW5hbnRTcGVha2VyVmlkZW8gPSBudWxsO1xuICAgICAgICAgICAgLy8gRW5hYmxlIHRoZSBjdXJyZW50bHkgc2V0IGRvbWluYW50IHNwZWFrZXIuXG4gICAgICAgICAgICBpZiAoY3VycmVudERvbWluYW50U3BlYWtlcikge1xuICAgICAgICAgICAgICAgIGRvbWluYW50U3BlYWtlclZpZGVvXG4gICAgICAgICAgICAgICAgICAgID0gJCgnI3BhcnRpY2lwYW50XycgKyBjdXJyZW50RG9taW5hbnRTcGVha2VyICsgJz52aWRlbycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZ2V0KDApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGRvbWluYW50U3BlYWtlclZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oXG4gICAgICAgICAgICAgICAgICAgICAgICBSVEMuZ2V0VmlkZW9TcmMoZG9taW5hbnRTcGVha2VyVmlkZW8pLFxuICAgICAgICAgICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnREb21pbmFudFNwZWFrZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFub1Bpbm5lZEVuZHBvaW50Q2hhbmdlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInBpbm5lZGVuZHBvaW50Y2hhbmdlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIExvY2sgbmV3IHZpZGVvXG4gICAgICAgIGZvY3VzZWRWaWRlb0luZm8gPSB7XG4gICAgICAgICAgICBzcmM6IHZpZGVvU3JjLFxuICAgICAgICAgICAgcmVzb3VyY2VKaWQ6IHJlc291cmNlSmlkXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gVXBkYXRlIGZvY3VzZWQvcGlubmVkIGludGVyZmFjZS5cbiAgICAgICAgaWYgKHJlc291cmNlSmlkKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZ2V0UGFydGljaXBhbnRDb250YWluZXIocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgY29udGFpbmVyLmFkZENsYXNzKFwidmlkZW9Db250YWluZXJGb2N1c2VkXCIpO1xuXG4gICAgICAgICAgICBpZiAoIW5vUGlubmVkRW5kcG9pbnRDaGFuZ2VkRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwicGlubmVkZW5kcG9pbnRjaGFuZ2VkXCIsIFtyZXNvdXJjZUppZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCQoJyNsYXJnZVZpZGVvJykuYXR0cignc3JjJykgPT09IHZpZGVvU3JjICYmXG4gICAgICAgICAgICBWaWRlb0xheW91dC5pc0xhcmdlVmlkZW9PblRvcCgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUcmlnZ2VycyBhIFwidmlkZW8uc2VsZWN0ZWRcIiBldmVudC4gVGhlIFwiZmFsc2VcIiBwYXJhbWV0ZXIgaW5kaWNhdGVzXG4gICAgICAgIC8vIHRoaXMgaXNuJ3QgYSBwcmV6aS5cbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInZpZGVvLnNlbGVjdGVkXCIsIFtmYWxzZV0pO1xuXG4gICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8odmlkZW9TcmMsIDEsIHJlc291cmNlSmlkKTtcblxuICAgICAgICAkKCdhdWRpbycpLmVhY2goZnVuY3Rpb24gKGlkeCwgZWwpIHtcbiAgICAgICAgICAgIGlmIChlbC5pZC5pbmRleE9mKCdtaXhlZG1zbGFiZWwnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBlbC52b2x1bWUgPSAwO1xuICAgICAgICAgICAgICAgIGVsLnZvbHVtZSA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQb3NpdGlvbnMgdGhlIGxhcmdlIHZpZGVvLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpZGVvV2lkdGggdGhlIHN0cmVhbSB2aWRlbyB3aWR0aFxuICAgICAqIEBwYXJhbSB2aWRlb0hlaWdodCB0aGUgc3RyZWFtIHZpZGVvIGhlaWdodFxuICAgICAqL1xuICAgIG15LnBvc2l0aW9uTGFyZ2UgPSBmdW5jdGlvbiAodmlkZW9XaWR0aCwgdmlkZW9IZWlnaHQpIHtcbiAgICAgICAgdmFyIHZpZGVvU3BhY2VXaWR0aCA9ICQoJyN2aWRlb3NwYWNlJykud2lkdGgoKTtcbiAgICAgICAgdmFyIHZpZGVvU3BhY2VIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cbiAgICAgICAgdmFyIHZpZGVvU2l6ZSA9IFZpZGVvTGF5b3V0LmdldFZpZGVvU2l6ZSh2aWRlb1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlSGVpZ2h0KTtcblxuICAgICAgICB2YXIgbGFyZ2VWaWRlb1dpZHRoID0gdmlkZW9TaXplWzBdO1xuICAgICAgICB2YXIgbGFyZ2VWaWRlb0hlaWdodCA9IHZpZGVvU2l6ZVsxXTtcblxuICAgICAgICB2YXIgdmlkZW9Qb3NpdGlvbiA9IFZpZGVvTGF5b3V0LmdldFZpZGVvUG9zaXRpb24obGFyZ2VWaWRlb1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb0hlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VIZWlnaHQpO1xuXG4gICAgICAgIHZhciBob3Jpem9udGFsSW5kZW50ID0gdmlkZW9Qb3NpdGlvblswXTtcbiAgICAgICAgdmFyIHZlcnRpY2FsSW5kZW50ID0gdmlkZW9Qb3NpdGlvblsxXTtcblxuICAgICAgICBwb3NpdGlvblZpZGVvKCQoJyNsYXJnZVZpZGVvJyksXG4gICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbEluZGVudCwgdmVydGljYWxJbmRlbnQpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cy9oaWRlcyB0aGUgbGFyZ2UgdmlkZW8uXG4gICAgICovXG4gICAgbXkuc2V0TGFyZ2VWaWRlb1Zpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZDtcblxuICAgICAgICBpZiAoaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG4gICAgICAgICAgICAkKCcud2F0ZXJtYXJrJykuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LmVuYWJsZURvbWluYW50U3BlYWtlcihyZXNvdXJjZUppZCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcbiAgICAgICAgICAgICQoJyNhY3RpdmVTcGVha2VyJykuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgICAgICAgICAgJCgnLndhdGVybWFyaycpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LmVuYWJsZURvbWluYW50U3BlYWtlcihyZXNvdXJjZUppZCwgZmFsc2UpO1xuICAgICAgICAgICAgaWYoZm9jdXNlZFZpZGVvSW5mbykge1xuICAgICAgICAgICAgICAgIHZhciBmb2N1c1Jlc291cmNlSmlkID0gZm9jdXNlZFZpZGVvSW5mby5yZXNvdXJjZUppZDtcbiAgICAgICAgICAgICAgICB2YXIgb2xkQ29udGFpbmVyID0gZ2V0UGFydGljaXBhbnRDb250YWluZXIoZm9jdXNSZXNvdXJjZUppZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAob2xkQ29udGFpbmVyICYmIG9sZENvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZENvbnRhaW5lci5yZW1vdmVDbGFzcyhcInZpZGVvQ29udGFpbmVyRm9jdXNlZFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9jdXNlZFZpZGVvSW5mbyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYoZm9jdXNSZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgICAgICAgICBBdmF0YXIuc2hvd1VzZXJBdmF0YXIoXG4gICAgICAgICAgICAgICAgICAgICAgICB4bXBwLmZpbmRKaWRGcm9tUmVzb3VyY2UoZm9jdXNSZXNvdXJjZUppZCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGxhcmdlIHZpZGVvIGlzIGN1cnJlbnRseSB2aXNpYmxlLlxuICAgICAqXG4gICAgICogQHJldHVybiA8dHQ+dHJ1ZTwvdHQ+IGlmIHZpc2libGUsIDx0dD5mYWxzZTwvdHQ+IC0gb3RoZXJ3aXNlXG4gICAgICovXG4gICAgbXkuaXNMYXJnZVZpZGVvVmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCgnI2xhcmdlVmlkZW8nKS5pcygnOnZpc2libGUnKTtcbiAgICB9O1xuXG4gICAgbXkuaXNMYXJnZVZpZGVvT25Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBFdGhlcnBhZCA9IHJlcXVpcmUoXCIuLi9ldGhlcnBhZC9FdGhlcnBhZFwiKTtcbiAgICAgICAgdmFyIFByZXppID0gcmVxdWlyZShcIi4uL3ByZXppL1ByZXppXCIpO1xuICAgICAgICByZXR1cm4gIVByZXppLmlzUHJlc2VudGF0aW9uVmlzaWJsZSgpICYmICFFdGhlcnBhZC5pc1Zpc2libGUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGNvbnRhaW5lciBmb3IgcGFydGljaXBhbnQgaWRlbnRpZmllZCBieSBnaXZlbiBwZWVySmlkIGV4aXN0c1xuICAgICAqIGluIHRoZSBkb2N1bWVudCBhbmQgY3JlYXRlcyBpdCBldmVudHVhbGx5LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBwZWVySmlkIHBlZXIgSmlkIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB1c2VySWQgdXNlciBlbWFpbCBvciBpZCBmb3Igc2V0dGluZyB0aGUgYXZhdGFyXG4gICAgICogXG4gICAgICogQHJldHVybiBSZXR1cm5zIDx0dD50cnVlPC90dD4gaWYgdGhlIHBlZXIgY29udGFpbmVyIGV4aXN0cyxcbiAgICAgKiA8dHQ+ZmFsc2U8L3R0PiAtIG90aGVyd2lzZVxuICAgICAqL1xuICAgIG15LmVuc3VyZVBlZXJDb250YWluZXJFeGlzdHMgPSBmdW5jdGlvbihwZWVySmlkLCB1c2VySWQpIHtcbiAgICAgICAgQ29udGFjdExpc3QuZW5zdXJlQWRkQ29udGFjdChwZWVySmlkLCB1c2VySWQpO1xuXG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKHBlZXJKaWQpO1xuXG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQ7XG5cbiAgICAgICAgaWYgKCEkKCcjJyArIHZpZGVvU3BhbklkKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmFkZFJlbW90ZVZpZGVvQ29udGFpbmVyKHBlZXJKaWQsIHZpZGVvU3BhbklkLCB1c2VySWQpO1xuICAgICAgICAgICAgQXZhdGFyLnNldFVzZXJBdmF0YXIocGVlckppZCwgdXNlcklkKTtcbiAgICAgICAgICAgIC8vIFNldCBkZWZhdWx0IGRpc3BsYXkgbmFtZS5cbiAgICAgICAgICAgIHNldERpc3BsYXlOYW1lKHZpZGVvU3BhbklkKTtcblxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbdmlkZW9TcGFuSWRdID1cbiAgICAgICAgICAgICAgICBuZXcgQ29ubmVjdGlvbkluZGljYXRvcihjb250YWluZXIsIHBlZXJKaWQsIFZpZGVvTGF5b3V0KTtcblxuICAgICAgICAgICAgdmFyIG5pY2tmaWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIG5pY2tmaWVsZC5jbGFzc05hbWUgPSBcIm5pY2tcIjtcbiAgICAgICAgICAgIG5pY2tmaWVsZC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShyZXNvdXJjZUppZCkpO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG5pY2tmaWVsZCk7XG5cbiAgICAgICAgICAgIC8vIEluIGNhc2UgdGhpcyBpcyBub3QgY3VycmVudGx5IGluIHRoZSBsYXN0IG4gd2UgZG9uJ3Qgc2hvdyBpdC5cbiAgICAgICAgICAgIGlmIChsb2NhbExhc3ROQ291bnRcbiAgICAgICAgICAgICAgICAmJiBsb2NhbExhc3ROQ291bnQgPiAwXG4gICAgICAgICAgICAgICAgJiYgJCgnI3JlbW90ZVZpZGVvcz5zcGFuJykubGVuZ3RoID49IGxvY2FsTGFzdE5Db3VudCArIDIpIHtcbiAgICAgICAgICAgICAgICBzaG93UGVlckNvbnRhaW5lcihyZXNvdXJjZUppZCwgJ2hpZGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbXkuYWRkUmVtb3RlVmlkZW9Db250YWluZXIgPSBmdW5jdGlvbihwZWVySmlkLCBzcGFuSWQpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgY29udGFpbmVyLmlkID0gc3BhbklkO1xuICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3ZpZGVvY29udGFpbmVyJztcbiAgICAgICAgdmFyIHJlbW90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVtb3RlVmlkZW9zJyk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHBlZXJKaWQgaXMgbnVsbCB0aGVuIHRoaXMgdmlkZW8gc3BhbiBjb3VsZG4ndCBiZSBkaXJlY3RseVxuICAgICAgICAvLyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWNpcGFudCAodGhpcyBjb3VsZCBoYXBwZW4gaW4gdGhlIGNhc2Ugb2YgcHJlemkpLlxuICAgICAgICBpZiAoeG1wcC5pc01vZGVyYXRvcigpICYmIHBlZXJKaWQgIT09IG51bGwpXG4gICAgICAgICAgICBhZGRSZW1vdGVWaWRlb01lbnUocGVlckppZCwgY29udGFpbmVyKTtcblxuICAgICAgICByZW1vdGVzLmFwcGVuZENoaWxkKGNvbnRhaW5lcik7XG4gICAgICAgIEF1ZGlvTGV2ZWxzLnVwZGF0ZUF1ZGlvTGV2ZWxDYW52YXMocGVlckppZCwgVmlkZW9MYXlvdXQpO1xuXG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gYXVkaW8gb3IgdmlkZW8gc3RyZWFtIGVsZW1lbnQuXG4gICAgICovXG4gICAgbXkuY3JlYXRlU3RyZWFtRWxlbWVudCA9IGZ1bmN0aW9uIChzaWQsIHN0cmVhbSkge1xuICAgICAgICB2YXIgaXNWaWRlbyA9IHN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmxlbmd0aCA+IDA7XG5cbiAgICAgICAgdmFyIGVsZW1lbnQgPSBpc1ZpZGVvXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJylcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgdmFyIGlkID0gKGlzVmlkZW8gPyAncmVtb3RlVmlkZW9fJyA6ICdyZW1vdGVBdWRpb18nKVxuICAgICAgICAgICAgICAgICAgICArIHNpZCArICdfJyArIFJUQy5nZXRTdHJlYW1JRChzdHJlYW0pO1xuXG4gICAgICAgIGVsZW1lbnQuaWQgPSBpZDtcbiAgICAgICAgZWxlbWVudC5hdXRvcGxheSA9IHRydWU7XG4gICAgICAgIGVsZW1lbnQub25jb250ZXh0bWVudSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG5cbiAgICBteS5hZGRSZW1vdGVTdHJlYW1FbGVtZW50XG4gICAgICAgID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgc2lkLCBzdHJlYW0sIHBlZXJKaWQsIHRoZXNzcmMpIHtcbiAgICAgICAgdmFyIG5ld0VsZW1lbnRJZCA9IG51bGw7XG5cbiAgICAgICAgdmFyIGlzVmlkZW8gPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGggPiAwO1xuXG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgIHZhciBzdHJlYW1FbGVtZW50ID0gVmlkZW9MYXlvdXQuY3JlYXRlU3RyZWFtRWxlbWVudChzaWQsIHN0cmVhbSk7XG4gICAgICAgICAgICBuZXdFbGVtZW50SWQgPSBzdHJlYW1FbGVtZW50LmlkO1xuXG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3RyZWFtRWxlbWVudCk7XG5cbiAgICAgICAgICAgIHZhciBzZWwgPSAkKCcjJyArIG5ld0VsZW1lbnRJZCk7XG4gICAgICAgICAgICBzZWwuaGlkZSgpO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgY29udGFpbmVyIGlzIGN1cnJlbnRseSB2aXNpYmxlIHdlIGF0dGFjaCB0aGUgc3RyZWFtLlxuICAgICAgICAgICAgaWYgKCFpc1ZpZGVvXG4gICAgICAgICAgICAgICAgfHwgKGNvbnRhaW5lci5vZmZzZXRQYXJlbnQgIT09IG51bGwgJiYgaXNWaWRlbykpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9TdHJlYW0gPSBzaW11bGNhc3QuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW0oc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBSVEMuYXR0YWNoTWVkaWFTdHJlYW0oc2VsLCB2aWRlb1N0cmVhbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNWaWRlbylcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvclJlbW90ZVZpZGVvKHNlbCwgdGhlc3NyYywgc3RyZWFtLCBwZWVySmlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RyZWFtLm9uZW5kZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3N0cmVhbSBlbmRlZCcsIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVtb3ZlUmVtb3RlU3RyZWFtRWxlbWVudChcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLCBpc1ZpZGVvLCBjb250YWluZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gTk9URShncCkgaXQgc2VlbXMgdGhhdCB1bmRlciBjZXJ0YWluIGNpcmN1bXN0YW5jZXMsIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9uZW5kZWQgZXZlbnQgaXMgbm90IGZpcmVkIGFuZCB0aHVzIHRoZSBjb250YWN0IGxpc3QgaXMgbm90XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlZC5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIFRoZSBvbmVuZGVkIGV2ZW50IG9mIGEgc3RyZWFtIHNob3VsZCBiZSBmaXJlZCB3aGVuIHRoZSBTU1JDc1xuICAgICAgICAgICAgICAgIC8vIGNvcnJlc3BvbmRpbmcgdG8gdGhhdCBzdHJlYW0gYXJlIHJlbW92ZWQgZnJvbSB0aGUgU0RQOyBidXRcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGRvZXNuJ3Qgc2VlbSB0byBhbHdheXMgYmUgdGhlIGNhc2UsIHJlc3VsdGluZyBpbiBnaG9zdFxuICAgICAgICAgICAgICAgIC8vIGNvbnRhY3RzLlxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLy8gSW4gYW4gYXR0ZW1wdCB0byBmaXggdGhlIGdob3N0IGNvbnRhY3RzIHByb2JsZW0sIEknbSBtb3ZpbmdcbiAgICAgICAgICAgICAgICAvLyB0aGUgcmVtb3ZlQ29udGFjdCgpIG1ldGhvZCBjYWxsIGluIGFwcC5qcywgaW5zaWRlIHRoZVxuICAgICAgICAgICAgICAgIC8vICdtdWMubGVmdCcgZXZlbnQgaGFuZGxlci5cblxuICAgICAgICAgICAgICAgIC8vaWYgKHBlZXJKaWQpXG4gICAgICAgICAgICAgICAgLy8gICAgQ29udGFjdExpc3QucmVtb3ZlQ29udGFjdChwZWVySmlkKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIEFkZCBjbGljayBoYW5kbGVyLlxuICAgICAgICAgICAgY29udGFpbmVyLm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAqIEZJWE1FIEl0IHR1cm5zIG91dCB0aGF0IHZpZGVvVGh1bWIgbWF5IG5vdCBleGlzdCAoaWYgdGhlcmUgaXNcbiAgICAgICAgICAgICAgICAgKiBubyBhY3R1YWwgdmlkZW8pLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHZhciB2aWRlb1RodW1iID0gJCgnIycgKyBjb250YWluZXIuaWQgKyAnPnZpZGVvJykuZ2V0KDApO1xuICAgICAgICAgICAgICAgIGlmICh2aWRlb1RodW1iKSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmhhbmRsZVZpZGVvVGh1bWJDbGlja2VkKFxuICAgICAgICAgICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKHZpZGVvVGh1bWIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBBZGQgaG92ZXIgaGFuZGxlclxuICAgICAgICAgICAgJChjb250YWluZXIpLmhvdmVyKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zaG93RGlzcGxheU5hbWUoY29udGFpbmVyLmlkLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmlkZW9TcmMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJCgnIycgKyBjb250YWluZXIuaWQgKyAnPnZpZGVvJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAkKCcjJyArIGNvbnRhaW5lci5pZCArICc+dmlkZW8nKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NyYyA9IFJUQy5nZXRWaWRlb1NyYygkKCcjJyArIGNvbnRhaW5lci5pZCArICc+dmlkZW8nKS5nZXQoMCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHZpZGVvIGhhcyBiZWVuIFwicGlubmVkXCIgYnkgdGhlIHVzZXIgd2Ugd2FudCB0b1xuICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIHRoZSBkaXNwbGF5IG5hbWUgb24gcGxhY2UuXG4gICAgICAgICAgICAgICAgICAgIGlmICghVmlkZW9MYXlvdXQuaXNMYXJnZVZpZGVvVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgdmlkZW9TcmMgIT09IFJUQy5nZXRWaWRlb1NyYygkKCcjbGFyZ2VWaWRlbycpWzBdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dEaXNwbGF5TmFtZShjb250YWluZXIuaWQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld0VsZW1lbnRJZDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgcmVtb3RlIHN0cmVhbSBlbGVtZW50IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIHN0cmVhbSBhbmRcbiAgICAgKiBwYXJlbnQgY29udGFpbmVyLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBzdHJlYW0gdGhlIHN0cmVhbVxuICAgICAqIEBwYXJhbSBpc1ZpZGVvIDx0dD50cnVlPC90dD4gaWYgZ2l2ZW4gPHR0PnN0cmVhbTwvdHQ+IGlzIGEgdmlkZW8gb25lLlxuICAgICAqIEBwYXJhbSBjb250YWluZXJcbiAgICAgKi9cbiAgICBteS5yZW1vdmVSZW1vdGVTdHJlYW1FbGVtZW50ID0gZnVuY3Rpb24gKHN0cmVhbSwgaXNWaWRlbywgY29udGFpbmVyKSB7XG4gICAgICAgIGlmICghY29udGFpbmVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBzZWxlY3QgPSBudWxsO1xuICAgICAgICB2YXIgcmVtb3ZlZFZpZGVvU3JjID0gbnVsbDtcbiAgICAgICAgaWYgKGlzVmlkZW8pIHtcbiAgICAgICAgICAgIHNlbGVjdCA9ICQoJyMnICsgY29udGFpbmVyLmlkICsgJz52aWRlbycpO1xuICAgICAgICAgICAgcmVtb3ZlZFZpZGVvU3JjID0gUlRDLmdldFZpZGVvU3JjKHNlbGVjdC5nZXQoMCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNlbGVjdCA9ICQoJyMnICsgY29udGFpbmVyLmlkICsgJz5hdWRpbycpO1xuXG5cbiAgICAgICAgLy8gTWFyayB2aWRlbyBhcyByZW1vdmVkIHRvIGNhbmNlbCB3YWl0aW5nIGxvb3AoaWYgdmlkZW8gaXMgcmVtb3ZlZFxuICAgICAgICAvLyBiZWZvcmUgaGFzIHN0YXJ0ZWQpXG4gICAgICAgIHNlbGVjdC5yZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgc2VsZWN0LnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciBhdWRpb0NvdW50ID0gJCgnIycgKyBjb250YWluZXIuaWQgKyAnPmF1ZGlvJykubGVuZ3RoO1xuICAgICAgICB2YXIgdmlkZW9Db3VudCA9ICQoJyMnICsgY29udGFpbmVyLmlkICsgJz52aWRlbycpLmxlbmd0aDtcblxuICAgICAgICBpZiAoIWF1ZGlvQ291bnQgJiYgIXZpZGVvQ291bnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVtb3ZlIHdob2xlIHVzZXJcIiwgY29udGFpbmVyLmlkKTtcbiAgICAgICAgICAgIGlmKFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW2NvbnRhaW5lci5pZF0pXG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbY29udGFpbmVyLmlkXS5yZW1vdmUoKTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB3aG9sZSBjb250YWluZXJcbiAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmUoKTtcblxuICAgICAgICAgICAgVXRpbC5wbGF5U291bmROb3RpZmljYXRpb24oJ3VzZXJMZWZ0Jyk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVtb3ZlZFZpZGVvU3JjKVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlUmVtb3ZlZFZpZGVvKHJlbW92ZWRWaWRlb1NyYyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3cvaGlkZSBwZWVyIGNvbnRhaW5lciBmb3IgdGhlIGdpdmVuIHJlc291cmNlSmlkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHNob3dQZWVyQ29udGFpbmVyKHJlc291cmNlSmlkLCBzdGF0ZSkge1xuICAgICAgICB2YXIgcGVlckNvbnRhaW5lciA9ICQoJyNwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQpO1xuXG4gICAgICAgIGlmICghcGVlckNvbnRhaW5lcilcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgaXNIaWRlID0gc3RhdGUgPT09ICdoaWRlJztcbiAgICAgICAgdmFyIHJlc2l6ZVRodW1ibmFpbHMgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIWlzSGlkZSkge1xuICAgICAgICAgICAgaWYgKCFwZWVyQ29udGFpbmVyLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgcmVzaXplVGh1bWJuYWlscyA9IHRydWU7XG4gICAgICAgICAgICAgICAgcGVlckNvbnRhaW5lci5zaG93KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGF0ZSA9PSAnc2hvdycpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gcGVlckNvbnRhaW5lci5jc3MoJy13ZWJraXQtZmlsdGVyJywgJycpO1xuICAgICAgICAgICAgICAgIHZhciBqaWQgPSB4bXBwLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgIEF2YXRhci5zaG93VXNlckF2YXRhcihqaWQsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgLy8gaWYgKHN0YXRlID09ICdhdmF0YXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIHBlZXJDb250YWluZXIuY3NzKCctd2Via2l0LWZpbHRlcicsICdncmF5c2NhbGUoMTAwJSknKTtcbiAgICAgICAgICAgICAgICB2YXIgamlkID0geG1wcC5maW5kSmlkRnJvbVJlc291cmNlKHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgICAgICBBdmF0YXIuc2hvd1VzZXJBdmF0YXIoamlkLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwZWVyQ29udGFpbmVyLmlzKCc6dmlzaWJsZScpICYmIGlzSGlkZSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzaXplVGh1bWJuYWlscyA9IHRydWU7XG4gICAgICAgICAgICBwZWVyQ29udGFpbmVyLmhpZGUoKTtcbiAgICAgICAgICAgIGlmKFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzWydwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWRdKVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzWydwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWRdLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXNpemVUaHVtYm5haWxzKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSB3YW50IHRvIGJlIGFibGUgdG8gcGluIGEgcGFydGljaXBhbnQgZnJvbSB0aGUgY29udGFjdCBsaXN0LCBldmVuXG4gICAgICAgIC8vIGlmIGhlJ3Mgbm90IGluIHRoZSBsYXN0TiBzZXQhXG4gICAgICAgIC8vIENvbnRhY3RMaXN0LnNldENsaWNrYWJsZShyZXNvdXJjZUppZCwgIWlzSGlkZSk7XG5cbiAgICB9O1xuXG4gICAgbXkuaW5wdXREaXNwbGF5TmFtZUhhbmRsZXIgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBpZiAobmFtZSAmJiBuaWNrbmFtZSAhPT0gbmFtZSkge1xuICAgICAgICAgICAgbmlja25hbWUgPSBuYW1lO1xuICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSA9IG5pY2tuYW1lO1xuICAgICAgICAgICAgeG1wcC5hZGRUb1ByZXNlbmNlKFwiZGlzcGxheU5hbWVcIiwgbmlja25hbWUpO1xuXG4gICAgICAgICAgICBDaGF0LnNldENoYXRDb252ZXJzYXRpb25Nb2RlKHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEkKCcjbG9jYWxEaXNwbGF5TmFtZScpLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgICAgIGlmIChuaWNrbmFtZSlcbiAgICAgICAgICAgICAgICAkKCcjbG9jYWxEaXNwbGF5TmFtZScpLnRleHQobmlja25hbWUgKyBcIiAobWUpXCIpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJylcbiAgICAgICAgICAgICAgICAgICAgLnRleHQoaW50ZXJmYWNlQ29uZmlnLkRFRkFVTFRfTE9DQUxfRElTUExBWV9OQU1FKTtcbiAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJykuc2hvdygpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnI2VkaXREaXNwbGF5TmFtZScpLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvd3MvaGlkZXMgdGhlIGRpc3BsYXkgbmFtZSBvbiB0aGUgcmVtb3RlIHZpZGVvLlxuICAgICAqIEBwYXJhbSB2aWRlb1NwYW5JZCB0aGUgaWRlbnRpZmllciBvZiB0aGUgdmlkZW8gc3BhbiBlbGVtZW50XG4gICAgICogQHBhcmFtIGlzU2hvdyBpbmRpY2F0ZXMgaWYgdGhlIGRpc3BsYXkgbmFtZSBzaG91bGQgYmUgc2hvd24gb3IgaGlkZGVuXG4gICAgICovXG4gICAgbXkuc2hvd0Rpc3BsYXlOYW1lID0gZnVuY3Rpb24odmlkZW9TcGFuSWQsIGlzU2hvdykge1xuICAgICAgICB2YXIgbmFtZVNwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLmRpc3BsYXluYW1lJykuZ2V0KDApO1xuICAgICAgICBpZiAoaXNTaG93KSB7XG4gICAgICAgICAgICBpZiAobmFtZVNwYW4gJiYgbmFtZVNwYW4uaW5uZXJIVE1MICYmIG5hbWVTcGFuLmlubmVySFRNTC5sZW5ndGgpIFxuICAgICAgICAgICAgICAgIG5hbWVTcGFuLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwiZGlzcGxheTppbmxpbmUtYmxvY2s7XCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5hbWVTcGFuKVxuICAgICAgICAgICAgICAgIG5hbWVTcGFuLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwiZGlzcGxheTpub25lO1wiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyB0aGUgcHJlc2VuY2Ugc3RhdHVzIG1lc3NhZ2UgZm9yIHRoZSBnaXZlbiB2aWRlby5cbiAgICAgKi9cbiAgICBteS5zZXRQcmVzZW5jZVN0YXR1cyA9IGZ1bmN0aW9uICh2aWRlb1NwYW5JZCwgc3RhdHVzTXNnKSB7XG5cbiAgICAgICAgaWYgKCEkKCcjJyArIHZpZGVvU3BhbklkKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIE5vIGNvbnRhaW5lclxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0YXR1c1NwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLnN0YXR1cycpO1xuICAgICAgICBpZiAoIXN0YXR1c1NwYW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAvL0FkZCBzdGF0dXMgc3BhblxuICAgICAgICAgICAgc3RhdHVzU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIHN0YXR1c1NwYW4uY2xhc3NOYW1lID0gJ3N0YXR1cyc7XG4gICAgICAgICAgICBzdGF0dXNTcGFuLmlkID0gdmlkZW9TcGFuSWQgKyAnX3N0YXR1cyc7XG4gICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkKVswXS5hcHBlbmRDaGlsZChzdGF0dXNTcGFuKTtcblxuICAgICAgICAgICAgc3RhdHVzU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4uc3RhdHVzJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEaXNwbGF5IHN0YXR1c1xuICAgICAgICBpZiAoc3RhdHVzTXNnICYmIHN0YXR1c01zZy5sZW5ndGgpIHtcbiAgICAgICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnX3N0YXR1cycpLnRleHQoc3RhdHVzTXNnKTtcbiAgICAgICAgICAgIHN0YXR1c1NwYW4uZ2V0KDApLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwiZGlzcGxheTppbmxpbmUtYmxvY2s7XCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gSGlkZVxuICAgICAgICAgICAgc3RhdHVzU3Bhbi5nZXQoMCkuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgXCJkaXNwbGF5Om5vbmU7XCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzIGEgdmlzdWFsIGluZGljYXRvciBmb3IgdGhlIG1vZGVyYXRvciBvZiB0aGUgY29uZmVyZW5jZS5cbiAgICAgKi9cbiAgICBteS5zaG93TW9kZXJhdG9ySW5kaWNhdG9yID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBpc01vZGVyYXRvciA9IHhtcHAuaXNNb2RlcmF0b3IoKTtcbiAgICAgICAgaWYgKGlzTW9kZXJhdG9yKSB7XG4gICAgICAgICAgICB2YXIgaW5kaWNhdG9yU3BhbiA9ICQoJyNsb2NhbFZpZGVvQ29udGFpbmVyIC5mb2N1c2luZGljYXRvcicpO1xuXG4gICAgICAgICAgICBpZiAoaW5kaWNhdG9yU3Bhbi5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVNb2RlcmF0b3JJbmRpY2F0b3JFbGVtZW50KGluZGljYXRvclNwYW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1lbWJlcnMgPSB4bXBwLmdldE1lbWJlcnMoKTtcblxuICAgICAgICBPYmplY3Qua2V5cyhtZW1iZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChqaWQpIHtcblxuICAgICAgICAgICAgaWYgKFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkgPT09ICdmb2N1cycpIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHNlcnZlciBzaWRlIGZvY3VzXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuICAgICAgICAgICAgdmFyIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZDtcbiAgICAgICAgICAgIHZhciB2aWRlb0NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZpZGVvU3BhbklkKTtcblxuICAgICAgICAgICAgaWYgKCF2aWRlb0NvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyB2aWRlbyBjb250YWluZXIgZm9yIFwiICsgamlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtZW1iZXIgPSBtZW1iZXJzW2ppZF07XG5cbiAgICAgICAgICAgIGlmIChtZW1iZXIucm9sZSA9PT0gJ21vZGVyYXRvcicpIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgbWVudSBpZiBwZWVyIGlzIG1vZGVyYXRvclxuICAgICAgICAgICAgICAgIHZhciBtZW51U3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4ucmVtb3RldmlkZW9tZW51Jyk7XG4gICAgICAgICAgICAgICAgaWYgKG1lbnVTcGFuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVSZW1vdGVWaWRlb01lbnUodmlkZW9TcGFuSWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTaG93IG1vZGVyYXRvciBpbmRpY2F0b3JcbiAgICAgICAgICAgICAgICB2YXIgaW5kaWNhdG9yU3BhblxuICAgICAgICAgICAgICAgICAgICA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnIC5mb2N1c2luZGljYXRvcicpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmRpY2F0b3JTcGFuIHx8IGluZGljYXRvclNwYW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvclNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvclNwYW4uY2xhc3NOYW1lID0gJ2ZvY3VzaW5kaWNhdG9yJztcblxuICAgICAgICAgICAgICAgICAgICB2aWRlb0NvbnRhaW5lci5hcHBlbmRDaGlsZChpbmRpY2F0b3JTcGFuKTtcblxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVNb2RlcmF0b3JJbmRpY2F0b3JFbGVtZW50KGluZGljYXRvclNwYW4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNNb2RlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICAvLyBXZSBhcmUgbW9kZXJhdG9yLCBidXQgdXNlciBpcyBub3QgLSBhZGQgbWVudVxuICAgICAgICAgICAgICAgIGlmICgkKCcjcmVtb3RlX3BvcHVwbWVudV8nICsgcmVzb3VyY2VKaWQpLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZFJlbW90ZVZpZGVvTWVudShcbiAgICAgICAgICAgICAgICAgICAgICAgIGppZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyB2aWRlbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciBzbWFsbCB2aWRlb3MuXG4gICAgICovXG4gICAgbXkuc2hvd1ZpZGVvSW5kaWNhdG9yID0gZnVuY3Rpb24odmlkZW9TcGFuSWQsIGlzTXV0ZWQpIHtcbiAgICAgICAgdmFyIHZpZGVvTXV0ZWRTcGFuID0gJCgnIycgKyB2aWRlb1NwYW5JZCArICc+c3Bhbi52aWRlb011dGVkJyk7XG5cbiAgICAgICAgaWYgKGlzTXV0ZWQgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIGlmICh2aWRlb011dGVkU3Bhbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4ucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZih2aWRlb011dGVkU3Bhbi5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuLmNsYXNzTmFtZSA9ICd2aWRlb011dGVkJztcblxuICAgICAgICAgICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQpWzBdLmFwcGVuZENoaWxkKHZpZGVvTXV0ZWRTcGFuKTtcblxuICAgICAgICAgICAgICAgIHZhciBtdXRlZEluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgICAgICAgICAgICBtdXRlZEluZGljYXRvci5jbGFzc05hbWUgPSAnaWNvbi1jYW1lcmEtZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIFV0aWwuc2V0VG9vbHRpcChtdXRlZEluZGljYXRvcixcbiAgICAgICAgICAgICAgICAgICAgXCJQYXJ0aWNpcGFudCBoYXM8YnIvPnN0b3BwZWQgdGhlIGNhbWVyYS5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0b3BcIik7XG4gICAgICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4uYXBwZW5kQ2hpbGQobXV0ZWRJbmRpY2F0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVNdXRlUG9zaXRpb24odmlkZW9TcGFuSWQpO1xuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbXkudXBkYXRlTXV0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKHZpZGVvU3BhbklkKSB7XG4gICAgICAgIHZhciBhdWRpb011dGVkU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4uYXVkaW9NdXRlZCcpO1xuICAgICAgICB2YXIgY29ubmVjdGlvbkluZGljYXRvciA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPmRpdi5jb25uZWN0aW9uaW5kaWNhdG9yJyk7XG4gICAgICAgIHZhciB2aWRlb011dGVkU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4udmlkZW9NdXRlZCcpO1xuICAgICAgICBpZihjb25uZWN0aW9uSW5kaWNhdG9yLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICYmIGNvbm5lY3Rpb25JbmRpY2F0b3JbMF0uc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIikge1xuICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4uY3NzKHtyaWdodDogXCIyM3B4XCJ9KTtcbiAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuLmNzcyh7cmlnaHQ6ICgoYXVkaW9NdXRlZFNwYW4ubGVuZ3RoID4gMD8gMjMgOiAwKSArIDMwKSArIFwicHhcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4uY3NzKHtyaWdodDogXCIwcHhcIn0pO1xuICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4uY3NzKHtyaWdodDogKGF1ZGlvTXV0ZWRTcGFuLmxlbmd0aCA+IDA/IDMwIDogMCkgKyBcInB4XCJ9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTaG93cyBhdWRpbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciBzbWFsbCB2aWRlb3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlzTXV0ZWRcbiAgICAgKi9cbiAgICBteS5zaG93QXVkaW9JbmRpY2F0b3IgPSBmdW5jdGlvbih2aWRlb1NwYW5JZCwgaXNNdXRlZCkge1xuICAgICAgICB2YXIgYXVkaW9NdXRlZFNwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLmF1ZGlvTXV0ZWQnKTtcblxuICAgICAgICBpZiAoaXNNdXRlZCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgaWYgKGF1ZGlvTXV0ZWRTcGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3Bhbi5wb3BvdmVyKCdoaWRlJyk7XG4gICAgICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4ucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZihhdWRpb011dGVkU3Bhbi5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3Bhbi5jbGFzc05hbWUgPSAnYXVkaW9NdXRlZCc7XG4gICAgICAgICAgICAgICAgVXRpbC5zZXRUb29sdGlwKGF1ZGlvTXV0ZWRTcGFuLFxuICAgICAgICAgICAgICAgICAgICBcIlBhcnRpY2lwYW50IGlzIG11dGVkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidG9wXCIpO1xuXG4gICAgICAgICAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZClbMF0uYXBwZW5kQ2hpbGQoYXVkaW9NdXRlZFNwYW4pO1xuICAgICAgICAgICAgICAgIHZhciBtdXRlZEluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgICAgICAgICAgICBtdXRlZEluZGljYXRvci5jbGFzc05hbWUgPSAnaWNvbi1taWMtZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIGF1ZGlvTXV0ZWRTcGFuLmFwcGVuZENoaWxkKG11dGVkSW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTXV0ZVBvc2l0aW9uKHZpZGVvU3BhbklkKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKlxuICAgICAqIFNob3dzIG9yIGhpZGVzIHRoZSBhdWRpbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciB0aGUgbG9jYWwgdGh1bWJuYWlsIHZpZGVvLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNNdXRlZFxuICAgICAqL1xuICAgIG15LnNob3dMb2NhbEF1ZGlvSW5kaWNhdG9yID0gZnVuY3Rpb24oaXNNdXRlZCkge1xuICAgICAgICBWaWRlb0xheW91dC5zaG93QXVkaW9JbmRpY2F0b3IoJ2xvY2FsVmlkZW9Db250YWluZXInLCBpc011dGVkLnRvU3RyaW5nKCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRoZSBsYXJnZSB2aWRlbyBjb250YWluZXIuXG4gICAgICovXG4gICAgbXkucmVzaXplTGFyZ2VWaWRlb0NvbnRhaW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ2hhdC5yZXNpemVDaGF0KCk7XG4gICAgICAgIHZhciBhdmFpbGFibGVIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IFVJVXRpbC5nZXRBdmFpbGFibGVWaWRlb1dpZHRoKCk7XG5cbiAgICAgICAgaWYgKGF2YWlsYWJsZVdpZHRoIDwgMCB8fCBhdmFpbGFibGVIZWlnaHQgPCAwKSByZXR1cm47XG5cbiAgICAgICAgJCgnI3ZpZGVvc3BhY2UnKS53aWR0aChhdmFpbGFibGVXaWR0aCk7XG4gICAgICAgICQoJyN2aWRlb3NwYWNlJykuaGVpZ2h0KGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICAgICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykud2lkdGgoYXZhaWxhYmxlV2lkdGgpO1xuICAgICAgICAkKCcjbGFyZ2VWaWRlb0NvbnRhaW5lcicpLmhlaWdodChhdmFpbGFibGVIZWlnaHQpO1xuXG4gICAgICAgIHZhciBhdmF0YXJTaXplID0gaW50ZXJmYWNlQ29uZmlnLkFDVElWRV9TUEVBS0VSX0FWQVRBUl9TSVpFO1xuICAgICAgICB2YXIgdG9wID0gYXZhaWxhYmxlSGVpZ2h0IC8gMiAtIGF2YXRhclNpemUgLyA0ICogMztcbiAgICAgICAgJCgnI2FjdGl2ZVNwZWFrZXInKS5jc3MoJ3RvcCcsIHRvcCk7XG5cbiAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRodW1ibmFpbHMuXG4gICAgICovXG4gICAgbXkucmVzaXplVGh1bWJuYWlscyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmlkZW9TcGFjZVdpZHRoID0gJCgnI3JlbW90ZVZpZGVvcycpLndpZHRoKCk7XG5cbiAgICAgICAgdmFyIHRodW1ibmFpbFNpemUgPSBWaWRlb0xheW91dC5jYWxjdWxhdGVUaHVtYm5haWxTaXplKHZpZGVvU3BhY2VXaWR0aCk7XG4gICAgICAgIHZhciB3aWR0aCA9IHRodW1ibmFpbFNpemVbMF07XG4gICAgICAgIHZhciBoZWlnaHQgPSB0aHVtYm5haWxTaXplWzFdO1xuXG4gICAgICAgIC8vIHNpemUgdmlkZW9zIHNvIHRoYXQgd2hpbGUga2VlcGluZyBBUiBhbmQgbWF4IGhlaWdodCwgd2UgaGF2ZSBhXG4gICAgICAgIC8vIG5pY2UgZml0XG4gICAgICAgICQoJyNyZW1vdGVWaWRlb3MnKS5oZWlnaHQoaGVpZ2h0KTtcbiAgICAgICAgJCgnI3JlbW90ZVZpZGVvcz5zcGFuJykud2lkdGgod2lkdGgpO1xuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5oZWlnaHQoaGVpZ2h0KTtcblxuICAgICAgICAkKCcudXNlckF2YXRhcicpLmNzcygnbGVmdCcsICh3aWR0aCAtIGhlaWdodCkgLyAyKTtcblxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwicmVtb3RldmlkZW8ucmVzaXplZFwiLCBbd2lkdGgsIGhlaWdodF0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGVzIHRoZSBkb21pbmFudCBzcGVha2VyIFVJLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc291cmNlSmlkIHRoZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZWxlbWVudCB0b1xuICAgICAqIGFjdGl2YXRlL2RlYWN0aXZhdGVcbiAgICAgKiBAcGFyYW0gaXNFbmFibGUgaW5kaWNhdGVzIGlmIHRoZSBkb21pbmFudCBzcGVha2VyIHNob3VsZCBiZSBlbmFibGVkIG9yXG4gICAgICogZGlzYWJsZWRcbiAgICAgKi9cbiAgICBteS5lbmFibGVEb21pbmFudFNwZWFrZXIgPSBmdW5jdGlvbihyZXNvdXJjZUppZCwgaXNFbmFibGUpIHtcblxuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBudWxsO1xuICAgICAgICB2YXIgdmlkZW9Db250YWluZXJJZCA9IG51bGw7XG4gICAgICAgIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgID09PSB4bXBwLm15UmVzb3VyY2UoKSkge1xuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb1dyYXBwZXInO1xuICAgICAgICAgICAgdmlkZW9Db250YWluZXJJZCA9ICdsb2NhbFZpZGVvQ29udGFpbmVyJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZDtcbiAgICAgICAgICAgIHZpZGVvQ29udGFpbmVySWQgPSB2aWRlb1NwYW5JZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkaXNwbGF5TmFtZSA9IHJlc291cmNlSmlkO1xuICAgICAgICB2YXIgbmFtZVNwYW4gPSAkKCcjJyArIHZpZGVvQ29udGFpbmVySWQgKyAnPnNwYW4uZGlzcGxheW5hbWUnKTtcbiAgICAgICAgaWYgKG5hbWVTcGFuLmxlbmd0aCA+IDApXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IG5hbWVTcGFuLmh0bWwoKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlVJIGVuYWJsZSBkb21pbmFudCBzcGVha2VyXCIsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIHJlc291cmNlSmlkLFxuICAgICAgICAgICAgaXNFbmFibGUpO1xuXG4gICAgICAgIHZpZGVvU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZpZGVvQ29udGFpbmVySWQpO1xuXG4gICAgICAgIGlmICghdmlkZW9TcGFuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmlkZW8gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz52aWRlbycpO1xuXG4gICAgICAgIGlmICh2aWRlbyAmJiB2aWRlby5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoaXNFbmFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNMYXJnZVZpZGVvVmlzaWJsZSA9IFZpZGVvTGF5b3V0LmlzTGFyZ2VWaWRlb09uVG9wKCk7XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd0Rpc3BsYXlOYW1lKHZpZGVvQ29udGFpbmVySWQsIGlzTGFyZ2VWaWRlb1Zpc2libGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF2aWRlb1NwYW4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiZG9taW5hbnRzcGVha2VyXCIpKVxuICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYW4uY2xhc3NMaXN0LmFkZChcImRvbWluYW50c3BlYWtlclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dEaXNwbGF5TmFtZSh2aWRlb0NvbnRhaW5lcklkLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodmlkZW9TcGFuLmNsYXNzTGlzdC5jb250YWlucyhcImRvbWluYW50c3BlYWtlclwiKSlcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9TcGFuLmNsYXNzTGlzdC5yZW1vdmUoXCJkb21pbmFudHNwZWFrZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEF2YXRhci5zaG93VXNlckF2YXRhcihcbiAgICAgICAgICAgICAgICB4bXBwLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2VKaWQpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSB0aHVtYm5haWwgc2l6ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2aWRlb1NwYWNlV2lkdGggdGhlIHdpZHRoIG9mIHRoZSB2aWRlbyBzcGFjZVxuICAgICAqL1xuICAgIG15LmNhbGN1bGF0ZVRodW1ibmFpbFNpemUgPSBmdW5jdGlvbiAodmlkZW9TcGFjZVdpZHRoKSB7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgYXZhaWxhYmxlIGhlaWdodCwgd2hpY2ggaXMgdGhlIGlubmVyIHdpbmRvdyBoZWlnaHQgbWludXNcbiAgICAgICAvLyAzOXB4IGZvciB0aGUgaGVhZGVyIG1pbnVzIDJweCBmb3IgdGhlIGRlbGltaXRlciBsaW5lcyBvbiB0aGUgdG9wIGFuZFxuICAgICAgIC8vIGJvdHRvbSBvZiB0aGUgbGFyZ2UgdmlkZW8sIG1pbnVzIHRoZSAzNnB4IHNwYWNlIGluc2lkZSB0aGUgcmVtb3RlVmlkZW9zXG4gICAgICAgLy8gY29udGFpbmVyIHVzZWQgZm9yIGhpZ2hsaWdodGluZyBzaGFkb3cuXG4gICAgICAgdmFyIGF2YWlsYWJsZUhlaWdodCA9IDEwMDtcblxuICAgICAgICB2YXIgbnVtdmlkcyA9ICQoJyNyZW1vdGVWaWRlb3M+c3Bhbjp2aXNpYmxlJykubGVuZ3RoO1xuICAgICAgICBpZiAobG9jYWxMYXN0TkNvdW50ICYmIGxvY2FsTGFzdE5Db3VudCA+IDApIHtcbiAgICAgICAgICAgIG51bXZpZHMgPSBNYXRoLm1pbihsb2NhbExhc3ROQ291bnQgKyAxLCBudW12aWRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgLy8gUmVtb3ZlIHRoZSAzcHggYm9yZGVycyBhcnJvdW5kIHZpZGVvcyBhbmQgYm9yZGVyIGFyb3VuZCB0aGUgcmVtb3RlXG4gICAgICAgLy8gdmlkZW9zIGFyZWEgYW5kIHRoZSA0IHBpeGVscyBiZXR3ZWVuIHRoZSBsb2NhbCB2aWRlbyBhbmQgdGhlIG90aGVyc1xuICAgICAgIC8vVE9ETzogRmluZCBvdXQgd2hlcmUgdGhlIDQgcGl4ZWxzIGNvbWUgZnJvbSBhbmQgcmVtb3ZlIHRoZW1cbiAgICAgICB2YXIgYXZhaWxhYmxlV2luV2lkdGggPSB2aWRlb1NwYWNlV2lkdGggLSAyICogMyAqIG51bXZpZHMgLSA3MCAtIDQ7XG5cbiAgICAgICB2YXIgYXZhaWxhYmxlV2lkdGggPSBhdmFpbGFibGVXaW5XaWR0aCAvIG51bXZpZHM7XG4gICAgICAgdmFyIGFzcGVjdFJhdGlvID0gMTYuMCAvIDkuMDtcbiAgICAgICB2YXIgbWF4SGVpZ2h0ID0gTWF0aC5taW4oMTYwLCBhdmFpbGFibGVIZWlnaHQpO1xuICAgICAgIGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWluKG1heEhlaWdodCwgYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbyk7XG4gICAgICAgaWYgKGF2YWlsYWJsZUhlaWdodCA8IGF2YWlsYWJsZVdpZHRoIC8gYXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgYXZhaWxhYmxlV2lkdGggPSBNYXRoLmZsb29yKGF2YWlsYWJsZUhlaWdodCAqIGFzcGVjdFJhdGlvKTtcbiAgICAgICB9XG5cbiAgICAgICByZXR1cm4gW2F2YWlsYWJsZVdpZHRoLCBhdmFpbGFibGVIZWlnaHRdO1xuICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIHJlbW90ZSB2aWRlbyBtZW51LlxuICAgICAqXG4gICAgICogQHBhcmFtIGppZCB0aGUgamlkIGluZGljYXRpbmcgdGhlIHZpZGVvIGZvciB3aGljaCB3ZSdyZSBhZGRpbmcgYSBtZW51LlxuICAgICAqIEBwYXJhbSBpc011dGVkIGluZGljYXRlcyB0aGUgY3VycmVudCBtdXRlIHN0YXRlXG4gICAgICovXG4gICAgbXkudXBkYXRlUmVtb3RlVmlkZW9NZW51ID0gZnVuY3Rpb24oamlkLCBpc011dGVkKSB7XG4gICAgICAgIHZhciBtdXRlTWVudUl0ZW1cbiAgICAgICAgICAgID0gJCgnI3JlbW90ZV9wb3B1cG1lbnVfJ1xuICAgICAgICAgICAgICAgICAgICArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZClcbiAgICAgICAgICAgICAgICAgICAgKyAnPmxpPmEubXV0ZWxpbmsnKTtcblxuICAgICAgICB2YXIgbXV0ZWRJbmRpY2F0b3IgPSBcIjxpIGNsYXNzPSdpY29uLW1pYy1kaXNhYmxlZCc+PC9pPlwiO1xuXG4gICAgICAgIGlmIChtdXRlTWVudUl0ZW0ubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgbXV0ZUxpbmsgPSBtdXRlTWVudUl0ZW0uZ2V0KDApO1xuXG4gICAgICAgICAgICBpZiAoaXNNdXRlZCA9PT0gJ3RydWUnKSB7XG4gICAgICAgICAgICAgICAgbXV0ZUxpbmsuaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnIE11dGVkJztcbiAgICAgICAgICAgICAgICBtdXRlTGluay5jbGFzc05hbWUgPSAnbXV0ZWxpbmsgZGlzYWJsZWQnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbXV0ZUxpbmsuaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnIE11dGUnO1xuICAgICAgICAgICAgICAgIG11dGVMaW5rLmNsYXNzTmFtZSA9ICdtdXRlbGluayc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCBkb21pbmFudCBzcGVha2VyIHJlc291cmNlIGppZC5cbiAgICAgKi9cbiAgICBteS5nZXREb21pbmFudFNwZWFrZXJSZXNvdXJjZUppZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnREb21pbmFudFNwZWFrZXI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGNvcnJlc3BvbmRpbmcgcmVzb3VyY2UgamlkIHRvIHRoZSBnaXZlbiBwZWVyIGNvbnRhaW5lclxuICAgICAqIERPTSBlbGVtZW50LlxuICAgICAqXG4gICAgICogQHJldHVybiB0aGUgY29ycmVzcG9uZGluZyByZXNvdXJjZSBqaWQgdG8gdGhlIGdpdmVuIHBlZXIgY29udGFpbmVyXG4gICAgICogRE9NIGVsZW1lbnRcbiAgICAgKi9cbiAgICBteS5nZXRQZWVyQ29udGFpbmVyUmVzb3VyY2VKaWQgPSBmdW5jdGlvbiAoY29udGFpbmVyRWxlbWVudCkge1xuICAgICAgICB2YXIgaSA9IGNvbnRhaW5lckVsZW1lbnQuaWQuaW5kZXhPZigncGFydGljaXBhbnRfJyk7XG5cbiAgICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgICAgIHJldHVybiBjb250YWluZXJFbGVtZW50LmlkLnN1YnN0cmluZyhpICsgMTIpOyBcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT24gY29udGFjdCBsaXN0IGl0ZW0gY2xpY2tlZC5cbiAgICAgKi9cbiAgICAkKENvbnRhY3RMaXN0KS5iaW5kKCdjb250YWN0Y2xpY2tlZCcsIGZ1bmN0aW9uKGV2ZW50LCBqaWQpIHtcbiAgICAgICAgaWYgKCFqaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXNvdXJjZSA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIHZhciB2aWRlb0NvbnRhaW5lciA9ICQoXCIjcGFydGljaXBhbnRfXCIgKyByZXNvdXJjZSk7XG4gICAgICAgIGlmICh2aWRlb0NvbnRhaW5lci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgdmlkZW9UaHVtYiA9ICQoJ3ZpZGVvJywgdmlkZW9Db250YWluZXIpLmdldCgwKTtcbiAgICAgICAgICAgIC8vIEl0IGlzIG5vdCBhbHdheXMgdGhlIGNhc2UgdGhhdCBhIHZpZGVvVGh1bWIgZXhpc3RzIChpZiB0aGVyZSBpc1xuICAgICAgICAgICAgLy8gbm8gYWN0dWFsIHZpZGVvKS5cbiAgICAgICAgICAgIGlmICh2aWRlb1RodW1iKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZpZGVvVGh1bWIuc3JjICYmIHZpZGVvVGh1bWIuc3JjICE9ICcnKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBhIHZpZGVvIHNyYywgZ3JlYXQhIExldCdzIHVwZGF0ZSB0aGUgbGFyZ2UgdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgLy8gbm93LlxuXG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmhhbmRsZVZpZGVvVGh1bWJDbGlja2VkKFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9UaHVtYi5zcmMsXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHZpZGVvIHNyYyBmb3IgamlkLCB0aGVyZSdzIGFic29sdXRlbHlcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gY2FsbGluZyBoYW5kbGVWaWRlb1RodW1iQ2xpY2tlZDsgUXVpdGVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2ltcGx5LCBpdCB3b24ndCB3b3JrIGJlY2F1c2UgaXQgbmVlZHMgYW4gc3JjIHRvIGF0dGFjaFxuICAgICAgICAgICAgICAgICAgICAvLyB0byB0aGUgbGFyZ2UgdmlkZW8uXG4gICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIC8vIEluc3RlYWQsIHdlIHRyaWdnZXIgdGhlIHBpbm5lZCBlbmRwb2ludCBjaGFuZ2VkIGV2ZW50IHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIGxldCB0aGUgYnJpZGdlIGFkanVzdCBpdHMgbGFzdE4gc2V0IGZvciBteWppZCBhbmQgc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBpbm5lZCB1c2VyIGluIHRoZSBsYXN0TlBpY2t1cEppZCB2YXJpYWJsZSB0byBiZVxuICAgICAgICAgICAgICAgICAgICAvLyBwaWNrZWQgdXAgbGF0ZXIgYnkgdGhlIGxhc3ROIGNoYW5nZWQgZXZlbnQgaGFuZGxlci5cblxuICAgICAgICAgICAgICAgICAgICBsYXN0TlBpY2t1cEppZCA9IGppZDtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInBpbm5lZGVuZHBvaW50Y2hhbmdlZFwiLCBbamlkXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChqaWQgPT0geG1wcC5teUppZCgpKSB7XG4gICAgICAgICAgICAgICAgJChcIiNsb2NhbFZpZGVvQ29udGFpbmVyXCIpLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE9uIGF1ZGlvIG11dGVkIGV2ZW50LlxuICAgICAqL1xuICAgICQoZG9jdW1lbnQpLmJpbmQoJ2F1ZGlvbXV0ZWQubXVjJywgZnVuY3Rpb24gKGV2ZW50LCBqaWQsIGlzTXV0ZWQpIHtcbiAgICAgICAgLypcbiAgICAgICAgIC8vIEZJWE1FOiBidXQgZm9jdXMgY2FuIG5vdCBtdXRlIGluIHRoaXMgY2FzZSA/IC0gY2hlY2tcbiAgICAgICAgaWYgKGppZCA9PT0geG1wcC5teUppZCgpKSB7XG5cbiAgICAgICAgICAgIC8vIFRoZSBsb2NhbCBtdXRlIGluZGljYXRvciBpcyBjb250cm9sbGVkIGxvY2FsbHlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSovXG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9IG51bGw7XG4gICAgICAgIGlmIChqaWQgPT09IHhtcHAubXlKaWQoKSkge1xuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb0NvbnRhaW5lcic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbnN1cmVQZWVyQ29udGFpbmVyRXhpc3RzKGppZCk7XG4gICAgICAgICAgICB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG11dGVkQXVkaW9zW2ppZF0gPSBpc011dGVkO1xuXG4gICAgICAgIGlmICh4bXBwLmlzTW9kZXJhdG9yKCkpIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZVJlbW90ZVZpZGVvTWVudShqaWQsIGlzTXV0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZpZGVvU3BhbklkKVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd0F1ZGlvSW5kaWNhdG9yKHZpZGVvU3BhbklkLCBpc011dGVkKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE9uIHZpZGVvIG11dGVkIGV2ZW50LlxuICAgICAqL1xuICAgICQoZG9jdW1lbnQpLmJpbmQoJ3ZpZGVvbXV0ZWQubXVjJywgZnVuY3Rpb24gKGV2ZW50LCBqaWQsIHZhbHVlKSB7XG4gICAgICAgIHZhciBpc011dGVkID0gKHZhbHVlID09PSBcInRydWVcIik7XG4gICAgICAgIGlmKCFSVEMubXV0ZVJlbW90ZVZpZGVvU3RyZWFtKGppZCwgaXNNdXRlZCkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKGppZCwgaXNNdXRlZCk7XG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9IG51bGw7XG4gICAgICAgIGlmIChqaWQgPT09IHhtcHAubXlKaWQoKSkge1xuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb0NvbnRhaW5lcic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbnN1cmVQZWVyQ29udGFpbmVyRXhpc3RzKGppZCk7XG4gICAgICAgICAgICB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2aWRlb1NwYW5JZClcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dWaWRlb0luZGljYXRvcih2aWRlb1NwYW5JZCwgdmFsdWUpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGlzcGxheSBuYW1lIGNoYW5nZWQuXG4gICAgICovXG4gICAgbXkub25EaXNwbGF5TmFtZUNoYW5nZWQgPVxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoamlkLCBkaXNwbGF5TmFtZSwgc3RhdHVzKSB7XG4gICAgICAgIHZhciBuYW1lID0gbnVsbDtcbiAgICAgICAgaWYgKGppZCA9PT0gJ2xvY2FsVmlkZW9Db250YWluZXInXG4gICAgICAgICAgICB8fCBqaWQgPT09IHhtcHAubXlKaWQoKSkge1xuICAgICAgICAgICAgbmFtZSA9IG5pY2tuYW1lO1xuICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUoJ2xvY2FsVmlkZW9Db250YWluZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuZW5zdXJlUGVlckNvbnRhaW5lckV4aXN0cyhqaWQpO1xuICAgICAgICAgICAgbmFtZSA9ICQoJyNwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKSArIFwiX25hbWVcIikudGV4dCgpO1xuICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUoXG4gICAgICAgICAgICAgICAgJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgIHN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihqaWQgPT09ICdsb2NhbFZpZGVvQ29udGFpbmVyJylcbiAgICAgICAgICAgIGppZCA9IHhtcHAubXlKaWQoKTtcbiAgICAgICAgaWYoIW5hbWUgfHwgbmFtZSAhPSBkaXNwbGF5TmFtZSlcbiAgICAgICAgICAgIEFQSS50cmlnZ2VyRXZlbnQoXCJkaXNwbGF5TmFtZUNoYW5nZVwiLHtqaWQ6IGppZCwgZGlzcGxheW5hbWU6IGRpc3BsYXlOYW1lfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9uIGRvbWluYW50IHNwZWFrZXIgY2hhbmdlZCBldmVudC5cbiAgICAgKi9cbiAgICAkKGRvY3VtZW50KS5iaW5kKCdkb21pbmFudHNwZWFrZXJjaGFuZ2VkJywgZnVuY3Rpb24gKGV2ZW50LCByZXNvdXJjZUppZCkge1xuICAgICAgICAvLyBXZSBpZ25vcmUgbG9jYWwgdXNlciBldmVudHMuXG4gICAgICAgIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgID09PSB4bXBwLm15UmVzb3VyY2UoKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgaWYgKHJlc291cmNlSmlkICE9PSBjdXJyZW50RG9taW5hbnRTcGVha2VyKSB7XG4gICAgICAgICAgICB2YXIgb2xkU3BlYWtlclZpZGVvU3BhbklkID0gXCJwYXJ0aWNpcGFudF9cIiArIGN1cnJlbnREb21pbmFudFNwZWFrZXIsXG4gICAgICAgICAgICAgICAgbmV3U3BlYWtlclZpZGVvU3BhbklkID0gXCJwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlSmlkO1xuICAgICAgICAgICAgaWYoJChcIiNcIiArIG9sZFNwZWFrZXJWaWRlb1NwYW5JZCArIFwiPnNwYW4uZGlzcGxheW5hbWVcIikudGV4dCgpID09PVxuICAgICAgICAgICAgICAgIGludGVyZmFjZUNvbmZpZy5ERUZBVUxUX0RPTUlOQU5UX1NQRUFLRVJfRElTUExBWV9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUob2xkU3BlYWtlclZpZGVvU3BhbklkLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCQoXCIjXCIgKyBuZXdTcGVha2VyVmlkZW9TcGFuSWQgKyBcIj5zcGFuLmRpc3BsYXluYW1lXCIpLnRleHQoKSA9PT1cbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9SRU1PVEVfRElTUExBWV9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUobmV3U3BlYWtlclZpZGVvU3BhbklkLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9ET01JTkFOVF9TUEVBS0VSX0RJU1BMQVlfTkFNRSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50RG9taW5hbnRTcGVha2VyID0gcmVzb3VyY2VKaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPYnRhaW4gY29udGFpbmVyIGZvciBuZXcgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgdmFyIGNvbnRhaW5lciAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICAgICAgICAgICAgICAncGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICAvLyBMb2NhbCB2aWRlbyB3aWxsIG5vdCBoYXZlIGNvbnRhaW5lciBmb3VuZCwgYnV0IHRoYXQncyBva1xuICAgICAgICAvLyBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIHN3aXRjaCB0byBsb2NhbCB2aWRlby5cbiAgICAgICAgaWYgKGNvbnRhaW5lciAmJiAhZm9jdXNlZFZpZGVvSW5mbylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHZpZGVvID0gY29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidmlkZW9cIik7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGFyZ2UgdmlkZW8gaWYgdGhlIHZpZGVvIHNvdXJjZSBpcyBhbHJlYWR5IGF2YWlsYWJsZSxcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSB3YWl0IGZvciB0aGUgXCJ2aWRlb2FjdGl2ZS5qaW5nbGVcIiBldmVudC5cbiAgICAgICAgICAgIGlmICh2aWRlby5sZW5ndGggJiYgdmlkZW9bMF0uY3VycmVudFRpbWUgPiAwKVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oUlRDLmdldFZpZGVvU3JjKHZpZGVvWzBdKSwgcmVzb3VyY2VKaWQpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBPbiBsYXN0IE4gY2hhbmdlIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCB0aGF0IG5vdGlmaWVkIHVzXG4gICAgICogQHBhcmFtIGxhc3RORW5kcG9pbnRzIHRoZSBsaXN0IG9mIGxhc3QgTiBlbmRwb2ludHNcbiAgICAgKiBAcGFyYW0gZW5kcG9pbnRzRW50ZXJpbmdMYXN0TiB0aGUgbGlzdCBjdXJyZW50bHkgZW50ZXJpbmcgbGFzdCBOXG4gICAgICogZW5kcG9pbnRzXG4gICAgICovXG4gICAgJChkb2N1bWVudCkuYmluZCgnbGFzdG5jaGFuZ2VkJywgZnVuY3Rpb24gKCBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RORW5kcG9pbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRzRW50ZXJpbmdMYXN0TixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbSkge1xuICAgICAgICBpZiAobGFzdE5Db3VudCAhPT0gbGFzdE5FbmRwb2ludHMubGVuZ3RoKVxuICAgICAgICAgICAgbGFzdE5Db3VudCA9IGxhc3RORW5kcG9pbnRzLmxlbmd0aDtcblxuICAgICAgICBsYXN0TkVuZHBvaW50c0NhY2hlID0gbGFzdE5FbmRwb2ludHM7XG5cbiAgICAgICAgLy8gU2F5IEEsIEIsIEMsIEQsIEUsIGFuZCBGIGFyZSBpbiBhIGNvbmZlcmVuY2UgYW5kIExhc3ROID0gMy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgTGFzdE4gZHJvcHMgdG8sIHNheSwgMiwgYmVjYXVzZSBvZiBhZGFwdGl2aXR5LCB0aGVuIEUgc2hvdWxkIHNlZVxuICAgICAgICAvLyB0aHVtYm5haWxzIGZvciBBLCBCIGFuZCBDLiBBIGFuZCBCIGFyZSBpbiBFJ3Mgc2VydmVyIHNpZGUgTGFzdE4gc2V0LFxuICAgICAgICAvLyBzbyBFIHNlZXMgdGhlbS4gQyBpcyBvbmx5IGluIEUncyBsb2NhbCBMYXN0TiBzZXQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIEYgc3RhcnRzIHRhbGtpbmcgYW5kIExhc3ROID0gMywgdGhlbiBFIHNob3VsZCBzZWUgdGh1bWJuYWlscyBmb3JcbiAgICAgICAgLy8gRiwgQSwgQi4gQiBnZXRzIFwiZWplY3RlZFwiIGZyb20gRSdzIHNlcnZlciBzaWRlIExhc3ROIHNldCwgYnV0IGl0XG4gICAgICAgIC8vIGVudGVycyBFJ3MgbG9jYWwgTGFzdE4gZWplY3RpbmcgQy5cblxuICAgICAgICAvLyBJbmNyZWFzZSB0aGUgbG9jYWwgTGFzdE4gc2V0IHNpemUsIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgaWYgKGxhc3ROQ291bnQgPiBsb2NhbExhc3ROQ291bnQpIHtcbiAgICAgICAgICAgIGxvY2FsTGFzdE5Db3VudCA9IGxhc3ROQ291bnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGxvY2FsIExhc3ROIHNldCBwcmVzZXJ2aW5nIHRoZSBvcmRlciBpbiB3aGljaCB0aGVcbiAgICAgICAgLy8gZW5kcG9pbnRzIGFwcGVhcmVkIGluIHRoZSBMYXN0Ti9sb2NhbCBMYXN0TiBzZXQuXG5cbiAgICAgICAgdmFyIG5leHRMb2NhbExhc3ROU2V0ID0gbGFzdE5FbmRwb2ludHMuc2xpY2UoMCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxMYXN0TlNldC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5leHRMb2NhbExhc3ROU2V0Lmxlbmd0aCA+PSBsb2NhbExhc3ROQ291bnQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJlc291cmNlSmlkID0gbG9jYWxMYXN0TlNldFtpXTtcbiAgICAgICAgICAgIGlmIChuZXh0TG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBuZXh0TG9jYWxMYXN0TlNldC5wdXNoKHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvY2FsTGFzdE5TZXQgPSBuZXh0TG9jYWxMYXN0TlNldDtcblxuICAgICAgICB2YXIgdXBkYXRlTGFyZ2VWaWRlbyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIEhhbmRsZSBMYXN0Ti9sb2NhbCBMYXN0TiBjaGFuZ2VzLlxuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5lYWNoKGZ1bmN0aW9uKCBpbmRleCwgZWxlbWVudCApIHtcbiAgICAgICAgICAgIHZhciByZXNvdXJjZUppZCA9IFZpZGVvTGF5b3V0LmdldFBlZXJDb250YWluZXJSZXNvdXJjZUppZChlbGVtZW50KTtcblxuICAgICAgICAgICAgdmFyIGlzUmVjZWl2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHJlc291cmNlSmlkXG4gICAgICAgICAgICAgICAgJiYgbGFzdE5FbmRwb2ludHMuaW5kZXhPZihyZXNvdXJjZUppZCkgPCAwXG4gICAgICAgICAgICAgICAgJiYgbG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA8IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92ZSBmcm9tIGxhc3QgTlwiLCByZXNvdXJjZUppZCk7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdoaWRlJyk7XG4gICAgICAgICAgICAgICAgaXNSZWNlaXZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgICYmICQoJyNwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQpLmlzKCc6dmlzaWJsZScpXG4gICAgICAgICAgICAgICAgJiYgbGFzdE5FbmRwb2ludHMuaW5kZXhPZihyZXNvdXJjZUppZCkgPCAwXG4gICAgICAgICAgICAgICAgJiYgbG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdhdmF0YXInKTtcbiAgICAgICAgICAgICAgICBpc1JlY2VpdmVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNSZWNlaXZlZCkge1xuICAgICAgICAgICAgICAgIC8vIHJlc291cmNlSmlkIGhhcyBkcm9wcGVkIG91dCBvZiB0aGUgc2VydmVyIHNpZGUgbGFzdE4gc2V0LCBzb1xuICAgICAgICAgICAgICAgIC8vIGl0IGlzIG5vIGxvbmdlciBiZWluZyByZWNlaXZlZC4gSWYgcmVzb3VyY2VKaWQgd2FzIGJlaW5nXG4gICAgICAgICAgICAgICAgLy8gZGlzcGxheWVkIGluIHRoZSBsYXJnZSB2aWRlbyB3ZSBoYXZlIHRvIHN3aXRjaCB0byBhbm90aGVyXG4gICAgICAgICAgICAgICAgLy8gdXNlci5cbiAgICAgICAgICAgICAgICB2YXIgbGFyZ2VWaWRlb1Jlc291cmNlID0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZDtcbiAgICAgICAgICAgICAgICBpZiAoIXVwZGF0ZUxhcmdlVmlkZW8gJiYgcmVzb3VyY2VKaWQgPT09IGxhcmdlVmlkZW9SZXNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXJnZVZpZGVvID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghZW5kcG9pbnRzRW50ZXJpbmdMYXN0TiB8fCBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLmxlbmd0aCA8IDApXG4gICAgICAgICAgICBlbmRwb2ludHNFbnRlcmluZ0xhc3ROID0gbGFzdE5FbmRwb2ludHM7XG5cbiAgICAgICAgaWYgKGVuZHBvaW50c0VudGVyaW5nTGFzdE4gJiYgZW5kcG9pbnRzRW50ZXJpbmdMYXN0Ti5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLmZvckVhY2goZnVuY3Rpb24gKHJlc291cmNlSmlkKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgaXNWaXNpYmxlID0gJCgnI3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZCkuaXMoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdzaG93Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBZGQgdG8gbGFzdCBOXCIsIHJlc291cmNlSmlkKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgamlkID0geG1wcC5maW5kSmlkRnJvbVJlc291cmNlKHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lZGlhU3RyZWFtID0gUlRDLnJlbW90ZVN0cmVhbXNbamlkXVtNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWwgPSAkKCcjcGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkICsgJz52aWRlbycpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IHNpbXVsY2FzdC5nZXRSZWNlaXZpbmdWaWRlb1N0cmVhbShcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGlhU3RyZWFtLnN0cmVhbSk7XG4gICAgICAgICAgICAgICAgICAgIFJUQy5hdHRhY2hNZWRpYVN0cmVhbShzZWwsIHZpZGVvU3RyZWFtKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3ROUGlja3VwSmlkID09IG1lZGlhU3RyZWFtLnBlZXJqaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwIHRoZSBsYXN0TiBwaWNrdXAgamlkLlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE5QaWNrdXBKaWQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBmaXJlIHRoZSBldmVudHMgYWdhaW4sIHRoZXkndmUgYWxyZWFkeVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmVlbiBmaXJlZCBpbiB0aGUgY29udGFjdCBsaXN0IGNsaWNrIGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5oYW5kbGVWaWRlb1RodW1iQ2xpY2tlZChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHNlbCkuYXR0cignc3JjJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQobWVkaWFTdHJlYW0ucGVlcmppZCkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXJnZVZpZGVvID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvclJlbW90ZVZpZGVvKHNlbCwgbWVkaWFTdHJlYW0uc3NyYywgbWVkaWFTdHJlYW0uc3RyZWFtLCByZXNvdXJjZUppZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBlbmRwb2ludCB0aGF0IHdhcyBiZWluZyBzaG93biBpbiB0aGUgbGFyZ2UgdmlkZW8gaGFzIGRyb3BwZWQgb3V0XG4gICAgICAgIC8vIG9mIHRoZSBsYXN0TiBzZXQgYW5kIHRoZXJlIHdhcyBubyBsYXN0TiBwaWNrdXAgamlkLiBXZSBuZWVkIHRvIHVwZGF0ZVxuICAgICAgICAvLyB0aGUgbGFyZ2UgdmlkZW8gbm93LlxuXG4gICAgICAgIGlmICh1cGRhdGVMYXJnZVZpZGVvKSB7XG5cbiAgICAgICAgICAgIHZhciByZXNvdXJjZSwgY29udGFpbmVyLCBzcmM7XG4gICAgICAgICAgICB2YXIgbXlSZXNvdXJjZVxuICAgICAgICAgICAgICAgID0geG1wcC5teVJlc291cmNlKCk7XG5cbiAgICAgICAgICAgIC8vIEZpbmQgb3V0IHdoaWNoIGVuZHBvaW50IHRvIHNob3cgaW4gdGhlIGxhcmdlIHZpZGVvLlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0TkVuZHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlc291cmNlID0gbGFzdE5FbmRwb2ludHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNvdXJjZSB8fCByZXNvdXJjZSA9PT0gbXlSZXNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSAkKFwiI3BhcnRpY2lwYW50X1wiICsgcmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgc3JjID0gJCgndmlkZW8nLCBjb250YWluZXIpLmF0dHIoJ3NyYycpO1xuICAgICAgICAgICAgICAgIGlmICghc3JjKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIC8vIHZpZGVvU3JjVG9Tc3JjIG5lZWRzIHRvIGJlIHVwZGF0ZSBmb3IgdGhpcyBjYWxsIHRvIHN1Y2NlZWQuXG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTGFyZ2VWaWRlbyhzcmMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoZG9jdW1lbnQpLmJpbmQoJ3NpbXVsY2FzdGxheWVyc2NoYW5naW5nJywgZnVuY3Rpb24gKGV2ZW50LCBlbmRwb2ludFNpbXVsY2FzdExheWVycykge1xuICAgICAgICBlbmRwb2ludFNpbXVsY2FzdExheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChlc2wpIHtcblxuICAgICAgICAgICAgdmFyIHJlc291cmNlID0gZXNsLmVuZHBvaW50O1xuXG4gICAgICAgICAgICAvLyBpZiBsYXN0TiBpcyBlbmFibGVkICphbmQqIHRoZSBlbmRwb2ludCBpcyAqbm90KiBpbiB0aGUgbGFzdE4gc2V0LFxuICAgICAgICAgICAgLy8gdGhlbiBpZ25vcmUgdGhlIGV2ZW50ICg9IGRvIG5vdCBwcmVsb2FkIGFueXRoaW5nKS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgYnJpZGdlIGNvdWxkIHByb2JhYmx5IHN0b3Agc2VuZGluZyB0aGlzIG1lc3NhZ2UgaWYgaXQncyBmb3JcbiAgICAgICAgICAgIC8vIGFuIGVuZHBvaW50IHRoYXQncyBub3QgaW4gbGFzdE4uXG5cbiAgICAgICAgICAgIGlmIChsYXN0TkNvdW50ICE9IC0xXG4gICAgICAgICAgICAgICAgJiYgKGxhc3ROQ291bnQgPCAxIHx8IGxhc3RORW5kcG9pbnRzQ2FjaGUuaW5kZXhPZihyZXNvdXJjZSkgPT09IC0xKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHByaW1hcnlTU1JDID0gZXNsLnNpbXVsY2FzdExheWVyLnByaW1hcnlTU1JDO1xuXG4gICAgICAgICAgICAvLyBHZXQgc2Vzc2lvbiBhbmQgc3RyZWFtIGZyb20gcHJpbWFyeSBzc3JjLlxuICAgICAgICAgICAgdmFyIHJlcyA9IHNpbXVsY2FzdC5nZXRSZWNlaXZpbmdWaWRlb1N0cmVhbUJ5U1NSQyhwcmltYXJ5U1NSQyk7XG4gICAgICAgICAgICB2YXIgc2lkID0gcmVzLnNpZDtcbiAgICAgICAgICAgIHZhciBlbGVjdGVkU3RyZWFtID0gcmVzLnN0cmVhbTtcblxuICAgICAgICAgICAgaWYgKHNpZCAmJiBlbGVjdGVkU3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zaWQgPSBzaW11bGNhc3QuZ2V0UmVtb3RlVmlkZW9TdHJlYW1JZEJ5U1NSQyhwcmltYXJ5U1NSQyk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oW2VzbCwgcHJpbWFyeVNTUkMsIG1zaWQsIHNpZCwgZWxlY3RlZFN0cmVhbV0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1zaWRQYXJ0cyA9IG1zaWQuc3BsaXQoJyAnKTtcblxuICAgICAgICAgICAgICAgIHZhciBwcmVsb2FkID0gKFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKHNzcmMyamlkW3ByaW1hcnlTU1JDXSkgPT0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocHJlbG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnUHJlbG9hZGluZyByZW1vdGUgdmlkZW8nKTtcbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQgPSAkKCc8dmlkZW8gYXV0b3BsYXk+PC92aWRlbz4nKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3NyY3MgYXJlIHVuaXF1ZSBpbiBhbiBydHAgc2Vzc2lvblxuICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZF9zc3JjID0gcHJpbWFyeVNTUkM7XG5cbiAgICAgICAgICAgICAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkLCBlbGVjdGVkU3RyZWFtKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmluZCBhIHN0cmVhbSBvciBhIHNlc3Npb24uJywgc2lkLCBlbGVjdGVkU3RyZWFtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBPbiBzaW11bGNhc3QgbGF5ZXJzIGNoYW5nZWQgZXZlbnQuXG4gICAgICovXG4gICAgJChkb2N1bWVudCkuYmluZCgnc2ltdWxjYXN0bGF5ZXJzY2hhbmdlZCcsIGZ1bmN0aW9uIChldmVudCwgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMpIHtcbiAgICAgICAgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMuZm9yRWFjaChmdW5jdGlvbiAoZXNsKSB7XG5cbiAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGVzbC5lbmRwb2ludDtcblxuICAgICAgICAgICAgLy8gaWYgbGFzdE4gaXMgZW5hYmxlZCAqYW5kKiB0aGUgZW5kcG9pbnQgaXMgKm5vdCogaW4gdGhlIGxhc3ROIHNldCxcbiAgICAgICAgICAgIC8vIHRoZW4gaWdub3JlIHRoZSBldmVudCAoPSBkbyBub3QgY2hhbmdlIGxhcmdlIHZpZGVvL3RodW1ibmFpbFxuICAgICAgICAgICAgLy8gU1JDcykuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gTm90ZSB0aGF0IGV2ZW4gaWYgd2UgaWdub3JlIHRoZSBcImNoYW5nZWRcIiBldmVudCBpbiB0aGlzIGV2ZW50XG4gICAgICAgICAgICAvLyBoYW5kbGVyLCB0aGUgYnJpZGdlIG11c3QgY29udGludWUgc2VuZGluZyB0aGVzZSBldmVudHMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gdGhlIHNpbXVsY2FzdCBjb2RlIGluIHNpbXVsY2FzdC5qcyB1c2VzIGl0IHRvIGtub3cgd2hhdCdzIGdvaW5nXG4gICAgICAgICAgICAvLyB0byBiZSBzdHJlYW1lZCBieSB0aGUgYnJpZGdlIHdoZW4vaWYgdGhlIGVuZHBvaW50IGdldHMgYmFjayBpbnRvXG4gICAgICAgICAgICAvLyB0aGUgbGFzdE4gc2V0LlxuXG4gICAgICAgICAgICBpZiAobGFzdE5Db3VudCAhPSAtMVxuICAgICAgICAgICAgICAgICYmIChsYXN0TkNvdW50IDwgMSB8fCBsYXN0TkVuZHBvaW50c0NhY2hlLmluZGV4T2YocmVzb3VyY2UpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcmltYXJ5U1NSQyA9IGVzbC5zaW11bGNhc3RMYXllci5wcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgLy8gR2V0IHNlc3Npb24gYW5kIHN0cmVhbSBmcm9tIHByaW1hcnkgc3NyYy5cbiAgICAgICAgICAgIHZhciByZXMgPSBzaW11bGNhc3QuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW1CeVNTUkMocHJpbWFyeVNTUkMpO1xuICAgICAgICAgICAgdmFyIHNpZCA9IHJlcy5zaWQ7XG4gICAgICAgICAgICB2YXIgZWxlY3RlZFN0cmVhbSA9IHJlcy5zdHJlYW07XG5cbiAgICAgICAgICAgIGlmIChzaWQgJiYgZWxlY3RlZFN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciBtc2lkID0gc2ltdWxjYXN0LmdldFJlbW90ZVZpZGVvU3RyZWFtSWRCeVNTUkMocHJpbWFyeVNTUkMpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdTd2l0Y2hpbmcgc2ltdWxjYXN0IHN1YnN0cmVhbS4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oW2VzbCwgcHJpbWFyeVNTUkMsIG1zaWQsIHNpZCwgZWxlY3RlZFN0cmVhbV0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1zaWRQYXJ0cyA9IG1zaWQuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICB2YXIgc2VsUmVtb3RlVmlkZW8gPSAkKFsnIycsICdyZW1vdGVWaWRlb18nLCBzaWQsICdfJywgbXNpZFBhcnRzWzBdXS5qb2luKCcnKSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlTGFyZ2VWaWRlbyA9IChTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChzc3JjMmppZFtwcmltYXJ5U1NSQ10pXG4gICAgICAgICAgICAgICAgICAgID09IGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVGb2N1c2VkVmlkZW9TcmMgPSAoZm9jdXNlZFZpZGVvSW5mbyAmJiBmb2N1c2VkVmlkZW9JbmZvLnNyYyAmJiBmb2N1c2VkVmlkZW9JbmZvLnNyYyAhPSAnJyAmJlxuICAgICAgICAgICAgICAgICAgICAoUlRDLmdldFZpZGVvU3JjKHNlbFJlbW90ZVZpZGVvWzBdKSA9PSBmb2N1c2VkVmlkZW9JbmZvLnNyYykpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVsZWN0ZWRTdHJlYW1Vcmw7XG4gICAgICAgICAgICAgICAgaWYgKGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkX3NzcmMgPT0gcHJpbWFyeVNTUkMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBSVEMuc2V0VmlkZW9TcmMoc2VsUmVtb3RlVmlkZW9bMF0sIFJUQy5nZXRWaWRlb1NyYyhsYXJnZVZpZGVvU3RhdGUucHJlbG9hZFswXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRfc3NyYyA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKHNlbFJlbW90ZVZpZGVvLCBlbGVjdGVkU3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgamlkID0gc3NyYzJqaWRbcHJpbWFyeVNTUkNdO1xuICAgICAgICAgICAgICAgIGppZDJTc3JjW2ppZF0gPSBwcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVMYXJnZVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oUlRDLmdldFZpZGVvU3JjKHNlbFJlbW90ZVZpZGVvWzBdKSwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVGb2N1c2VkVmlkZW9TcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9jdXNlZFZpZGVvSW5mby5zcmMgPSBSVEMuZ2V0VmlkZW9TcmMoc2VsUmVtb3RlVmlkZW9bMF0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciB2aWRlb0lkO1xuICAgICAgICAgICAgICAgIGlmKHJlc291cmNlID09IHhtcHAubXlSZXNvdXJjZSgpKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9JZCA9IFwibG9jYWxWaWRlb0NvbnRhaW5lclwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2aWRlb0lkID0gXCJwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbkluZGljYXRvciA9IFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW3ZpZGVvSWRdO1xuICAgICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25JbmRpY2F0b3IpXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25JbmRpY2F0b3IudXBkYXRlUG9wb3ZlckRhdGEoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmluZCBhIHN0cmVhbSBvciBhIHNpZC4nLCBzaWQsIGVsZWN0ZWRTdHJlYW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgbG9jYWwgc3RhdHNcbiAgICAgKiBAcGFyYW0gcGVyY2VudFxuICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgKi9cbiAgICBteS51cGRhdGVMb2NhbENvbm5lY3Rpb25TdGF0cyA9IGZ1bmN0aW9uIChwZXJjZW50LCBvYmplY3QpIHtcbiAgICAgICAgdmFyIHJlc29sdXRpb24gPSBudWxsO1xuICAgICAgICBpZihvYmplY3QucmVzb2x1dGlvbiAhPT0gbnVsbClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzb2x1dGlvbiA9IG9iamVjdC5yZXNvbHV0aW9uO1xuICAgICAgICAgICAgb2JqZWN0LnJlc29sdXRpb24gPSByZXNvbHV0aW9uW3htcHAubXlKaWQoKV07XG4gICAgICAgICAgICBkZWxldGUgcmVzb2x1dGlvblt4bXBwLm15SmlkKCldO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZVN0YXRzSW5kaWNhdG9yKFwibG9jYWxWaWRlb0NvbnRhaW5lclwiLCBwZXJjZW50LCBvYmplY3QpO1xuICAgICAgICBmb3IodmFyIGppZCBpbiByZXNvbHV0aW9uKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZihyZXNvbHV0aW9uW2ppZF0gPT09IG51bGwpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgaWQgPSAncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgICAgICBpZihWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tpZF0pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbaWRdLnVwZGF0ZVJlc29sdXRpb24ocmVzb2x1dGlvbltqaWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgcmVtb3RlIHN0YXRzLlxuICAgICAqIEBwYXJhbSBqaWQgdGhlIGppZCBhc3NvY2lhdGVkIHdpdGggdGhlIHN0YXRzXG4gICAgICogQHBhcmFtIHBlcmNlbnQgdGhlIGNvbm5lY3Rpb24gcXVhbGl0eSBwZXJjZW50XG4gICAgICogQHBhcmFtIG9iamVjdCB0aGUgc3RhdHMgZGF0YVxuICAgICAqL1xuICAgIG15LnVwZGF0ZUNvbm5lY3Rpb25TdGF0cyA9IGZ1bmN0aW9uIChqaWQsIHBlcmNlbnQsIG9iamVjdCkge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuXG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQ7XG4gICAgICAgIHVwZGF0ZVN0YXRzSW5kaWNhdG9yKHZpZGVvU3BhbklkLCBwZXJjZW50LCBvYmplY3QpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIHRoZSBjb25uZWN0aW9uXG4gICAgICogQHBhcmFtIGppZFxuICAgICAqL1xuICAgIG15LnJlbW92ZUNvbm5lY3Rpb25JbmRpY2F0b3IgPSBmdW5jdGlvbiAoamlkKSB7XG4gICAgICAgIGlmKFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzWydwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKV0pXG4gICAgICAgICAgICBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1sncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCldLnJlbW92ZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBIaWRlcyB0aGUgY29ubmVjdGlvbiBpbmRpY2F0b3JcbiAgICAgKiBAcGFyYW0gamlkXG4gICAgICovXG4gICAgbXkuaGlkZUNvbm5lY3Rpb25JbmRpY2F0b3IgPSBmdW5jdGlvbiAoamlkKSB7XG4gICAgICAgIGlmKFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzWydwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKV0pXG4gICAgICAgICAgICBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1sncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCldLmhpZGUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSGlkZXMgYWxsIHRoZSBpbmRpY2F0b3JzXG4gICAgICovXG4gICAgbXkub25TdGF0c1N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvcih2YXIgaW5kaWNhdG9yIGluIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzKVxuICAgICAgICB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tpbmRpY2F0b3JdLmhpZGVJbmRpY2F0b3IoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gbXk7XG59KFZpZGVvTGF5b3V0IHx8IHt9KSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVmlkZW9MYXlvdXQ7IiwiLy92YXIgbm91bnMgPSBbXG4vL107XG52YXIgcGx1cmFsTm91bnMgPSBbXG4gICAgXCJBbGllbnNcIiwgXCJBbmltYWxzXCIsIFwiQW50ZWxvcGVzXCIsIFwiQW50c1wiLCBcIkFwZXNcIiwgXCJBcHBsZXNcIiwgXCJCYWJvb25zXCIsIFwiQmFjdGVyaWFcIiwgXCJCYWRnZXJzXCIsIFwiQmFuYW5hc1wiLCBcIkJhdHNcIixcbiAgICBcIkJlYXJzXCIsIFwiQmlyZHNcIiwgXCJCb25vYm9zXCIsIFwiQnJpZGVzXCIsIFwiQnVnc1wiLCBcIkJ1bGxzXCIsIFwiQnV0dGVyZmxpZXNcIiwgXCJDaGVldGFoc1wiLFxuICAgIFwiQ2hlcnJpZXNcIiwgXCJDaGlja2VuXCIsIFwiQ2hpbGRyZW5cIiwgXCJDaGltcHNcIiwgXCJDbG93bnNcIiwgXCJDb3dzXCIsIFwiQ3JlYXR1cmVzXCIsIFwiRGlub3NhdXJzXCIsIFwiRG9nc1wiLCBcIkRvbHBoaW5zXCIsXG4gICAgXCJEb25rZXlzXCIsIFwiRHJhZ29uc1wiLCBcIkR1Y2tzXCIsIFwiRHdhcmZzXCIsIFwiRWFnbGVzXCIsIFwiRWxlcGhhbnRzXCIsIFwiRWx2ZXNcIiwgXCJGQUlMXCIsIFwiRmF0aGVyc1wiLFxuICAgIFwiRmlzaFwiLCBcIkZsb3dlcnNcIiwgXCJGcm9nc1wiLCBcIkZydWl0XCIsIFwiRnVuZ2lcIiwgXCJHYWxheGllc1wiLCBcIkdlZXNlXCIsIFwiR29hdHNcIixcbiAgICBcIkdvcmlsbGFzXCIsIFwiSGVkZ2Vob2dzXCIsIFwiSGlwcG9zXCIsIFwiSG9yc2VzXCIsIFwiSHVudGVyc1wiLCBcIkluc2VjdHNcIiwgXCJLaWRzXCIsIFwiS25pZ2h0c1wiLFxuICAgIFwiTGVtb25zXCIsIFwiTGVtdXJzXCIsIFwiTGVvcGFyZHNcIiwgXCJMaWZlRm9ybXNcIiwgXCJMaW9uc1wiLCBcIkxpemFyZHNcIiwgXCJNaWNlXCIsIFwiTW9ua2V5c1wiLCBcIk1vbnN0ZXJzXCIsXG4gICAgXCJNdXNocm9vbXNcIiwgXCJPY3RvcG9kZXNcIiwgXCJPcmFuZ2VzXCIsIFwiT3Jhbmd1dGFuc1wiLCBcIk9yZ2FuaXNtc1wiLCBcIlBhbnRzXCIsIFwiUGFycm90c1wiLCBcIlBlbmd1aW5zXCIsXG4gICAgXCJQZW9wbGVcIiwgXCJQaWdlb25zXCIsIFwiUGlnc1wiLCBcIlBpbmVhcHBsZXNcIiwgXCJQbGFudHNcIiwgXCJQb3RhdG9lc1wiLCBcIlByaWVzdHNcIiwgXCJSYXRzXCIsIFwiUmVwdGlsZXNcIiwgXCJSZXB0aWxpYW5zXCIsXG4gICAgXCJSaGlub3NcIiwgXCJTZWFndWxsc1wiLCBcIlNoZWVwXCIsIFwiU2libGluZ3NcIiwgXCJTbmFrZXNcIiwgXCJTcGFnaGV0dGlcIiwgXCJTcGlkZXJzXCIsIFwiU3F1aWRcIiwgXCJTcXVpcnJlbHNcIixcbiAgICBcIlN0YXJzXCIsIFwiU3R1ZGVudHNcIiwgXCJUZWFjaGVyc1wiLCBcIlRpZ2Vyc1wiLCBcIlRvbWF0b2VzXCIsIFwiVHJlZXNcIiwgXCJWYW1waXJlc1wiLCBcIlZlZ2V0YWJsZXNcIiwgXCJWaXJ1c2VzXCIsIFwiVnVsY2Fuc1wiLFxuICAgIFwiV2FyZXdvbHZlc1wiLCBcIldlYXNlbHNcIiwgXCJXaGFsZXNcIiwgXCJXaXRjaGVzXCIsIFwiV2l6YXJkc1wiLCBcIldvbHZlc1wiLCBcIldvcmtlcnNcIiwgXCJXb3Jtc1wiLCBcIlplYnJhc1wiXG5dO1xuLy92YXIgcGxhY2VzID0gW1xuLy9cIlB1YlwiLCBcIlVuaXZlcnNpdHlcIiwgXCJBaXJwb3J0XCIsIFwiTGlicmFyeVwiLCBcIk1hbGxcIiwgXCJUaGVhdGVyXCIsIFwiU3RhZGl1bVwiLCBcIk9mZmljZVwiLCBcIlNob3dcIiwgXCJHYWxsb3dzXCIsIFwiQmVhY2hcIixcbi8vIFwiQ2VtZXRlcnlcIiwgXCJIb3NwaXRhbFwiLCBcIlJlY2VwdGlvblwiLCBcIlJlc3RhdXJhbnRcIiwgXCJCYXJcIiwgXCJDaHVyY2hcIiwgXCJIb3VzZVwiLCBcIlNjaG9vbFwiLCBcIlNxdWFyZVwiLCBcIlZpbGxhZ2VcIixcbi8vIFwiQ2luZW1hXCIsIFwiTW92aWVzXCIsIFwiUGFydHlcIiwgXCJSZXN0cm9vbVwiLCBcIkVuZFwiLCBcIkphaWxcIiwgXCJQb3N0T2ZmaWNlXCIsIFwiU3RhdGlvblwiLCBcIkNpcmN1c1wiLCBcIkdhdGVzXCIsIFwiRW50cmFuY2VcIixcbi8vIFwiQnJpZGdlXCJcbi8vXTtcbnZhciB2ZXJicyA9IFtcbiAgICBcIkFiYW5kb25cIiwgXCJBZGFwdFwiLCBcIkFkdmVydGlzZVwiLCBcIkFuc3dlclwiLCBcIkFudGljaXBhdGVcIiwgXCJBcHByZWNpYXRlXCIsXG4gICAgXCJBcHByb2FjaFwiLCBcIkFyZ3VlXCIsIFwiQXNrXCIsIFwiQml0ZVwiLCBcIkJsb3Nzb21cIiwgXCJCbHVzaFwiLCBcIkJyZWF0aGVcIiwgXCJCcmVlZFwiLCBcIkJyaWJlXCIsIFwiQnVyblwiLCBcIkNhbGN1bGF0ZVwiLFxuICAgIFwiQ2xlYW5cIiwgXCJDb2RlXCIsIFwiQ29tbXVuaWNhdGVcIiwgXCJDb21wdXRlXCIsIFwiQ29uZmVzc1wiLCBcIkNvbmZpc2NhdGVcIiwgXCJDb25qdWdhdGVcIiwgXCJDb25qdXJlXCIsIFwiQ29uc3VtZVwiLFxuICAgIFwiQ29udGVtcGxhdGVcIiwgXCJDcmF3bFwiLCBcIkRhbmNlXCIsIFwiRGVsZWdhdGVcIiwgXCJEZXZvdXJcIiwgXCJEZXZlbG9wXCIsIFwiRGlmZmVyXCIsIFwiRGlzY3Vzc1wiLFxuICAgIFwiRGlzc29sdmVcIiwgXCJEcmlua1wiLCBcIkVhdFwiLCBcIkVsYWJvcmF0ZVwiLCBcIkVtYW5jaXBhdGVcIiwgXCJFc3RpbWF0ZVwiLCBcIkV4cGlyZVwiLCBcIkV4dGluZ3Vpc2hcIixcbiAgICBcIkV4dHJhY3RcIiwgXCJGQUlMXCIsIFwiRmFjaWxpdGF0ZVwiLCBcIkZhbGxcIiwgXCJGZWVkXCIsIFwiRmluaXNoXCIsIFwiRmxvc3NcIiwgXCJGbHlcIiwgXCJGb2xsb3dcIiwgXCJGcmFnbWVudFwiLCBcIkZyZWV6ZVwiLFxuICAgIFwiR2F0aGVyXCIsIFwiR2xvd1wiLCBcIkdyb3dcIiwgXCJIZXhcIiwgXCJIaWRlXCIsIFwiSHVnXCIsIFwiSHVycnlcIiwgXCJJbXByb3ZlXCIsIFwiSW50ZXJzZWN0XCIsIFwiSW52ZXN0aWdhdGVcIiwgXCJKaW54XCIsXG4gICAgXCJKb2tlXCIsIFwiSnViaWxhdGVcIiwgXCJLaXNzXCIsIFwiTGF1Z2hcIiwgXCJNYW5hZ2VcIiwgXCJNZWV0XCIsIFwiTWVyZ2VcIiwgXCJNb3ZlXCIsIFwiT2JqZWN0XCIsIFwiT2JzZXJ2ZVwiLCBcIk9mZmVyXCIsXG4gICAgXCJQYWludFwiLCBcIlBhcnRpY2lwYXRlXCIsIFwiUGFydHlcIiwgXCJQZXJmb3JtXCIsIFwiUGxhblwiLCBcIlB1cnN1ZVwiLCBcIlBpZXJjZVwiLCBcIlBsYXlcIiwgXCJQb3N0cG9uZVwiLCBcIlByYXlcIiwgXCJQcm9jbGFpbVwiLFxuICAgIFwiUXVlc3Rpb25cIiwgXCJSZWFkXCIsIFwiUmVja29uXCIsIFwiUmVqb2ljZVwiLCBcIlJlcHJlc2VudFwiLCBcIlJlc2l6ZVwiLCBcIlJoeW1lXCIsIFwiU2NyZWFtXCIsIFwiU2VhcmNoXCIsIFwiU2VsZWN0XCIsIFwiU2hhcmVcIiwgXCJTaG9vdFwiLFxuICAgIFwiU2hvdXRcIiwgXCJTaWduYWxcIiwgXCJTaW5nXCIsIFwiU2thdGVcIiwgXCJTbGVlcFwiLCBcIlNtaWxlXCIsIFwiU21va2VcIiwgXCJTb2x2ZVwiLCBcIlNwZWxsXCIsIFwiU3RlZXJcIiwgXCJTdGlua1wiLFxuICAgIFwiU3Vic3RpdHV0ZVwiLCBcIlN3aW1cIiwgXCJUYXN0ZVwiLCBcIlRlYWNoXCIsIFwiVGVybWluYXRlXCIsIFwiVGhpbmtcIiwgXCJUeXBlXCIsIFwiVW5pdGVcIiwgXCJWYW5pc2hcIiwgXCJXb3JzaGlwXCJcbl07XG52YXIgYWR2ZXJicyA9IFtcbiAgICBcIkFic2VudGx5XCIsIFwiQWNjdXJhdGVseVwiLCBcIkFjY3VzaW5nbHlcIiwgXCJBZG9yYWJseVwiLCBcIkFsbFRoZVRpbWVcIiwgXCJBbG9uZVwiLCBcIkFsd2F5c1wiLCBcIkFtYXppbmdseVwiLCBcIkFuZ3JpbHlcIixcbiAgICBcIkFueGlvdXNseVwiLCBcIkFueXdoZXJlXCIsIFwiQXBwYWxsaW5nbHlcIiwgXCJBcHBhcmVudGx5XCIsIFwiQXJ0aWN1bGF0ZWx5XCIsIFwiQXN0b25pc2hpbmdseVwiLCBcIkJhZGx5XCIsIFwiQmFyZWx5XCIsXG4gICAgXCJCZWF1dGlmdWxseVwiLCBcIkJsaW5kbHlcIiwgXCJCcmF2ZWx5XCIsIFwiQnJpZ2h0bHlcIiwgXCJCcmlza2x5XCIsIFwiQnJ1dGFsbHlcIiwgXCJDYWxtbHlcIiwgXCJDYXJlZnVsbHlcIiwgXCJDYXN1YWxseVwiLFxuICAgIFwiQ2F1dGlvdXNseVwiLCBcIkNsZXZlcmx5XCIsIFwiQ29uc3RhbnRseVwiLCBcIkNvcnJlY3RseVwiLCBcIkNyYXppbHlcIiwgXCJDdXJpb3VzbHlcIiwgXCJDeW5pY2FsbHlcIiwgXCJEYWlseVwiLFxuICAgIFwiRGFuZ2Vyb3VzbHlcIiwgXCJEZWxpYmVyYXRlbHlcIiwgXCJEZWxpY2F0ZWx5XCIsIFwiRGVzcGVyYXRlbHlcIiwgXCJEaXNjcmVldGx5XCIsIFwiRWFnZXJseVwiLCBcIkVhc2lseVwiLCBcIkV1cGhvcmljbHlcIixcbiAgICBcIkV2ZW5seVwiLCBcIkV2ZXJ5d2hlcmVcIiwgXCJFeGFjdGx5XCIsIFwiRXhwZWN0YW50bHlcIiwgXCJFeHRlbnNpdmVseVwiLCBcIkZBSUxcIiwgXCJGZXJvY2lvdXNseVwiLCBcIkZpZXJjZWx5XCIsIFwiRmluZWx5XCIsXG4gICAgXCJGbGF0bHlcIiwgXCJGcmVxdWVudGx5XCIsIFwiRnJpZ2h0ZW5pbmdseVwiLCBcIkdlbnRseVwiLCBcIkdsb3Jpb3VzbHlcIiwgXCJHcmltbHlcIiwgXCJHdWlsdGlseVwiLCBcIkhhcHBpbHlcIixcbiAgICBcIkhhcmRcIiwgXCJIYXN0aWx5XCIsIFwiSGVyb2ljYWxseVwiLCBcIkhpZ2hcIiwgXCJIaWdobHlcIiwgXCJIb3VybHlcIiwgXCJIdW1ibHlcIiwgXCJIeXN0ZXJpY2FsbHlcIiwgXCJJbW1lbnNlbHlcIixcbiAgICBcIkltcGFydGlhbGx5XCIsIFwiSW1wb2xpdGVseVwiLCBcIkluZGlmZmVyZW50bHlcIiwgXCJJbnRlbnNlbHlcIiwgXCJKZWFsb3VzbHlcIiwgXCJKb3ZpYWxseVwiLCBcIktpbmRseVwiLCBcIkxhemlseVwiLFxuICAgIFwiTGlnaHRseVwiLCBcIkxvdWRseVwiLCBcIkxvdmluZ2x5XCIsIFwiTG95YWxseVwiLCBcIk1hZ25pZmljZW50bHlcIiwgXCJNYWxldm9sZW50bHlcIiwgXCJNZXJyaWx5XCIsIFwiTWlnaHRpbHlcIiwgXCJNaXNlcmFibHlcIixcbiAgICBcIk15c3RlcmlvdXNseVwiLCBcIk5PVFwiLCBcIk5lcnZvdXNseVwiLCBcIk5pY2VseVwiLCBcIk5vd2hlcmVcIiwgXCJPYmplY3RpdmVseVwiLCBcIk9ibm94aW91c2x5XCIsIFwiT2JzZXNzaXZlbHlcIixcbiAgICBcIk9idmlvdXNseVwiLCBcIk9mdGVuXCIsIFwiUGFpbmZ1bGx5XCIsIFwiUGF0aWVudGx5XCIsIFwiUGxheWZ1bGx5XCIsIFwiUG9saXRlbHlcIiwgXCJQb29ybHlcIiwgXCJQcmVjaXNlbHlcIiwgXCJQcm9tcHRseVwiLFxuICAgIFwiUXVpY2tseVwiLCBcIlF1aWV0bHlcIiwgXCJSYW5kb21seVwiLCBcIlJhcGlkbHlcIiwgXCJSYXJlbHlcIiwgXCJSZWNrbGVzc2x5XCIsIFwiUmVndWxhcmx5XCIsIFwiUmVtb3JzZWZ1bGx5XCIsIFwiUmVzcG9uc2libHlcIixcbiAgICBcIlJ1ZGVseVwiLCBcIlJ1dGhsZXNzbHlcIiwgXCJTYWRseVwiLCBcIlNjb3JuZnVsbHlcIiwgXCJTZWFtbGVzc2x5XCIsIFwiU2VsZG9tXCIsIFwiU2VsZmlzaGx5XCIsIFwiU2VyaW91c2x5XCIsIFwiU2hha2lseVwiLFxuICAgIFwiU2hhcnBseVwiLCBcIlNpZGV3YXlzXCIsIFwiU2lsZW50bHlcIiwgXCJTbGVlcGlseVwiLCBcIlNsaWdodGx5XCIsIFwiU2xvd2x5XCIsIFwiU2x5bHlcIiwgXCJTbW9vdGhseVwiLCBcIlNvZnRseVwiLCBcIlNvbGVtbmx5XCIsIFwiU3RlYWRpbHlcIiwgXCJTdGVybmx5XCIsIFwiU3RyYW5nZWx5XCIsIFwiU3Ryb25nbHlcIiwgXCJTdHVubmluZ2x5XCIsIFwiU3VyZWx5XCIsIFwiVGVuZGVybHlcIiwgXCJUaG91Z2h0ZnVsbHlcIixcbiAgICBcIlRpZ2h0bHlcIiwgXCJVbmVhc2lseVwiLCBcIlZhbmlzaGluZ2x5XCIsIFwiVmlvbGVudGx5XCIsIFwiV2FybWx5XCIsIFwiV2Vha2x5XCIsIFwiV2VhcmlseVwiLCBcIldlZWtseVwiLCBcIldlaXJkbHlcIiwgXCJXZWxsXCIsXG4gICAgXCJXZWxsXCIsIFwiV2lja2VkbHlcIiwgXCJXaWxkbHlcIiwgXCJXaXNlbHlcIiwgXCJXb25kZXJmdWxseVwiLCBcIlllYXJseVwiXG5dO1xudmFyIGFkamVjdGl2ZXMgPSBbXG4gICAgXCJBYm9taW5hYmxlXCIsIFwiQWNjdXJhdGVcIiwgXCJBZG9yYWJsZVwiLCBcIkFsbFwiLCBcIkFsbGVnZWRcIiwgXCJBbmNpZW50XCIsIFwiQW5ncnlcIiwgXCJBbmdyeVwiLCBcIkFueGlvdXNcIiwgXCJBcHBhbGxpbmdcIixcbiAgICBcIkFwcGFyZW50XCIsIFwiQXN0b25pc2hpbmdcIiwgXCJBdHRyYWN0aXZlXCIsIFwiQXdlc29tZVwiLCBcIkJhYnlcIiwgXCJCYWRcIiwgXCJCZWF1dGlmdWxcIiwgXCJCZW5pZ25cIiwgXCJCaWdcIiwgXCJCaXR0ZXJcIixcbiAgICBcIkJsaW5kXCIsIFwiQmx1ZVwiLCBcIkJvbGRcIiwgXCJCcmF2ZVwiLCBcIkJyaWdodFwiLCBcIkJyaXNrXCIsIFwiQ2FsbVwiLCBcIkNhbW91ZmxhZ2VkXCIsIFwiQ2FzdWFsXCIsIFwiQ2F1dGlvdXNcIixcbiAgICBcIkNob3BweVwiLCBcIkNob3NlblwiLCBcIkNsZXZlclwiLCBcIkNvbGRcIiwgXCJDb29sXCIsIFwiQ3Jhd2x5XCIsIFwiQ3JhenlcIiwgXCJDcmVlcHlcIiwgXCJDcnVlbFwiLCBcIkN1cmlvdXNcIiwgXCJDeW5pY2FsXCIsXG4gICAgXCJEYW5nZXJvdXNcIiwgXCJEYXJrXCIsIFwiRGVsaWNhdGVcIiwgXCJEZXNwZXJhdGVcIiwgXCJEaWZmaWN1bHRcIiwgXCJEaXNjcmVldFwiLCBcIkRpc2d1aXNlZFwiLCBcIkRpenp5XCIsXG4gICAgXCJEdW1iXCIsIFwiRWFnZXJcIiwgXCJFYXN5XCIsIFwiRWRneVwiLCBcIkVsZWN0cmljXCIsIFwiRWxlZ2FudFwiLCBcIkVtYW5jaXBhdGVkXCIsIFwiRW5vcm1vdXNcIiwgXCJFdXBob3JpY1wiLCBcIkV2aWxcIixcbiAgICBcIkZBSUxcIiwgXCJGYXN0XCIsIFwiRmVyb2Npb3VzXCIsIFwiRmllcmNlXCIsIFwiRmluZVwiLCBcIkZsYXdlZFwiLCBcIkZseWluZ1wiLCBcIkZvb2xpc2hcIiwgXCJGb3h5XCIsXG4gICAgXCJGcmVlemluZ1wiLCBcIkZ1bm55XCIsIFwiRnVyaW91c1wiLCBcIkdlbnRsZVwiLCBcIkdsb3Jpb3VzXCIsIFwiR29sZGVuXCIsIFwiR29vZFwiLCBcIkdyZWVuXCIsIFwiR3JlZW5cIiwgXCJHdWlsdHlcIixcbiAgICBcIkhhaXJ5XCIsIFwiSGFwcHlcIiwgXCJIYXJkXCIsIFwiSGFzdHlcIiwgXCJIYXp5XCIsIFwiSGVyb2ljXCIsIFwiSG9zdGlsZVwiLCBcIkhvdFwiLCBcIkh1bWJsZVwiLCBcIkh1bW9uZ291c1wiLFxuICAgIFwiSHVtb3JvdXNcIiwgXCJIeXN0ZXJpY2FsXCIsIFwiSWRlYWxpc3RpY1wiLCBcIklnbm9yYW50XCIsIFwiSW1tZW5zZVwiLCBcIkltcGFydGlhbFwiLCBcIkltcG9saXRlXCIsIFwiSW5kaWZmZXJlbnRcIixcbiAgICBcIkluZnVyaWF0ZWRcIiwgXCJJbnNpZ2h0ZnVsXCIsIFwiSW50ZW5zZVwiLCBcIkludGVyZXN0aW5nXCIsIFwiSW50aW1pZGF0ZWRcIiwgXCJJbnRyaWd1aW5nXCIsIFwiSmVhbG91c1wiLCBcIkpvbGx5XCIsIFwiSm92aWFsXCIsXG4gICAgXCJKdW1weVwiLCBcIktpbmRcIiwgXCJMYXVnaGluZ1wiLCBcIkxhenlcIiwgXCJMaXF1aWRcIiwgXCJMb25lbHlcIiwgXCJMb25naW5nXCIsIFwiTG91ZFwiLCBcIkxvdmluZ1wiLCBcIkxveWFsXCIsIFwiTWFjYWJyZVwiLCBcIk1hZFwiLFxuICAgIFwiTWFnaWNhbFwiLCBcIk1hZ25pZmljZW50XCIsIFwiTWFsZXZvbGVudFwiLCBcIk1lZGlldmFsXCIsIFwiTWVtb3JhYmxlXCIsIFwiTWVyZVwiLCBcIk1lcnJ5XCIsIFwiTWlnaHR5XCIsXG4gICAgXCJNaXNjaGlldm91c1wiLCBcIk1pc2VyYWJsZVwiLCBcIk1vZGlmaWVkXCIsIFwiTW9vZHlcIiwgXCJNb3N0XCIsIFwiTXlzdGVyaW91c1wiLCBcIk15c3RpY2FsXCIsIFwiTmVlZHlcIixcbiAgICBcIk5lcnZvdXNcIiwgXCJOaWNlXCIsIFwiT2JqZWN0aXZlXCIsIFwiT2Jub3hpb3VzXCIsIFwiT2JzZXNzaXZlXCIsIFwiT2J2aW91c1wiLCBcIk9waW5pb25hdGVkXCIsIFwiT3JhbmdlXCIsXG4gICAgXCJQYWluZnVsXCIsIFwiUGFzc2lvbmF0ZVwiLCBcIlBlcmZlY3RcIiwgXCJQaW5rXCIsIFwiUGxheWZ1bFwiLCBcIlBvaXNvbm91c1wiLCBcIlBvbGl0ZVwiLCBcIlBvb3JcIiwgXCJQb3B1bGFyXCIsIFwiUG93ZXJmdWxcIixcbiAgICBcIlByZWNpc2VcIiwgXCJQcmVzZXJ2ZWRcIiwgXCJQcmV0dHlcIiwgXCJQdXJwbGVcIiwgXCJRdWlja1wiLCBcIlF1aWV0XCIsIFwiUmFuZG9tXCIsIFwiUmFwaWRcIiwgXCJSYXJlXCIsIFwiUmVhbFwiLFxuICAgIFwiUmVhc3N1cmluZ1wiLCBcIlJlY2tsZXNzXCIsIFwiUmVkXCIsIFwiUmVndWxhclwiLCBcIlJlbW9yc2VmdWxcIiwgXCJSZXNwb25zaWJsZVwiLCBcIlJpY2hcIiwgXCJSdWRlXCIsIFwiUnV0aGxlc3NcIixcbiAgICBcIlNhZFwiLCBcIlNjYXJlZFwiLCBcIlNjYXJ5XCIsIFwiU2Nvcm5mdWxcIiwgXCJTY3JlYW1pbmdcIiwgXCJTZWxmaXNoXCIsIFwiU2VyaW91c1wiLCBcIlNoYWR5XCIsIFwiU2hha3lcIiwgXCJTaGFycFwiLFxuICAgIFwiU2hpbnlcIiwgXCJTaHlcIiwgXCJTaW1wbGVcIiwgXCJTbGVlcHlcIiwgXCJTbG93XCIsIFwiU2x5XCIsIFwiU21hbGxcIiwgXCJTbWFydFwiLCBcIlNtZWxseVwiLCBcIlNtaWxpbmdcIiwgXCJTbW9vdGhcIixcbiAgICBcIlNtdWdcIiwgXCJTb2JlclwiLCBcIlNvZnRcIiwgXCJTb2xlbW5cIiwgXCJTcXVhcmVcIiwgXCJTcXVhcmVcIiwgXCJTdGVhZHlcIiwgXCJTdHJhbmdlXCIsIFwiU3Ryb25nXCIsXG4gICAgXCJTdHVubmluZ1wiLCBcIlN1YmplY3RpdmVcIiwgXCJTdWNjZXNzZnVsXCIsIFwiU3VybHlcIiwgXCJTd2VldFwiLCBcIlRhY3RmdWxcIiwgXCJUZW5zZVwiLFxuICAgIFwiVGhvdWdodGZ1bFwiLCBcIlRpZ2h0XCIsIFwiVGlueVwiLCBcIlRvbGVyYW50XCIsIFwiVW5lYXN5XCIsIFwiVW5pcXVlXCIsIFwiVW5zZWVuXCIsIFwiV2FybVwiLCBcIldlYWtcIixcbiAgICBcIldlaXJkXCIsIFwiV2VsbENvb2tlZFwiLCBcIldpbGRcIiwgXCJXaXNlXCIsIFwiV2l0dHlcIiwgXCJXb25kZXJmdWxcIiwgXCJXb3JyaWVkXCIsIFwiWWVsbG93XCIsIFwiWW91bmdcIixcbiAgICBcIlplYWxvdXNcIlxuICAgIF07XG4vL3ZhciBwcm9ub3VucyA9IFtcbi8vXTtcbi8vdmFyIGNvbmp1bmN0aW9ucyA9IFtcbi8vXCJBbmRcIiwgXCJPclwiLCBcIkZvclwiLCBcIkFib3ZlXCIsIFwiQmVmb3JlXCIsIFwiQWdhaW5zdFwiLCBcIkJldHdlZW5cIlxuLy9dO1xuXG4vKlxuICogTWFwcyBhIHN0cmluZyAoY2F0ZWdvcnkgbmFtZSkgdG8gdGhlIGFycmF5IG9mIHdvcmRzIGZyb20gdGhhdCBjYXRlZ29yeS5cbiAqL1xudmFyIENBVEVHT1JJRVMgPVxue1xuICAgIC8vXCJfTk9VTl9cIjogbm91bnMsXG4gICAgXCJfUExVUkFMTk9VTl9cIjogcGx1cmFsTm91bnMsXG4gICAgLy9cIl9QTEFDRV9cIjogcGxhY2VzLFxuICAgIFwiX1ZFUkJfXCI6IHZlcmJzLFxuICAgIFwiX0FEVkVSQl9cIjogYWR2ZXJicyxcbiAgICBcIl9BREpFQ1RJVkVfXCI6IGFkamVjdGl2ZXNcbiAgICAvL1wiX1BST05PVU5fXCI6IHByb25vdW5zLFxuICAgIC8vXCJfQ09OSlVOQ1RJT05fXCI6IGNvbmp1bmN0aW9ucyxcbn07XG5cbnZhciBQQVRURVJOUyA9IFtcbiAgICBcIl9BREpFQ1RJVkVfX1BMVVJBTE5PVU5fX1ZFUkJfX0FEVkVSQl9cIlxuXG4gICAgLy8gQmVhdXRpZnVsRnVuZ2lPclNwYWdoZXR0aVxuICAgIC8vXCJfQURKRUNUSVZFX19QTFVSQUxOT1VOX19DT05KVU5DVElPTl9fUExVUkFMTk9VTl9cIixcblxuICAgIC8vIEFtYXppbmdseVNjYXJ5VG95XG4gICAgLy9cIl9BRFZFUkJfX0FESkVDVElWRV9fTk9VTl9cIixcblxuICAgIC8vIE5laXRoZXJUcmFzaE5vclJpZmxlXG4gICAgLy9cIk5laXRoZXJfTk9VTl9Ob3JfTk9VTl9cIixcbiAgICAvL1wiRWl0aGVyX05PVU5fT3JfTk9VTl9cIixcblxuICAgIC8vIEVpdGhlckNvcHVsYXRlT3JJbnZlc3RpZ2F0ZVxuICAgIC8vXCJFaXRoZXJfVkVSQl9Pcl9WRVJCX1wiLFxuICAgIC8vXCJOZWl0aGVyX1ZFUkJfTm9yX1ZFUkJfXCIsXG5cbiAgICAvL1wiVGhlX0FESkVDVElWRV9fQURKRUNUSVZFX19OT1VOX1wiLFxuICAgIC8vXCJUaGVfQURWRVJCX19BREpFQ1RJVkVfX05PVU5fXCIsXG4gICAgLy9cIlRoZV9BRFZFUkJfX0FESkVDVElWRV9fTk9VTl9zXCIsXG4gICAgLy9cIlRoZV9BRFZFUkJfX0FESkVDVElWRV9fUExVUkFMTk9VTl9fVkVSQl9cIixcblxuICAgIC8vIFdvbHZlc0NvbXB1dGVCYWRseVxuICAgIC8vXCJfUExVUkFMTk9VTl9fVkVSQl9fQURWRVJCX1wiLFxuXG4gICAgLy8gVW5pdGVGYWNpbGl0YXRlQW5kTWVyZ2VcbiAgICAvL1wiX1ZFUkJfX1ZFUkJfQW5kX1ZFUkJfXCIsXG5cbiAgICAvL05hc3R5V2l0Y2hlc0F0VGhlUHViXG4gICAgLy9cIl9BREpFQ1RJVkVfX1BMVVJBTE5PVU5fQXRUaGVfUExBQ0VfXCIsXG5dO1xuXG5cbi8qXG4gKiBSZXR1cm5zIGEgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkgJ2FycidcbiAqL1xuZnVuY3Rpb24gcmFuZG9tRWxlbWVudChhcnIpXG57XG4gICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG59XG5cbi8qXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIHN0cmluZyAncycgY29udGFpbnMgb25lIG9mIHRoZVxuICogdGVtcGxhdGUgc3RyaW5ncy5cbiAqL1xuZnVuY3Rpb24gaGFzVGVtcGxhdGUocylcbntcbiAgICBmb3IgKHZhciB0ZW1wbGF0ZSBpbiBDQVRFR09SSUVTKXtcbiAgICAgICAgaWYgKHMuaW5kZXhPZih0ZW1wbGF0ZSkgPj0gMCl7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgbmV3IHJvb20gbmFtZS5cbiAqL1xudmFyIFJvb21OYW1lR2VuZXJhdG9yID0ge1xuICAgIGdlbmVyYXRlUm9vbVdpdGhvdXRTZXBhcmF0b3I6IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCBpZiBtb3JlIHRoYW4gb25lIHBhdHRlcm4gaXMgYXZhaWxhYmxlLCB0aGUgY2hvaWNlIG9mICduYW1lJyB3b24ndCBiZSByYW5kb20gKG5hbWVzIGZyb20gcGF0dGVybnNcbiAgICAgICAgLy8gd2l0aCBmZXdlciBvcHRpb25zIHdpbGwgaGF2ZSBoaWdoZXIgcHJvYmFiaWxpdHkgb2YgYmVpbmcgY2hvc2VuIHRoYXQgbmFtZXMgZnJvbSBwYXR0ZXJucyB3aXRoIG1vcmUgb3B0aW9ucykuXG4gICAgICAgIHZhciBuYW1lID0gcmFuZG9tRWxlbWVudChQQVRURVJOUyk7XG4gICAgICAgIHZhciB3b3JkO1xuICAgICAgICB3aGlsZSAoaGFzVGVtcGxhdGUobmFtZSkpe1xuICAgICAgICAgICAgZm9yICh2YXIgdGVtcGxhdGUgaW4gQ0FURUdPUklFUyl7XG4gICAgICAgICAgICAgICAgd29yZCA9IHJhbmRvbUVsZW1lbnQoQ0FURUdPUklFU1t0ZW1wbGF0ZV0pO1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UodGVtcGxhdGUsIHdvcmQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvb21OYW1lR2VuZXJhdG9yO1xuIiwidmFyIGFuaW1hdGVUaW1lb3V0LCB1cGRhdGVUaW1lb3V0O1xuXG52YXIgUm9vbU5hbWVHZW5lcmF0b3IgPSByZXF1aXJlKFwiLi9Sb29tbmFtZUdlbmVyYXRvclwiKTtcblxuZnVuY3Rpb24gZW50ZXJfcm9vbSgpXG57XG4gICAgdmFyIHZhbCA9ICQoXCIjZW50ZXJfcm9vbV9maWVsZFwiKS52YWwoKTtcbiAgICBpZighdmFsKSB7XG4gICAgICAgIHZhbCA9ICQoXCIjZW50ZXJfcm9vbV9maWVsZFwiKS5hdHRyKFwicm9vbV9uYW1lXCIpO1xuICAgIH1cbiAgICBpZiAodmFsKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9IFwiL1wiICsgdmFsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYW5pbWF0ZSh3b3JkKSB7XG4gICAgdmFyIGN1cnJlbnRWYWwgPSAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikuYXR0cihcInBsYWNlaG9sZGVyXCIpO1xuICAgICQoXCIjZW50ZXJfcm9vbV9maWVsZFwiKS5hdHRyKFwicGxhY2Vob2xkZXJcIiwgY3VycmVudFZhbCArIHdvcmQuc3Vic3RyKDAsIDEpKTtcbiAgICBhbmltYXRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGFuaW1hdGUod29yZC5zdWJzdHJpbmcoMSwgd29yZC5sZW5ndGgpKVxuICAgIH0sIDcwKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlX3Jvb21uYW1lKClcbntcbiAgICB2YXIgd29yZCA9IFJvb21OYW1lR2VuZXJhdG9yLmdlbmVyYXRlUm9vbVdpdGhvdXRTZXBhcmF0b3IoKTtcbiAgICAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikuYXR0cihcInJvb21fbmFtZVwiLCB3b3JkKTtcbiAgICAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikuYXR0cihcInBsYWNlaG9sZGVyXCIsIFwiXCIpO1xuICAgIGNsZWFyVGltZW91dChhbmltYXRlVGltZW91dCk7XG4gICAgYW5pbWF0ZSh3b3JkKTtcbiAgICB1cGRhdGVUaW1lb3V0ID0gc2V0VGltZW91dCh1cGRhdGVfcm9vbW5hbWUsIDEwMDAwKTtcbn1cblxuXG5mdW5jdGlvbiBzZXR1cFdlbGNvbWVQYWdlKClcbntcbiAgICAkKFwiI3ZpZGVvY29uZmVyZW5jZV9wYWdlXCIpLmhpZGUoKTtcbiAgICAkKFwiI2RvbWFpbl9uYW1lXCIpLnRleHQoXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgKyBcIi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArIFwiL1wiKTtcbiAgICAkKFwic3BhbltuYW1lPSdhcHBOYW1lJ11cIikudGV4dChpbnRlcmZhY2VDb25maWcuQVBQX05BTUUpO1xuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5TSE9XX0pJVFNJX1dBVEVSTUFSSykge1xuICAgICAgICB2YXIgbGVmdFdhdGVybWFya0RpdlxuICAgICAgICAgICAgPSAkKFwiI3dlbGNvbWVfcGFnZV9oZWFkZXIgZGl2W2NsYXNzPSd3YXRlcm1hcmsgbGVmdHdhdGVybWFyayddXCIpO1xuICAgICAgICBpZihsZWZ0V2F0ZXJtYXJrRGl2ICYmIGxlZnRXYXRlcm1hcmtEaXYubGVuZ3RoID4gMClcbiAgICAgICAge1xuICAgICAgICAgICAgbGVmdFdhdGVybWFya0Rpdi5jc3Moe2Rpc3BsYXk6ICdibG9jayd9KTtcbiAgICAgICAgICAgIGxlZnRXYXRlcm1hcmtEaXYucGFyZW50KCkuZ2V0KDApLmhyZWZcbiAgICAgICAgICAgICAgICA9IGludGVyZmFjZUNvbmZpZy5KSVRTSV9XQVRFUk1BUktfTElOSztcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5TSE9XX0JSQU5EX1dBVEVSTUFSSykge1xuICAgICAgICB2YXIgcmlnaHRXYXRlcm1hcmtEaXZcbiAgICAgICAgICAgID0gJChcIiN3ZWxjb21lX3BhZ2VfaGVhZGVyIGRpdltjbGFzcz0nd2F0ZXJtYXJrIHJpZ2h0d2F0ZXJtYXJrJ11cIik7XG4gICAgICAgIGlmKHJpZ2h0V2F0ZXJtYXJrRGl2ICYmIHJpZ2h0V2F0ZXJtYXJrRGl2Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJ30pO1xuICAgICAgICAgICAgcmlnaHRXYXRlcm1hcmtEaXYucGFyZW50KCkuZ2V0KDApLmhyZWZcbiAgICAgICAgICAgICAgICA9IGludGVyZmFjZUNvbmZpZy5CUkFORF9XQVRFUk1BUktfTElOSztcbiAgICAgICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmdldCgwKS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICAgICAgICA9IFwidXJsKGltYWdlcy9yaWdodHdhdGVybWFyay5wbmcpXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaW50ZXJmYWNlQ29uZmlnLlNIT1dfUE9XRVJFRF9CWSkge1xuICAgICAgICAkKFwiI3dlbGNvbWVfcGFnZV9oZWFkZXI+YVtjbGFzcz0ncG93ZXJlZGJ5J11cIilcbiAgICAgICAgICAgIC5jc3Moe2Rpc3BsYXk6ICdibG9jayd9KTtcbiAgICB9XG5cbiAgICAkKFwiI2VudGVyX3Jvb21fYnV0dG9uXCIpLmNsaWNrKGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIGVudGVyX3Jvb20oKTtcbiAgICB9KTtcblxuICAgICQoXCIjZW50ZXJfcm9vbV9maWVsZFwiKS5rZXlkb3duKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMgLyogZW50ZXIgKi8pIHtcbiAgICAgICAgICAgIGVudGVyX3Jvb20oKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKCEoaW50ZXJmYWNlQ29uZmlnLkdFTkVSQVRFX1JPT01OQU1FU19PTl9XRUxDT01FX1BBR0UgPT09IGZhbHNlKSl7XG4gICAgICAgIHZhciB1cGRhdGVUaW1lb3V0O1xuICAgICAgICB2YXIgYW5pbWF0ZVRpbWVvdXQ7XG4gICAgICAgICQoXCIjcmVsb2FkX3Jvb21uYW1lXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh1cGRhdGVUaW1lb3V0KTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChhbmltYXRlVGltZW91dCk7XG4gICAgICAgICAgICB1cGRhdGVfcm9vbW5hbWUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoXCIjcmVsb2FkX3Jvb21uYW1lXCIpLnNob3coKTtcblxuXG4gICAgICAgIHVwZGF0ZV9yb29tbmFtZSgpO1xuICAgIH1cblxuICAgICQoXCIjZGlzYWJsZV93ZWxjb21lXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS53ZWxjb21lUGFnZURpc2FibGVkXG4gICAgICAgICAgICA9ICQoXCIjZGlzYWJsZV93ZWxjb21lXCIpLmlzKFwiOmNoZWNrZWRcIik7XG4gICAgfSk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXR1cFdlbGNvbWVQYWdlOyJdfQ==
