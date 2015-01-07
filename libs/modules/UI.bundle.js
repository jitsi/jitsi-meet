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


},{"./audio_levels/AudioLevels.js":2,"./avatar/Avatar":4,"./etherpad/Etherpad.js":5,"./prezi/Prezi.js":6,"./side_pannels/SidePanelToggler":7,"./side_pannels/chat/Chat.js":8,"./side_pannels/contactlist/ContactList":12,"./side_pannels/settings/Settings":13,"./side_pannels/settings/SettingsMenu":14,"./toolbars/BottomToolbar":15,"./toolbars/toolbar":17,"./toolbars/toolbartoggler":18,"./util/MessageHandler":20,"./videolayout/VideoLayout.js":23,"./welcome_page/RoomnameGenerator":24,"./welcome_page/WelcomePage":25}],2:[function(require,module,exports){
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
            if(!connection.emuc.myroomjid) {
                return;
            }
            resourceJid = Strophe.getResourceFromJid(connection.emuc.myroomjid);
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
                || (connection.emuc.myroomjid && resourceJid
                    === Strophe.getResourceFromJid(connection.emuc.myroomjid)))
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
    if (jid && jid != connection.emuc.myroomjid) {
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
    if(id === connection.emuc.myroomjid || !id) {
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
        if (jid === connection.emuc.myroomjid) {
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

            if (jid === connection.emuc.myroomjid) {
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
            jid = connection.emuc.findJidFromResource(
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
},{"../side_pannels/settings/Settings":13,"../videolayout/VideoLayout":23}],5:[function(require,module,exports){
/* global $, config, connection, dockToolbar, Moderator,
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
    connection.emuc.addEtherpadToPresence(etherpadName);
    connection.emuc.sendPresence();
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

},{"../prezi/Prezi":6,"../util/UIUtil":21,"../videolayout/VideoLayout":23}],6:[function(require,module,exports){
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
        var myprezi = connection.emuc.getPrezi(connection.emuc.myroomjid);
        if (myprezi) {
            messageHandler.openTwoButtonDialog("Remove Prezi",
                "Are you sure you would like to remove your Prezi?",
                false,
                "Remove",
                function(e,v,m,f) {
                    if(v) {
                        connection.emuc.removePreziFromPresence();
                        connection.emuc.sendPresence();
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
                                        connection.emuc
                                            .addPreziToPresence(urlValue, 0);
                                        connection.emuc.sendPresence();
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
    if (jid === connection.emuc.myroomjid)
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
            if (jid != connection.emuc.myroomjid)
                preziPlayer.flyToStep(currentSlide);
        }
    });

    preziPlayer.on(PreziPlayer.EVENT_CURRENT_STEP, function(event) {
        console.log("event value", event.value);
        connection.emuc.addCurrentSlideToPresence(event.value);
        connection.emuc.sendPresence();
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

},{"../toolbars/ToolbarToggler":16,"../util/MessageHandler":20,"../util/UIUtil":21,"../videolayout/VideoLayout":23}],7:[function(require,module,exports){
var Chat = require("./chat/Chat");
var ContactList = require("./contactlist/ContactList");
var Settings = require("./settings/Settings");
var SettingsMenu = require("./settings/SettingsMenu");
var VideoLayout = require("../videolayout/VideoLayout");
var ToolbarToggler = require("../toolbars/ToolbarToggler");

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
            = getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = getVideoPosition(videoWidth,
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
        buttonClick(buttons[selector], "active");

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
                buttonClick(buttons[currentlyOpen], "active");
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
},{"../toolbars/ToolbarToggler":16,"../videolayout/VideoLayout":23,"./chat/Chat":8,"./contactlist/ContactList":12,"./settings/Settings":13,"./settings/SettingsMenu":14}],8:[function(require,module,exports){
/* global $, Util, connection, nickname:true, getVideoSize,
getVideoPosition, showToolbar */
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

                    connection.emuc.addDisplayNameToPresence(nickname);
                    connection.emuc.sendPresence();

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
                    connection.emuc.sendMessage(message, nickname);
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

        if (connection.emuc.myroomjid === from) {
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
},{"../../toolbars/ToolbarToggler":16,"../SidePanelToggler":7,"./Commands":9,"./Replacement":10,"./smileys.json":11}],9:[function(require,module,exports){
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
    connection.emuc.setSubject(topic);
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
},{}],10:[function(require,module,exports){
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

},{"./smileys.json":11}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){

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


/**
 * Indicates that the display name has changed.
 */
$(document).bind(   'displaynamechanged',
    function (event, peerJid, displayName) {
        if (peerJid === 'localVideoContainer')
            peerJid = connection.emuc.myroomjid;

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactName = $('#contactlist #' + resourceJid + '>p');

        if (contactName && displayName && displayName.length > 0)
            contactName.html(displayName);
    });


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

        if (resourceJid === Strophe.getResourceFromJid(connection.emuc.myroomjid)
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
    }
};

module.exports = ContactList;
},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var Avatar = require("../../avatar/Avatar");
var Settings = require("./Settings");


var SettingsMenu = {

    update: function() {
        var newDisplayName = Util.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = Util.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            connection.emuc.addDisplayNameToPresence(displayName);
        }


        connection.emuc.addEmailToPresence(newEmail);
        var email = Settings.setEmail(newEmail);


        connection.emuc.sendPresence();
        Avatar.setUserAvatar(connection.emuc.myroomjid, email);
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    setDisplayName: function(newDisplayName) {
        var displayName = Settings.setDisplayName(newDisplayName);
        $('#setDisplayName').get(0).value = displayName;
    }
};

$(document).bind('displaynamechanged', function(event, peerJid, newDisplayName) {
    if(peerJid === 'localVideoContainer' ||
        peerJid === connection.emuc.myroomjid) {
        SettingsMenu.setDisplayName(newDisplayName);
    }
});

module.exports = SettingsMenu;
},{"../../avatar/Avatar":4,"./Settings":13}],15:[function(require,module,exports){
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

},{"../side_pannels/SidePanelToggler":7}],16:[function(require,module,exports){
/* global $, interfaceConfig, Moderator, showDesktopSharingButton */

var toolbarTimeoutObject,
    toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;

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

        if (Moderator.isModerator())
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
    }

};

module.exports = ToolbarToggler;
},{}],17:[function(require,module,exports){
/* global $, buttonClick, config, lockRoom,  Moderator,
   setSharedKey, sharedKey, Util */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var Prezi = require("../prezi/Prezi");
var Etherpad = require("../etherpad/Etherpad");
var PanelToggler = require("../side_pannels/SidePanelToggler");

var roomUrl = null;
var sharedKey = '';
var authenticationWindow = null;

var buttonHandlers =
{
    "toolbar_button_mute": function () {
        return toggleAudio();
    },
    "toolbar_button_camera": function () {
        return toggleVideo();
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
        return toggleScreenSharing();
    },
    "toolbar_button_fullScreen": function()
    {
        buttonClick("#fullScreen", "icon-full-screen icon-exit-full-screen");
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

/**
 * Starts or stops the recording for the conference.
 */

function toggleRecording() {
    Recording.toggleRecording();
}

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    var currentSharedKey = '';
    if (lock)
        currentSharedKey = sharedKey;

    connection.emuc.lockRoom(currentSharedKey, function (res) {
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

var Toolbar = (function (my) {

    my.init = function () {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    }

    /**
     * Sets shared key
     * @param sKey the shared key
     */
    my.setSharedKey = function (sKey) {
        sharedKey = sKey;
    };

    my.closeAuthenticationWindow = function () {
        if (authenticationWindow) {
            authenticationWindow.close();
            authenticationWindow = null;
        }
    }

    my.authenticateClicked = function () {
        // Get authentication URL
        Moderator.getAuthUrl(function (url) {
            // Open popup with authentication URL
            authenticationWindow = messageHandler.openCenteredPopup(
                url, 500, 400,
                function () {
                    // On popup closed - retry room allocation
                    Moderator.allocateConferenceFocus(
                        roomName, doJoinAfterFocus);
                    authenticationWindow = null;
                });
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
    }

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
        if (!Moderator.isModerator()) {
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
            buttonClick("#lockIcon", "icon-security icon-security-locked");
    };
    /**
     * Updates the lock button state to locked.
     */
    my.lockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security"))
            buttonClick("#lockIcon", "icon-security icon-security-locked");
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
        if (config.hosts.call_control && show) {
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
},{"../etherpad/Etherpad":5,"../prezi/Prezi":6,"../side_pannels/SidePanelToggler":7,"../util/MessageHandler":20,"./BottomToolbar":15}],18:[function(require,module,exports){
module.exports=require(16)
},{}],19:[function(require,module,exports){
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
},{}],20:[function(require,module,exports){
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
    my.openDialog = function(titleString, msgString, persistent, buttons, submitFunction, loadedFunction) {
        $.prompt(msgString, {
            title: titleString,
            persistent: false,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction
        });
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



},{}],21:[function(require,module,exports){
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
    }

};
},{"../side_pannels/SidePanelToggler":7}],22:[function(require,module,exports){
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
    if(this.resolution)
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
},{"../util/JitsiPopover":19}],23:[function(require,module,exports){
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

var defaultLocalDisplayName = "Me";

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

    if (resourceJid === Strophe.getResourceFromJid(connection.emuc.myroomjid))
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
        connection.moderate.setMute(jid, !isMute);
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
        connection.moderate.eject(jid);
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


var VideoLayout = (function (my) {
    my.connectionIndicators = {};

    my.isInLastN = function(resource) {
        return lastNCount < 0 // lastN is disabled, return true
            || (lastNCount > 0 && lastNEndpointsCache.length == 0) // lastNEndpoints cache not built yet, return true
            || (lastNEndpointsCache && lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream) {
        connection.jingle.localAudio = stream;
        VideoLayout.changeLocalVideo(stream, true);
    };

    my.changeLocalAudio = function(stream) {
        connection.jingle.localAudio = stream;
        RTC.attachMediaStream($('#localAudio'), stream);
        document.getElementById('localAudio').autoplay = true;
        document.getElementById('localAudio').volume = 0;
        if (preMuted) {
            setAudioMuted(true);
            preMuted = false;
        }
    };

    my.changeLocalVideo = function(stream, flipX) {
        connection.jingle.localVideo = stream;

        var localVideo = document.createElement('video');
        localVideo.id = 'localVideo_' + RTC.getStreamID(stream);
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
                Strophe.getResourceFromJid(connection.emuc.myroomjid));
        });
        $('#localVideoContainer').click(function (event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                RTC.getVideoSrc(localVideo),
                false,
                Strophe.getResourceFromJid(connection.emuc.myroomjid));
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
        stream.onended = function () {
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

        var myResourceJid = null;
        if(connection.emuc.myroomjid)
        {
           myResourceJid = Strophe.getResourceFromJid(connection.emuc.myroomjid);
        }
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
                        jid = Strophe.getResourceFromJid(connection.emuc.myroomjid);
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
                (connection && connection.emuc.myroomjid &&
                    largeVideoState.userResourceJid ===
                    Strophe.getResourceFromJid(connection.emuc.myroomjid))) {
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
                        connection.emuc.findJidFromResource(
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

                    getVideoSize = largeVideoState.isDesktop
                        ? getDesktopVideoSize
                        : getCameraVideoSize;
                    getVideoPosition = largeVideoState.isDesktop
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
                            connection.emuc.findJidFromResource(
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
                connection.emuc.findJidFromResource(
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

        var videoSize = getVideoSize(videoWidth,
                                     videoHeight,
                                     videoSpaceWidth,
                                     videoSpaceHeight);

        var largeVideoWidth = videoSize[0];
        var largeVideoHeight = videoSize[1];

        var videoPosition = getVideoPosition(largeVideoWidth,
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
                        connection.emuc.findJidFromResource(focusResourceJid));
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

        if ($('#' + videoSpanId).length > 0) {
            // If there's been a focus change, make sure we add focus related
            // interface!!
            if (Moderator.isModerator() && !Moderator.isPeerModerator(peerJid)
                && $('#remote_popupmenu_' + resourceJid).length <= 0) {
                addRemoteVideoMenu(peerJid,
                    document.getElementById(videoSpanId));
            }
        }
        else {
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
        if (Moderator.isModerator() && peerJid !== null)
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
                var jid = connection.emuc.findJidFromResource(resourceJid);
                Avatar.showUserAvatar(jid, false);
            }
            else // if (state == 'avatar')
            {
                // peerContainer.css('-webkit-filter', 'grayscale(100%)');
                var jid = connection.emuc.findJidFromResource(resourceJid);
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
            connection.emuc.addDisplayNameToPresence(nickname);
            connection.emuc.sendPresence();

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
        if (Moderator.isModerator()) {
            var indicatorSpan = $('#localVideoContainer .focusindicator');

            if (indicatorSpan.children().length === 0)
            {
                createModeratorIndicatorElement(indicatorSpan[0]);
            }
        }
        Object.keys(connection.emuc.members).forEach(function (jid) {
            var member = connection.emuc.members[jid];
            if (member.role === 'moderator') {
                var moderatorId
                    = 'participant_' + Strophe.getResourceFromJid(jid);

                var moderatorContainer
                    = document.getElementById(moderatorId);

                if (Strophe.getResourceFromJid(jid) === 'focus') {
                    // Skip server side focus
                    return;
                }
                if (!moderatorContainer) {
                    console.error("No moderator container for " + jid);
                    return;
                }
                var menuSpan = $('#' + moderatorId + '>span.remotevideomenu');
                if (menuSpan.length) {
                    removeRemoteVideoMenu(moderatorId);
                }

                var indicatorSpan
                    = $('#' + moderatorId + ' .focusindicator');

                if (!indicatorSpan || indicatorSpan.length === 0) {
                    indicatorSpan = document.createElement('span');
                    indicatorSpan.className = 'focusindicator';

                    moderatorContainer.appendChild(indicatorSpan);

                    createModeratorIndicatorElement(indicatorSpan);
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
                === Strophe.getResourceFromJid(connection.emuc.myroomjid)) {
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
                connection.emuc.findJidFromResource(resourceJid));
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
            } else if (jid == connection.emuc.myroomjid) {
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
        if (jid === connection.emuc.myroomjid) {

            // The local mute indicator is controlled locally
            return;
        }*/
        var videoSpanId = null;
        if (jid === connection.emuc.myroomjid) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        mutedAudios[jid] = isMuted;

        if (Moderator.isModerator()) {
            VideoLayout.updateRemoteVideoMenu(jid, isMuted);
        }

        if (videoSpanId)
            VideoLayout.showAudioIndicator(videoSpanId, isMuted);
    });

    /**
     * On video muted event.
     */
    $(document).bind('videomuted.muc', function (event, jid, isMuted) {
        if(!RTC.muteRemoteVideoStream(jid, isMuted))
            return;

        Avatar.showUserAvatar(jid, isMuted);
        var videoSpanId = null;
        if (jid === connection.emuc.myroomjid) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        if (videoSpanId)
            VideoLayout.showVideoIndicator(videoSpanId, isMuted);
    });

    /**
     * Display name changed.
     */
    $(document).bind('displaynamechanged',
                    function (event, jid, displayName, status) {
        var name = null;
        if (jid === 'localVideoContainer'
            || jid === connection.emuc.myroomjid) {
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

        if(APIConnector.isEnabled() && APIConnector.isEventEnabled("displayNameChange"))
        {
            if(jid === 'localVideoContainer')
                jid = connection.emuc.myroomjid;
            if(!name || name != displayName)
                APIConnector.triggerEvent("displayNameChange",{jid: jid, displayname: displayName});
        }
    });

    /**
     * On dominant speaker changed event.
     */
    $(document).bind('dominantspeakerchanged', function (event, resourceJid) {
        // We ignore local user events.
        if (resourceJid
                === Strophe.getResourceFromJid(connection.emuc.myroomjid))
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

                    var jid = connection.emuc.findJidFromResource(resourceJid);
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
                = Strophe.getResourceFromJid(connection.emuc.myroomjid);

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

    $(document).bind('videoactive.jingle', function (event, videoelem) {
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
            var session = res.session;
            var electedStream = res.stream;

            if (session && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info([esl, primarySSRC, msid, session, electedStream]);

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
                console.error('Could not find a stream or a session.', session, electedStream);
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
            var session = res.session;
            var electedStream = res.stream;

            if (session && electedStream) {
                var msid = simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info('Switching simulcast substream.');
                console.info([esl, primarySSRC, msid, session, electedStream]);

                var msidParts = msid.split(' ');
                var selRemoteVideo = $(['#', 'remoteVideo_', session.sid, '_', msidParts[0]].join(''));

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
                if(resource == Strophe.getResourceFromJid(connection.emuc.myroomjid))
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
                console.error('Could not find a stream or a session.', session, electedStream);
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
            object.resolution = resolution[connection.emuc.myroomjid];
            delete resolution[connection.emuc.myroomjid];
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
},{"../audio_levels/AudioLevels":2,"../avatar/Avatar":4,"../etherpad/Etherpad":5,"../prezi/Prezi":6,"../side_pannels/chat/Chat":8,"../side_pannels/contactlist/ContactList":12,"../util/UIUtil":21,"./ConnectionIndicator":22}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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
},{"./RoomnameGenerator":24}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL1VJLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9hdWRpb19sZXZlbHMvQXVkaW9MZXZlbHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL2F1ZGlvX2xldmVscy9DYW52YXNVdGlscy5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvYXZhdGFyL0F2YXRhci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvZXRoZXJwYWQvRXRoZXJwYWQuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3ByZXppL1ByZXppLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9zaWRlX3Bhbm5lbHMvU2lkZVBhbmVsVG9nZ2xlci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL2NoYXQvQ2hhdC5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL2NoYXQvQ29tbWFuZHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3NpZGVfcGFubmVscy9jaGF0L1JlcGxhY2VtZW50LmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9zaWRlX3Bhbm5lbHMvY2hhdC9zbWlsZXlzLmpzb24iLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3NpZGVfcGFubmVscy9jb250YWN0bGlzdC9Db250YWN0TGlzdC5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvc2lkZV9wYW5uZWxzL3NldHRpbmdzL1NldHRpbmdzLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS9zaWRlX3Bhbm5lbHMvc2V0dGluZ3MvU2V0dGluZ3NNZW51LmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS90b29sYmFycy9Cb3R0b21Ub29sYmFyLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS90b29sYmFycy9Ub29sYmFyVG9nZ2xlci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdG9vbGJhcnMvdG9vbGJhci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvdXRpbC9KaXRzaVBvcG92ZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3V0aWwvTWVzc2FnZUhhbmRsZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1VJL3V0aWwvVUlVdGlsLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS92aWRlb2xheW91dC9Db25uZWN0aW9uSW5kaWNhdG9yLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS92aWRlb2xheW91dC9WaWRlb0xheW91dC5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvVUkvd2VsY29tZV9wYWdlL1Jvb21uYW1lR2VuZXJhdG9yLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9VSS93ZWxjb21lX3BhZ2UvV2VsY29tZVBhZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDamlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzEvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgVUkgPSB7fTtcblxudmFyIFZpZGVvTGF5b3V0ID0gcmVxdWlyZShcIi4vdmlkZW9sYXlvdXQvVmlkZW9MYXlvdXQuanNcIik7XG52YXIgQXVkaW9MZXZlbHMgPSByZXF1aXJlKFwiLi9hdWRpb19sZXZlbHMvQXVkaW9MZXZlbHMuanNcIik7XG52YXIgUHJlemkgPSByZXF1aXJlKFwiLi9wcmV6aS9QcmV6aS5qc1wiKTtcbnZhciBFdGhlcnBhZCA9IHJlcXVpcmUoXCIuL2V0aGVycGFkL0V0aGVycGFkLmpzXCIpO1xudmFyIENoYXQgPSByZXF1aXJlKFwiLi9zaWRlX3Bhbm5lbHMvY2hhdC9DaGF0LmpzXCIpO1xudmFyIFRvb2xiYXIgPSByZXF1aXJlKFwiLi90b29sYmFycy90b29sYmFyXCIpO1xudmFyIFRvb2xiYXJUb2dnbGVyID0gcmVxdWlyZShcIi4vdG9vbGJhcnMvdG9vbGJhcnRvZ2dsZXJcIik7XG52YXIgQm90dG9tVG9vbGJhciA9IHJlcXVpcmUoXCIuL3Rvb2xiYXJzL0JvdHRvbVRvb2xiYXJcIik7XG52YXIgQ29udGFjdExpc3QgPSByZXF1aXJlKFwiLi9zaWRlX3Bhbm5lbHMvY29udGFjdGxpc3QvQ29udGFjdExpc3RcIik7XG52YXIgQXZhdGFyID0gcmVxdWlyZShcIi4vYXZhdGFyL0F2YXRhclwiKTtcbi8vdmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJldmVudHNcIik7XG52YXIgU2V0dGluZ3NNZW51ID0gcmVxdWlyZShcIi4vc2lkZV9wYW5uZWxzL3NldHRpbmdzL1NldHRpbmdzTWVudVwiKTtcbnZhciBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuL3NpZGVfcGFubmVscy9zZXR0aW5ncy9TZXR0aW5nc1wiKTtcbnZhciBQYW5lbFRvZ2dsZXIgPSByZXF1aXJlKFwiLi9zaWRlX3Bhbm5lbHMvU2lkZVBhbmVsVG9nZ2xlclwiKTtcbnZhciBSb29tTmFtZUdlbmVyYXRvciA9IHJlcXVpcmUoXCIuL3dlbGNvbWVfcGFnZS9Sb29tbmFtZUdlbmVyYXRvclwiKTtcblVJLm1lc3NhZ2VIYW5kbGVyID0gcmVxdWlyZShcIi4vdXRpbC9NZXNzYWdlSGFuZGxlclwiKTtcbnZhciBtZXNzYWdlSGFuZGxlciA9IFVJLm1lc3NhZ2VIYW5kbGVyO1xuXG4vL3ZhciBldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cblxuXG5mdW5jdGlvbiBzZXR1cFByZXppKClcbntcbiAgICAkKFwiI3JlbG9hZFByZXNlbnRhdGlvbkxpbmtcIikuY2xpY2soZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgUHJlemkucmVsb2FkUHJlc2VudGF0aW9uKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwQ2hhdCgpXG57XG4gICAgQ2hhdC5pbml0KCk7XG4gICAgJChcIiN0b2dnbGVfc21pbGV5c1wiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgQ2hhdC50b2dnbGVTbWlsZXlzKCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldHVwVG9vbGJhcnMoKSB7XG4gICAgVG9vbGJhci5pbml0KCk7XG4gICAgVG9vbGJhci5zZXR1cEJ1dHRvbnNGcm9tQ29uZmlnKCk7XG4gICAgQm90dG9tVG9vbGJhci5pbml0KCk7XG59XG5cblxuZnVuY3Rpb24gcmVnaXN0ZXJMaXN0ZW5lcnMoKSB7XG4gICAgUlRDLmFkZFN0cmVhbUxpc3RlbmVyKGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgc3dpdGNoIChzdHJlYW0udHlwZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBcImF1ZGlvXCI6XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuY2hhbmdlTG9jYWxBdWRpbyhzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidmlkZW9cIjpcbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbFZpZGVvKHN0cmVhbS5nZXRPcmlnaW5hbFN0cmVhbSgpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJlYW1cIjpcbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbFN0cmVhbShzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGVza3RvcFwiOlxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmNoYW5nZUxvY2FsVmlkZW8oc3RyZWFtLCAhaXNVc2luZ1NjcmVlblN0cmVhbSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LCBTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfTE9DQUxfQ1JFQVRFRCk7XG5cbiAgICBSVEMuYWRkU3RyZWFtTGlzdGVuZXIoZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICBWaWRlb0xheW91dC5vblJlbW90ZVN0cmVhbUFkZGVkKHN0cmVhbSk7XG4gICAgfSwgU3RyZWFtRXZlbnRUeXBlcy5FVkVOVF9UWVBFX1JFTU9URV9DUkVBVEVEKTtcblxuICAgIC8vIExpc3RlbiBmb3IgbGFyZ2UgdmlkZW8gc2l6ZSB1cGRhdGVzXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKVxuICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVkbWV0YWRhdGEnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY3VycmVudFZpZGVvV2lkdGggPSB0aGlzLnZpZGVvV2lkdGg7XG4gICAgICAgICAgICBjdXJyZW50VmlkZW9IZWlnaHQgPSB0aGlzLnZpZGVvSGVpZ2h0O1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucG9zaXRpb25MYXJnZShjdXJyZW50VmlkZW9XaWR0aCwgY3VycmVudFZpZGVvSGVpZ2h0KTtcbiAgICAgICAgfSk7XG5cblxuICAgIHN0YXRpc3RpY3MuYWRkQXVkaW9MZXZlbExpc3RlbmVyKGZ1bmN0aW9uKGppZCwgYXVkaW9MZXZlbClcbiAgICB7XG4gICAgICAgIHZhciByZXNvdXJjZUppZDtcbiAgICAgICAgaWYoamlkID09PSBzdGF0aXN0aWNzLkxPQ0FMX0pJRClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzb3VyY2VKaWQgPSBBdWRpb0xldmVscy5MT0NBTF9MRVZFTDtcbiAgICAgICAgICAgIGlmKGlzQXVkaW9NdXRlZCgpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGF1ZGlvTGV2ZWwgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgQXVkaW9MZXZlbHMudXBkYXRlQXVkaW9MZXZlbChyZXNvdXJjZUppZCwgYXVkaW9MZXZlbCxcbiAgICAgICAgICAgIFVJLmdldExhcmdlVmlkZW9TdGF0ZSgpLnVzZXJSZXNvdXJjZUppZCk7XG4gICAgfSk7XG5cbn1cblxuZnVuY3Rpb24gYmluZEV2ZW50cygpXG57XG4gICAgLyoqXG4gICAgICogUmVzaXplcyBhbmQgcmVwb3NpdGlvbnMgdmlkZW9zIGluIGZ1bGwgc2NyZWVuIG1vZGUuXG4gICAgICovXG4gICAgJChkb2N1bWVudCkub24oJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UgbW96ZnVsbHNjcmVlbmNoYW5nZSBmdWxsc2NyZWVuY2hhbmdlJyxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplTGFyZ2VWaWRlb0NvbnRhaW5lcigpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucG9zaXRpb25MYXJnZSgpO1xuICAgICAgICAgICAgaXNGdWxsU2NyZWVuID0gZG9jdW1lbnQuZnVsbFNjcmVlbiB8fFxuICAgICAgICAgICAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gfHxcbiAgICAgICAgICAgICAgICBkb2N1bWVudC53ZWJraXRJc0Z1bGxTY3JlZW47XG5cbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplTGFyZ2VWaWRlb0NvbnRhaW5lcigpO1xuICAgICAgICBWaWRlb0xheW91dC5wb3NpdGlvbkxhcmdlKCk7XG4gICAgfSk7XG59XG5cblVJLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIGRvY3VtZW50LnRpdGxlID0gaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FO1xuICAgIGlmKGNvbmZpZy5lbmFibGVXZWxjb21lUGFnZSAmJiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT0gXCIvXCIgJiZcbiAgICAgICAgKCF3aW5kb3cubG9jYWxTdG9yYWdlLndlbGNvbWVQYWdlRGlzYWJsZWQgfHwgd2luZG93LmxvY2FsU3RvcmFnZS53ZWxjb21lUGFnZURpc2FibGVkID09IFwiZmFsc2VcIikpXG4gICAge1xuICAgICAgICAkKFwiI3ZpZGVvY29uZmVyZW5jZV9wYWdlXCIpLmhpZGUoKTtcbiAgICAgICAgdmFyIHNldHVwV2VsY29tZVBhZ2UgPSByZXF1aXJlKFwiLi93ZWxjb21lX3BhZ2UvV2VsY29tZVBhZ2VcIik7XG4gICAgICAgIHNldHVwV2VsY29tZVBhZ2UoKTtcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5TSE9XX0pJVFNJX1dBVEVSTUFSSykge1xuICAgICAgICB2YXIgbGVmdFdhdGVybWFya0RpdlxuICAgICAgICAgICAgPSAkKFwiI2xhcmdlVmlkZW9Db250YWluZXIgZGl2W2NsYXNzPSd3YXRlcm1hcmsgbGVmdHdhdGVybWFyayddXCIpO1xuXG4gICAgICAgIGxlZnRXYXRlcm1hcmtEaXYuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgICAgIGxlZnRXYXRlcm1hcmtEaXYucGFyZW50KCkuZ2V0KDApLmhyZWZcbiAgICAgICAgICAgID0gaW50ZXJmYWNlQ29uZmlnLkpJVFNJX1dBVEVSTUFSS19MSU5LO1xuICAgIH1cblxuICAgIGlmIChpbnRlcmZhY2VDb25maWcuU0hPV19CUkFORF9XQVRFUk1BUkspIHtcbiAgICAgICAgdmFyIHJpZ2h0V2F0ZXJtYXJrRGl2XG4gICAgICAgICAgICA9ICQoXCIjbGFyZ2VWaWRlb0NvbnRhaW5lciBkaXZbY2xhc3M9J3dhdGVybWFyayByaWdodHdhdGVybWFyayddXCIpO1xuXG4gICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmNzcyh7ZGlzcGxheTogJ2Jsb2NrJ30pO1xuICAgICAgICByaWdodFdhdGVybWFya0Rpdi5wYXJlbnQoKS5nZXQoMCkuaHJlZlxuICAgICAgICAgICAgPSBpbnRlcmZhY2VDb25maWcuQlJBTkRfV0FURVJNQVJLX0xJTks7XG4gICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LmdldCgwKS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2VcbiAgICAgICAgICAgID0gXCJ1cmwoaW1hZ2VzL3JpZ2h0d2F0ZXJtYXJrLnBuZylcIjtcbiAgICB9XG5cbiAgICBpZiAoaW50ZXJmYWNlQ29uZmlnLlNIT1dfUE9XRVJFRF9CWSkge1xuICAgICAgICAkKFwiI2xhcmdlVmlkZW9Db250YWluZXI+YVtjbGFzcz0ncG93ZXJlZGJ5J11cIikuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgfVxuXG4gICAgJChcIiN3ZWxjb21lX3BhZ2VcIikuaGlkZSgpO1xuXG4gICAgJCgnYm9keScpLnBvcG92ZXIoeyBzZWxlY3RvcjogJ1tkYXRhLXRvZ2dsZT1wb3BvdmVyXScsXG4gICAgICAgIHRyaWdnZXI6ICdjbGljayBob3ZlcicsXG4gICAgICAgIGNvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwiY29udGVudFwiKSArXG4gICAgICAgICAgICAgICAgS2V5Ym9hcmRTaG9ydGN1dC5nZXRTaG9ydGN1dCh0aGlzLmdldEF0dHJpYnV0ZShcInNob3J0Y3V0XCIpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFZpZGVvTGF5b3V0LnJlc2l6ZUxhcmdlVmlkZW9Db250YWluZXIoKTtcbiAgICAkKFwiI3ZpZGVvc3BhY2VcIikubW91c2Vtb3ZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFRvb2xiYXJUb2dnbGVyLnNob3dUb29sYmFyKCk7XG4gICAgfSk7XG4gICAgLy8gU2V0IHRoZSBkZWZhdWx0cyBmb3IgcHJvbXB0IGRpYWxvZ3MuXG4gICAgalF1ZXJ5LnByb21wdC5zZXREZWZhdWx0cyh7cGVyc2lzdGVudDogZmFsc2V9KTtcblxuLy8gICAgS2V5Ym9hcmRTaG9ydGN1dC5pbml0KCk7XG4gICAgcmVnaXN0ZXJMaXN0ZW5lcnMoKTtcbiAgICBiaW5kRXZlbnRzKCk7XG4gICAgc2V0dXBQcmV6aSgpO1xuICAgIHNldHVwVG9vbGJhcnMoKTtcbiAgICBzZXR1cENoYXQoKTtcblxuICAgIGRvY3VtZW50LnRpdGxlID0gaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FO1xuXG4gICAgJChcIiNkb3dubG9hZGxvZ1wiKS5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgZHVtcChldmVudC50YXJnZXQpO1xuICAgIH0pO1xuXG4gICAgaWYoY29uZmlnLmVuYWJsZVdlbGNvbWVQYWdlICYmIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSBcIi9cIiAmJlxuICAgICAgICAoIXdpbmRvdy5sb2NhbFN0b3JhZ2Uud2VsY29tZVBhZ2VEaXNhYmxlZCB8fCB3aW5kb3cubG9jYWxTdG9yYWdlLndlbGNvbWVQYWdlRGlzYWJsZWQgPT0gXCJmYWxzZVwiKSlcbiAgICB7XG4gICAgICAgICQoXCIjdmlkZW9jb25mZXJlbmNlX3BhZ2VcIikuaGlkZSgpO1xuICAgICAgICB2YXIgc2V0dXBXZWxjb21lUGFnZSA9IHJlcXVpcmUoXCIuL3dlbGNvbWVfcGFnZS9XZWxjb21lUGFnZVwiKTtcbiAgICAgICAgc2V0dXBXZWxjb21lUGFnZSgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAkKFwiI3dlbGNvbWVfcGFnZVwiKS5oaWRlKCk7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGFyZ2VWaWRlbycpLnZvbHVtZSA9IDA7XG5cbiAgICBpZiAoISQoJyNzZXR0aW5ncycpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdpbml0Jyk7XG4gICAgICAgIGluaXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2dpbkluZm8ub25zdWJtaXQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKGUucHJldmVudERlZmF1bHQpIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICQoJyNzZXR0aW5ncycpLmhpZGUoKTtcbiAgICAgICAgICAgIGluaXQoKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB0b2FzdHIub3B0aW9ucyA9IHtcbiAgICAgICAgXCJjbG9zZUJ1dHRvblwiOiB0cnVlLFxuICAgICAgICBcImRlYnVnXCI6IGZhbHNlLFxuICAgICAgICBcInBvc2l0aW9uQ2xhc3NcIjogXCJub3RpZmljYXRpb24tYm90dG9tLXJpZ2h0XCIsXG4gICAgICAgIFwib25jbGlja1wiOiBudWxsLFxuICAgICAgICBcInNob3dEdXJhdGlvblwiOiBcIjMwMFwiLFxuICAgICAgICBcImhpZGVEdXJhdGlvblwiOiBcIjEwMDBcIixcbiAgICAgICAgXCJ0aW1lT3V0XCI6IFwiMjAwMFwiLFxuICAgICAgICBcImV4dGVuZGVkVGltZU91dFwiOiBcIjEwMDBcIixcbiAgICAgICAgXCJzaG93RWFzaW5nXCI6IFwic3dpbmdcIixcbiAgICAgICAgXCJoaWRlRWFzaW5nXCI6IFwibGluZWFyXCIsXG4gICAgICAgIFwic2hvd01ldGhvZFwiOiBcImZhZGVJblwiLFxuICAgICAgICBcImhpZGVNZXRob2RcIjogXCJmYWRlT3V0XCIsXG4gICAgICAgIFwicmVwb3NpdGlvblwiOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmKFBhbmVsVG9nZ2xlci5pc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWJvdHRvbS1yaWdodC1jZW50ZXJcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLnJlbW92ZUNsYXNzKFwibm90aWZpY2F0aW9uLWJvdHRvbS1yaWdodC1jZW50ZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwibmV3ZXN0T25Ub3BcIjogZmFsc2VcbiAgICB9O1xuXG4gICAgJCgnI3NldHRpbmdzbWVudT5pbnB1dCcpLmtleXVwKGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgaWYoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHsvL2VudGVyXG4gICAgICAgICAgICBTZXR0aW5nc01lbnUudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoXCIjdXBkYXRlU2V0dGluZ3NcIikuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBTZXR0aW5nc01lbnUudXBkYXRlKCk7XG4gICAgfSk7XG5cbn07XG5cblxuVUkuc2V0VXNlckF2YXRhciA9IGZ1bmN0aW9uIChqaWQsIGlkKSB7XG4gICAgQXZhdGFyLnNldFVzZXJBdmF0YXIoamlkLCBpZCk7XG59O1xuXG5VSS50b2dnbGVTbWlsZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIENoYXQudG9nZ2xlU21pbGV5cygpO1xufTtcblxuVUkuY2hhdEFkZEVycm9yID0gZnVuY3Rpb24oZXJyb3JNZXNzYWdlLCBvcmlnaW5hbFRleHQpXG57XG4gICAgcmV0dXJuIENoYXQuY2hhdEFkZEVycm9yKGVycm9yTWVzc2FnZSwgb3JpZ2luYWxUZXh0KTtcbn07XG5cblVJLmNoYXRTZXRTdWJqZWN0ID0gZnVuY3Rpb24odGV4dClcbntcbiAgICByZXR1cm4gQ2hhdC5jaGF0U2V0U3ViamVjdCh0ZXh0KTtcbn07XG5cblVJLnVwZGF0ZUNoYXRDb252ZXJzYXRpb24gPSBmdW5jdGlvbiAoZnJvbSwgZGlzcGxheU5hbWUsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gQ2hhdC51cGRhdGVDaGF0Q29udmVyc2F0aW9uKGZyb20sIGRpc3BsYXlOYW1lLCBtZXNzYWdlKTtcbn07XG5cblVJLm9uTXVjSm9pbmVkID0gZnVuY3Rpb24gKGppZCwgaW5mbykge1xuICAgIFRvb2xiYXIudXBkYXRlUm9vbVVybCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2FsTmljaycpLmFwcGVuZENoaWxkKFxuICAgICAgICBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpICsgJyAobWUpJylcbiAgICApO1xuXG4gICAgdmFyIHNldHRpbmdzID0gU2V0dGluZ3MuZ2V0U2V0dGluZ3MoKTtcbiAgICAvLyBBZGQgbXlzZWxmIHRvIHRoZSBjb250YWN0IGxpc3QuXG4gICAgQ29udGFjdExpc3QuYWRkQ29udGFjdChqaWQsIHNldHRpbmdzLmVtYWlsIHx8IHNldHRpbmdzLnVpZCk7XG5cbiAgICAvLyBPbmNlIHdlJ3ZlIGpvaW5lZCB0aGUgbXVjIHNob3cgdGhlIHRvb2xiYXJcbiAgICBUb29sYmFyVG9nZ2xlci5zaG93VG9vbGJhcigpO1xuXG4gICAgLy8gU2hvdyBhdXRoZW50aWNhdGUgYnV0dG9uIGlmIG5lZWRlZFxuICAgIFRvb2xiYXIuc2hvd0F1dGhlbnRpY2F0ZUJ1dHRvbihcbiAgICAgICAgICAgIE1vZGVyYXRvci5pc0V4dGVybmFsQXV0aEVuYWJsZWQoKSAmJiAhTW9kZXJhdG9yLmlzTW9kZXJhdG9yKCkpO1xuXG4gICAgdmFyIGRpc3BsYXlOYW1lID0gIWNvbmZpZy5kaXNwbGF5Smlkc1xuICAgICAgICA/IGluZm8uZGlzcGxheU5hbWUgOiBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuXG4gICAgaWYgKGRpc3BsYXlOYW1lKVxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdkaXNwbGF5bmFtZWNoYW5nZWQnLFxuICAgICAgICAgICAgWydsb2NhbFZpZGVvQ29udGFpbmVyJywgZGlzcGxheU5hbWUgKyAnIChtZSknXSk7XG59O1xuXG5VSS5pbml0RXRoZXJwYWQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIEV0aGVycGFkLmluaXQobmFtZSk7XG59O1xuXG5VSS5vbk11Y0xlZnQgPSBmdW5jdGlvbiAoamlkKSB7XG4gICAgY29uc29sZS5sb2coJ2xlZnQubXVjJywgamlkKTtcbiAgICB2YXIgZGlzcGxheU5hbWUgPSAkKCcjcGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkgK1xuICAgICAgICAnPi5kaXNwbGF5bmFtZScpLmh0bWwoKTtcbiAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoZGlzcGxheU5hbWUgfHwgJ1NvbWVib2R5JyxcbiAgICAgICAgJ2Rpc2Nvbm5lY3RlZCcsXG4gICAgICAgICdkaXNjb25uZWN0ZWQnKTtcbiAgICAvLyBOZWVkIHRvIGNhbGwgdGhpcyB3aXRoIGEgc2xpZ2h0IGRlbGF5LCBvdGhlcndpc2UgdGhlIGVsZW1lbnQgY291bGRuJ3QgYmVcbiAgICAvLyBmb3VuZCBmb3Igc29tZSByZWFzb24uXG4gICAgLy8gWFhYKGdwKSBpdCB3b3JrcyBmaW5lIHdpdGhvdXQgdGhlIHRpbWVvdXQgZm9yIG1lICh3aXRoIENocm9tZSAzOCkuXG4gICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gICAgICAgICAgICAgICAgJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpKTtcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgQ29udGFjdExpc3QucmVtb3ZlQ29udGFjdChqaWQpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVtb3ZlQ29ubmVjdGlvbkluZGljYXRvcihqaWQpO1xuICAgICAgICAgICAgLy8gaGlkZSBoZXJlLCB3YWl0IGZvciB2aWRlbyB0byBjbG9zZSBiZWZvcmUgcmVtb3ZpbmdcbiAgICAgICAgICAgICQoY29udGFpbmVyKS5oaWRlKCk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5yZXNpemVUaHVtYm5haWxzKCk7XG4gICAgICAgIH1cbiAgICB9LCAxMCk7XG5cbiAgICAvLyBVbmxvY2sgbGFyZ2UgdmlkZW9cbiAgICBpZiAoZm9jdXNlZFZpZGVvSW5mbyAmJiBmb2N1c2VkVmlkZW9JbmZvLmppZCA9PT0gamlkKVxuICAgIHtcbiAgICAgICAgY29uc29sZS5pbmZvKFwiRm9jdXNlZCB2aWRlbyBvd25lciBoYXMgbGVmdCB0aGUgY29uZmVyZW5jZVwiKTtcbiAgICAgICAgZm9jdXNlZFZpZGVvSW5mbyA9IG51bGw7XG4gICAgfVxuXG59O1xuXG5VSS5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gU2V0dGluZ3MuZ2V0U2V0dGluZ3MoKTtcbn07XG5cblVJLnRvZ2dsZUZpbG1TdHJpcCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQm90dG9tVG9vbGJhci50b2dnbGVGaWxtU3RyaXAoKTtcbn07XG5cblVJLnRvZ2dsZUNoYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvdHRvbVRvb2xiYXIudG9nZ2xlQ2hhdCgpO1xufTtcblxuVUkudG9nZ2xlQ29udGFjdExpc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIEJvdHRvbVRvb2xiYXIudG9nZ2xlQ29udGFjdExpc3QoKTtcbn07XG5cblVJLm9uTG9jYWxSb2xlQ2hhbmdlID0gZnVuY3Rpb24gKGppZCwgaW5mbywgcHJlcykge1xuXG4gICAgY29uc29sZS5pbmZvKFwiTXkgcm9sZSBjaGFuZ2VkLCBuZXcgcm9sZTogXCIgKyBpbmZvLnJvbGUpO1xuICAgIHZhciBpc01vZGVyYXRvciA9IE1vZGVyYXRvci5pc01vZGVyYXRvcigpO1xuXG4gICAgVmlkZW9MYXlvdXQuc2hvd01vZGVyYXRvckluZGljYXRvcigpO1xuICAgIFRvb2xiYXIuc2hvd0F1dGhlbnRpY2F0ZUJ1dHRvbihcbiAgICAgICAgICAgIE1vZGVyYXRvci5pc0V4dGVybmFsQXV0aEVuYWJsZWQoKSAmJiAhaXNNb2RlcmF0b3IpO1xuXG4gICAgaWYgKGlzTW9kZXJhdG9yKSB7XG4gICAgICAgIFRvb2xiYXIuY2xvc2VBdXRoZW50aWNhdGlvbldpbmRvdygpO1xuICAgICAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoXG4gICAgICAgICAgICAnTWUnLCAnY29ubmVjdGVkJywgJ01vZGVyYXRvciByaWdodHMgZ3JhbnRlZCAhJyk7XG4gICAgfVxufTtcblxuVUkub25EaXNwb3NlQ29uZmVyZW5jZSA9IGZ1bmN0aW9uICh1bmxvYWQpIHtcbiAgICBUb29sYmFyLnNob3dBdXRoZW50aWNhdGVCdXR0b24oZmFsc2UpO1xufTtcblxuVUkub25Nb2RlcmF0b3JTdGF0dXNDaGFuZ2VkID0gZnVuY3Rpb24gKGlzTW9kZXJhdG9yKSB7XG5cbiAgICBUb29sYmFyLnNob3dTaXBDYWxsQnV0dG9uKGlzTW9kZXJhdG9yKTtcbiAgICBUb29sYmFyLnNob3dSZWNvcmRpbmdCdXR0b24oXG4gICAgICAgIGlzTW9kZXJhdG9yKTsgLy8mJlxuICAgIC8vIEZJWE1FOlxuICAgIC8vIFJlY29yZGluZyB2aXNpYmxlIGlmXG4gICAgLy8gdGhlcmUgYXJlIGF0IGxlYXN0IDIoKyAxIGZvY3VzKSBwYXJ0aWNpcGFudHNcbiAgICAvL09iamVjdC5rZXlzKGNvbm5lY3Rpb24uZW11Yy5tZW1iZXJzKS5sZW5ndGggPj0gMyk7XG5cbiAgICBpZiAoaXNNb2RlcmF0b3IgJiYgY29uZmlnLmV0aGVycGFkX2Jhc2UpIHtcbiAgICAgICAgRXRoZXJwYWQuaW5pdCgpO1xuICAgIH1cbn07XG5cblVJLm9uUGFzc3dvcmRSZXFpdXJlZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIC8vIHBhc3N3b3JkIGlzIHJlcXVpcmVkXG4gICAgVG9vbGJhci5sb2NrTG9ja0J1dHRvbigpO1xuXG4gICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhudWxsLFxuICAgICAgICAgICAgJzxoMj5QYXNzd29yZCByZXF1aXJlZDwvaDI+JyArXG4gICAgICAgICAgICAnPGlucHV0IGlkPVwibG9ja0tleVwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJwYXNzd29yZFwiIGF1dG9mb2N1cz4nLFxuICAgICAgICB0cnVlLFxuICAgICAgICBcIk9rXCIsXG4gICAgICAgIGZ1bmN0aW9uIChlLCB2LCBtLCBmKSB7fSxcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9ja0tleScpLmZvY3VzKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlLCB2LCBtLCBmKSB7XG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgIHZhciBsb2NrS2V5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tLZXknKTtcbiAgICAgICAgICAgICAgICBpZiAobG9ja0tleS52YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBUb29sYmFyLnNldFNoYXJlZEtleShsb2NrS2V5LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobG9ja0tleS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn07XG5cblVJLm9uQXV0aGVudGljYXRpb25SZXF1aXJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBleHRyYWN0IHJvb20gbmFtZSBmcm9tICdyb29tQG11Yy5zZXJ2ZXIubmV0J1xuICAgIHZhciByb29tID0gcm9vbU5hbWUuc3Vic3RyKDAsIHJvb21OYW1lLmluZGV4T2YoJ0AnKSk7XG5cbiAgICBtZXNzYWdlSGFuZGxlci5vcGVuRGlhbG9nKFxuICAgICAgICAnU3RvcCcsXG4gICAgICAgICAgICAnQXV0aGVudGljYXRpb24gaXMgcmVxdWlyZWQgdG8gY3JlYXRlIHJvb206PGJyLz4nICsgcm9vbSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAge1xuICAgICAgICAgICAgQXV0aGVudGljYXRlOiAnYXV0aE5vdycsXG4gICAgICAgICAgICBDbG9zZTogJ2Nsb3NlJ1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAob25TdWJtaXRFdmVudCwgc3VibWl0VmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnT24gc3VibWl0OiAnICsgc3VibWl0VmFsdWUsIHN1Ym1pdFZhbHVlKTtcbiAgICAgICAgICAgIGlmIChzdWJtaXRWYWx1ZSA9PT0gJ2F1dGhOb3cnKSB7XG4gICAgICAgICAgICAgICAgVG9vbGJhci5hdXRoZW50aWNhdGVDbGlja2VkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFRvb2xiYXIuc2hvd0F1dGhlbnRpY2F0ZUJ1dHRvbih0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59O1xuXG5VSS5zZXRSZWNvcmRpbmdCdXR0b25TdGF0ZSA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgIFRvb2xiYXIuc2V0UmVjb3JkaW5nQnV0dG9uU3RhdGUoc3RhdGUpO1xufTtcblxuVUkuY2hhbmdlRGVza3RvcFNoYXJpbmdCdXR0b25TdGF0ZSA9IGZ1bmN0aW9uIChpc1VzaW5nU2NyZWVuU3RyZWFtKSB7XG4gICAgVG9vbGJhci5jaGFuZ2VEZXNrdG9wU2hhcmluZ0J1dHRvblN0YXRlKGlzVXNpbmdTY3JlZW5TdHJlYW0pO1xufTtcblxuVUkuaW5wdXREaXNwbGF5TmFtZUhhbmRsZXIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBWaWRlb0xheW91dC5pbnB1dERpc3BsYXlOYW1lSGFuZGxlcih2YWx1ZSk7XG59O1xuXG5VSS5vbk11Y0VudGVyZWQgPSBmdW5jdGlvbiAoamlkLCBpZCwgZGlzcGxheU5hbWUpIHtcbiAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoZGlzcGxheU5hbWUgfHwgJ1NvbWVib2R5JyxcbiAgICAgICAgJ2Nvbm5lY3RlZCcsXG4gICAgICAgICdjb25uZWN0ZWQnKTtcblxuICAgIC8vIEFkZCBQZWVyJ3MgY29udGFpbmVyXG4gICAgVmlkZW9MYXlvdXQuZW5zdXJlUGVlckNvbnRhaW5lckV4aXN0cyhqaWQsaWQpO1xuXG4gICAgaWYoQVBJQ29ubmVjdG9yLmlzRW5hYmxlZCgpICYmXG4gICAgICAgIEFQSUNvbm5lY3Rvci5pc0V2ZW50RW5hYmxlZChcInBhcnRpY2lwYW50Sm9pbmVkXCIpKVxuICAgIHtcbiAgICAgICAgQVBJQ29ubmVjdG9yLnRyaWdnZXJFdmVudChcInBhcnRpY2lwYW50Sm9pbmVkXCIse2ppZDogamlkfSk7XG4gICAgfVxufTtcblxuVUkub25NdWNQcmVzZW5jZVN0YXR1cyA9IGZ1bmN0aW9uICggamlkLCBpbmZvKSB7XG4gICAgVmlkZW9MYXlvdXQuc2V0UHJlc2VuY2VTdGF0dXMoXG4gICAgICAgICAgICAncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCksIGluZm8uc3RhdHVzKTtcbn07XG5cblVJLm9uTXVjUm9sZUNoYW5nZWQgPSBmdW5jdGlvbiAocm9sZSwgZGlzcGxheU5hbWUpIHtcbiAgICBWaWRlb0xheW91dC5zaG93TW9kZXJhdG9ySW5kaWNhdG9yKCk7XG5cbiAgICBpZiAocm9sZSA9PT0gJ21vZGVyYXRvcicpIHtcbiAgICAgICAgdmFyIGRpc3BsYXlOYW1lID0gZGlzcGxheU5hbWU7XG4gICAgICAgIGlmICghZGlzcGxheU5hbWUpIHtcbiAgICAgICAgICAgIGRpc3BsYXlOYW1lID0gJ1NvbWVib2R5JztcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlSGFuZGxlci5ub3RpZnkoXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICdjb25uZWN0ZWQnLFxuICAgICAgICAgICAgICAgICdNb2RlcmF0b3IgcmlnaHRzIGdyYW50ZWQgdG8gJyArIGRpc3BsYXlOYW1lICsgJyEnKTtcbiAgICB9XG59O1xuXG5VSS51cGRhdGVMb2NhbENvbm5lY3Rpb25TdGF0cyA9IGZ1bmN0aW9uKHBlcmNlbnQsIHN0YXRzKVxue1xuICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxvY2FsQ29ubmVjdGlvblN0YXRzKHBlcmNlbnQsIHN0YXRzKTtcbn07XG5cblVJLnVwZGF0ZUNvbm5lY3Rpb25TdGF0cyA9IGZ1bmN0aW9uKGppZCwgcGVyY2VudCwgc3RhdHMpXG57XG4gICAgVmlkZW9MYXlvdXQudXBkYXRlQ29ubmVjdGlvblN0YXRzKGppZCwgcGVyY2VudCwgc3RhdHMpO1xufTtcblxuVUkub25TdGF0c1N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgVmlkZW9MYXlvdXQub25TdGF0c1N0b3AoKTtcbn07XG5cblVJLmdldExhcmdlVmlkZW9TdGF0ZSA9IGZ1bmN0aW9uKClcbntcbiAgICByZXR1cm4gVmlkZW9MYXlvdXQuZ2V0TGFyZ2VWaWRlb1N0YXRlKCk7XG59O1xuXG5VSS5zaG93TG9jYWxBdWRpb0luZGljYXRvciA9IGZ1bmN0aW9uIChtdXRlKSB7XG4gICAgVmlkZW9MYXlvdXQuc2hvd0xvY2FsQXVkaW9JbmRpY2F0b3IobXV0ZSk7XG59O1xuXG5VSS5jaGFuZ2VMb2NhbFZpZGVvID0gZnVuY3Rpb24gKHN0cmVhbSwgZmxpcHgpIHtcbiAgICBWaWRlb0xheW91dC5jaGFuZ2VMb2NhbFZpZGVvKHN0cmVhbSwgZmxpcHgpO1xufTtcblxuVUkuZ2VuZXJhdGVSb29tTmFtZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByb29tbm9kZSA9IG51bGw7XG4gICAgdmFyIHBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAvLyBkZXRlcm1pbmRlIHRoZSByb29tIG5vZGUgZnJvbSB0aGUgdXJsXG4gICAgLy8gVE9ETzoganVzdCB0aGUgcm9vbW5vZGUgb3IgdGhlIHdob2xlIGJhcmUgamlkP1xuICAgIGlmIChjb25maWcuZ2V0cm9vbW5vZGUgJiYgdHlwZW9mIGNvbmZpZy5nZXRyb29tbm9kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBjdXN0b20gZnVuY3Rpb24gbWlnaHQgYmUgcmVzcG9uc2libGUgZm9yIGRvaW5nIHRoZSBwdXNoc3RhdGVcbiAgICAgICAgcm9vbW5vZGUgPSBjb25maWcuZ2V0cm9vbW5vZGUocGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLyogZmFsbCBiYWNrIHRvIGRlZmF1bHQgc3RyYXRlZ3lcbiAgICAgICAgICogdGhpcyBpcyBtYWtpbmcgYXNzdW1wdGlvbnMgYWJvdXQgaG93IHRoZSBVUkwtPnJvb20gbWFwcGluZyBoYXBwZW5zLlxuICAgICAgICAgKiBJdCBjdXJyZW50bHkgYXNzdW1lcyBkZXBsb3ltZW50IGF0IHJvb3QsIHdpdGggYSByZXdyaXRlIGxpa2UgdGhlXG4gICAgICAgICAqIGZvbGxvd2luZyBvbmUgKGZvciBuZ2lueCk6XG4gICAgICAgICBsb2NhdGlvbiB+IF4vKFthLXpBLVowLTldKykkIHtcbiAgICAgICAgIHJld3JpdGUgXi8oLiopJCAvIGJyZWFrO1xuICAgICAgICAgfVxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcm9vbW5vZGUgPSBwYXRoLnN1YnN0cigxKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHdvcmQgPSBSb29tTmFtZUdlbmVyYXRvci5nZW5lcmF0ZVJvb21XaXRob3V0U2VwYXJhdG9yKCk7XG4gICAgICAgICAgICByb29tbm9kZSA9IHdvcmQudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKCdWaWRlb0NoYXQnLFxuICAgICAgICAgICAgICAgICAgICAnUm9vbTogJyArIHdvcmQsIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdvcmQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcm9vbU5hbWUgPSByb29tbm9kZSArICdAJyArIGNvbmZpZy5ob3N0cy5tdWM7XG59O1xuXG5cblVJLmNvbm5lY3Rpb25JbmRpY2F0b3JTaG93TW9yZSA9IGZ1bmN0aW9uKGlkKVxue1xuICAgIHJldHVybiBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tpZF0uc2hvd01vcmUoKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFVJO1xuXG4iLCJ2YXIgQ2FudmFzVXRpbCA9IHJlcXVpcmUoXCIuL0NhbnZhc1V0aWxzXCIpO1xuXG4vKipcbiAqIFRoZSBhdWRpbyBMZXZlbHMgcGx1Z2luLlxuICovXG52YXIgQXVkaW9MZXZlbHMgPSAoZnVuY3Rpb24obXkpIHtcbiAgICB2YXIgYXVkaW9MZXZlbENhbnZhc0NhY2hlID0ge307XG5cbiAgICBteS5MT0NBTF9MRVZFTCA9ICdsb2NhbCc7XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBhdWRpbyBsZXZlbCBjYW52YXMgZm9yIHRoZSBnaXZlbiBwZWVySmlkLiBJZiB0aGUgY2FudmFzXG4gICAgICogZGlkbid0IGV4aXN0IHdlIGNyZWF0ZSBpdC5cbiAgICAgKi9cbiAgICBteS51cGRhdGVBdWRpb0xldmVsQ2FudmFzID0gZnVuY3Rpb24gKHBlZXJKaWQsIFZpZGVvTGF5b3V0KSB7XG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IG51bGw7XG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9IG51bGw7XG4gICAgICAgIGlmICghcGVlckppZClcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ2xvY2FsVmlkZW9Db250YWluZXInO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCk7XG5cbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2aWRlb1NwYW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2aWRlb1NwYW5JZCk7XG5cbiAgICAgICAgaWYgKCF2aWRlb1NwYW4pIHtcbiAgICAgICAgICAgIGlmIChyZXNvdXJjZUppZClcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gdmlkZW8gZWxlbWVudCBmb3IgamlkXCIsIHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gdmlkZW8gZWxlbWVudCBmb3IgbG9jYWwgdmlkZW8uXCIpO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXVkaW9MZXZlbENhbnZhcyA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPmNhbnZhcycpO1xuXG4gICAgICAgIHZhciB2aWRlb1NwYWNlV2lkdGggPSAkKCcjcmVtb3RlVmlkZW9zJykud2lkdGgoKTtcbiAgICAgICAgdmFyIHRodW1ibmFpbFNpemUgPSBWaWRlb0xheW91dC5jYWxjdWxhdGVUaHVtYm5haWxTaXplKHZpZGVvU3BhY2VXaWR0aCk7XG4gICAgICAgIHZhciB0aHVtYm5haWxXaWR0aCA9IHRodW1ibmFpbFNpemVbMF07XG4gICAgICAgIHZhciB0aHVtYm5haWxIZWlnaHQgPSB0aHVtYm5haWxTaXplWzFdO1xuXG4gICAgICAgIGlmICghYXVkaW9MZXZlbENhbnZhcyB8fCBhdWRpb0xldmVsQ2FudmFzLmxlbmd0aCA9PT0gMCkge1xuXG4gICAgICAgICAgICBhdWRpb0xldmVsQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBhdWRpb0xldmVsQ2FudmFzLmNsYXNzTmFtZSA9IFwiYXVkaW9sZXZlbFwiO1xuICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhcy5zdHlsZS5ib3R0b20gPSBcIi1cIiArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkEvMiArIFwicHhcIjtcbiAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMuc3R5bGUubGVmdCA9IFwiLVwiICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yICsgXCJweFwiO1xuICAgICAgICAgICAgcmVzaXplQXVkaW9MZXZlbENhbnZhcyggYXVkaW9MZXZlbENhbnZhcyxcbiAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEhlaWdodCk7XG5cbiAgICAgICAgICAgIHZpZGVvU3Bhbi5hcHBlbmRDaGlsZChhdWRpb0xldmVsQ2FudmFzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXMgPSBhdWRpb0xldmVsQ2FudmFzLmdldCgwKTtcblxuICAgICAgICAgICAgcmVzaXplQXVkaW9MZXZlbENhbnZhcyggYXVkaW9MZXZlbENhbnZhcyxcbiAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbEhlaWdodCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgYXVkaW8gbGV2ZWwgVUkgZm9yIHRoZSBnaXZlbiByZXNvdXJjZUppZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXNvdXJjZUppZCB0aGUgcmVzb3VyY2UgamlkIGluZGljYXRpbmcgdGhlIHZpZGVvIGVsZW1lbnQgZm9yXG4gICAgICogd2hpY2ggd2UgZHJhdyB0aGUgYXVkaW8gbGV2ZWxcbiAgICAgKiBAcGFyYW0gYXVkaW9MZXZlbCB0aGUgbmV3QXVkaW8gbGV2ZWwgdG8gcmVuZGVyXG4gICAgICovXG4gICAgbXkudXBkYXRlQXVkaW9MZXZlbCA9IGZ1bmN0aW9uIChyZXNvdXJjZUppZCwgYXVkaW9MZXZlbCwgbGFyZ2VWaWRlb1Jlc291cmNlSmlkKSB7XG4gICAgICAgIGRyYXdBdWRpb0xldmVsQ2FudmFzKHJlc291cmNlSmlkLCBhdWRpb0xldmVsKTtcblxuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBnZXRWaWRlb1NwYW5JZChyZXNvdXJjZUppZCk7XG5cbiAgICAgICAgdmFyIGF1ZGlvTGV2ZWxDYW52YXMgPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5jYW52YXMnKS5nZXQoMCk7XG5cbiAgICAgICAgaWYgKCFhdWRpb0xldmVsQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBkcmF3Q29udGV4dCA9IGF1ZGlvTGV2ZWxDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICB2YXIgY2FudmFzQ2FjaGUgPSBhdWRpb0xldmVsQ2FudmFzQ2FjaGVbcmVzb3VyY2VKaWRdO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LmNsZWFyUmVjdCAoMCwgMCxcbiAgICAgICAgICAgICAgICBhdWRpb0xldmVsQ2FudmFzLndpZHRoLCBhdWRpb0xldmVsQ2FudmFzLmhlaWdodCk7XG4gICAgICAgIGRyYXdDb250ZXh0LmRyYXdJbWFnZShjYW52YXNDYWNoZSwgMCwgMCk7XG5cbiAgICAgICAgaWYocmVzb3VyY2VKaWQgPT09IEF1ZGlvTGV2ZWxzLkxPQ0FMX0xFVkVMKSB7XG4gICAgICAgICAgICBpZighY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihyZXNvdXJjZUppZCAgPT09IGxhcmdlVmlkZW9SZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgQXVkaW9MZXZlbHMudXBkYXRlQWN0aXZlU3BlYWtlckF1ZGlvTGV2ZWwoYXVkaW9MZXZlbCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbXkudXBkYXRlQWN0aXZlU3BlYWtlckF1ZGlvTGV2ZWwgPSBmdW5jdGlvbihhdWRpb0xldmVsKSB7XG4gICAgICAgIHZhciBkcmF3Q29udGV4dCA9ICQoJyNhY3RpdmVTcGVha2VyQXVkaW9MZXZlbCcpWzBdLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciByID0gaW50ZXJmYWNlQ29uZmlnLkFDVElWRV9TUEVBS0VSX0FWQVRBUl9TSVpFIC8gMjtcbiAgICAgICAgdmFyIGNlbnRlciA9IChpbnRlcmZhY2VDb25maWcuQUNUSVZFX1NQRUFLRVJfQVZBVEFSX1NJWkUgKyByKSAvIDI7XG5cbiAgICAgICAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgc3RhdGUgb2YgdGhlIGNvbnRleHQuXG4gICAgICAgIGRyYXdDb250ZXh0LnNhdmUoKTtcblxuICAgICAgICBkcmF3Q29udGV4dC5jbGVhclJlY3QoMCwgMCwgMzAwLCAzMDApO1xuXG4gICAgICAgIC8vIERyYXcgYSBjaXJjbGUuXG4gICAgICAgIGRyYXdDb250ZXh0LmFyYyhjZW50ZXIsIGNlbnRlciwgciwgMCwgMiAqIE1hdGguUEkpO1xuXG4gICAgICAgIC8vIEFkZCBhIHNoYWRvdyBhcm91bmQgdGhlIGNpcmNsZVxuICAgICAgICBkcmF3Q29udGV4dC5zaGFkb3dDb2xvciA9IGludGVyZmFjZUNvbmZpZy5TSEFET1dfQ09MT1I7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd0JsdXIgPSBnZXRTaGFkb3dMZXZlbChhdWRpb0xldmVsKTtcbiAgICAgICAgZHJhd0NvbnRleHQuc2hhZG93T2Zmc2V0WCA9IDA7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd09mZnNldFkgPSAwO1xuXG4gICAgICAgIC8vIEZpbGwgdGhlIHNoYXBlLlxuICAgICAgICBkcmF3Q29udGV4dC5maWxsKCk7XG5cbiAgICAgICAgZHJhd0NvbnRleHQuc2F2ZSgpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LnJlc3RvcmUoKTtcblxuXG4gICAgICAgIGRyYXdDb250ZXh0LmFyYyhjZW50ZXIsIGNlbnRlciwgciwgMCwgMiAqIE1hdGguUEkpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LmNsaXAoKTtcbiAgICAgICAgZHJhd0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIDI3NywgMjAwKTtcblxuICAgICAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyBjb250ZXh0IHN0YXRlLlxuICAgICAgICBkcmF3Q29udGV4dC5yZXN0b3JlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlc2l6ZXMgdGhlIGdpdmVuIGF1ZGlvIGxldmVsIGNhbnZhcyB0byBtYXRjaCB0aGUgZ2l2ZW4gdGh1bWJuYWlsIHNpemUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVzaXplQXVkaW9MZXZlbENhbnZhcyhhdWRpb0xldmVsQ2FudmFzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJuYWlsV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYm5haWxIZWlnaHQpIHtcbiAgICAgICAgYXVkaW9MZXZlbENhbnZhcy53aWR0aCA9IHRodW1ibmFpbFdpZHRoICsgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQTtcbiAgICAgICAgYXVkaW9MZXZlbENhbnZhcy5oZWlnaHQgPSB0aHVtYm5haWxIZWlnaHQgKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERyYXdzIHRoZSBhdWRpbyBsZXZlbCBjYW52YXMgaW50byB0aGUgY2FjaGVkIGNhbnZhcyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVzb3VyY2VKaWQgdGhlIHJlc291cmNlIGppZCBpbmRpY2F0aW5nIHRoZSB2aWRlbyBlbGVtZW50IGZvclxuICAgICAqIHdoaWNoIHdlIGRyYXcgdGhlIGF1ZGlvIGxldmVsXG4gICAgICogQHBhcmFtIGF1ZGlvTGV2ZWwgdGhlIG5ld0F1ZGlvIGxldmVsIHRvIHJlbmRlclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGRyYXdBdWRpb0xldmVsQ2FudmFzKHJlc291cmNlSmlkLCBhdWRpb0xldmVsKSB7XG4gICAgICAgIGlmICghYXVkaW9MZXZlbENhbnZhc0NhY2hlW3Jlc291cmNlSmlkXSkge1xuXG4gICAgICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBnZXRWaWRlb1NwYW5JZChyZXNvdXJjZUppZCk7XG5cbiAgICAgICAgICAgIHZhciBhdWRpb0xldmVsQ2FudmFzT3JpZyA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPmNhbnZhcycpLmdldCgwKTtcblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEZJWE1FIFRlc3RpbmcgaGFzIHNob3duIHRoYXQgYXVkaW9MZXZlbENhbnZhc09yaWcgbWF5IG5vdCBleGlzdC5cbiAgICAgICAgICAgICAqIEluIHN1Y2ggYSBjYXNlLCB0aGUgbWV0aG9kIENhbnZhc1V0aWwuY2xvbmVDYW52YXMgbWF5IHRocm93IGFuXG4gICAgICAgICAgICAgKiBlcnJvci4gU2luY2UgYXVkaW8gbGV2ZWxzIGFyZSBmcmVxdWVudGx5IHVwZGF0ZWQsIHRoZSBlcnJvcnMgaGF2ZVxuICAgICAgICAgICAgICogYmVlbiBvYnNlcnZlZCB0byBwaWxlIGludG8gdGhlIGNvbnNvbGUsIHN0cmFpbiB0aGUgQ1BVLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpZiAoYXVkaW9MZXZlbENhbnZhc09yaWcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhc0NhY2hlW3Jlc291cmNlSmlkXVxuICAgICAgICAgICAgICAgICAgICA9IENhbnZhc1V0aWwuY2xvbmVDYW52YXMoYXVkaW9MZXZlbENhbnZhc09yaWcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNhbnZhcyA9IGF1ZGlvTGV2ZWxDYW52YXNDYWNoZVtyZXNvdXJjZUppZF07XG5cbiAgICAgICAgaWYgKCFjYW52YXMpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGRyYXdDb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgZHJhd0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgICAgICAgdmFyIHNoYWRvd0xldmVsID0gZ2V0U2hhZG93TGV2ZWwoYXVkaW9MZXZlbCk7XG5cbiAgICAgICAgaWYgKHNoYWRvd0xldmVsID4gMClcbiAgICAgICAgICAgIC8vIGRyYXdDb250ZXh0LCB4LCB5LCB3LCBoLCByLCBzaGFkb3dDb2xvciwgc2hhZG93TGV2ZWxcbiAgICAgICAgICAgIENhbnZhc1V0aWwuZHJhd1JvdW5kUmVjdEdsb3coICAgZHJhd0NvbnRleHQsXG4gICAgICAgICAgICAgICAgaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yLCBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBLzIsXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoIC0gaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQSxcbiAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0IC0gaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQSxcbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX1JBRElVUyxcbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuU0hBRE9XX0NPTE9SLFxuICAgICAgICAgICAgICAgIHNoYWRvd0xldmVsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzaGFkb3cvZ2xvdyBsZXZlbCBmb3IgdGhlIGdpdmVuIGF1ZGlvIGxldmVsLlxuICAgICAqXG4gICAgICogQHBhcmFtIGF1ZGlvTGV2ZWwgdGhlIGF1ZGlvIGxldmVsIGZyb20gd2hpY2ggd2UgZGV0ZXJtaW5lIHRoZSBzaGFkb3dcbiAgICAgKiBsZXZlbFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFNoYWRvd0xldmVsIChhdWRpb0xldmVsKSB7XG4gICAgICAgIHZhciBzaGFkb3dMZXZlbCA9IDA7XG5cbiAgICAgICAgaWYgKGF1ZGlvTGV2ZWwgPD0gMC4zKSB7XG4gICAgICAgICAgICBzaGFkb3dMZXZlbCA9IE1hdGgucm91bmQoaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yKihhdWRpb0xldmVsLzAuMykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGF1ZGlvTGV2ZWwgPD0gMC42KSB7XG4gICAgICAgICAgICBzaGFkb3dMZXZlbCA9IE1hdGgucm91bmQoaW50ZXJmYWNlQ29uZmlnLkNBTlZBU19FWFRSQS8yKigoYXVkaW9MZXZlbCAtIDAuMykgLyAwLjMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNoYWRvd0xldmVsID0gTWF0aC5yb3VuZChpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBLzIqKChhdWRpb0xldmVsIC0gMC42KSAvIDAuNCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaGFkb3dMZXZlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2aWRlbyBzcGFuIGlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGdpdmVuIHJlc291cmNlSmlkIG9yIGxvY2FsXG4gICAgICogdXNlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRWaWRlb1NwYW5JZChyZXNvdXJjZUppZCkge1xuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBudWxsO1xuICAgICAgICBpZiAocmVzb3VyY2VKaWQgPT09IEF1ZGlvTGV2ZWxzLkxPQ0FMX0xFVkVMXG4gICAgICAgICAgICAgICAgfHwgKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQgJiYgcmVzb3VyY2VKaWRcbiAgICAgICAgICAgICAgICAgICAgPT09IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpKSlcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ2xvY2FsVmlkZW9Db250YWluZXInO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQ7XG5cbiAgICAgICAgcmV0dXJuIHZpZGVvU3BhbklkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyB0aGF0IHRoZSByZW1vdGUgdmlkZW8gaGFzIGJlZW4gcmVzaXplZC5cbiAgICAgKi9cbiAgICAkKGRvY3VtZW50KS5iaW5kKCdyZW1vdGV2aWRlby5yZXNpemVkJywgZnVuY3Rpb24gKGV2ZW50LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciByZXNpemVkID0gZmFsc2U7XG4gICAgICAgICQoJyNyZW1vdGVWaWRlb3M+c3Bhbj5jYW52YXMnKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQodGhpcykuZ2V0KDApO1xuICAgICAgICAgICAgaWYgKGNhbnZhcy53aWR0aCAhPT0gd2lkdGggKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGggKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBO1xuICAgICAgICAgICAgICAgIHJlc2l6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY2FudmFzLmhlaWdoICE9PSBoZWlnaHQgKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBKSB7XG4gICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkE7XG4gICAgICAgICAgICAgICAgcmVzaXplZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZXNpemVkKVxuICAgICAgICAgICAgT2JqZWN0LmtleXMoYXVkaW9MZXZlbENhbnZhc0NhY2hlKS5mb3JFYWNoKGZ1bmN0aW9uIChyZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgICAgIGF1ZGlvTGV2ZWxDYW52YXNDYWNoZVtyZXNvdXJjZUppZF0ud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgPSB3aWR0aCArIGludGVyZmFjZUNvbmZpZy5DQU5WQVNfRVhUUkE7XG4gICAgICAgICAgICAgICAgYXVkaW9MZXZlbENhbnZhc0NhY2hlW3Jlc291cmNlSmlkXS5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgPSBoZWlnaHQgKyBpbnRlcmZhY2VDb25maWcuQ0FOVkFTX0VYVFJBO1xuICAgICAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbXk7XG5cbn0pKEF1ZGlvTGV2ZWxzIHx8IHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdWRpb0xldmVsczsiLCIvKipcbiAqIFV0aWxpdHkgY2xhc3MgZm9yIGRyYXdpbmcgY2FudmFzIHNoYXBlcy5cbiAqL1xudmFyIENhbnZhc1V0aWwgPSAoZnVuY3Rpb24obXkpIHtcblxuICAgIC8qKlxuICAgICAqIERyYXdzIGEgcm91bmQgcmVjdGFuZ2xlIHdpdGggYSBnbG93LiBUaGUgZ2xvd1dpZHRoIGluZGljYXRlcyB0aGUgZGVwdGhcbiAgICAgKiBvZiB0aGUgZ2xvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkcmF3Q29udGV4dCB0aGUgY29udGV4dCBvZiB0aGUgY2FudmFzIHRvIGRyYXcgdG9cbiAgICAgKiBAcGFyYW0geCB0aGUgeCBjb29yZGluYXRlIG9mIHRoZSByb3VuZCByZWN0YW5nbGVcbiAgICAgKiBAcGFyYW0geSB0aGUgeSBjb29yZGluYXRlIG9mIHRoZSByb3VuZCByZWN0YW5nbGVcbiAgICAgKiBAcGFyYW0gdyB0aGUgd2lkdGggb2YgdGhlIHJvdW5kIHJlY3RhbmdsZVxuICAgICAqIEBwYXJhbSBoIHRoZSBoZWlnaHQgb2YgdGhlIHJvdW5kIHJlY3RhbmdsZVxuICAgICAqIEBwYXJhbSBnbG93Q29sb3IgdGhlIGNvbG9yIG9mIHRoZSBnbG93XG4gICAgICogQHBhcmFtIGdsb3dXaWR0aCB0aGUgd2lkdGggb2YgdGhlIGdsb3dcbiAgICAgKi9cbiAgICBteS5kcmF3Um91bmRSZWN0R2xvd1xuICAgICAgICA9IGZ1bmN0aW9uKGRyYXdDb250ZXh0LCB4LCB5LCB3LCBoLCByLCBnbG93Q29sb3IsIGdsb3dXaWR0aCkge1xuXG4gICAgICAgIC8vIFNhdmUgdGhlIHByZXZpb3VzIHN0YXRlIG9mIHRoZSBjb250ZXh0LlxuICAgICAgICBkcmF3Q29udGV4dC5zYXZlKCk7XG5cbiAgICAgICAgaWYgKHcgPCAyICogcikgciA9IHcgLyAyO1xuICAgICAgICBpZiAoaCA8IDIgKiByKSByID0gaCAvIDI7XG5cbiAgICAgICAgLy8gRHJhdyBhIHJvdW5kIHJlY3RhbmdsZS5cbiAgICAgICAgZHJhd0NvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIGRyYXdDb250ZXh0Lm1vdmVUbyh4K3IsIHkpO1xuICAgICAgICBkcmF3Q29udGV4dC5hcmNUbyh4K3csIHksICAgeCt3LCB5K2gsIHIpO1xuICAgICAgICBkcmF3Q29udGV4dC5hcmNUbyh4K3csIHkraCwgeCwgICB5K2gsIHIpO1xuICAgICAgICBkcmF3Q29udGV4dC5hcmNUbyh4LCAgIHkraCwgeCwgICB5LCAgIHIpO1xuICAgICAgICBkcmF3Q29udGV4dC5hcmNUbyh4LCAgIHksICAgeCt3LCB5LCAgIHIpO1xuICAgICAgICBkcmF3Q29udGV4dC5jbG9zZVBhdGgoKTtcblxuICAgICAgICAvLyBBZGQgYSBzaGFkb3cgYXJvdW5kIHRoZSByZWN0YW5nbGVcbiAgICAgICAgZHJhd0NvbnRleHQuc2hhZG93Q29sb3IgPSBnbG93Q29sb3I7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd0JsdXIgPSBnbG93V2lkdGg7XG4gICAgICAgIGRyYXdDb250ZXh0LnNoYWRvd09mZnNldFggPSAwO1xuICAgICAgICBkcmF3Q29udGV4dC5zaGFkb3dPZmZzZXRZID0gMDtcblxuICAgICAgICAvLyBGaWxsIHRoZSBzaGFwZS5cbiAgICAgICAgZHJhd0NvbnRleHQuZmlsbCgpO1xuXG4gICAgICAgIGRyYXdDb250ZXh0LnNhdmUoKTtcblxuICAgICAgICBkcmF3Q29udGV4dC5yZXN0b3JlKCk7XG5cbi8vICAgICAgMSkgVW5jb21tZW50IHRoaXMgbGluZSB0byB1c2UgQ29tcG9zaXRlIE9wZXJhdGlvbiwgd2hpY2ggaXMgZG9pbmcgdGhlXG4vLyAgICAgIHNhbWUgYXMgdGhlIGNsaXAgZnVuY3Rpb24gYmVsb3cgYW5kIGlzIGFsc28gYW50aWFsaWFzaW5nIHRoZSByb3VuZFxuLy8gICAgICBib3JkZXIsIGJ1dCBpcyBzYWlkIHRvIGJlIGxlc3MgZmFzdCBwZXJmb3JtYW5jZSB3aXNlLlxuXG4vLyAgICAgIGRyYXdDb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj0nZGVzdGluYXRpb24tb3V0JztcblxuICAgICAgICBkcmF3Q29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgZHJhd0NvbnRleHQubW92ZVRvKHgrciwgeSk7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgrdywgeSwgICB4K3csIHkraCwgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgrdywgeStoLCB4LCAgIHkraCwgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgsICAgeStoLCB4LCAgIHksICAgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmFyY1RvKHgsICAgeSwgICB4K3csIHksICAgcik7XG4gICAgICAgIGRyYXdDb250ZXh0LmNsb3NlUGF0aCgpO1xuXG4vLyAgICAgIDIpIFVuY29tbWVudCB0aGlzIGxpbmUgdG8gdXNlIENvbXBvc2l0ZSBPcGVyYXRpb24sIHdoaWNoIGlzIGRvaW5nIHRoZVxuLy8gICAgICBzYW1lIGFzIHRoZSBjbGlwIGZ1bmN0aW9uIGJlbG93IGFuZCBpcyBhbHNvIGFudGlhbGlhc2luZyB0aGUgcm91bmRcbi8vICAgICAgYm9yZGVyLCBidXQgaXMgc2FpZCB0byBiZSBsZXNzIGZhc3QgcGVyZm9ybWFuY2Ugd2lzZS5cblxuLy8gICAgICBkcmF3Q29udGV4dC5maWxsKCk7XG5cbiAgICAgICAgLy8gQ29tbWVudCB0aGVzZSB0d28gbGluZXMgaWYgY2hvb3NpbmcgdG8gZG8gdGhlIHNhbWUgd2l0aCBjb21wb3NpdGVcbiAgICAgICAgLy8gb3BlcmF0aW9uIGFib3ZlIDEgYW5kIDIuXG4gICAgICAgIGRyYXdDb250ZXh0LmNsaXAoKTtcbiAgICAgICAgZHJhd0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIDI3NywgMjAwKTtcblxuICAgICAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyBjb250ZXh0IHN0YXRlLlxuICAgICAgICBkcmF3Q29udGV4dC5yZXN0b3JlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENsb25lcyB0aGUgZ2l2ZW4gY2FudmFzLlxuICAgICAqXG4gICAgICogQHJldHVybiB0aGUgbmV3IGNsb25lZCBjYW52YXMuXG4gICAgICovXG4gICAgbXkuY2xvbmVDYW52YXMgPSBmdW5jdGlvbiAob2xkQ2FudmFzKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAqIEZJWE1FIFRlc3RpbmcgaGFzIHNob3duIHRoYXQgb2xkQ2FudmFzIG1heSBub3QgZXhpc3QuIEluIHN1Y2ggYSBjYXNlLFxuICAgICAgICAgKiB0aGUgbWV0aG9kIENhbnZhc1V0aWwuY2xvbmVDYW52YXMgbWF5IHRocm93IGFuIGVycm9yLiBTaW5jZSBhdWRpb1xuICAgICAgICAgKiBsZXZlbHMgYXJlIGZyZXF1ZW50bHkgdXBkYXRlZCwgdGhlIGVycm9ycyBoYXZlIGJlZW4gb2JzZXJ2ZWQgdG8gcGlsZVxuICAgICAgICAgKiBpbnRvIHRoZSBjb25zb2xlLCBzdHJhaW4gdGhlIENQVS5cbiAgICAgICAgICovXG4gICAgICAgIGlmICghb2xkQ2FudmFzKVxuICAgICAgICAgICAgcmV0dXJuIG9sZENhbnZhcztcblxuICAgICAgICAvL2NyZWF0ZSBhIG5ldyBjYW52YXNcbiAgICAgICAgdmFyIG5ld0NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICB2YXIgY29udGV4dCA9IG5ld0NhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIC8vc2V0IGRpbWVuc2lvbnNcbiAgICAgICAgbmV3Q2FudmFzLndpZHRoID0gb2xkQ2FudmFzLndpZHRoO1xuICAgICAgICBuZXdDYW52YXMuaGVpZ2h0ID0gb2xkQ2FudmFzLmhlaWdodDtcblxuICAgICAgICAvL2FwcGx5IHRoZSBvbGQgY2FudmFzIHRvIHRoZSBuZXcgb25lXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKG9sZENhbnZhcywgMCwgMCk7XG5cbiAgICAgICAgLy9yZXR1cm4gdGhlIG5ldyBjYW52YXNcbiAgICAgICAgcmV0dXJuIG5ld0NhbnZhcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIG15O1xufSkoQ2FudmFzVXRpbCB8fCB7fSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzVXRpbDsiLCJ2YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2lkZV9wYW5uZWxzL3NldHRpbmdzL1NldHRpbmdzXCIpO1xuXG52YXIgdXNlcnMgPSB7fTtcbnZhciBhY3RpdmVTcGVha2VySmlkO1xuXG5mdW5jdGlvbiBzZXRWaXNpYmlsaXR5KHNlbGVjdG9yLCBzaG93KSB7XG4gICAgaWYgKHNlbGVjdG9yICYmIHNlbGVjdG9yLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VsZWN0b3IuY3NzKFwidmlzaWJpbGl0eVwiLCBzaG93ID8gXCJ2aXNpYmxlXCIgOiBcImhpZGRlblwiKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzVXNlck11dGVkKGppZCkge1xuICAgIC8vIFhYWChncCkgd2UgbWF5IHdhbnQgdG8gcmVuYW1lIHRoaXMgbWV0aG9kIHRvIHNvbWV0aGluZyBsaWtlXG4gICAgLy8gaXNVc2VyU3RyZWFtaW5nLCBmb3IgZXhhbXBsZS5cbiAgICBpZiAoamlkICYmIGppZCAhPSBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSB7XG4gICAgICAgIHZhciByZXNvdXJjZSA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIGlmICghcmVxdWlyZShcIi4uL3ZpZGVvbGF5b3V0L1ZpZGVvTGF5b3V0XCIpLmlzSW5MYXN0TihyZXNvdXJjZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFSVEMucmVtb3RlU3RyZWFtc1tqaWRdIHx8ICFSVEMucmVtb3RlU3RyZWFtc1tqaWRdW01lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFXSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIFJUQy5yZW1vdGVTdHJlYW1zW2ppZF1bTWVkaWFTdHJlYW1UeXBlLlZJREVPX1RZUEVdLm11dGVkO1xufVxuXG5mdW5jdGlvbiBnZXRHcmF2YXRhclVybChpZCwgc2l6ZSkge1xuICAgIGlmKGlkID09PSBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkIHx8ICFpZCkge1xuICAgICAgICBpZCA9IFNldHRpbmdzLmdldFNldHRpbmdzKCkudWlkO1xuICAgIH1cbiAgICByZXR1cm4gJ2h0dHBzOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvJyArXG4gICAgICAgIE1ENS5oZXhkaWdlc3QoaWQudHJpbSgpLnRvTG93ZXJDYXNlKCkpICtcbiAgICAgICAgXCI/ZD13YXZhdGFyJnNpemU9XCIgKyAoc2l6ZSB8fCBcIjMwXCIpO1xufVxuXG52YXIgQXZhdGFyID0ge1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdXNlcidzIGF2YXRhciBpbiB0aGUgc2V0dGluZ3MgbWVudShpZiBsb2NhbCB1c2VyKSwgY29udGFjdCBsaXN0XG4gICAgICogYW5kIHRodW1ibmFpbFxuICAgICAqIEBwYXJhbSBqaWQgamlkIG9mIHRoZSB1c2VyXG4gICAgICogQHBhcmFtIGlkIGVtYWlsIG9yIHVzZXJJRCB0byBiZSB1c2VkIGFzIGEgaGFzaFxuICAgICAqL1xuICAgIHNldFVzZXJBdmF0YXI6IGZ1bmN0aW9uIChqaWQsIGlkKSB7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgaWYgKHVzZXJzW2ppZF0gPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXNlcnNbamlkXSA9IGlkO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0aHVtYlVybCA9IGdldEdyYXZhdGFyVXJsKHVzZXJzW2ppZF0gfHwgamlkLCAxMDApO1xuICAgICAgICB2YXIgY29udGFjdExpc3RVcmwgPSBnZXRHcmF2YXRhclVybCh1c2Vyc1tqaWRdIHx8IGppZCk7XG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIHZhciB0aHVtYm5haWwgPSAkKCcjcGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkKTtcbiAgICAgICAgdmFyIGF2YXRhciA9ICQoJyNhdmF0YXJfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICAvLyBzZXQgdGhlIGF2YXRhciBpbiB0aGUgc2V0dGluZ3MgbWVudSBpZiBpdCBpcyBsb2NhbCB1c2VyIGFuZCBnZXQgdGhlXG4gICAgICAgIC8vIGxvY2FsIHZpZGVvIGNvbnRhaW5lclxuICAgICAgICBpZiAoamlkID09PSBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSB7XG4gICAgICAgICAgICAkKCcjYXZhdGFyJykuZ2V0KDApLnNyYyA9IHRodW1iVXJsO1xuICAgICAgICAgICAgdGh1bWJuYWlsID0gJCgnI2xvY2FsVmlkZW9Db250YWluZXInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB0aGUgYXZhdGFyIGluIHRoZSBjb250YWN0IGxpc3RcbiAgICAgICAgdmFyIGNvbnRhY3QgPSAkKCcjJyArIHJlc291cmNlSmlkICsgJz5pbWcnKTtcbiAgICAgICAgaWYgKGNvbnRhY3QgJiYgY29udGFjdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb250YWN0LmdldCgwKS5zcmMgPSBjb250YWN0TGlzdFVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNldCB0aGUgYXZhdGFyIGluIHRoZSB0aHVtYm5haWxcbiAgICAgICAgaWYgKGF2YXRhciAmJiBhdmF0YXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgYXZhdGFyWzBdLnNyYyA9IHRodW1iVXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRodW1ibmFpbCAmJiB0aHVtYm5haWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICAgICAgICAgICAgICAgIGF2YXRhci5pZCA9ICdhdmF0YXJfJyArIHJlc291cmNlSmlkO1xuICAgICAgICAgICAgICAgIGF2YXRhci5jbGFzc05hbWUgPSAndXNlckF2YXRhcic7XG4gICAgICAgICAgICAgICAgYXZhdGFyLnNyYyA9IHRodW1iVXJsO1xuICAgICAgICAgICAgICAgIHRodW1ibmFpbC5hcHBlbmQoYXZhdGFyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vaWYgdGhlIHVzZXIgaXMgdGhlIGN1cnJlbnQgYWN0aXZlIHNwZWFrZXIgLSB1cGRhdGUgdGhlIGFjdGl2ZSBzcGVha2VyXG4gICAgICAgIC8vIGF2YXRhclxuICAgICAgICBpZiAoamlkID09PSBhY3RpdmVTcGVha2VySmlkKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUFjdGl2ZVNwZWFrZXJBdmF0YXJTcmMoamlkKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBIaWRlcyBvciBzaG93cyB0aGUgdXNlcidzIGF2YXRhclxuICAgICAqIEBwYXJhbSBqaWQgamlkIG9mIHRoZSB1c2VyXG4gICAgICogQHBhcmFtIHNob3cgd2hldGhlciB3ZSBzaG91bGQgc2hvdyB0aGUgYXZhdGFyIG9yIG5vdFxuICAgICAqIHZpZGVvIGJlY2F1c2UgdGhlcmUgaXMgbm8gZG9taW5hbnQgc3BlYWtlciBhbmQgbm8gZm9jdXNlZCBzcGVha2VyXG4gICAgICovXG4gICAgc2hvd1VzZXJBdmF0YXI6IGZ1bmN0aW9uIChqaWQsIHNob3cpIHtcbiAgICAgICAgaWYgKHVzZXJzW2ppZF0pIHtcbiAgICAgICAgICAgIHZhciByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgICAgICB2YXIgdmlkZW8gPSAkKCcjcGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkICsgJz52aWRlbycpO1xuICAgICAgICAgICAgdmFyIGF2YXRhciA9ICQoJyNhdmF0YXJfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICAgICAgaWYgKGppZCA9PT0gY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkge1xuICAgICAgICAgICAgICAgIHZpZGVvID0gJCgnI2xvY2FsVmlkZW9XcmFwcGVyPnZpZGVvJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2hvdyA9PT0gdW5kZWZpbmVkIHx8IHNob3cgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzaG93ID0gaXNVc2VyTXV0ZWQoamlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9pZiB0aGUgdXNlciBpcyB0aGUgY3VycmVudGx5IGZvY3VzZWQsIHRoZSBkb21pbmFudCBzcGVha2VyIG9yIGlmXG4gICAgICAgICAgICAvL3RoZXJlIGlzIG5vIGZvY3VzZWQgYW5kIG5vIGRvbWluYW50IHNwZWFrZXIgYW5kIHRoZSBsYXJnZSB2aWRlbyBpc1xuICAgICAgICAgICAgLy9jdXJyZW50bHkgc2hvd25cbiAgICAgICAgICAgIGlmIChhY3RpdmVTcGVha2VySmlkID09PSBqaWQgJiYgcmVxdWlyZShcIi4uL3ZpZGVvbGF5b3V0L1ZpZGVvTGF5b3V0XCIpLmlzTGFyZ2VWaWRlb09uVG9wKCkpIHtcbiAgICAgICAgICAgICAgICBzZXRWaXNpYmlsaXR5KCQoXCIjbGFyZ2VWaWRlb1wiKSwgIXNob3cpO1xuICAgICAgICAgICAgICAgIHNldFZpc2liaWxpdHkoJCgnI2FjdGl2ZVNwZWFrZXInKSwgc2hvdyk7XG4gICAgICAgICAgICAgICAgc2V0VmlzaWJpbGl0eShhdmF0YXIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBzZXRWaXNpYmlsaXR5KHZpZGVvLCBmYWxzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh2aWRlbyAmJiB2aWRlby5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldFZpc2liaWxpdHkodmlkZW8sICFzaG93KTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VmlzaWJpbGl0eShhdmF0YXIsIHNob3cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBzcmMgb2YgdGhlIGFjdGl2ZSBzcGVha2VyIGF2YXRhclxuICAgICAqIEBwYXJhbSBqaWQgb2YgdGhlIGN1cnJlbnQgYWN0aXZlIHNwZWFrZXJcbiAgICAgKi9cbiAgICB1cGRhdGVBY3RpdmVTcGVha2VyQXZhdGFyU3JjOiBmdW5jdGlvbiAoamlkKSB7XG4gICAgICAgIGlmICghamlkKSB7XG4gICAgICAgICAgICBqaWQgPSBjb25uZWN0aW9uLmVtdWMuZmluZEppZEZyb21SZXNvdXJjZShcbiAgICAgICAgICAgICAgICByZXF1aXJlKFwiLi4vdmlkZW9sYXlvdXQvVmlkZW9MYXlvdXRcIikuZ2V0TGFyZ2VWaWRlb1N0YXRlKCkudXNlclJlc291cmNlSmlkKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXZhdGFyID0gJChcIiNhY3RpdmVTcGVha2VyQXZhdGFyXCIpWzBdO1xuICAgICAgICB2YXIgdXJsID0gZ2V0R3JhdmF0YXJVcmwodXNlcnNbamlkXSxcbiAgICAgICAgICAgIGludGVyZmFjZUNvbmZpZy5BQ1RJVkVfU1BFQUtFUl9BVkFUQVJfU0laRSk7XG4gICAgICAgIGlmIChqaWQgPT09IGFjdGl2ZVNwZWFrZXJKaWQgJiYgYXZhdGFyLnNyYyA9PT0gdXJsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYWN0aXZlU3BlYWtlckppZCA9IGppZDtcbiAgICAgICAgdmFyIGlzTXV0ZWQgPSBpc1VzZXJNdXRlZChqaWQpO1xuICAgICAgICBpZiAoamlkICYmIGlzTXV0ZWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGF2YXRhci5zcmMgPSB1cmw7XG4gICAgICAgICAgICBzZXRWaXNpYmlsaXR5KCQoXCIjbGFyZ2VWaWRlb1wiKSwgIWlzTXV0ZWQpO1xuICAgICAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKGppZCwgaXNNdXRlZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBBdmF0YXI7IiwiLyogZ2xvYmFsICQsIGNvbmZpZywgY29ubmVjdGlvbiwgZG9ja1Rvb2xiYXIsIE1vZGVyYXRvcixcbiAgIHNldExhcmdlVmlkZW9WaXNpYmxlLCBVdGlsICovXG5cbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKTtcbnZhciBQcmV6aSA9IHJlcXVpcmUoXCIuLi9wcmV6aS9QcmV6aVwiKTtcbnZhciBVSVV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbC9VSVV0aWxcIik7XG5cbnZhciBldGhlcnBhZE5hbWUgPSBudWxsO1xudmFyIGV0aGVycGFkSUZyYW1lID0gbnVsbDtcbnZhciBkb21haW4gPSBudWxsO1xudmFyIG9wdGlvbnMgPSBcIj9zaG93Q29udHJvbHM9dHJ1ZSZzaG93Q2hhdD1mYWxzZSZzaG93TGluZU51bWJlcnM9dHJ1ZSZ1c2VNb25vc3BhY2VGb250PWZhbHNlXCI7XG5cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBldGhlcnBhZC5cbiAqL1xuZnVuY3Rpb24gcmVzaXplKCkge1xuICAgIGlmICgkKCcjZXRoZXJwYWQ+aWZyYW1lJykubGVuZ3RoKSB7XG4gICAgICAgIHZhciByZW1vdGVWaWRlb3MgPSAkKCcjcmVtb3RlVmlkZW9zJyk7XG4gICAgICAgIHZhciBhdmFpbGFibGVIZWlnaHRcbiAgICAgICAgICAgID0gd2luZG93LmlubmVySGVpZ2h0IC0gcmVtb3RlVmlkZW9zLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IFVJVXRpbC5nZXRBdmFpbGFibGVWaWRlb1dpZHRoKCk7XG5cbiAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLndpZHRoKGF2YWlsYWJsZVdpZHRoKTtcbiAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmhlaWdodChhdmFpbGFibGVIZWlnaHQpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTaGFyZXMgdGhlIEV0aGVycGFkIG5hbWUgd2l0aCBvdGhlciBwYXJ0aWNpcGFudHMuXG4gKi9cbmZ1bmN0aW9uIHNoYXJlRXRoZXJwYWQoKSB7XG4gICAgY29ubmVjdGlvbi5lbXVjLmFkZEV0aGVycGFkVG9QcmVzZW5jZShldGhlcnBhZE5hbWUpO1xuICAgIGNvbm5lY3Rpb24uZW11Yy5zZW5kUHJlc2VuY2UoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBFdGhlcnBhZCBidXR0b24gYW5kIGFkZHMgaXQgdG8gdGhlIHRvb2xiYXIuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUV0aGVycGFkQnV0dG9uKCkge1xuICAgIGlmICghJCgnI2V0aGVycGFkQnV0dG9uJykuaXMoXCI6dmlzaWJsZVwiKSlcbiAgICAgICAgJCgnI2V0aGVycGFkQnV0dG9uJykuY3NzKHtkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIElGcmFtZSBmb3IgdGhlIGV0aGVycGFkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVJRnJhbWUoKSB7XG4gICAgZXRoZXJwYWRJRnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBldGhlcnBhZElGcmFtZS5zcmMgPSBkb21haW4gKyBldGhlcnBhZE5hbWUgKyBvcHRpb25zO1xuICAgIGV0aGVycGFkSUZyYW1lLmZyYW1lQm9yZGVyID0gMDtcbiAgICBldGhlcnBhZElGcmFtZS5zY3JvbGxpbmcgPSBcIm5vXCI7XG4gICAgZXRoZXJwYWRJRnJhbWUud2lkdGggPSAkKCcjbGFyZ2VWaWRlb0NvbnRhaW5lcicpLndpZHRoKCkgfHwgNjQwO1xuICAgIGV0aGVycGFkSUZyYW1lLmhlaWdodCA9ICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykuaGVpZ2h0KCkgfHwgNDgwO1xuICAgIGV0aGVycGFkSUZyYW1lLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAndmlzaWJpbGl0eTogaGlkZGVuOycpO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V0aGVycGFkJykuYXBwZW5kQ2hpbGQoZXRoZXJwYWRJRnJhbWUpO1xuXG4gICAgZXRoZXJwYWRJRnJhbWUub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZG9jdW1lbnQuZG9tYWluID0gZG9jdW1lbnQuZG9tYWluO1xuICAgICAgICBidWJibGVJZnJhbWVNb3VzZU1vdmUoZXRoZXJwYWRJRnJhbWUpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gdGhlIGlmcmFtZXMgaW5zaWRlIG9mIHRoZSBldGhlcnBhZCBhcmVcbiAgICAgICAgICAgIC8vIG5vdCB5ZXQgbG9hZGVkIHdoZW4gdGhlIGV0aGVycGFkIGlmcmFtZSBpcyBsb2FkZWRcbiAgICAgICAgICAgIHZhciBvdXRlciA9IGV0aGVycGFkSUZyYW1lLlxuICAgICAgICAgICAgICAgIGNvbnRlbnREb2N1bWVudC5nZXRFbGVtZW50c0J5TmFtZShcImFjZV9vdXRlclwiKVswXTtcbiAgICAgICAgICAgIGJ1YmJsZUlmcmFtZU1vdXNlTW92ZShvdXRlcik7XG4gICAgICAgICAgICB2YXIgaW5uZXIgPSBvdXRlci5cbiAgICAgICAgICAgICAgICBjb250ZW50RG9jdW1lbnQuZ2V0RWxlbWVudHNCeU5hbWUoXCJhY2VfaW5uZXJcIilbMF07XG4gICAgICAgICAgICBidWJibGVJZnJhbWVNb3VzZU1vdmUoaW5uZXIpO1xuICAgICAgICB9LCAyMDAwKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBidWJibGVJZnJhbWVNb3VzZU1vdmUoaWZyYW1lKXtcbiAgICB2YXIgZXhpc3RpbmdPbk1vdXNlTW92ZSA9IGlmcmFtZS5jb250ZW50V2luZG93Lm9ubW91c2Vtb3ZlO1xuICAgIGlmcmFtZS5jb250ZW50V2luZG93Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSl7XG4gICAgICAgIGlmKGV4aXN0aW5nT25Nb3VzZU1vdmUpIGV4aXN0aW5nT25Nb3VzZU1vdmUoZSk7XG4gICAgICAgIHZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICB2YXIgYm91bmRpbmdDbGllbnRSZWN0ID0gaWZyYW1lLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBldnQuaW5pdE1vdXNlRXZlbnQoXG4gICAgICAgICAgICBcIm1vdXNlbW92ZVwiLFxuICAgICAgICAgICAgdHJ1ZSwgLy8gYnViYmxlc1xuICAgICAgICAgICAgZmFsc2UsIC8vIG5vdCBjYW5jZWxhYmxlXG4gICAgICAgICAgICB3aW5kb3csXG4gICAgICAgICAgICBlLmRldGFpbCxcbiAgICAgICAgICAgIGUuc2NyZWVuWCxcbiAgICAgICAgICAgIGUuc2NyZWVuWSxcbiAgICAgICAgICAgICAgICBlLmNsaWVudFggKyBib3VuZGluZ0NsaWVudFJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICBlLmNsaWVudFkgKyBib3VuZGluZ0NsaWVudFJlY3QudG9wLFxuICAgICAgICAgICAgZS5jdHJsS2V5LFxuICAgICAgICAgICAgZS5hbHRLZXksXG4gICAgICAgICAgICBlLnNoaWZ0S2V5LFxuICAgICAgICAgICAgZS5tZXRhS2V5LFxuICAgICAgICAgICAgZS5idXR0b24sXG4gICAgICAgICAgICBudWxsIC8vIG5vIHJlbGF0ZWQgZWxlbWVudFxuICAgICAgICApO1xuICAgICAgICBpZnJhbWUuZGlzcGF0Y2hFdmVudChldnQpO1xuICAgIH07XG59XG5cblxuLyoqXG4gKiBPbiB2aWRlbyBzZWxlY3RlZCBldmVudC5cbiAqL1xuJChkb2N1bWVudCkuYmluZCgndmlkZW8uc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGlzUHJlc2VudGF0aW9uKSB7XG4gICAgaWYgKGNvbmZpZy5ldGhlcnBhZF9iYXNlICYmIGV0aGVycGFkSUZyYW1lICYmIGV0aGVycGFkSUZyYW1lLnN0eWxlLnZpc2liaWxpdHkgIT09ICdoaWRkZW4nKVxuICAgICAgICBFdGhlcnBhZC50b2dnbGVFdGhlcnBhZChpc1ByZXNlbnRhdGlvbik7XG59KTtcblxuXG52YXIgRXRoZXJwYWQgPSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdGhlIGV0aGVycGFkLlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uIChuYW1lKSB7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5ldGhlcnBhZF9iYXNlICYmICFldGhlcnBhZE5hbWUpIHtcblxuICAgICAgICAgICAgZG9tYWluID0gY29uZmlnLmV0aGVycGFkX2Jhc2U7XG5cbiAgICAgICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UncmUgdGhlIGZvY3VzIHdlIGdlbmVyYXRlIHRoZSBuYW1lLlxuICAgICAgICAgICAgICAgIGV0aGVycGFkTmFtZSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdfJyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBzaGFyZUV0aGVycGFkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZXRoZXJwYWROYW1lID0gbmFtZTtcblxuICAgICAgICAgICAgZW5hYmxlRXRoZXJwYWRCdXR0b24oKTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXNpemVzIHRoZSBldGhlcnBhZCwgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc2l6ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbnMvaGlkZXMgdGhlIEV0aGVycGFkLlxuICAgICAqL1xuICAgIHRvZ2dsZUV0aGVycGFkOiBmdW5jdGlvbiAoaXNQcmVzZW50YXRpb24pIHtcbiAgICAgICAgaWYgKCFldGhlcnBhZElGcmFtZSlcbiAgICAgICAgICAgIGNyZWF0ZUlGcmFtZSgpO1xuXG4gICAgICAgIHZhciBsYXJnZVZpZGVvID0gbnVsbDtcbiAgICAgICAgaWYgKFByZXppLmlzUHJlc2VudGF0aW9uVmlzaWJsZSgpKVxuICAgICAgICAgICAgbGFyZ2VWaWRlbyA9ICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhcmdlVmlkZW8gPSAkKCcjbGFyZ2VWaWRlbycpO1xuXG4gICAgICAgIGlmICgkKCcjZXRoZXJwYWQ+aWZyYW1lJykuY3NzKCd2aXNpYmlsaXR5JykgPT09ICdoaWRkZW4nKSB7XG4gICAgICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIGxhcmdlVmlkZW8uZmFkZU91dCgzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoUHJlemkuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlby5jc3Moe29wYWNpdHk6ICcwJ30pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNldExhcmdlVmlkZW9WaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmZhZGVJbigzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmJhY2tncm91bmQgPSAnI2VlZWVlZSc7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkJykuY3NzKHt6SW5kZXg6IDJ9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCQoJyNldGhlcnBhZD5pZnJhbWUnKSkge1xuICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmZhZGVPdXQoMzAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCgnI2V0aGVycGFkPmlmcmFtZScpLmNzcyh7dmlzaWJpbGl0eTogJ2hpZGRlbid9KTtcbiAgICAgICAgICAgICAgICAkKCcjZXRoZXJwYWQnKS5jc3Moe3pJbmRleDogMH0pO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuYmFja2dyb3VuZCA9ICdibGFjayc7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFpc1ByZXNlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgICQoJyNsYXJnZVZpZGVvJykuZmFkZUluKDMwMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zZXRMYXJnZVZpZGVvVmlzaWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXNpemUoKTtcbiAgICB9LFxuXG4gICAgaXNWaXNpYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV0aGVycGFkSWZyYW1lID0gJCgnI2V0aGVycGFkPmlmcmFtZScpO1xuICAgICAgICByZXR1cm4gZXRoZXJwYWRJZnJhbWUgJiYgZXRoZXJwYWRJZnJhbWUuaXMoJzp2aXNpYmxlJyk7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV0aGVycGFkO1xuIiwidmFyIFRvb2xiYXJUb2dnbGVyID0gcmVxdWlyZShcIi4uL3Rvb2xiYXJzL1Rvb2xiYXJUb2dnbGVyXCIpO1xudmFyIFVJVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL1VJVXRpbFwiKTtcbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKTtcbnZhciBtZXNzYWdlSGFuZGxlciA9IHJlcXVpcmUoXCIuLi91dGlsL01lc3NhZ2VIYW5kbGVyXCIpO1xuXG52YXIgcHJlemlQbGF5ZXIgPSBudWxsO1xuXG52YXIgUHJlemkgPSB7XG5cblxuICAgIC8qKlxuICAgICAqIFJlbG9hZHMgdGhlIGN1cnJlbnQgcHJlc2VudGF0aW9uLlxuICAgICAqL1xuICAgIHJlbG9hZFByZXNlbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcmV6aVBsYXllci5vcHRpb25zLnByZXppSWQpO1xuICAgICAgICBpZnJhbWUuc3JjID0gaWZyYW1lLnNyYztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyA8dHQ+dHJ1ZTwvdHQ+IGlmIHRoZSBwcmVzZW50YXRpb24gaXMgdmlzaWJsZSwgPHR0PmZhbHNlPC90dD4gLVxuICAgICAqIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBpc1ByZXNlbnRhdGlvblZpc2libGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICgkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpICE9IG51bGxcbiAgICAgICAgICAgICAgICAmJiAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLmNzcygnb3BhY2l0eScpID09IDEpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgUHJlemkgZGlhbG9nLCBmcm9tIHdoaWNoIHRoZSB1c2VyIGNvdWxkIGNob29zZSBhIHByZXNlbnRhdGlvblxuICAgICAqIHRvIGxvYWQuXG4gICAgICovXG4gICAgb3BlblByZXppRGlhbG9nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15cHJlemkgPSBjb25uZWN0aW9uLmVtdWMuZ2V0UHJlemkoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCk7XG4gICAgICAgIGlmIChteXByZXppKSB7XG4gICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKFwiUmVtb3ZlIFByZXppXCIsXG4gICAgICAgICAgICAgICAgXCJBcmUgeW91IHN1cmUgeW91IHdvdWxkIGxpa2UgdG8gcmVtb3ZlIHlvdXIgUHJlemk/XCIsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJSZW1vdmVcIixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlLHYsbSxmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5yZW1vdmVQcmV6aUZyb21QcmVzZW5jZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5lbXVjLnNlbmRQcmVzZW5jZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV6aVBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKFwiU2hhcmUgYSBQcmV6aVwiLFxuICAgICAgICAgICAgICAgIFwiQW5vdGhlciBwYXJ0aWNpcGFudCBpcyBhbHJlYWR5IHNoYXJpbmcgYSBQcmV6aS5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiVGhpcyBjb25mZXJlbmNlIGFsbG93cyBvbmx5IG9uZSBQcmV6aSBhdCBhIHRpbWUuXCIsXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgXCJPa1wiLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGUsdixtLGYpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9wZW5QcmV6aVN0YXRlID0ge1xuICAgICAgICAgICAgICAgIHN0YXRlMDoge1xuICAgICAgICAgICAgICAgICAgICBodG1sOiAgICc8aDI+U2hhcmUgYSBQcmV6aTwvaDI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCBpZD1cInByZXppVXJsXCIgdHlwZT1cInRleHRcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAncGxhY2Vob2xkZXI9XCJlLmcuICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdodHRwOi8vcHJlemkuY29tL3d6N3ZoanljbDdlNi9teS1wcmV6aVwiIGF1dG9mb2N1cz4nLFxuICAgICAgICAgICAgICAgICAgICBwZXJzaXN0ZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogeyBcIlNoYXJlXCI6IHRydWUgLCBcIkNhbmNlbFwiOiBmYWxzZX0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRCdXR0b246IDEsXG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdDogZnVuY3Rpb24oZSx2LG0sZil7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZih2KVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV6aVVybCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV6aVVybCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXppVXJsLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVybFZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IGVuY29kZVVSSShVdGlsLmVzY2FwZUh0bWwocHJlemlVcmwudmFsdWUpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXJsVmFsdWUuaW5kZXhPZignaHR0cDovL3ByZXppLmNvbS8nKSAhPSAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB1cmxWYWx1ZS5pbmRleE9mKCdodHRwczovL3ByZXppLmNvbS8nKSAhPSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5nb1RvU3RhdGUoJ3N0YXRlMScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXNJZFRtcCA9IHVybFZhbHVlLnN1YnN0cmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsVmFsdWUuaW5kZXhPZihcInByZXppLmNvbS9cIikgKyAxMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzQWxwaGFudW1lcmljKHByZXNJZFRtcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgcHJlc0lkVG1wLmluZGV4T2YoJy8nKSA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5nb1RvU3RhdGUoJ3N0YXRlMScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Y1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkUHJlemlUb1ByZXNlbmNlKHVybFZhbHVlLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuc2VuZFByZXNlbmNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGF0ZTE6IHtcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogICAnPGgyPlNoYXJlIGEgUHJlemk8L2gyPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQbGVhc2UgcHJvdmlkZSBhIGNvcnJlY3QgcHJlemkgbGluay4nLFxuICAgICAgICAgICAgICAgICAgICBwZXJzaXN0ZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uczogeyBcIkJhY2tcIjogdHJ1ZSwgXCJDYW5jZWxcIjogZmFsc2UgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdEJ1dHRvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0OmZ1bmN0aW9uKGUsdixtLGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHY9PTApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5wcm9tcHQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnByb21wdC5nb1RvU3RhdGUoJ3N0YXRlMCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBmb2N1c1ByZXppVXJsID0gIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ByZXppVXJsJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlbkRpYWxvZ1dpdGhTdGF0ZXMob3BlblByZXppU3RhdGUsIGZvY3VzUHJlemlVcmwsIGZvY3VzUHJlemlVcmwpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuXG4vKipcbiAqIEEgbmV3IHByZXNlbnRhdGlvbiBoYXMgYmVlbiBhZGRlZC5cbiAqXG4gKiBAcGFyYW0gZXZlbnQgdGhlIGV2ZW50IGluZGljYXRpbmcgdGhlIGFkZCBvZiBhIHByZXNlbnRhdGlvblxuICogQHBhcmFtIGppZCB0aGUgamlkIGZyb20gd2hpY2ggdGhlIHByZXNlbnRhdGlvbiB3YXMgYWRkZWRcbiAqIEBwYXJhbSBwcmVzVXJsIHVybCBvZiB0aGUgcHJlc2VudGF0aW9uXG4gKiBAcGFyYW0gY3VycmVudFNsaWRlIHRoZSBjdXJyZW50IHNsaWRlIHRvIHdoaWNoIHdlIHNob3VsZCBtb3ZlXG4gKi9cbmZ1bmN0aW9uIHByZXNlbnRhdGlvbkFkZGVkKGV2ZW50LCBqaWQsIHByZXNVcmwsIGN1cnJlbnRTbGlkZSkge1xuICAgIGNvbnNvbGUubG9nKFwicHJlc2VudGF0aW9uIGFkZGVkXCIsIHByZXNVcmwpO1xuXG4gICAgdmFyIHByZXNJZCA9IGdldFByZXNlbnRhdGlvbklkKHByZXNVcmwpO1xuXG4gICAgdmFyIGVsZW1lbnRJZCA9ICdwYXJ0aWNpcGFudF8nXG4gICAgICAgICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKVxuICAgICAgICArICdfJyArIHByZXNJZDtcblxuICAgIC8vIFdlIGV4cGxpY2l0bHkgZG9uJ3Qgc3BlY2lmeSB0aGUgcGVlciBqaWQgaGVyZSwgYmVjYXVzZSB3ZSBkb24ndCB3YW50XG4gICAgLy8gdGhpcyB2aWRlbyB0byBiZSBkZWFsdCB3aXRoIGFzIGEgcGVlciByZWxhdGVkIG9uZSAoZm9yIGV4YW1wbGUgd2VcbiAgICAvLyBkb24ndCB3YW50IHRvIHNob3cgYSBtdXRlL2tpY2sgbWVudSBmb3IgdGhpcyBvbmUsIGV0Yy4pLlxuICAgIFZpZGVvTGF5b3V0LmFkZFJlbW90ZVZpZGVvQ29udGFpbmVyKG51bGwsIGVsZW1lbnRJZCk7XG4gICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuXG4gICAgdmFyIGNvbnRyb2xzRW5hYmxlZCA9IGZhbHNlO1xuICAgIGlmIChqaWQgPT09IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpXG4gICAgICAgIGNvbnRyb2xzRW5hYmxlZCA9IHRydWU7XG5cbiAgICBzZXRQcmVzZW50YXRpb25WaXNpYmxlKHRydWUpO1xuICAgICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykuaG92ZXIoXG4gICAgICAgIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKFByZXppLmlzUHJlc2VudGF0aW9uVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlbG9hZEJ1dHRvblJpZ2h0ID0gd2luZG93LmlubmVyV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgLSAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLm9mZnNldCgpLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgLSAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLndpZHRoKCk7XG5cbiAgICAgICAgICAgICAgICAkKCcjcmVsb2FkUHJlc2VudGF0aW9uJykuY3NzKHsgIHJpZ2h0OiByZWxvYWRCdXR0b25SaWdodCxcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTonaW5saW5lLWJsb2NrJ30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICghUHJlemkuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpXG4gICAgICAgICAgICAgICAgJCgnI3JlbG9hZFByZXNlbnRhdGlvbicpLmNzcyh7ZGlzcGxheTonbm9uZSd9KTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBlID0gZXZlbnQudG9FbGVtZW50IHx8IGV2ZW50LnJlbGF0ZWRUYXJnZXQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoZSAmJiBlLmlkICE9ICdyZWxvYWRQcmVzZW50YXRpb24nICYmIGUuaWQgIT0gJ2hlYWRlcicpXG4gICAgICAgICAgICAgICAgICAgICQoJyNyZWxvYWRQcmVzZW50YXRpb24nKS5jc3Moe2Rpc3BsYXk6J25vbmUnfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgcHJlemlQbGF5ZXIgPSBuZXcgUHJlemlQbGF5ZXIoXG4gICAgICAgICdwcmVzZW50YXRpb24nLFxuICAgICAgICB7cHJlemlJZDogcHJlc0lkLFxuICAgICAgICAgICAgd2lkdGg6IGdldFByZXNlbnRhdGlvbldpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQ6IGdldFByZXNlbnRhdGlvbkhlaWhndCgpLFxuICAgICAgICAgICAgY29udHJvbHM6IGNvbnRyb2xzRW5hYmxlZCxcbiAgICAgICAgICAgIGRlYnVnOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgJCgnI3ByZXNlbnRhdGlvbj5pZnJhbWUnKS5hdHRyKCdpZCcsIHByZXppUGxheWVyLm9wdGlvbnMucHJlemlJZCk7XG5cbiAgICBwcmV6aVBsYXllci5vbihQcmV6aVBsYXllci5FVkVOVF9TVEFUVVMsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJlemkgc3RhdHVzXCIsIGV2ZW50LnZhbHVlKTtcbiAgICAgICAgaWYgKGV2ZW50LnZhbHVlID09IFByZXppUGxheWVyLlNUQVRVU19DT05URU5UX1JFQURZKSB7XG4gICAgICAgICAgICBpZiAoamlkICE9IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpXG4gICAgICAgICAgICAgICAgcHJlemlQbGF5ZXIuZmx5VG9TdGVwKGN1cnJlbnRTbGlkZSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHByZXppUGxheWVyLm9uKFByZXppUGxheWVyLkVWRU5UX0NVUlJFTlRfU1RFUCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJldmVudCB2YWx1ZVwiLCBldmVudC52YWx1ZSk7XG4gICAgICAgIGNvbm5lY3Rpb24uZW11Yy5hZGRDdXJyZW50U2xpZGVUb1ByZXNlbmNlKGV2ZW50LnZhbHVlKTtcbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLnNlbmRQcmVzZW5jZSgpO1xuICAgIH0pO1xuXG4gICAgJChcIiNcIiArIGVsZW1lbnRJZCkuY3NzKCAnYmFja2dyb3VuZC1pbWFnZScsXG4gICAgICAgICd1cmwoLi4vaW1hZ2VzL2F2YXRhcnByZXppLnBuZyknKTtcbiAgICAkKFwiI1wiICsgZWxlbWVudElkKS5jbGljayhcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0UHJlc2VudGF0aW9uVmlzaWJsZSh0cnVlKTtcbiAgICAgICAgfVxuICAgICk7XG59O1xuXG4vKipcbiAqIEEgcHJlc2VudGF0aW9uIGhhcyBiZWVuIHJlbW92ZWQuXG4gKlxuICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCBpbmRpY2F0aW5nIHRoZSByZW1vdmUgb2YgYSBwcmVzZW50YXRpb25cbiAqIEBwYXJhbSBqaWQgdGhlIGppZCBmb3Igd2hpY2ggdGhlIHByZXNlbnRhdGlvbiB3YXMgcmVtb3ZlZFxuICogQHBhcmFtIHRoZSB1cmwgb2YgdGhlIHByZXNlbnRhdGlvblxuICovXG5mdW5jdGlvbiBwcmVzZW50YXRpb25SZW1vdmVkKGV2ZW50LCBqaWQsIHByZXNVcmwpIHtcbiAgICBjb25zb2xlLmxvZygncHJlc2VudGF0aW9uIHJlbW92ZWQnLCBwcmVzVXJsKTtcbiAgICB2YXIgcHJlc0lkID0gZ2V0UHJlc2VudGF0aW9uSWQocHJlc1VybCk7XG4gICAgc2V0UHJlc2VudGF0aW9uVmlzaWJsZShmYWxzZSk7XG4gICAgJCgnI3BhcnRpY2lwYW50XydcbiAgICAgICAgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpXG4gICAgICAgICsgJ18nICsgcHJlc0lkKS5yZW1vdmUoKTtcbiAgICAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpLnJlbW92ZSgpO1xuICAgIGlmIChwcmV6aVBsYXllciAhPSBudWxsKSB7XG4gICAgICAgIHByZXppUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgcHJlemlQbGF5ZXIgPSBudWxsO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgYW4gYWxwaGFudW1lcmljIHN0cmluZy5cbiAqIE5vdGUgdGhhdCBzb21lIHNwZWNpYWwgY2hhcmFjdGVycyBhcmUgYWxzbyBhbGxvd2VkICgtLCBfICwgLywgJiwgPywgPSwgOykgZm9yIHRoZVxuICogcHVycG9zZSBvZiBjaGVja2luZyBVUklzLlxuICovXG5mdW5jdGlvbiBpc0FscGhhbnVtZXJpYyh1bnNhZmVUZXh0KSB7XG4gICAgdmFyIHJlZ2V4ID0gL15bYS16MC05LV9cXC8mXFw/PTtdKyQvaTtcbiAgICByZXR1cm4gcmVnZXgudGVzdCh1bnNhZmVUZXh0KTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwcmVzZW50YXRpb24gaWQgZnJvbSB0aGUgZ2l2ZW4gdXJsLlxuICovXG5mdW5jdGlvbiBnZXRQcmVzZW50YXRpb25JZCAocHJlc1VybCkge1xuICAgIHZhciBwcmVzSWRUbXAgPSBwcmVzVXJsLnN1YnN0cmluZyhwcmVzVXJsLmluZGV4T2YoXCJwcmV6aS5jb20vXCIpICsgMTApO1xuICAgIHJldHVybiBwcmVzSWRUbXAuc3Vic3RyaW5nKDAsIHByZXNJZFRtcC5pbmRleE9mKCcvJykpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHByZXNlbnRhdGlvbiB3aWR0aC5cbiAqL1xuZnVuY3Rpb24gZ2V0UHJlc2VudGF0aW9uV2lkdGgoKSB7XG4gICAgdmFyIGF2YWlsYWJsZVdpZHRoID0gVUlVdGlsLmdldEF2YWlsYWJsZVZpZGVvV2lkdGgoKTtcbiAgICB2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gZ2V0UHJlc2VudGF0aW9uSGVpaGd0KCk7XG5cbiAgICB2YXIgYXNwZWN0UmF0aW8gPSAxNi4wIC8gOS4wO1xuICAgIGlmIChhdmFpbGFibGVIZWlnaHQgPCBhdmFpbGFibGVXaWR0aCAvIGFzcGVjdFJhdGlvKSB7XG4gICAgICAgIGF2YWlsYWJsZVdpZHRoID0gTWF0aC5mbG9vcihhdmFpbGFibGVIZWlnaHQgKiBhc3BlY3RSYXRpbyk7XG4gICAgfVxuICAgIHJldHVybiBhdmFpbGFibGVXaWR0aDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwcmVzZW50YXRpb24gaGVpZ2h0LlxuICovXG5mdW5jdGlvbiBnZXRQcmVzZW50YXRpb25IZWloZ3QoKSB7XG4gICAgdmFyIHJlbW90ZVZpZGVvcyA9ICQoJyNyZW1vdGVWaWRlb3MnKTtcbiAgICByZXR1cm4gd2luZG93LmlubmVySGVpZ2h0IC0gcmVtb3RlVmlkZW9zLm91dGVySGVpZ2h0KCk7XG59XG5cbi8qKlxuICogUmVzaXplcyB0aGUgcHJlc2VudGF0aW9uIGlmcmFtZS5cbiAqL1xuZnVuY3Rpb24gcmVzaXplKCkge1xuICAgIGlmICgkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpKSB7XG4gICAgICAgICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJykud2lkdGgoZ2V0UHJlc2VudGF0aW9uV2lkdGgoKSk7XG4gICAgICAgICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJykuaGVpZ2h0KGdldFByZXNlbnRhdGlvbkhlaWhndCgpKTtcbiAgICB9XG59XG5cbi8qKlxuICogU2hvd3MvaGlkZXMgYSBwcmVzZW50YXRpb24uXG4gKi9cbmZ1bmN0aW9uIHNldFByZXNlbnRhdGlvblZpc2libGUodmlzaWJsZSkge1xuICAgIHZhciBwcmV6aSA9ICQoJyNwcmVzZW50YXRpb24+aWZyYW1lJyk7XG4gICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgLy8gVHJpZ2dlciB0aGUgdmlkZW8uc2VsZWN0ZWQgZXZlbnQgdG8gaW5kaWNhdGUgYSBjaGFuZ2UgaW4gdGhlXG4gICAgICAgIC8vIGxhcmdlIHZpZGVvLlxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwidmlkZW8uc2VsZWN0ZWRcIiwgW3RydWVdKTtcblxuICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmZhZGVPdXQoMzAwKTtcbiAgICAgICAgcHJlemkuZmFkZUluKDMwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwcmV6aS5jc3Moe29wYWNpdHk6JzEnfSk7XG4gICAgICAgICAgICBUb29sYmFyVG9nZ2xlci5kb2NrVG9vbGJhcih0cnVlKTtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNldExhcmdlVmlkZW9WaXNpYmxlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJyNhY3RpdmVTcGVha2VyJykuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHByZXppLmNzcygnb3BhY2l0eScpID09ICcxJykge1xuICAgICAgICAgICAgcHJlemkuZmFkZU91dCgzMDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcmV6aS5jc3Moe29wYWNpdHk6JzAnfSk7XG4gICAgICAgICAgICAgICAgJCgnI3JlbG9hZFByZXNlbnRhdGlvbicpLmNzcyh7ZGlzcGxheTonbm9uZSd9KTtcbiAgICAgICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmZhZGVJbigzMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zZXRMYXJnZVZpZGVvVmlzaWJsZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgVG9vbGJhclRvZ2dsZXIuZG9ja1Rvb2xiYXIoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogUHJlc2VudGF0aW9uIGhhcyBiZWVuIHJlbW92ZWQuXG4gKi9cbiQoZG9jdW1lbnQpLmJpbmQoJ3ByZXNlbnRhdGlvbnJlbW92ZWQubXVjJywgcHJlc2VudGF0aW9uUmVtb3ZlZCk7XG5cbi8qKlxuICogUHJlc2VudGF0aW9uIGhhcyBiZWVuIGFkZGVkLlxuICovXG4kKGRvY3VtZW50KS5iaW5kKCdwcmVzZW50YXRpb25hZGRlZC5tdWMnLCBwcmVzZW50YXRpb25BZGRlZCk7XG5cbi8qXG4gKiBJbmRpY2F0ZXMgcHJlc2VudGF0aW9uIHNsaWRlIGNoYW5nZS5cbiAqL1xuJChkb2N1bWVudCkuYmluZCgnZ290b3NsaWRlLm11YycsIGZ1bmN0aW9uIChldmVudCwgamlkLCBwcmVzVXJsLCBjdXJyZW50KSB7XG4gICAgaWYgKHByZXppUGxheWVyICYmIHByZXppUGxheWVyLmdldEN1cnJlbnRTdGVwKCkgIT0gY3VycmVudCkge1xuICAgICAgICBwcmV6aVBsYXllci5mbHlUb1N0ZXAoY3VycmVudCk7XG5cbiAgICAgICAgdmFyIGFuaW1hdGlvblN0ZXBzQXJyYXkgPSBwcmV6aVBsYXllci5nZXRBbmltYXRpb25Db3VudE9uU3RlcHMoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzZUludChhbmltYXRpb25TdGVwc0FycmF5W2N1cnJlbnRdKTsgaSsrKSB7XG4gICAgICAgICAgICBwcmV6aVBsYXllci5mbHlUb1N0ZXAoY3VycmVudCwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuLyoqXG4gKiBPbiB2aWRlbyBzZWxlY3RlZCBldmVudC5cbiAqL1xuJChkb2N1bWVudCkuYmluZCgndmlkZW8uc2VsZWN0ZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGlzUHJlc2VudGF0aW9uKSB7XG4gICAgaWYgKCFpc1ByZXNlbnRhdGlvbiAmJiAkKCcjcHJlc2VudGF0aW9uPmlmcmFtZScpKSB7XG4gICAgICAgIHNldFByZXNlbnRhdGlvblZpc2libGUoZmFsc2UpO1xuICAgIH1cbn0pO1xuXG4kKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICByZXNpemUoKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByZXppO1xuIiwidmFyIENoYXQgPSByZXF1aXJlKFwiLi9jaGF0L0NoYXRcIik7XG52YXIgQ29udGFjdExpc3QgPSByZXF1aXJlKFwiLi9jb250YWN0bGlzdC9Db250YWN0TGlzdFwiKTtcbnZhciBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuL3NldHRpbmdzL1NldHRpbmdzXCIpO1xudmFyIFNldHRpbmdzTWVudSA9IHJlcXVpcmUoXCIuL3NldHRpbmdzL1NldHRpbmdzTWVudVwiKTtcbnZhciBWaWRlb0xheW91dCA9IHJlcXVpcmUoXCIuLi92aWRlb2xheW91dC9WaWRlb0xheW91dFwiKTtcbnZhciBUb29sYmFyVG9nZ2xlciA9IHJlcXVpcmUoXCIuLi90b29sYmFycy9Ub29sYmFyVG9nZ2xlclwiKTtcblxuLyoqXG4gKiBUb2dnbGVyIGZvciB0aGUgY2hhdCwgY29udGFjdCBsaXN0LCBzZXR0aW5ncyBtZW51LCBldGMuLlxuICovXG52YXIgUGFuZWxUb2dnbGVyID0gKGZ1bmN0aW9uKG15KSB7XG5cbiAgICB2YXIgY3VycmVudGx5T3BlbiA9IG51bGw7XG4gICAgdmFyIGJ1dHRvbnMgPSB7XG4gICAgICAgICcjY2hhdHNwYWNlJzogJyNjaGF0Qm90dG9tQnV0dG9uJyxcbiAgICAgICAgJyNjb250YWN0bGlzdCc6ICcjY29udGFjdExpc3RCdXR0b24nLFxuICAgICAgICAnI3NldHRpbmdzbWVudSc6ICcjc2V0dGluZ3NCdXR0b24nXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlc2l6ZXMgdGhlIHZpZGVvIGFyZWFcbiAgICAgKiBAcGFyYW0gaXNDbG9zaW5nIHdoZXRoZXIgdGhlIHNpZGUgcGFuZWwgaXMgZ29pbmcgdG8gYmUgY2xvc2VkIG9yIGlzIGdvaW5nIHRvIG9wZW4gLyByZW1haW4gb3BlbmVkXG4gICAgICogQHBhcmFtIGNvbXBsZXRlRnVuY3Rpb24gYSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgdmlkZW8gc3BhY2UgaXMgcmVzaXplZFxuICAgICAqL1xuICAgIHZhciByZXNpemVWaWRlb0FyZWEgPSBmdW5jdGlvbihpc0Nsb3NpbmcsIGNvbXBsZXRlRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIHZpZGVvc3BhY2UgPSAkKCcjdmlkZW9zcGFjZScpO1xuXG4gICAgICAgIHZhciBwYW5lbFNpemUgPSBpc0Nsb3NpbmcgPyBbMCwgMF0gOiBQYW5lbFRvZ2dsZXIuZ2V0UGFuZWxTaXplKCk7XG4gICAgICAgIHZhciB2aWRlb3NwYWNlV2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aCAtIHBhbmVsU2l6ZVswXTtcbiAgICAgICAgdmFyIHZpZGVvc3BhY2VIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHZhciB2aWRlb1NpemVcbiAgICAgICAgICAgID0gZ2V0VmlkZW9TaXplKG51bGwsIG51bGwsIHZpZGVvc3BhY2VXaWR0aCwgdmlkZW9zcGFjZUhlaWdodCk7XG4gICAgICAgIHZhciB2aWRlb1dpZHRoID0gdmlkZW9TaXplWzBdO1xuICAgICAgICB2YXIgdmlkZW9IZWlnaHQgPSB2aWRlb1NpemVbMV07XG4gICAgICAgIHZhciB2aWRlb1Bvc2l0aW9uID0gZ2V0VmlkZW9Qb3NpdGlvbih2aWRlb1dpZHRoLFxuICAgICAgICAgICAgdmlkZW9IZWlnaHQsXG4gICAgICAgICAgICB2aWRlb3NwYWNlV2lkdGgsXG4gICAgICAgICAgICB2aWRlb3NwYWNlSGVpZ2h0KTtcbiAgICAgICAgdmFyIGhvcml6b250YWxJbmRlbnQgPSB2aWRlb1Bvc2l0aW9uWzBdO1xuICAgICAgICB2YXIgdmVydGljYWxJbmRlbnQgPSB2aWRlb1Bvc2l0aW9uWzFdO1xuXG4gICAgICAgIHZhciB0aHVtYm5haWxTaXplID0gVmlkZW9MYXlvdXQuY2FsY3VsYXRlVGh1bWJuYWlsU2l6ZSh2aWRlb3NwYWNlV2lkdGgpO1xuICAgICAgICB2YXIgdGh1bWJuYWlsc1dpZHRoID0gdGh1bWJuYWlsU2l6ZVswXTtcbiAgICAgICAgdmFyIHRodW1ibmFpbHNIZWlnaHQgPSB0aHVtYm5haWxTaXplWzFdO1xuICAgICAgICAvL2ZvciBjaGF0XG5cbiAgICAgICAgdmlkZW9zcGFjZS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICByaWdodDogcGFuZWxTaXplWzBdLFxuICAgICAgICAgICAgICAgIHdpZHRoOiB2aWRlb3NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB2aWRlb3NwYWNlSGVpZ2h0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZUZ1bmN0aW9uXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zJykuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aHVtYm5haWxzSGVpZ2h0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRodW1ibmFpbHNIZWlnaHQsXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRodW1ibmFpbHNXaWR0aFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBxdWV1ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDUwMCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJyZW1vdGV2aWRlby5yZXNpemVkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBbdGh1bWJuYWlsc1dpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRodW1ibmFpbHNIZWlnaHRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAkKCcjbGFyZ2VWaWRlb0NvbnRhaW5lcicpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiB2aWRlb3NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB2aWRlb3NwYWNlSGVpZ2h0XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiB2aWRlb1dpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdmlkZW9IZWlnaHQsXG4gICAgICAgICAgICAgICAgdG9wOiB2ZXJ0aWNhbEluZGVudCxcbiAgICAgICAgICAgICAgICBib3R0b206IHZlcnRpY2FsSW5kZW50LFxuICAgICAgICAgICAgICAgIGxlZnQ6IGhvcml6b250YWxJbmRlbnQsXG4gICAgICAgICAgICAgICAgcmlnaHQ6IGhvcml6b250YWxJbmRlbnRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA1MDBcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGVzIHRoZSB3aW5kb3dzIGluIHRoZSBzaWRlIHBhbmVsXG4gICAgICogQHBhcmFtIG9iamVjdCB0aGUgd2luZG93IHRoYXQgc2hvdWxkIGJlIHNob3duXG4gICAgICogQHBhcmFtIHNlbGVjdG9yIHRoZSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnQgY29udGFpbmluZyB0aGUgcGFuZWxcbiAgICAgKiBAcGFyYW0gb25PcGVuQ29tcGxldGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBhbmVsIGlzIG9wZW5lZFxuICAgICAqIEBwYXJhbSBvbk9wZW4gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGlmIHRoZSB3aW5kb3cgaXMgZ29pbmcgdG8gYmUgb3BlbmVkXG4gICAgICogQHBhcmFtIG9uQ2xvc2UgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIGlmIHRoZSB3aW5kb3cgaXMgZ29pbmcgdG8gYmUgY2xvc2VkXG4gICAgICovXG4gICAgdmFyIHRvZ2dsZSA9IGZ1bmN0aW9uKG9iamVjdCwgc2VsZWN0b3IsIG9uT3BlbkNvbXBsZXRlLCBvbk9wZW4sIG9uQ2xvc2UpIHtcbiAgICAgICAgYnV0dG9uQ2xpY2soYnV0dG9uc1tzZWxlY3Rvcl0sIFwiYWN0aXZlXCIpO1xuXG4gICAgICAgIGlmIChvYmplY3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICQoXCIjdG9hc3QtY29udGFpbmVyXCIpLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICByaWdodDogJzVweCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHNlbGVjdG9yKS5oaWRlKFwic2xpZGVcIiwge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmKHR5cGVvZiBvbkNsb3NlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBvbkNsb3NlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGN1cnJlbnRseU9wZW4gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gVW5kb2NrIHRoZSB0b29sYmFyIHdoZW4gdGhlIGNoYXQgaXMgc2hvd24gYW5kIGlmIHdlJ3JlIGluIGFcbiAgICAgICAgICAgIC8vIHZpZGVvIG1vZGUuXG4gICAgICAgICAgICBpZiAoVmlkZW9MYXlvdXQuaXNMYXJnZVZpZGVvVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICAgICAgVG9vbGJhclRvZ2dsZXIuZG9ja1Rvb2xiYXIoZmFsc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjdXJyZW50bHlPcGVuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSAkKGN1cnJlbnRseU9wZW4pO1xuICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrKGJ1dHRvbnNbY3VycmVudGx5T3Blbl0sIFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnQuY3NzKCd6LWluZGV4JywgNCk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudC5jc3MoJ3otaW5kZXgnLCA1KTtcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkKFwiI3RvYXN0LWNvbnRhaW5lclwiKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IChQYW5lbFRvZ2dsZXIuZ2V0UGFuZWxTaXplKClbMF0gKyA1KSArICdweCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHNlbGVjdG9yKS5zaG93KFwic2xpZGVcIiwge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJyaWdodFwiLFxuICAgICAgICAgICAgICAgIHF1ZXVlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogNTAwLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBvbk9wZW5Db21wbGV0ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZih0eXBlb2Ygb25PcGVuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBvbk9wZW4oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudGx5T3BlbiA9IHNlbGVjdG9yO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wZW5zIC8gY2xvc2VzIHRoZSBjaGF0IGFyZWEuXG4gICAgICovXG4gICAgbXkudG9nZ2xlQ2hhdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hhdENvbXBsZXRlRnVuY3Rpb24gPSBDaGF0LmlzVmlzaWJsZSgpID9cbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge30gOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBDaGF0LnNjcm9sbENoYXRUb0JvdHRvbSgpO1xuICAgICAgICAgICAgJCgnI2NoYXRzcGFjZScpLnRyaWdnZXIoJ3Nob3duJyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmVzaXplVmlkZW9BcmVhKENoYXQuaXNWaXNpYmxlKCksIGNoYXRDb21wbGV0ZUZ1bmN0aW9uKTtcblxuICAgICAgICB0b2dnbGUoQ2hhdCxcbiAgICAgICAgICAgICcjY2hhdHNwYWNlJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBSZXF1ZXN0IHRoZSBmb2N1cyBpbiB0aGUgbmlja25hbWUgZmllbGQgb3IgdGhlIGNoYXQgaW5wdXQgZmllbGQuXG4gICAgICAgICAgICAgICAgaWYgKCQoJyNuaWNrbmFtZScpLmNzcygndmlzaWJpbGl0eScpID09PSAndmlzaWJsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnI25pY2tpbnB1dCcpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnI3VzZXJtc2cnKS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgQ2hhdC5yZXNpemVDaGF0LFxuICAgICAgICAgICAgbnVsbCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wZW5zIC8gY2xvc2VzIHRoZSBjb250YWN0IGxpc3QgYXJlYS5cbiAgICAgKi9cbiAgICBteS50b2dnbGVDb250YWN0TGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNvbXBsZXRlRnVuY3Rpb24gPSBDb250YWN0TGlzdC5pc1Zpc2libGUoKSA/XG4gICAgICAgICAgICBmdW5jdGlvbigpIHt9IDogZnVuY3Rpb24gKCkgeyAkKCcjY29udGFjdGxpc3QnKS50cmlnZ2VyKCdzaG93bicpO307XG4gICAgICAgIHJlc2l6ZVZpZGVvQXJlYShDb250YWN0TGlzdC5pc1Zpc2libGUoKSwgY29tcGxldGVGdW5jdGlvbik7XG5cbiAgICAgICAgdG9nZ2xlKENvbnRhY3RMaXN0LFxuICAgICAgICAgICAgJyNjb250YWN0bGlzdCcsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQ29udGFjdExpc3Quc2V0VmlzdWFsTm90aWZpY2F0aW9uKGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudWxsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3BlbnMgLyBjbG9zZXMgdGhlIHNldHRpbmdzIG1lbnVcbiAgICAgKi9cbiAgICBteS50b2dnbGVTZXR0aW5nc01lbnUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzaXplVmlkZW9BcmVhKFNldHRpbmdzTWVudS5pc1Zpc2libGUoKSwgZnVuY3Rpb24gKCl7fSk7XG4gICAgICAgIHRvZ2dsZShTZXR0aW5nc01lbnUsXG4gICAgICAgICAgICAnI3NldHRpbmdzbWVudScsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNldHRpbmdzID0gU2V0dGluZ3MuZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgICAkKCcjc2V0RGlzcGxheU5hbWUnKS5nZXQoMCkudmFsdWUgPSBzZXR0aW5ncy5kaXNwbGF5TmFtZTtcbiAgICAgICAgICAgICAgICAkKCcjc2V0RW1haWwnKS5nZXQoMCkudmFsdWUgPSBzZXR0aW5ncy5lbWFpbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudWxsKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgc2lkZSBwYW5lbC5cbiAgICAgKi9cbiAgICBteS5nZXRQYW5lbFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhdmFpbGFibGVIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXG4gICAgICAgIHZhciBwYW5lbFdpZHRoID0gMjAwO1xuICAgICAgICBpZiAoYXZhaWxhYmxlV2lkdGggKiAwLjIgPCAyMDApIHtcbiAgICAgICAgICAgIHBhbmVsV2lkdGggPSBhdmFpbGFibGVXaWR0aCAqIDAuMjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBbcGFuZWxXaWR0aCwgYXZhaWxhYmxlSGVpZ2h0XTtcbiAgICB9O1xuXG4gICAgbXkuaXNWaXNpYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAoQ2hhdC5pc1Zpc2libGUoKSB8fCBDb250YWN0TGlzdC5pc1Zpc2libGUoKSB8fCBTZXR0aW5nc01lbnUuaXNWaXNpYmxlKCkpO1xuICAgIH07XG5cbiAgICByZXR1cm4gbXk7XG5cbn0oUGFuZWxUb2dnbGVyIHx8IHt9KSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxUb2dnbGVyOyIsIi8qIGdsb2JhbCAkLCBVdGlsLCBjb25uZWN0aW9uLCBuaWNrbmFtZTp0cnVlLCBnZXRWaWRlb1NpemUsXG5nZXRWaWRlb1Bvc2l0aW9uLCBzaG93VG9vbGJhciAqL1xudmFyIFJlcGxhY2VtZW50ID0gcmVxdWlyZShcIi4vUmVwbGFjZW1lbnRcIik7XG52YXIgQ29tbWFuZHNQcm9jZXNzb3IgPSByZXF1aXJlKFwiLi9Db21tYW5kc1wiKTtcbnZhciBUb29sYmFyVG9nZ2xlciA9IHJlcXVpcmUoXCIuLi8uLi90b29sYmFycy9Ub29sYmFyVG9nZ2xlclwiKTtcbnZhciBzbWlsZXlzID0gcmVxdWlyZShcIi4vc21pbGV5cy5qc29uXCIpLnNtaWxleXM7XG5cbnZhciBub3RpZmljYXRpb25JbnRlcnZhbCA9IGZhbHNlO1xudmFyIHVucmVhZE1lc3NhZ2VzID0gMDtcblxuXG4vKipcbiAqIFNob3dzL2hpZGVzIGEgdmlzdWFsIG5vdGlmaWNhdGlvbiwgaW5kaWNhdGluZyB0aGF0IGEgbWVzc2FnZSBoYXMgYXJyaXZlZC5cbiAqL1xuZnVuY3Rpb24gc2V0VmlzdWFsTm90aWZpY2F0aW9uKHNob3cpIHtcbiAgICB2YXIgdW5yZWFkTXNnRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1bnJlYWRNZXNzYWdlcycpO1xuICAgIHZhciB1bnJlYWRNc2dCb3R0b21FbGVtZW50XG4gICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JvdHRvbVVucmVhZE1lc3NhZ2VzJyk7XG5cbiAgICB2YXIgZ2xvd2VyID0gJCgnI2NoYXRCdXR0b24nKTtcbiAgICB2YXIgYm90dG9tR2xvd2VyID0gJCgnI2NoYXRCb3R0b21CdXR0b24nKTtcblxuICAgIGlmICh1bnJlYWRNZXNzYWdlcykge1xuICAgICAgICB1bnJlYWRNc2dFbGVtZW50LmlubmVySFRNTCA9IHVucmVhZE1lc3NhZ2VzLnRvU3RyaW5nKCk7XG4gICAgICAgIHVucmVhZE1zZ0JvdHRvbUVsZW1lbnQuaW5uZXJIVE1MID0gdW5yZWFkTWVzc2FnZXMudG9TdHJpbmcoKTtcblxuICAgICAgICBUb29sYmFyVG9nZ2xlci5kb2NrVG9vbGJhcih0cnVlKTtcblxuICAgICAgICB2YXIgY2hhdEJ1dHRvbkVsZW1lbnRcbiAgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXRCdXR0b24nKS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgbGVmdEluZGVudCA9IChVdGlsLmdldFRleHRXaWR0aChjaGF0QnV0dG9uRWxlbWVudCkgLVxuICAgICAgICAgICAgVXRpbC5nZXRUZXh0V2lkdGgodW5yZWFkTXNnRWxlbWVudCkpIC8gMjtcbiAgICAgICAgdmFyIHRvcEluZGVudCA9IChVdGlsLmdldFRleHRIZWlnaHQoY2hhdEJ1dHRvbkVsZW1lbnQpIC1cbiAgICAgICAgICAgIFV0aWwuZ2V0VGV4dEhlaWdodCh1bnJlYWRNc2dFbGVtZW50KSkgLyAyIC0gMztcblxuICAgICAgICB1bnJlYWRNc2dFbGVtZW50LnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgJ3RvcDonICsgdG9wSW5kZW50ICtcbiAgICAgICAgICAgICAgICAnOyBsZWZ0OicgKyBsZWZ0SW5kZW50ICsgJzsnKTtcblxuICAgICAgICB2YXIgY2hhdEJvdHRvbUJ1dHRvbkVsZW1lbnRcbiAgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXRCb3R0b21CdXR0b24nKS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgYm90dG9tTGVmdEluZGVudCA9IChVdGlsLmdldFRleHRXaWR0aChjaGF0Qm90dG9tQnV0dG9uRWxlbWVudCkgLVxuICAgICAgICAgICAgVXRpbC5nZXRUZXh0V2lkdGgodW5yZWFkTXNnQm90dG9tRWxlbWVudCkpIC8gMjtcbiAgICAgICAgdmFyIGJvdHRvbVRvcEluZGVudCA9IChVdGlsLmdldFRleHRIZWlnaHQoY2hhdEJvdHRvbUJ1dHRvbkVsZW1lbnQpIC1cbiAgICAgICAgICAgIFV0aWwuZ2V0VGV4dEhlaWdodCh1bnJlYWRNc2dCb3R0b21FbGVtZW50KSkgLyAyIC0gMjtcblxuICAgICAgICB1bnJlYWRNc2dCb3R0b21FbGVtZW50LnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdzdHlsZScsXG4gICAgICAgICAgICAgICAgJ3RvcDonICsgYm90dG9tVG9wSW5kZW50ICtcbiAgICAgICAgICAgICAgICAnOyBsZWZ0OicgKyBib3R0b21MZWZ0SW5kZW50ICsgJzsnKTtcblxuXG4gICAgICAgIGlmICghZ2xvd2VyLmhhc0NsYXNzKCdpY29uLWNoYXQtc2ltcGxlJykpIHtcbiAgICAgICAgICAgIGdsb3dlci5yZW1vdmVDbGFzcygnaWNvbi1jaGF0Jyk7XG4gICAgICAgICAgICBnbG93ZXIuYWRkQ2xhc3MoJ2ljb24tY2hhdC1zaW1wbGUnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdW5yZWFkTXNnRWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgdW5yZWFkTXNnQm90dG9tRWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgZ2xvd2VyLnJlbW92ZUNsYXNzKCdpY29uLWNoYXQtc2ltcGxlJyk7XG4gICAgICAgIGdsb3dlci5hZGRDbGFzcygnaWNvbi1jaGF0Jyk7XG4gICAgfVxuXG4gICAgaWYgKHNob3cgJiYgIW5vdGlmaWNhdGlvbkludGVydmFsKSB7XG4gICAgICAgIG5vdGlmaWNhdGlvbkludGVydmFsID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdsb3dlci50b2dnbGVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICBib3R0b21HbG93ZXIudG9nZ2xlQ2xhc3MoJ2FjdGl2ZSBnbG93aW5nJyk7XG4gICAgICAgIH0sIDgwMCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKCFzaG93ICYmIG5vdGlmaWNhdGlvbkludGVydmFsKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKG5vdGlmaWNhdGlvbkludGVydmFsKTtcbiAgICAgICAgbm90aWZpY2F0aW9uSW50ZXJ2YWwgPSBmYWxzZTtcbiAgICAgICAgZ2xvd2VyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgYm90dG9tR2xvd2VyLnJlbW92ZUNsYXNzKCdnbG93aW5nJyk7XG4gICAgICAgIGJvdHRvbUdsb3dlci5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfVxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCB0aW1lIGluIHRoZSBmb3JtYXQgaXQgaXMgc2hvd24gdG8gdGhlIHVzZXJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldEN1cnJlbnRUaW1lKCkge1xuICAgIHZhciBub3cgICAgID0gbmV3IERhdGUoKTtcbiAgICB2YXIgaG91ciAgICA9IG5vdy5nZXRIb3VycygpO1xuICAgIHZhciBtaW51dGUgID0gbm93LmdldE1pbnV0ZXMoKTtcbiAgICB2YXIgc2Vjb25kICA9IG5vdy5nZXRTZWNvbmRzKCk7XG4gICAgaWYoaG91ci50b1N0cmluZygpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBob3VyID0gJzAnK2hvdXI7XG4gICAgfVxuICAgIGlmKG1pbnV0ZS50b1N0cmluZygpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBtaW51dGUgPSAnMCcrbWludXRlO1xuICAgIH1cbiAgICBpZihzZWNvbmQudG9TdHJpbmcoKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgc2Vjb25kID0gJzAnK3NlY29uZDtcbiAgICB9XG4gICAgcmV0dXJuIGhvdXIrJzonK21pbnV0ZSsnOicrc2Vjb25kO1xufVxuXG5mdW5jdGlvbiB0b2dnbGVTbWlsZXlzKClcbntcbiAgICB2YXIgc21pbGV5cyA9ICQoJyNzbWlsZXlzQ29udGFpbmVyJyk7XG4gICAgaWYoIXNtaWxleXMuaXMoJzp2aXNpYmxlJykpIHtcbiAgICAgICAgc21pbGV5cy5zaG93KFwic2xpZGVcIiwgeyBkaXJlY3Rpb246IFwiZG93blwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc21pbGV5cy5oaWRlKFwic2xpZGVcIiwgeyBkaXJlY3Rpb246IFwiZG93blwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgfVxuICAgICQoJyN1c2VybXNnJykuZm9jdXMoKTtcbn1cblxuZnVuY3Rpb24gYWRkQ2xpY2tGdW5jdGlvbihzbWlsZXksIG51bWJlcikge1xuICAgIHNtaWxleS5vbmNsaWNrID0gZnVuY3Rpb24gYWRkU21pbGV5VG9NZXNzYWdlKCkge1xuICAgICAgICB2YXIgdXNlcm1zZyA9ICQoJyN1c2VybXNnJyk7XG4gICAgICAgIHZhciBtZXNzYWdlID0gdXNlcm1zZy52YWwoKTtcbiAgICAgICAgbWVzc2FnZSArPSBzbWlsZXlzWydzbWlsZXknICsgbnVtYmVyXTtcbiAgICAgICAgdXNlcm1zZy52YWwobWVzc2FnZSk7XG4gICAgICAgIHVzZXJtc2cuZ2V0KDApLnNldFNlbGVjdGlvblJhbmdlKG1lc3NhZ2UubGVuZ3RoLCBtZXNzYWdlLmxlbmd0aCk7XG4gICAgICAgIHRvZ2dsZVNtaWxleXMoKTtcbiAgICAgICAgdXNlcm1zZy5mb2N1cygpO1xuICAgIH07XG59XG5cbi8qKlxuICogQWRkcyB0aGUgc21pbGV5cyBjb250YWluZXIgdG8gdGhlIGNoYXRcbiAqL1xuZnVuY3Rpb24gYWRkU21pbGV5cygpIHtcbiAgICB2YXIgc21pbGV5c0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHNtaWxleXNDb250YWluZXIuaWQgPSAnc21pbGV5c0NvbnRhaW5lcic7XG4gICAgZm9yKHZhciBpID0gMTsgaSA8PSAyMTsgaSsrKSB7XG4gICAgICAgIHZhciBzbWlsZXlDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgc21pbGV5Q29udGFpbmVyLmlkID0gJ3NtaWxleScgKyBpO1xuICAgICAgICBzbWlsZXlDb250YWluZXIuY2xhc3NOYW1lID0gJ3NtaWxleUNvbnRhaW5lcic7XG4gICAgICAgIHZhciBzbWlsZXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgICAgc21pbGV5LnNyYyA9ICdpbWFnZXMvc21pbGV5cy9zbWlsZXknICsgaSArICcuc3ZnJztcbiAgICAgICAgc21pbGV5LmNsYXNzTmFtZSA9ICAnc21pbGV5JztcbiAgICAgICAgYWRkQ2xpY2tGdW5jdGlvbihzbWlsZXksIGkpO1xuICAgICAgICBzbWlsZXlDb250YWluZXIuYXBwZW5kQ2hpbGQoc21pbGV5KTtcbiAgICAgICAgc21pbGV5c0NvbnRhaW5lci5hcHBlbmRDaGlsZChzbWlsZXlDb250YWluZXIpO1xuICAgIH1cblxuICAgICQoXCIjY2hhdHNwYWNlXCIpLmFwcGVuZChzbWlsZXlzQ29udGFpbmVyKTtcbn1cblxuLyoqXG4gKiBSZXNpemVzIHRoZSBjaGF0IGNvbnZlcnNhdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVzaXplQ2hhdENvbnZlcnNhdGlvbigpIHtcbiAgICB2YXIgbXNnYXJlYUhlaWdodCA9ICQoJyN1c2VybXNnJykub3V0ZXJIZWlnaHQoKTtcbiAgICB2YXIgY2hhdHNwYWNlID0gJCgnI2NoYXRzcGFjZScpO1xuICAgIHZhciB3aWR0aCA9IGNoYXRzcGFjZS53aWR0aCgpO1xuICAgIHZhciBjaGF0ID0gJCgnI2NoYXRjb252ZXJzYXRpb24nKTtcbiAgICB2YXIgc21pbGV5cyA9ICQoJyNzbWlsZXlzYXJlYScpO1xuXG4gICAgc21pbGV5cy5oZWlnaHQobXNnYXJlYUhlaWdodCk7XG4gICAgJChcIiNzbWlsZXlzXCIpLmNzcygnYm90dG9tJywgKG1zZ2FyZWFIZWlnaHQgLSAyNikgLyAyKTtcbiAgICAkKCcjc21pbGV5c0NvbnRhaW5lcicpLmNzcygnYm90dG9tJywgbXNnYXJlYUhlaWdodCk7XG4gICAgY2hhdC53aWR0aCh3aWR0aCAtIDEwKTtcbiAgICBjaGF0LmhlaWdodCh3aW5kb3cuaW5uZXJIZWlnaHQgLSAxNSAtIG1zZ2FyZWFIZWlnaHQpO1xufVxuXG4vKipcbiAqIENoYXQgcmVsYXRlZCB1c2VyIGludGVyZmFjZS5cbiAqL1xudmFyIENoYXQgPSAoZnVuY3Rpb24gKG15KSB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgY2hhdCByZWxhdGVkIGludGVyZmFjZS5cbiAgICAgKi9cbiAgICBteS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3RvcmVkRGlzcGxheU5hbWUgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmRpc3BsYXluYW1lO1xuICAgICAgICBpZiAoc3RvcmVkRGlzcGxheU5hbWUpIHtcbiAgICAgICAgICAgIG5pY2tuYW1lID0gc3RvcmVkRGlzcGxheU5hbWU7XG5cbiAgICAgICAgICAgIENoYXQuc2V0Q2hhdENvbnZlcnNhdGlvbk1vZGUodHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcjbmlja2lucHV0Jykua2V5ZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IFV0aWwuZXNjYXBlSHRtbCh0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKCFuaWNrbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBuaWNrbmFtZSA9IHZhbDtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSA9IG5pY2tuYW1lO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5hZGREaXNwbGF5TmFtZVRvUHJlc2VuY2Uobmlja25hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuc2VuZFByZXNlbmNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgQ2hhdC5zZXRDaGF0Q29udmVyc2F0aW9uTW9kZSh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAkKCcjdXNlcm1zZycpLmtleWRvd24oZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgJCgnI3VzZXJtc2cnKS52YWwoJycpLnRyaWdnZXIoJ2F1dG9zaXplLnJlc2l6ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWFuZCA9IG5ldyBDb21tYW5kc1Byb2Nlc3Nvcih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgaWYoY29tbWFuZC5pc0NvbW1hbmQoKSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQucHJvY2Vzc0NvbW1hbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBVdGlsLmVzY2FwZUh0bWwodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuc2VuZE1lc3NhZ2UobWVzc2FnZSwgbmlja25hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIG9uVGV4dEFyZWFSZXNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNpemVDaGF0Q29udmVyc2F0aW9uKCk7XG4gICAgICAgICAgICBDaGF0LnNjcm9sbENoYXRUb0JvdHRvbSgpO1xuICAgICAgICB9O1xuICAgICAgICAkKCcjdXNlcm1zZycpLmF1dG9zaXplKHtjYWxsYmFjazogb25UZXh0QXJlYVJlc2l6ZX0pO1xuXG4gICAgICAgICQoXCIjY2hhdHNwYWNlXCIpLmJpbmQoXCJzaG93blwiLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVucmVhZE1lc3NhZ2VzID0gMDtcbiAgICAgICAgICAgICAgICBzZXRWaXN1YWxOb3RpZmljYXRpb24oZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgYWRkU21pbGV5cygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIHRoZSBnaXZlbiBtZXNzYWdlIHRvIHRoZSBjaGF0IGNvbnZlcnNhdGlvbi5cbiAgICAgKi9cbiAgICBteS51cGRhdGVDaGF0Q29udmVyc2F0aW9uID0gZnVuY3Rpb24gKGZyb20sIGRpc3BsYXlOYW1lLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciBkaXZDbGFzc05hbWUgPSAnJztcblxuICAgICAgICBpZiAoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCA9PT0gZnJvbSkge1xuICAgICAgICAgICAgZGl2Q2xhc3NOYW1lID0gXCJsb2NhbHVzZXJcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpdkNsYXNzTmFtZSA9IFwicmVtb3RldXNlclwiO1xuXG4gICAgICAgICAgICBpZiAoIUNoYXQuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgICAgICAgICB1bnJlYWRNZXNzYWdlcysrO1xuICAgICAgICAgICAgICAgIFV0aWwucGxheVNvdW5kTm90aWZpY2F0aW9uKCdjaGF0Tm90aWZpY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgc2V0VmlzdWFsTm90aWZpY2F0aW9uKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjZSBsaW5rcyBhbmQgc21pbGV5c1xuICAgICAgICAvLyBTdHJvcGhlIGFscmVhZHkgZXNjYXBlcyBzcGVjaWFsIHN5bWJvbHMgb24gc2VuZGluZyxcbiAgICAgICAgLy8gc28gd2UgZXNjYXBlIGhlcmUgb25seSB0YWdzIHRvIGF2b2lkIGRvdWJsZSAmYW1wO1xuICAgICAgICB2YXIgZXNjTWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvPC9nLCAnJmx0OycpLlxuICAgICAgICAgICAgcmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoL1xcbi9nLCAnPGJyLz4nKTtcbiAgICAgICAgdmFyIGVzY0Rpc3BsYXlOYW1lID0gVXRpbC5lc2NhcGVIdG1sKGRpc3BsYXlOYW1lKTtcbiAgICAgICAgbWVzc2FnZSA9IFJlcGxhY2VtZW50LnByb2Nlc3NSZXBsYWNlbWVudHMoZXNjTWVzc2FnZSk7XG5cbiAgICAgICAgdmFyIG1lc3NhZ2VDb250YWluZXIgPVxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjaGF0bWVzc2FnZVwiPicrXG4gICAgICAgICAgICAgICAgJzxpbWcgc3JjPVwiLi4vaW1hZ2VzL2NoYXRBcnJvdy5zdmdcIiBjbGFzcz1cImNoYXRBcnJvd1wiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidXNlcm5hbWUgJyArIGRpdkNsYXNzTmFtZSArJ1wiPicgKyBlc2NEaXNwbGF5TmFtZSArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgKyAnPGRpdiBjbGFzcz1cInRpbWVzdGFtcFwiPicgKyBnZXRDdXJyZW50VGltZSgpICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArICc8ZGl2IGNsYXNzPVwidXNlcm1lc3NhZ2VcIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nO1xuXG4gICAgICAgICQoJyNjaGF0Y29udmVyc2F0aW9uJykuYXBwZW5kKG1lc3NhZ2VDb250YWluZXIpO1xuICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpLmFuaW1hdGUoXG4gICAgICAgICAgICAgICAgeyBzY3JvbGxUb3A6ICQoJyNjaGF0Y29udmVyc2F0aW9uJylbMF0uc2Nyb2xsSGVpZ2h0fSwgMTAwMCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgZXJyb3IgbWVzc2FnZSB0byB0aGUgY29udmVyc2F0aW9uXG4gICAgICogQHBhcmFtIGVycm9yTWVzc2FnZSB0aGUgcmVjZWl2ZWQgZXJyb3IgbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0gb3JpZ2luYWxUZXh0IHRoZSBvcmlnaW5hbCBtZXNzYWdlLlxuICAgICAqL1xuICAgIG15LmNoYXRBZGRFcnJvciA9IGZ1bmN0aW9uKGVycm9yTWVzc2FnZSwgb3JpZ2luYWxUZXh0KVxuICAgIHtcbiAgICAgICAgZXJyb3JNZXNzYWdlID0gVXRpbC5lc2NhcGVIdG1sKGVycm9yTWVzc2FnZSk7XG4gICAgICAgIG9yaWdpbmFsVGV4dCA9IFV0aWwuZXNjYXBlSHRtbChvcmlnaW5hbFRleHQpO1xuXG4gICAgICAgICQoJyNjaGF0Y29udmVyc2F0aW9uJykuYXBwZW5kKFxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJlcnJvck1lc3NhZ2VcIj48Yj5FcnJvcjogPC9iPicgKyAnWW91ciBtZXNzYWdlJyArXG4gICAgICAgICAgICAob3JpZ2luYWxUZXh0PyAoJyBcXFwiJysgb3JpZ2luYWxUZXh0ICsgJ1xcXCInKSA6IFwiXCIpICtcbiAgICAgICAgICAgICcgd2FzIG5vdCBzZW50LicgK1xuICAgICAgICAgICAgKGVycm9yTWVzc2FnZT8gKCcgUmVhc29uOiAnICsgZXJyb3JNZXNzYWdlKSA6ICcnKSArICAnPC9kaXY+Jyk7XG4gICAgICAgICQoJyNjaGF0Y29udmVyc2F0aW9uJykuYW5pbWF0ZShcbiAgICAgICAgICAgIHsgc2Nyb2xsVG9wOiAkKCcjY2hhdGNvbnZlcnNhdGlvbicpWzBdLnNjcm9sbEhlaWdodH0sIDEwMDApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBzdWJqZWN0IHRvIHRoZSBVSVxuICAgICAqIEBwYXJhbSBzdWJqZWN0IHRoZSBzdWJqZWN0XG4gICAgICovXG4gICAgbXkuY2hhdFNldFN1YmplY3QgPSBmdW5jdGlvbihzdWJqZWN0KVxuICAgIHtcbiAgICAgICAgaWYoc3ViamVjdClcbiAgICAgICAgICAgIHN1YmplY3QgPSBzdWJqZWN0LnRyaW0oKTtcbiAgICAgICAgJCgnI3N1YmplY3QnKS5odG1sKFJlcGxhY2VtZW50LmxpbmtpZnkoVXRpbC5lc2NhcGVIdG1sKHN1YmplY3QpKSk7XG4gICAgICAgIGlmKHN1YmplY3QgPT09IFwiXCIpXG4gICAgICAgIHtcbiAgICAgICAgICAgICQoXCIjc3ViamVjdFwiKS5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICAkKFwiI3N1YmplY3RcIikuY3NzKHtkaXNwbGF5OiBcImJsb2NrXCJ9KTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY2hhdCBjb252ZXJzYXRpb24gbW9kZS5cbiAgICAgKi9cbiAgICBteS5zZXRDaGF0Q29udmVyc2F0aW9uTW9kZSA9IGZ1bmN0aW9uIChpc0NvbnZlcnNhdGlvbk1vZGUpIHtcbiAgICAgICAgaWYgKGlzQ29udmVyc2F0aW9uTW9kZSkge1xuICAgICAgICAgICAgJCgnI25pY2tuYW1lJykuY3NzKHt2aXNpYmlsaXR5OiAnaGlkZGVuJ30pO1xuICAgICAgICAgICAgJCgnI2NoYXRjb252ZXJzYXRpb24nKS5jc3Moe3Zpc2liaWxpdHk6ICd2aXNpYmxlJ30pO1xuICAgICAgICAgICAgJCgnI3VzZXJtc2cnKS5jc3Moe3Zpc2liaWxpdHk6ICd2aXNpYmxlJ30pO1xuICAgICAgICAgICAgJCgnI3NtaWxleXNhcmVhJykuY3NzKHt2aXNpYmlsaXR5OiAndmlzaWJsZSd9KTtcbiAgICAgICAgICAgICQoJyN1c2VybXNnJykuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRoZSBjaGF0IGFyZWEuXG4gICAgICovXG4gICAgbXkucmVzaXplQ2hhdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNoYXRTaXplID0gcmVxdWlyZShcIi4uL1NpZGVQYW5lbFRvZ2dsZXJcIikuZ2V0UGFuZWxTaXplKCk7XG5cbiAgICAgICAgJCgnI2NoYXRzcGFjZScpLndpZHRoKGNoYXRTaXplWzBdKTtcbiAgICAgICAgJCgnI2NoYXRzcGFjZScpLmhlaWdodChjaGF0U2l6ZVsxXSk7XG5cbiAgICAgICAgcmVzaXplQ2hhdENvbnZlcnNhdGlvbigpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNoYXQgaXMgY3VycmVudGx5IHZpc2libGUuXG4gICAgICovXG4gICAgbXkuaXNWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJCgnI2NoYXRzcGFjZScpLmlzKFwiOnZpc2libGVcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBTaG93cyBhbmQgaGlkZXMgdGhlIHdpbmRvdyB3aXRoIHRoZSBzbWlsZXlzXG4gICAgICovXG4gICAgbXkudG9nZ2xlU21pbGV5cyA9IHRvZ2dsZVNtaWxleXM7XG5cbiAgICAvKipcbiAgICAgKiBTY3JvbGxzIGNoYXQgdG8gdGhlIGJvdHRvbS5cbiAgICAgKi9cbiAgICBteS5zY3JvbGxDaGF0VG9Cb3R0b20gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpLnNjcm9sbFRvcChcbiAgICAgICAgICAgICAgICAkKCcjY2hhdGNvbnZlcnNhdGlvbicpWzBdLnNjcm9sbEhlaWdodCk7XG4gICAgICAgIH0sIDUpO1xuICAgIH07XG5cblxuICAgIHJldHVybiBteTtcbn0oQ2hhdCB8fCB7fSkpO1xubW9kdWxlLmV4cG9ydHMgPSBDaGF0OyIsIi8qKlxuICogTGlzdCB3aXRoIHN1cHBvcnRlZCBjb21tYW5kcy4gVGhlIGtleXMgYXJlIHRoZSBuYW1lcyBvZiB0aGUgY29tbWFuZHMgYW5kXG4gKiB0aGUgdmFsdWUgaXMgdGhlIGZ1bmN0aW9uIHRoYXQgcHJvY2Vzc2VzIHRoZSBtZXNzYWdlLlxuICogQHR5cGUge3tTdHJpbmc6IGZ1bmN0aW9ufX1cbiAqL1xudmFyIGNvbW1hbmRzID0ge1xuICAgIFwidG9waWNcIiA6IHByb2Nlc3NUb3BpY1xufTtcblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgY29tbWFuZCBmcm9tIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIG1lc3NhZ2UgdGhlIHJlY2VpdmVkIG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHRoZSBjb21tYW5kXG4gKi9cbmZ1bmN0aW9uIGdldENvbW1hbmQobWVzc2FnZSlcbntcbiAgICBpZihtZXNzYWdlKVxuICAgIHtcbiAgICAgICAgZm9yKHZhciBjb21tYW5kIGluIGNvbW1hbmRzKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZihtZXNzYWdlLmluZGV4T2YoXCIvXCIgKyBjb21tYW5kKSA9PSAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBjb21tYW5kO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIlwiO1xufTtcblxuLyoqXG4gKiBQcm9jZXNzZXMgdGhlIGRhdGEgZm9yIHRvcGljIGNvbW1hbmQuXG4gKiBAcGFyYW0gY29tbWFuZEFyZ3VtZW50cyB0aGUgYXJndW1lbnRzIG9mIHRoZSB0b3BpYyBjb21tYW5kLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzVG9waWMoY29tbWFuZEFyZ3VtZW50cylcbntcbiAgICB2YXIgdG9waWMgPSBVdGlsLmVzY2FwZUh0bWwoY29tbWFuZEFyZ3VtZW50cyk7XG4gICAgY29ubmVjdGlvbi5lbXVjLnNldFN1YmplY3QodG9waWMpO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgbmV3IENvbW1hbmRQcm9jY2Vzc29yIGluc3RhbmNlIGZyb20gYSBtZXNzYWdlIHRoYXRcbiAqIGhhbmRsZXMgY29tbWFuZHMgcmVjZWl2ZWQgdmlhIGNoYXQgbWVzc2FnZXMuXG4gKiBAcGFyYW0gbWVzc2FnZSB0aGUgbWVzc2FnZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbW1hbmRzUHJvY2Vzc29yKG1lc3NhZ2UpXG57XG5cblxuICAgIHZhciBjb21tYW5kID0gZ2V0Q29tbWFuZChtZXNzYWdlKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhlIGNvbW1hbmQuXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdGhlIGNvbW1hbmRcbiAgICAgKi9cbiAgICB0aGlzLmdldENvbW1hbmQgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICByZXR1cm4gY29tbWFuZDtcbiAgICB9O1xuXG5cbiAgICB2YXIgbWVzc2FnZUFyZ3VtZW50ID0gbWVzc2FnZS5zdWJzdHIoY29tbWFuZC5sZW5ndGggKyAyKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGFyZ3VtZW50cyBvZiB0aGUgY29tbWFuZC5cbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIHRoaXMuZ2V0QXJndW1lbnQgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICByZXR1cm4gbWVzc2FnZUFyZ3VtZW50O1xuICAgIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSBpcyB2YWxpZCBjb21tYW5kIG9yIG5vdC5cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5Db21tYW5kc1Byb2Nlc3Nvci5wcm90b3R5cGUuaXNDb21tYW5kID0gZnVuY3Rpb24oKVxue1xuICAgIGlmKHRoaXMuZ2V0Q29tbWFuZCgpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIFByb2Nlc3NlcyB0aGUgY29tbWFuZC5cbiAqL1xuQ29tbWFuZHNQcm9jZXNzb3IucHJvdG90eXBlLnByb2Nlc3NDb21tYW5kID0gZnVuY3Rpb24oKVxue1xuICAgIGlmKCF0aGlzLmlzQ29tbWFuZCgpKVxuICAgICAgICByZXR1cm47XG5cbiAgICBjb21tYW5kc1t0aGlzLmdldENvbW1hbmQoKV0odGhpcy5nZXRBcmd1bWVudCgpKTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21tYW5kc1Byb2Nlc3NvcjsiLCJ2YXIgU21pbGV5cyA9IHJlcXVpcmUoXCIuL3NtaWxleXMuanNvblwiKTtcbi8qKlxuICogUHJvY2Vzc2VzIGxpbmtzIGFuZCBzbWlsZXlzIGluIFwiYm9keVwiXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NSZXBsYWNlbWVudHMoYm9keSlcbntcbiAgICAvL21ha2UgbGlua3MgY2xpY2thYmxlXG4gICAgYm9keSA9IGxpbmtpZnkoYm9keSk7XG5cbiAgICAvL2FkZCBzbWlsZXlzXG4gICAgYm9keSA9IHNtaWxpZnkoYm9keSk7XG5cbiAgICByZXR1cm4gYm9keTtcbn1cblxuLyoqXG4gKiBGaW5kcyBhbmQgcmVwbGFjZXMgYWxsIGxpbmtzIGluIHRoZSBsaW5rcyBpbiBcImJvZHlcIlxuICogd2l0aCB0aGVpciA8YSBocmVmPVwiXCI+PC9hPlxuICovXG5mdW5jdGlvbiBsaW5raWZ5KGlucHV0VGV4dClcbntcbiAgICB2YXIgcmVwbGFjZWRUZXh0LCByZXBsYWNlUGF0dGVybjEsIHJlcGxhY2VQYXR0ZXJuMiwgcmVwbGFjZVBhdHRlcm4zO1xuXG4gICAgLy9VUkxzIHN0YXJ0aW5nIHdpdGggaHR0cDovLywgaHR0cHM6Ly8sIG9yIGZ0cDovL1xuICAgIHJlcGxhY2VQYXR0ZXJuMSA9IC8oXFxiKGh0dHBzP3xmdHApOlxcL1xcL1stQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2dpbTtcbiAgICByZXBsYWNlZFRleHQgPSBpbnB1dFRleHQucmVwbGFjZShyZXBsYWNlUGF0dGVybjEsICc8YSBocmVmPVwiJDFcIiB0YXJnZXQ9XCJfYmxhbmtcIj4kMTwvYT4nKTtcblxuICAgIC8vVVJMcyBzdGFydGluZyB3aXRoIFwid3d3LlwiICh3aXRob3V0IC8vIGJlZm9yZSBpdCwgb3IgaXQnZCByZS1saW5rIHRoZSBvbmVzIGRvbmUgYWJvdmUpLlxuICAgIHJlcGxhY2VQYXR0ZXJuMiA9IC8oXnxbXlxcL10pKHd3d1xcLltcXFNdKyhcXGJ8JCkpL2dpbTtcbiAgICByZXBsYWNlZFRleHQgPSByZXBsYWNlZFRleHQucmVwbGFjZShyZXBsYWNlUGF0dGVybjIsICckMTxhIGhyZWY9XCJodHRwOi8vJDJcIiB0YXJnZXQ9XCJfYmxhbmtcIj4kMjwvYT4nKTtcblxuICAgIC8vQ2hhbmdlIGVtYWlsIGFkZHJlc3NlcyB0byBtYWlsdG86OiBsaW5rcy5cbiAgICByZXBsYWNlUGF0dGVybjMgPSAvKChbYS16QS1aMC05XFwtXFxfXFwuXSkrQFthLXpBLVpcXF9dKz8oXFwuW2EtekEtWl17Miw2fSkrKS9naW07XG4gICAgcmVwbGFjZWRUZXh0ID0gcmVwbGFjZWRUZXh0LnJlcGxhY2UocmVwbGFjZVBhdHRlcm4zLCAnPGEgaHJlZj1cIm1haWx0bzokMVwiPiQxPC9hPicpO1xuXG4gICAgcmV0dXJuIHJlcGxhY2VkVGV4dDtcbn1cblxuLyoqXG4gKiBSZXBsYWNlcyBjb21tb24gc21pbGV5IHN0cmluZ3Mgd2l0aCBpbWFnZXNcbiAqL1xuZnVuY3Rpb24gc21pbGlmeShib2R5KVxue1xuICAgIGlmKCFib2R5KSB7XG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cblxuICAgIHZhciByZWdleHMgPSBTbWlsZXlzW1wicmVnZXhzXCJdO1xuICAgIGZvcih2YXIgc21pbGV5IGluIHJlZ2V4cykge1xuICAgICAgICBpZihyZWdleHMuaGFzT3duUHJvcGVydHkoc21pbGV5KSkge1xuICAgICAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZShyZWdleHNbc21pbGV5XSxcbiAgICAgICAgICAgICAgICAgICAgJzxpbWcgY2xhc3M9XCJzbWlsZXlcIiBzcmM9XCJpbWFnZXMvc21pbGV5cy8nICsgc21pbGV5ICsgJy5zdmdcIj4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBib2R5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBwcm9jZXNzUmVwbGFjZW1lbnRzOiBwcm9jZXNzUmVwbGFjZW1lbnRzLFxuICAgIGxpbmtpZnk6IGxpbmtpZnlcbn07XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJzbWlsZXlzXCI6IHtcbiAgICAgICAgXCJzbWlsZXkxXCI6IFwiOilcIixcbiAgICAgICAgXCJzbWlsZXkyXCI6IFwiOihcIixcbiAgICAgICAgXCJzbWlsZXkzXCI6IFwiOkRcIixcbiAgICAgICAgXCJzbWlsZXk0XCI6IFwiKHkpXCIsXG4gICAgICAgIFwic21pbGV5NVwiOiBcIiA6UFwiLFxuICAgICAgICBcInNtaWxleTZcIjogXCIod2F2ZSlcIixcbiAgICAgICAgXCJzbWlsZXk3XCI6IFwiKGJsdXNoKVwiLFxuICAgICAgICBcInNtaWxleThcIjogXCIoY2h1Y2tsZSlcIixcbiAgICAgICAgXCJzbWlsZXk5XCI6IFwiKHNob2NrZWQpXCIsXG4gICAgICAgIFwic21pbGV5MTBcIjogXCI6KlwiLFxuICAgICAgICBcInNtaWxleTExXCI6IFwiKG4pXCIsXG4gICAgICAgIFwic21pbGV5MTJcIjogXCIoc2VhcmNoKVwiLFxuICAgICAgICBcInNtaWxleTEzXCI6IFwiIDwzXCIsXG4gICAgICAgIFwic21pbGV5MTRcIjogXCIob29wcylcIixcbiAgICAgICAgXCJzbWlsZXkxNVwiOiBcIihhbmdyeSlcIixcbiAgICAgICAgXCJzbWlsZXkxNlwiOiBcIihhbmdlbClcIixcbiAgICAgICAgXCJzbWlsZXkxN1wiOiBcIihzaWNrKVwiLFxuICAgICAgICBcInNtaWxleTE4XCI6IFwiOyhcIixcbiAgICAgICAgXCJzbWlsZXkxOVwiOiBcIihib21iKVwiLFxuICAgICAgICBcInNtaWxleTIwXCI6IFwiKGNsYXApXCIsXG4gICAgICAgIFwic21pbGV5MjFcIjogXCIgOylcIlxuICAgIH0sXG4gICAgXCJyZWdleHNcIjoge1xuICAgICAgICBcInNtaWxleTJcIjogLyg6LVxcKFxcKHw6LVxcKHw6XFwoXFwofDpcXCh8XFwoc2FkXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkzXCI6IC8oOi1cXClcXCl8OlxcKVxcKXxcXChsb2xcXCl8Oi1EfDpEKS9naSxcbiAgICAgICAgXCJzbWlsZXkxXCI6IC8oOi1cXCl8OlxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5NFwiOiAvKFxcKHlcXCl8XFwoWVxcKXxcXChva1xcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5NVwiOiAvKDotUHw6UHw6LXB8OnApL2dpLFxuICAgICAgICBcInNtaWxleTZcIjogLyhcXCh3YXZlXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXk3XCI6IC8oXFwoYmx1c2hcXCkpL2dpLFxuICAgICAgICBcInNtaWxleThcIjogLyhcXChjaHVja2xlXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXk5XCI6IC8oOi0wfFxcKHNob2NrZWRcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTEwXCI6IC8oOi1cXCp8OlxcKnxcXChraXNzXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkxMVwiOiAvKFxcKG5cXCkpL2dpLFxuICAgICAgICBcInNtaWxleTEyXCI6IC8oXFwoc2VhcmNoXFwpKS9nLFxuICAgICAgICBcInNtaWxleTEzXCI6IC8oPDN8Jmx0OzN8JmFtcDtsdDszfFxcKExcXCl8XFwobFxcKXxcXChIXFwpfFxcKGhcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTE0XCI6IC8oXFwob29wc1xcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTVcIjogLyhcXChhbmdyeVxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTZcIjogLyhcXChhbmdlbFxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MTdcIjogLyhcXChzaWNrXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkxOFwiOiAvKDstXFwoXFwofDtcXChcXCh8Oy1cXCh8O1xcKHw6XCJcXCh8OlwiLVxcKHw6fi1cXCh8On5cXCh8XFwodXBzZXRcXCkpL2dpLFxuICAgICAgICBcInNtaWxleTE5XCI6IC8oXFwoYm9tYlxcKSkvZ2ksXG4gICAgICAgIFwic21pbGV5MjBcIjogLyhcXChjbGFwXFwpKS9naSxcbiAgICAgICAgXCJzbWlsZXkyMVwiOiAvKDstXFwpfDtcXCl8Oy1cXClcXCl8O1xcKVxcKXw7LUR8O0R8XFwod2lua1xcKSkvZ2lcbiAgICB9XG59XG4iLCJcbnZhciBudW1iZXJPZkNvbnRhY3RzID0gMDtcbnZhciBub3RpZmljYXRpb25JbnRlcnZhbDtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBudW1iZXIgb2YgcGFydGljaXBhbnRzIGluIHRoZSBjb250YWN0IGxpc3QgYnV0dG9uIGFuZCBzZXRzXG4gKiB0aGUgZ2xvd1xuICogQHBhcmFtIGRlbHRhIGluZGljYXRlcyB3aGV0aGVyIGEgbmV3IHVzZXIgaGFzIGpvaW5lZCAoMSkgb3Igc29tZW9uZSBoYXNcbiAqIGxlZnQoLTEpXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZU51bWJlck9mUGFydGljaXBhbnRzKGRlbHRhKSB7XG4gICAgLy93aGVuIHRoZSB1c2VyIGlzIGFsb25lIHdlIGRvbid0IHNob3cgdGhlIG51bWJlciBvZiBwYXJ0aWNpcGFudHNcbiAgICBpZihudW1iZXJPZkNvbnRhY3RzID09PSAwKSB7XG4gICAgICAgICQoXCIjbnVtYmVyT2ZQYXJ0aWNpcGFudHNcIikudGV4dCgnJyk7XG4gICAgICAgIG51bWJlck9mQ29udGFjdHMgKz0gZGVsdGE7XG4gICAgfSBlbHNlIGlmKG51bWJlck9mQ29udGFjdHMgIT09IDAgJiYgIUNvbnRhY3RMaXN0LmlzVmlzaWJsZSgpKSB7XG4gICAgICAgIENvbnRhY3RMaXN0LnNldFZpc3VhbE5vdGlmaWNhdGlvbih0cnVlKTtcbiAgICAgICAgbnVtYmVyT2ZDb250YWN0cyArPSBkZWx0YTtcbiAgICAgICAgJChcIiNudW1iZXJPZlBhcnRpY2lwYW50c1wiKS50ZXh0KG51bWJlck9mQ29udGFjdHMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBhdmF0YXIgZWxlbWVudC5cbiAqXG4gKiBAcmV0dXJuIHRoZSBuZXdseSBjcmVhdGVkIGF2YXRhciBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUF2YXRhcihpZCkge1xuICAgIHZhciBhdmF0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICBhdmF0YXIuY2xhc3NOYW1lID0gXCJpY29uLWF2YXRhciBhdmF0YXJcIjtcbiAgICBhdmF0YXIuc3JjID0gXCJodHRwczovL3d3dy5ncmF2YXRhci5jb20vYXZhdGFyL1wiICsgaWQgKyBcIj9kPXdhdmF0YXImc2l6ZT0zMFwiO1xuXG4gICAgcmV0dXJuIGF2YXRhcjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBkaXNwbGF5IG5hbWUgcGFyYWdyYXBoLlxuICpcbiAqIEBwYXJhbSBkaXNwbGF5TmFtZSB0aGUgZGlzcGxheSBuYW1lIHRvIHNldFxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXNwbGF5TmFtZVBhcmFncmFwaChkaXNwbGF5TmFtZSkge1xuICAgIHZhciBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIHAuaW5uZXJUZXh0ID0gZGlzcGxheU5hbWU7XG5cbiAgICByZXR1cm4gcDtcbn1cblxuXG4vKipcbiAqIEluZGljYXRlcyB0aGF0IHRoZSBkaXNwbGF5IG5hbWUgaGFzIGNoYW5nZWQuXG4gKi9cbiQoZG9jdW1lbnQpLmJpbmQoICAgJ2Rpc3BsYXluYW1lY2hhbmdlZCcsXG4gICAgZnVuY3Rpb24gKGV2ZW50LCBwZWVySmlkLCBkaXNwbGF5TmFtZSkge1xuICAgICAgICBpZiAocGVlckppZCA9PT0gJ2xvY2FsVmlkZW9Db250YWluZXInKVxuICAgICAgICAgICAgcGVlckppZCA9IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQ7XG5cbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCk7XG5cbiAgICAgICAgdmFyIGNvbnRhY3ROYW1lID0gJCgnI2NvbnRhY3RsaXN0ICMnICsgcmVzb3VyY2VKaWQgKyAnPnAnKTtcblxuICAgICAgICBpZiAoY29udGFjdE5hbWUgJiYgZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoID4gMClcbiAgICAgICAgICAgIGNvbnRhY3ROYW1lLmh0bWwoZGlzcGxheU5hbWUpO1xuICAgIH0pO1xuXG5cbmZ1bmN0aW9uIHN0b3BHbG93aW5nKGdsb3dlcikge1xuICAgIHdpbmRvdy5jbGVhckludGVydmFsKG5vdGlmaWNhdGlvbkludGVydmFsKTtcbiAgICBub3RpZmljYXRpb25JbnRlcnZhbCA9IGZhbHNlO1xuICAgIGdsb3dlci5yZW1vdmVDbGFzcygnZ2xvd2luZycpO1xuICAgIGlmICghQ29udGFjdExpc3QuaXNWaXNpYmxlKCkpIHtcbiAgICAgICAgZ2xvd2VyLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBDb250YWN0IGxpc3QuXG4gKi9cbnZhciBDb250YWN0TGlzdCA9IHtcbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNoYXQgaXMgY3VycmVudGx5IHZpc2libGUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIDx0dD50cnVlPC90dD4gaWYgdGhlIGNoYXQgaXMgY3VycmVudGx5IHZpc2libGUsIDx0dD5mYWxzZTwvdHQ+IC1cbiAgICAgKiBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBpc1Zpc2libGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICQoJyNjb250YWN0bGlzdCcpLmlzKFwiOnZpc2libGVcIik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBjb250YWN0IGZvciB0aGUgZ2l2ZW4gcGVlckppZCBpZiBzdWNoIGRvZXNuJ3QgeWV0IGV4aXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlZXJKaWQgdGhlIHBlZXJKaWQgY29ycmVzcG9uZGluZyB0byB0aGUgY29udGFjdFxuICAgICAqIEBwYXJhbSBpZCB0aGUgdXNlcidzIGVtYWlsIG9yIHVzZXJJZCB1c2VkIHRvIGdldCB0aGUgdXNlcidzIGF2YXRhclxuICAgICAqL1xuICAgIGVuc3VyZUFkZENvbnRhY3Q6IGZ1bmN0aW9uIChwZWVySmlkLCBpZCkge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKTtcblxuICAgICAgICB2YXIgY29udGFjdCA9ICQoJyNjb250YWN0bGlzdD51bD5saVtpZD1cIicgKyByZXNvdXJjZUppZCArICdcIl0nKTtcblxuICAgICAgICBpZiAoIWNvbnRhY3QgfHwgY29udGFjdC5sZW5ndGggPD0gMClcbiAgICAgICAgICAgIENvbnRhY3RMaXN0LmFkZENvbnRhY3QocGVlckppZCwgaWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgY29udGFjdCBmb3IgdGhlIGdpdmVuIHBlZXIgamlkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlZXJKaWQgdGhlIGppZCBvZiB0aGUgY29udGFjdCB0byBhZGRcbiAgICAgKiBAcGFyYW0gaWQgdGhlIGVtYWlsIG9yIHVzZXJJZCBvZiB0aGUgdXNlclxuICAgICAqL1xuICAgIGFkZENvbnRhY3Q6IGZ1bmN0aW9uIChwZWVySmlkLCBpZCkge1xuICAgICAgICB2YXIgcmVzb3VyY2VKaWQgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChwZWVySmlkKTtcblxuICAgICAgICB2YXIgY29udGFjdGxpc3QgPSAkKCcjY29udGFjdGxpc3Q+dWwnKTtcblxuICAgICAgICB2YXIgbmV3Q29udGFjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIG5ld0NvbnRhY3QuaWQgPSByZXNvdXJjZUppZDtcbiAgICAgICAgbmV3Q29udGFjdC5jbGFzc05hbWUgPSBcImNsaWNrYWJsZVwiO1xuICAgICAgICBuZXdDb250YWN0Lm9uY2xpY2sgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5jdXJyZW50VGFyZ2V0LmNsYXNzTmFtZSA9PT0gXCJjbGlja2FibGVcIikge1xuICAgICAgICAgICAgICAgICQoQ29udGFjdExpc3QpLnRyaWdnZXIoJ2NvbnRhY3RjbGlja2VkJywgW3BlZXJKaWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBuZXdDb250YWN0LmFwcGVuZENoaWxkKGNyZWF0ZUF2YXRhcihpZCkpO1xuICAgICAgICBuZXdDb250YWN0LmFwcGVuZENoaWxkKGNyZWF0ZURpc3BsYXlOYW1lUGFyYWdyYXBoKFwiUGFydGljaXBhbnRcIikpO1xuXG4gICAgICAgIHZhciBjbEVsZW1lbnQgPSBjb250YWN0bGlzdC5nZXQoMCk7XG5cbiAgICAgICAgaWYgKHJlc291cmNlSmlkID09PSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKVxuICAgICAgICAgICAgJiYgJCgnI2NvbnRhY3RsaXN0PnVsIC50aXRsZScpWzBdLm5leHRTaWJsaW5nLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICBjbEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5ld0NvbnRhY3QsXG4gICAgICAgICAgICAgICAgJCgnI2NvbnRhY3RsaXN0PnVsIC50aXRsZScpWzBdLm5leHRTaWJsaW5nLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsRWxlbWVudC5hcHBlbmRDaGlsZChuZXdDb250YWN0KTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVOdW1iZXJPZlBhcnRpY2lwYW50cygxKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhIGNvbnRhY3QgZm9yIHRoZSBnaXZlbiBwZWVyIGppZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwZWVySmlkIHRoZSBwZWVySmlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGNvbnRhY3QgdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlQ29udGFjdDogZnVuY3Rpb24gKHBlZXJKaWQpIHtcbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCk7XG5cbiAgICAgICAgdmFyIGNvbnRhY3QgPSAkKCcjY29udGFjdGxpc3Q+dWw+bGlbaWQ9XCInICsgcmVzb3VyY2VKaWQgKyAnXCJdJyk7XG5cbiAgICAgICAgaWYgKGNvbnRhY3QgJiYgY29udGFjdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgY29udGFjdGxpc3QgPSAkKCcjY29udGFjdGxpc3Q+dWwnKTtcblxuICAgICAgICAgICAgY29udGFjdGxpc3QuZ2V0KDApLnJlbW92ZUNoaWxkKGNvbnRhY3QuZ2V0KDApKTtcblxuICAgICAgICAgICAgdXBkYXRlTnVtYmVyT2ZQYXJ0aWNpcGFudHMoLTEpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFZpc3VhbE5vdGlmaWNhdGlvbjogZnVuY3Rpb24gKHNob3csIHN0b3BHbG93aW5nSW4pIHtcbiAgICAgICAgdmFyIGdsb3dlciA9ICQoJyNjb250YWN0TGlzdEJ1dHRvbicpO1xuXG4gICAgICAgIGlmIChzaG93ICYmICFub3RpZmljYXRpb25JbnRlcnZhbCkge1xuICAgICAgICAgICAgbm90aWZpY2F0aW9uSW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGdsb3dlci50b2dnbGVDbGFzcygnYWN0aXZlIGdsb3dpbmcnKTtcbiAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoIXNob3cgJiYgbm90aWZpY2F0aW9uSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHN0b3BHbG93aW5nKGdsb3dlcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0b3BHbG93aW5nSW4pIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN0b3BHbG93aW5nKGdsb3dlcik7XG4gICAgICAgICAgICB9LCBzdG9wR2xvd2luZ0luKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRDbGlja2FibGU6IGZ1bmN0aW9uIChyZXNvdXJjZUppZCwgaXNDbGlja2FibGUpIHtcbiAgICAgICAgdmFyIGNvbnRhY3QgPSAkKCcjY29udGFjdGxpc3Q+dWw+bGlbaWQ9XCInICsgcmVzb3VyY2VKaWQgKyAnXCJdJyk7XG4gICAgICAgIGlmIChpc0NsaWNrYWJsZSkge1xuICAgICAgICAgICAgY29udGFjdC5hZGRDbGFzcygnY2xpY2thYmxlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250YWN0LnJlbW92ZUNsYXNzKCdjbGlja2FibGUnKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdExpc3Q7IiwidmFyIGVtYWlsID0gJyc7XG52YXIgZGlzcGxheU5hbWUgPSAnJztcbnZhciB1c2VySWQ7XG5cblxuZnVuY3Rpb24gc3VwcG9ydHNMb2NhbFN0b3JhZ2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuICdsb2NhbFN0b3JhZ2UnIGluIHdpbmRvdyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlICE9PSBudWxsO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2NhbHN0b3JhZ2UgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZVVuaXF1ZUlkKCkge1xuICAgIGZ1bmN0aW9uIF9wOCgpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDE2KStcIjAwMDAwMDAwMFwiKS5zdWJzdHIoMiw4KTtcbiAgICB9XG4gICAgcmV0dXJuIF9wOCgpICsgX3A4KCkgKyBfcDgoKSArIF9wOCgpO1xufVxuXG5pZihzdXBwb3J0c0xvY2FsU3RvcmFnZSgpKSB7XG4gICAgaWYoIXdpbmRvdy5sb2NhbFN0b3JhZ2Uuaml0c2lNZWV0SWQpIHtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5qaXRzaU1lZXRJZCA9IGdlbmVyYXRlVW5pcXVlSWQoKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJnZW5lcmF0ZWQgaWRcIiwgd2luZG93LmxvY2FsU3RvcmFnZS5qaXRzaU1lZXRJZCk7XG4gICAgfVxuICAgIHVzZXJJZCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2Uuaml0c2lNZWV0SWQgfHwgJyc7XG4gICAgZW1haWwgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmVtYWlsIHx8ICcnO1xuICAgIGRpc3BsYXlOYW1lID0gd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSB8fCAnJztcbn0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coXCJsb2NhbCBzdG9yYWdlIGlzIG5vdCBzdXBwb3J0ZWRcIik7XG4gICAgdXNlcklkID0gZ2VuZXJhdGVVbmlxdWVJZCgpO1xufVxuXG52YXIgU2V0dGluZ3MgPVxue1xuICAgIHNldERpc3BsYXlOYW1lOiBmdW5jdGlvbiAobmV3RGlzcGxheU5hbWUpIHtcbiAgICAgICAgZGlzcGxheU5hbWUgPSBuZXdEaXNwbGF5TmFtZTtcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5kaXNwbGF5bmFtZSA9IGRpc3BsYXlOYW1lO1xuICAgICAgICByZXR1cm4gZGlzcGxheU5hbWU7XG4gICAgfSxcbiAgICBzZXRFbWFpbDogZnVuY3Rpb24obmV3RW1haWwpXG4gICAge1xuICAgICAgICBlbWFpbCA9IG5ld0VtYWlsO1xuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLmVtYWlsID0gbmV3RW1haWw7XG4gICAgICAgIHJldHVybiBlbWFpbDtcbiAgICB9LFxuICAgIGdldFNldHRpbmdzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBlbWFpbDogZW1haWwsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogZGlzcGxheU5hbWUsXG4gICAgICAgICAgICB1aWQ6IHVzZXJJZFxuICAgICAgICB9O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2V0dGluZ3M7XG4iLCJ2YXIgQXZhdGFyID0gcmVxdWlyZShcIi4uLy4uL2F2YXRhci9BdmF0YXJcIik7XG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi9TZXR0aW5nc1wiKTtcblxuXG52YXIgU2V0dGluZ3NNZW51ID0ge1xuXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5ld0Rpc3BsYXlOYW1lID0gVXRpbC5lc2NhcGVIdG1sKCQoJyNzZXREaXNwbGF5TmFtZScpLmdldCgwKS52YWx1ZSk7XG4gICAgICAgIHZhciBuZXdFbWFpbCA9IFV0aWwuZXNjYXBlSHRtbCgkKCcjc2V0RW1haWwnKS5nZXQoMCkudmFsdWUpO1xuXG4gICAgICAgIGlmKG5ld0Rpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheU5hbWUgPSBTZXR0aW5ncy5zZXREaXNwbGF5TmFtZShuZXdEaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkRGlzcGxheU5hbWVUb1ByZXNlbmNlKGRpc3BsYXlOYW1lKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLmFkZEVtYWlsVG9QcmVzZW5jZShuZXdFbWFpbCk7XG4gICAgICAgIHZhciBlbWFpbCA9IFNldHRpbmdzLnNldEVtYWlsKG5ld0VtYWlsKTtcblxuXG4gICAgICAgIGNvbm5lY3Rpb24uZW11Yy5zZW5kUHJlc2VuY2UoKTtcbiAgICAgICAgQXZhdGFyLnNldFVzZXJBdmF0YXIoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCwgZW1haWwpO1xuICAgIH0sXG5cbiAgICBpc1Zpc2libGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCgnI3NldHRpbmdzbWVudScpLmlzKCc6dmlzaWJsZScpO1xuICAgIH0sXG5cbiAgICBzZXREaXNwbGF5TmFtZTogZnVuY3Rpb24obmV3RGlzcGxheU5hbWUpIHtcbiAgICAgICAgdmFyIGRpc3BsYXlOYW1lID0gU2V0dGluZ3Muc2V0RGlzcGxheU5hbWUobmV3RGlzcGxheU5hbWUpO1xuICAgICAgICAkKCcjc2V0RGlzcGxheU5hbWUnKS5nZXQoMCkudmFsdWUgPSBkaXNwbGF5TmFtZTtcbiAgICB9XG59O1xuXG4kKGRvY3VtZW50KS5iaW5kKCdkaXNwbGF5bmFtZWNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgcGVlckppZCwgbmV3RGlzcGxheU5hbWUpIHtcbiAgICBpZihwZWVySmlkID09PSAnbG9jYWxWaWRlb0NvbnRhaW5lcicgfHxcbiAgICAgICAgcGVlckppZCA9PT0gY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkge1xuICAgICAgICBTZXR0aW5nc01lbnUuc2V0RGlzcGxheU5hbWUobmV3RGlzcGxheU5hbWUpO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldHRpbmdzTWVudTsiLCJ2YXIgUGFuZWxUb2dnbGVyID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9TaWRlUGFuZWxUb2dnbGVyXCIpO1xuXG52YXIgYnV0dG9uSGFuZGxlcnMgPSB7XG4gICAgXCJib3R0b21fdG9vbGJhcl9jb250YWN0X2xpc3RcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICBCb3R0b21Ub29sYmFyLnRvZ2dsZUNvbnRhY3RMaXN0KCk7XG4gICAgfSxcbiAgICBcImJvdHRvbV90b29sYmFyX2ZpbG1fc3RyaXBcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICBCb3R0b21Ub29sYmFyLnRvZ2dsZUZpbG1TdHJpcCgpO1xuICAgIH0sXG4gICAgXCJib3R0b21fdG9vbGJhcl9jaGF0XCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQm90dG9tVG9vbGJhci50b2dnbGVDaGF0KCk7XG4gICAgfVxufTtcblxudmFyIEJvdHRvbVRvb2xiYXIgPSAoZnVuY3Rpb24gKG15KSB7XG4gICAgbXkuaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yKHZhciBrIGluIGJ1dHRvbkhhbmRsZXJzKVxuICAgICAgICAgICAgJChcIiNcIiArIGspLmNsaWNrKGJ1dHRvbkhhbmRsZXJzW2tdKTtcbiAgICB9O1xuXG4gICAgbXkudG9nZ2xlQ2hhdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBQYW5lbFRvZ2dsZXIudG9nZ2xlQ2hhdCgpO1xuICAgIH07XG5cbiAgICBteS50b2dnbGVDb250YWN0TGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBQYW5lbFRvZ2dsZXIudG9nZ2xlQ29udGFjdExpc3QoKTtcbiAgICB9O1xuXG4gICAgbXkudG9nZ2xlRmlsbVN0cmlwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWxtc3RyaXAgPSAkKFwiI3JlbW90ZVZpZGVvc1wiKTtcbiAgICAgICAgZmlsbXN0cmlwLnRvZ2dsZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgIH07XG5cbiAgICAkKGRvY3VtZW50KS5iaW5kKFwicmVtb3RldmlkZW8ucmVzaXplZFwiLCBmdW5jdGlvbiAoZXZlbnQsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGJvdHRvbSA9IChoZWlnaHQgLSAkKCcjYm90dG9tVG9vbGJhcicpLm91dGVySGVpZ2h0KCkpLzIgKyAxODtcblxuICAgICAgICAkKCcjYm90dG9tVG9vbGJhcicpLmNzcyh7Ym90dG9tOiBib3R0b20gKyAncHgnfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbXk7XG59KEJvdHRvbVRvb2xiYXIgfHwge30pKTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb3R0b21Ub29sYmFyO1xuIiwiLyogZ2xvYmFsICQsIGludGVyZmFjZUNvbmZpZywgTW9kZXJhdG9yLCBzaG93RGVza3RvcFNoYXJpbmdCdXR0b24gKi9cblxudmFyIHRvb2xiYXJUaW1lb3V0T2JqZWN0LFxuICAgIHRvb2xiYXJUaW1lb3V0ID0gaW50ZXJmYWNlQ29uZmlnLklOSVRJQUxfVE9PTEJBUl9USU1FT1VUO1xuXG4vKipcbiAqIEhpZGVzIHRoZSB0b29sYmFyLlxuICovXG5mdW5jdGlvbiBoaWRlVG9vbGJhcigpIHtcbiAgICB2YXIgaGVhZGVyID0gJChcIiNoZWFkZXJcIiksXG4gICAgICAgIGJvdHRvbVRvb2xiYXIgPSAkKFwiI2JvdHRvbVRvb2xiYXJcIik7XG4gICAgdmFyIGlzVG9vbGJhckhvdmVyID0gZmFsc2U7XG4gICAgaGVhZGVyLmZpbmQoJyonKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGlkID0gJCh0aGlzKS5hdHRyKCdpZCcpO1xuICAgICAgICBpZiAoJChcIiNcIiArIGlkICsgXCI6aG92ZXJcIikubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaXNUb29sYmFySG92ZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCQoXCIjYm90dG9tVG9vbGJhcjpob3ZlclwiKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlzVG9vbGJhckhvdmVyID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjbGVhclRpbWVvdXQodG9vbGJhclRpbWVvdXRPYmplY3QpO1xuICAgIHRvb2xiYXJUaW1lb3V0T2JqZWN0ID0gbnVsbDtcblxuICAgIGlmICghaXNUb29sYmFySG92ZXIpIHtcbiAgICAgICAgaGVhZGVyLmhpZGUoXCJzbGlkZVwiLCB7IGRpcmVjdGlvbjogXCJ1cFwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgICAgICQoJyNzdWJqZWN0JykuYW5pbWF0ZSh7dG9wOiBcIi09NDBcIn0sIDMwMCk7XG4gICAgICAgIGlmICgkKFwiI3JlbW90ZVZpZGVvc1wiKS5oYXNDbGFzcyhcImhpZGRlblwiKSkge1xuICAgICAgICAgICAgYm90dG9tVG9vbGJhci5oaWRlKFxuICAgICAgICAgICAgICAgIFwic2xpZGVcIiwge2RpcmVjdGlvbjogXCJyaWdodFwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRvb2xiYXJUaW1lb3V0T2JqZWN0ID0gc2V0VGltZW91dChoaWRlVG9vbGJhciwgdG9vbGJhclRpbWVvdXQpO1xuICAgIH1cbn1cblxudmFyIFRvb2xiYXJUb2dnbGVyID0ge1xuICAgIC8qKlxuICAgICAqIFNob3dzIHRoZSBtYWluIHRvb2xiYXIuXG4gICAgICovXG4gICAgc2hvd1Rvb2xiYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGhlYWRlciA9ICQoXCIjaGVhZGVyXCIpLFxuICAgICAgICAgICAgYm90dG9tVG9vbGJhciA9ICQoXCIjYm90dG9tVG9vbGJhclwiKTtcbiAgICAgICAgaWYgKCFoZWFkZXIuaXMoJzp2aXNpYmxlJykgfHwgIWJvdHRvbVRvb2xiYXIuaXMoXCI6dmlzaWJsZVwiKSkge1xuICAgICAgICAgICAgaGVhZGVyLnNob3coXCJzbGlkZVwiLCB7IGRpcmVjdGlvbjogXCJ1cFwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgICAgICAgICAkKCcjc3ViamVjdCcpLmFuaW1hdGUoe3RvcDogXCIrPTQwXCJ9LCAzMDApO1xuICAgICAgICAgICAgaWYgKCFib3R0b21Ub29sYmFyLmlzKFwiOnZpc2libGVcIikpIHtcbiAgICAgICAgICAgICAgICBib3R0b21Ub29sYmFyLnNob3coXG4gICAgICAgICAgICAgICAgICAgIFwic2xpZGVcIiwge2RpcmVjdGlvbjogXCJyaWdodFwiLCBkdXJhdGlvbjogMzAwfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b29sYmFyVGltZW91dE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0b29sYmFyVGltZW91dE9iamVjdCk7XG4gICAgICAgICAgICAgICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBzZXRUaW1lb3V0KGhpZGVUb29sYmFyLCB0b29sYmFyVGltZW91dCk7XG4gICAgICAgICAgICB0b29sYmFyVGltZW91dCA9IGludGVyZmFjZUNvbmZpZy5UT09MQkFSX1RJTUVPVVQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoTW9kZXJhdG9yLmlzTW9kZXJhdG9yKCkpXG4gICAgICAgIHtcbi8vICAgICAgICAgICAgVE9ETzogRW5hYmxlIHNldHRpbmdzIGZ1bmN0aW9uYWxpdHkuXG4vLyAgICAgICAgICAgICAgICAgIE5lZWQgdG8gdW5jb21tZW50IHRoZSBzZXR0aW5ncyBidXR0b24gaW4gaW5kZXguaHRtbC5cbi8vICAgICAgICAgICAgJCgnI3NldHRpbmdzQnV0dG9uJykuY3NzKHt2aXNpYmlsaXR5OlwidmlzaWJsZVwifSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG93L2hpZGUgZGVza3RvcCBzaGFyaW5nIGJ1dHRvblxuICAgICAgICBzaG93RGVza3RvcFNoYXJpbmdCdXR0b24oKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBEb2Nrcy91bmRvY2tzIHRoZSB0b29sYmFyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRG9jayBpbmRpY2F0ZXMgd2hhdCBvcGVyYXRpb24gdG8gcGVyZm9ybVxuICAgICAqL1xuICAgIGRvY2tUb29sYmFyOiBmdW5jdGlvbiAoaXNEb2NrKSB7XG4gICAgICAgIGlmIChpc0RvY2spIHtcbiAgICAgICAgICAgIC8vIEZpcnN0IG1ha2Ugc3VyZSB0aGUgdG9vbGJhciBpcyBzaG93bi5cbiAgICAgICAgICAgIGlmICghJCgnI2hlYWRlcicpLmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93VG9vbGJhcigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGVuIGNsZWFyIHRoZSB0aW1lIG91dCwgdG8gZG9jayB0aGUgdG9vbGJhci5cbiAgICAgICAgICAgIGlmICh0b29sYmFyVGltZW91dE9iamVjdCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0b29sYmFyVGltZW91dE9iamVjdCk7XG4gICAgICAgICAgICAgICAgdG9vbGJhclRpbWVvdXRPYmplY3QgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCEkKCcjaGVhZGVyJykuaXMoJzp2aXNpYmxlJykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dUb29sYmFyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0b29sYmFyVGltZW91dE9iamVjdCA9IHNldFRpbWVvdXQoaGlkZVRvb2xiYXIsIHRvb2xiYXJUaW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb29sYmFyVG9nZ2xlcjsiLCIvKiBnbG9iYWwgJCwgYnV0dG9uQ2xpY2ssIGNvbmZpZywgbG9ja1Jvb20sICBNb2RlcmF0b3IsXG4gICBzZXRTaGFyZWRLZXksIHNoYXJlZEtleSwgVXRpbCAqL1xudmFyIG1lc3NhZ2VIYW5kbGVyID0gcmVxdWlyZShcIi4uL3V0aWwvTWVzc2FnZUhhbmRsZXJcIik7XG52YXIgQm90dG9tVG9vbGJhciA9IHJlcXVpcmUoXCIuL0JvdHRvbVRvb2xiYXJcIik7XG52YXIgUHJlemkgPSByZXF1aXJlKFwiLi4vcHJlemkvUHJlemlcIik7XG52YXIgRXRoZXJwYWQgPSByZXF1aXJlKFwiLi4vZXRoZXJwYWQvRXRoZXJwYWRcIik7XG52YXIgUGFuZWxUb2dnbGVyID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9TaWRlUGFuZWxUb2dnbGVyXCIpO1xuXG52YXIgcm9vbVVybCA9IG51bGw7XG52YXIgc2hhcmVkS2V5ID0gJyc7XG52YXIgYXV0aGVudGljYXRpb25XaW5kb3cgPSBudWxsO1xuXG52YXIgYnV0dG9uSGFuZGxlcnMgPVxue1xuICAgIFwidG9vbGJhcl9idXR0b25fbXV0ZVwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0b2dnbGVBdWRpbygpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9jYW1lcmFcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdG9nZ2xlVmlkZW8oKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fYXV0aGVudGljYXRpb25cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVG9vbGJhci5hdXRoZW50aWNhdGVDbGlja2VkKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX3JlY29yZFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0b2dnbGVSZWNvcmRpbmcoKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fc2VjdXJpdHlcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVG9vbGJhci5vcGVuTG9ja0RpYWxvZygpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9saW5rXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFRvb2xiYXIub3BlbkxpbmtEaWFsb2coKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fY2hhdFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBCb3R0b21Ub29sYmFyLnRvZ2dsZUNoYXQoKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25fcHJlemlcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUHJlemkub3BlblByZXppRGlhbG9nKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX2V0aGVycGFkXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIEV0aGVycGFkLnRvZ2dsZUV0aGVycGFkKDApO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9kZXNrdG9wc2hhcmluZ1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0b2dnbGVTY3JlZW5TaGFyaW5nKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX2Z1bGxTY3JlZW5cIjogZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgYnV0dG9uQ2xpY2soXCIjZnVsbFNjcmVlblwiLCBcImljb24tZnVsbC1zY3JlZW4gaWNvbi1leGl0LWZ1bGwtc2NyZWVuXCIpO1xuICAgICAgICByZXR1cm4gVG9vbGJhci50b2dnbGVGdWxsU2NyZWVuKCk7XG4gICAgfSxcbiAgICBcInRvb2xiYXJfYnV0dG9uX3NpcFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsU2lwQnV0dG9uQ2xpY2tlZCgpO1xuICAgIH0sXG4gICAgXCJ0b29sYmFyX2J1dHRvbl9zZXR0aW5nc1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFBhbmVsVG9nZ2xlci50b2dnbGVTZXR0aW5nc01lbnUoKTtcbiAgICB9LFxuICAgIFwidG9vbGJhcl9idXR0b25faGFuZ3VwXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGhhbmd1cCgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogU3RhcnRzIG9yIHN0b3BzIHRoZSByZWNvcmRpbmcgZm9yIHRoZSBjb25mZXJlbmNlLlxuICovXG5cbmZ1bmN0aW9uIHRvZ2dsZVJlY29yZGluZygpIHtcbiAgICBSZWNvcmRpbmcudG9nZ2xlUmVjb3JkaW5nKCk7XG59XG5cbi8qKlxuICogTG9ja3MgLyB1bmxvY2tzIHRoZSByb29tLlxuICovXG5mdW5jdGlvbiBsb2NrUm9vbShsb2NrKSB7XG4gICAgdmFyIGN1cnJlbnRTaGFyZWRLZXkgPSAnJztcbiAgICBpZiAobG9jaylcbiAgICAgICAgY3VycmVudFNoYXJlZEtleSA9IHNoYXJlZEtleTtcblxuICAgIGNvbm5lY3Rpb24uZW11Yy5sb2NrUm9vbShjdXJyZW50U2hhcmVkS2V5LCBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIC8vIHBhc3N3b3JkIGlzIHJlcXVpcmVkXG4gICAgICAgIGlmIChzaGFyZWRLZXkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZXQgcm9vbSBwYXNzd29yZCcpO1xuICAgICAgICAgICAgVG9vbGJhci5sb2NrTG9ja0J1dHRvbigpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlbW92ZWQgcm9vbSBwYXNzd29yZCcpO1xuICAgICAgICAgICAgVG9vbGJhci51bmxvY2tMb2NrQnV0dG9uKCk7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2Fybignc2V0dGluZyBwYXNzd29yZCBmYWlsZWQnLCBlcnIpO1xuICAgICAgICBtZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoJ0xvY2sgZmFpbGVkJyxcbiAgICAgICAgICAgICdGYWlsZWQgdG8gbG9jayBjb25mZXJlbmNlLicsXG4gICAgICAgICAgICBlcnIpO1xuICAgICAgICBUb29sYmFyLnNldFNoYXJlZEtleSgnJyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ3Jvb20gcGFzc3dvcmRzIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgbWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCdXYXJuaW5nJyxcbiAgICAgICAgICAgICdSb29tIHBhc3N3b3JkcyBhcmUgY3VycmVudGx5IG5vdCBzdXBwb3J0ZWQuJyk7XG4gICAgICAgIFRvb2xiYXIuc2V0U2hhcmVkS2V5KCcnKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogSW52aXRlIHBhcnRpY2lwYW50cyB0byBjb25mZXJlbmNlLlxuICovXG5mdW5jdGlvbiBpbnZpdGVQYXJ0aWNpcGFudHMoKSB7XG4gICAgaWYgKHJvb21VcmwgPT09IG51bGwpXG4gICAgICAgIHJldHVybjtcblxuICAgIHZhciBzaGFyZWRLZXlUZXh0ID0gXCJcIjtcbiAgICBpZiAoc2hhcmVkS2V5ICYmIHNoYXJlZEtleS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNoYXJlZEtleVRleHQgPVxuICAgICAgICAgICAgXCJUaGlzIGNvbmZlcmVuY2UgaXMgcGFzc3dvcmQgcHJvdGVjdGVkLiBQbGVhc2UgdXNlIHRoZSBcIiArXG4gICAgICAgICAgICBcImZvbGxvd2luZyBwaW4gd2hlbiBqb2luaW5nOiUwRCUwQSUwRCUwQVwiICtcbiAgICAgICAgICAgIHNoYXJlZEtleSArIFwiJTBEJTBBJTBEJTBBXCI7XG4gICAgfVxuXG4gICAgdmFyIGNvbmZlcmVuY2VOYW1lID0gcm9vbVVybC5zdWJzdHJpbmcocm9vbVVybC5sYXN0SW5kZXhPZignLycpICsgMSk7XG4gICAgdmFyIHN1YmplY3QgPSBcIkludml0YXRpb24gdG8gYSBcIiArIGludGVyZmFjZUNvbmZpZy5BUFBfTkFNRSArIFwiIChcIiArIGNvbmZlcmVuY2VOYW1lICsgXCIpXCI7XG4gICAgdmFyIGJvZHkgPSBcIkhleSB0aGVyZSwgSSUyN2QgbGlrZSB0byBpbnZpdGUgeW91IHRvIGEgXCIgKyBpbnRlcmZhY2VDb25maWcuQVBQX05BTUUgK1xuICAgICAgICBcIiBjb25mZXJlbmNlIEklMjd2ZSBqdXN0IHNldCB1cC4lMEQlMEElMEQlMEFcIiArXG4gICAgICAgIFwiUGxlYXNlIGNsaWNrIG9uIHRoZSBmb2xsb3dpbmcgbGluayBpbiBvcmRlclwiICtcbiAgICAgICAgXCIgdG8gam9pbiB0aGUgY29uZmVyZW5jZS4lMEQlMEElMEQlMEFcIiArXG4gICAgICAgIHJvb21VcmwgK1xuICAgICAgICBcIiUwRCUwQSUwRCUwQVwiICtcbiAgICAgICAgc2hhcmVkS2V5VGV4dCArXG4gICAgICAgIFwiTm90ZSB0aGF0IFwiICsgaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FICsgXCIgaXMgY3VycmVudGx5XCIgK1xuICAgICAgICBcIiBvbmx5IHN1cHBvcnRlZCBieSBDaHJvbWl1bSxcIiArXG4gICAgICAgIFwiIEdvb2dsZSBDaHJvbWUgYW5kIE9wZXJhLCBzbyB5b3UgbmVlZFwiICtcbiAgICAgICAgXCIgdG8gYmUgdXNpbmcgb25lIG9mIHRoZXNlIGJyb3dzZXJzLiUwRCUwQSUwRCUwQVwiICtcbiAgICAgICAgXCJUYWxrIHRvIHlvdSBpbiBhIHNlYyFcIjtcblxuICAgIGlmICh3aW5kb3cubG9jYWxTdG9yYWdlLmRpc3BsYXluYW1lKSB7XG4gICAgICAgIGJvZHkgKz0gXCIlMEQlMEElMEQlMEFcIiArIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZGlzcGxheW5hbWU7XG4gICAgfVxuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5JTlZJVEFUSU9OX1BPV0VSRURfQlkpIHtcbiAgICAgICAgYm9keSArPSBcIiUwRCUwQSUwRCUwQS0tJTBEJTBBcG93ZXJlZCBieSBqaXRzaS5vcmdcIjtcbiAgICB9XG5cbiAgICB3aW5kb3cub3BlbihcIm1haWx0bzo/c3ViamVjdD1cIiArIHN1YmplY3QgKyBcIiZib2R5PVwiICsgYm9keSwgJ19ibGFuaycpO1xufVxuXG52YXIgVG9vbGJhciA9IChmdW5jdGlvbiAobXkpIHtcblxuICAgIG15LmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvcih2YXIgayBpbiBidXR0b25IYW5kbGVycylcbiAgICAgICAgICAgICQoXCIjXCIgKyBrKS5jbGljayhidXR0b25IYW5kbGVyc1trXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyBzaGFyZWQga2V5XG4gICAgICogQHBhcmFtIHNLZXkgdGhlIHNoYXJlZCBrZXlcbiAgICAgKi9cbiAgICBteS5zZXRTaGFyZWRLZXkgPSBmdW5jdGlvbiAoc0tleSkge1xuICAgICAgICBzaGFyZWRLZXkgPSBzS2V5O1xuICAgIH07XG5cbiAgICBteS5jbG9zZUF1dGhlbnRpY2F0aW9uV2luZG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoYXV0aGVudGljYXRpb25XaW5kb3cpIHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uV2luZG93LmNsb3NlKCk7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGlvbldpbmRvdyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBteS5hdXRoZW50aWNhdGVDbGlja2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBHZXQgYXV0aGVudGljYXRpb24gVVJMXG4gICAgICAgIE1vZGVyYXRvci5nZXRBdXRoVXJsKGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgIC8vIE9wZW4gcG9wdXAgd2l0aCBhdXRoZW50aWNhdGlvbiBVUkxcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uV2luZG93ID0gbWVzc2FnZUhhbmRsZXIub3BlbkNlbnRlcmVkUG9wdXAoXG4gICAgICAgICAgICAgICAgdXJsLCA1MDAsIDQwMCxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE9uIHBvcHVwIGNsb3NlZCAtIHJldHJ5IHJvb20gYWxsb2NhdGlvblxuICAgICAgICAgICAgICAgICAgICBNb2RlcmF0b3IuYWxsb2NhdGVDb25mZXJlbmNlRm9jdXMoXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tTmFtZSwgZG9Kb2luQWZ0ZXJGb2N1cyk7XG4gICAgICAgICAgICAgICAgICAgIGF1dGhlbnRpY2F0aW9uV2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghYXV0aGVudGljYXRpb25XaW5kb3cpIHtcbiAgICAgICAgICAgICAgICBUb29sYmFyLnNob3dBdXRoZW50aWNhdGVCdXR0b24odHJ1ZSk7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3Blbk1lc3NhZ2VEaWFsb2coXG4gICAgICAgICAgICAgICAgICAgIG51bGwsIFwiWW91ciBicm93c2VyIGlzIGJsb2NraW5nIHBvcHVwIHdpbmRvd3MgZnJvbSB0aGlzIHNpdGUuXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIgUGxlYXNlIGVuYWJsZSBwb3B1cHMgaW4geW91ciBicm93c2VyIHNlY3VyaXR5IHNldHRpbmdzXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIgYW5kIHRyeSBhZ2Fpbi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSByb29tIGludml0ZSB1cmwuXG4gICAgICovXG4gICAgbXkudXBkYXRlUm9vbVVybCA9IGZ1bmN0aW9uIChuZXdSb29tVXJsKSB7XG4gICAgICAgIHJvb21VcmwgPSBuZXdSb29tVXJsO1xuXG4gICAgICAgIC8vIElmIHRoZSBpbnZpdGUgZGlhbG9nIGhhcyBiZWVuIGFscmVhZHkgb3BlbmVkIHdlIHVwZGF0ZSB0aGUgaW5mb3JtYXRpb24uXG4gICAgICAgIHZhciBpbnZpdGVMaW5rID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ludml0ZUxpbmtSZWYnKTtcbiAgICAgICAgaWYgKGludml0ZUxpbmspIHtcbiAgICAgICAgICAgIGludml0ZUxpbmsudmFsdWUgPSByb29tVXJsO1xuICAgICAgICAgICAgaW52aXRlTGluay5zZWxlY3QoKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdqcWlfc3RhdGUwX2J1dHRvbkludml0ZScpLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNhYmxlcyBhbmQgZW5hYmxlcyBzb21lIG9mIHRoZSBidXR0b25zLlxuICAgICAqL1xuICAgIG15LnNldHVwQnV0dG9uc0Zyb21Db25maWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb25maWcuZGlzYWJsZVByZXppKVxuICAgICAgICB7XG4gICAgICAgICAgICAkKFwiI3ByZXppX2J1dHRvblwiKS5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIGxvY2sgcm9vbSBkaWFsb2cuXG4gICAgICovXG4gICAgbXkub3BlbkxvY2tEaWFsb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIE9ubHkgdGhlIGZvY3VzIGlzIGFibGUgdG8gc2V0IGEgc2hhcmVkIGtleS5cbiAgICAgICAgaWYgKCFNb2RlcmF0b3IuaXNNb2RlcmF0b3IoKSkge1xuICAgICAgICAgICAgaWYgKHNoYXJlZEtleSkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5NZXNzYWdlRGlhbG9nKG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgY29udmVyc2F0aW9uIGlzIGN1cnJlbnRseSBwcm90ZWN0ZWQgYnlcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBhIHBhc3N3b3JkLiBPbmx5IHRoZSBvd25lciBvZiB0aGUgY29uZmVyZW5jZVwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiIGNvdWxkIHNldCBhIHBhc3N3b3JkLlwiLFxuICAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJQYXNzd29yZFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3Blbk1lc3NhZ2VEaWFsb2cobnVsbCxcbiAgICAgICAgICAgICAgICAgICAgXCJUaGlzIGNvbnZlcnNhdGlvbiBpc24ndCBjdXJyZW50bHkgcHJvdGVjdGVkIGJ5XCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIgYSBwYXNzd29yZC4gT25seSB0aGUgb3duZXIgb2YgdGhlIGNvbmZlcmVuY2VcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiBjb3VsZCBzZXQgYSBwYXNzd29yZC5cIixcbiAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiUGFzc3dvcmRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc2hhcmVkS2V5KSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICAgICBcIkFyZSB5b3Ugc3VyZSB5b3Ugd291bGQgbGlrZSB0byByZW1vdmUgeW91ciBwYXNzd29yZD9cIixcbiAgICAgICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwiUmVtb3ZlXCIsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlLCB2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRvb2xiYXIuc2V0U2hhcmVkS2V5KCcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NrUm9vbShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5vcGVuVHdvQnV0dG9uRGlhbG9nKG51bGwsXG4gICAgICAgICAgICAgICAgICAgICc8aDI+U2V0IGEgcGFzc3dvcmQgdG8gbG9jayB5b3VyIHJvb208L2gyPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCBpZD1cImxvY2tLZXlcIiB0eXBlPVwidGV4dFwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAncGxhY2Vob2xkZXI9XCJ5b3VyIHBhc3N3b3JkXCIgYXV0b2ZvY3VzPicsXG4gICAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcIlNhdmVcIixcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGUsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvY2tLZXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9ja0tleScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxvY2tLZXkudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVG9vbGJhci5zZXRTaGFyZWRLZXkoVXRpbC5lc2NhcGVIdG1sKGxvY2tLZXkudmFsdWUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9ja1Jvb20odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9ja0tleScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBpbnZpdGUgbGluayBkaWFsb2cuXG4gICAgICovXG4gICAgbXkub3BlbkxpbmtEaWFsb2cgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnZpdGVMaW5rO1xuICAgICAgICBpZiAocm9vbVVybCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgaW52aXRlTGluayA9IFwiWW91ciBjb25mZXJlbmNlIGlzIGN1cnJlbnRseSBiZWluZyBjcmVhdGVkLi4uXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnZpdGVMaW5rID0gZW5jb2RlVVJJKHJvb21VcmwpO1xuICAgICAgICB9XG4gICAgICAgIG1lc3NhZ2VIYW5kbGVyLm9wZW5Ud29CdXR0b25EaWFsb2coXG4gICAgICAgICAgICBcIlNoYXJlIHRoaXMgbGluayB3aXRoIGV2ZXJ5b25lIHlvdSB3YW50IHRvIGludml0ZVwiLFxuICAgICAgICAgICAgJzxpbnB1dCBpZD1cImludml0ZUxpbmtSZWZcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwiJyArXG4gICAgICAgICAgICAgICAgaW52aXRlTGluayArICdcIiBvbmNsaWNrPVwidGhpcy5zZWxlY3QoKTtcIiByZWFkb25seT4nLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBcIkludml0ZVwiLFxuICAgICAgICAgICAgZnVuY3Rpb24gKGUsIHYpIHtcbiAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICBpZiAocm9vbVVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52aXRlUGFydGljaXBhbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChyb29tVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnZpdGVMaW5rUmVmJykuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pxaV9zdGF0ZTBfYnV0dG9uSW52aXRlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgc2V0dGluZ3MgZGlhbG9nLlxuICAgICAqL1xuICAgIG15Lm9wZW5TZXR0aW5nc0RpYWxvZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWVzc2FnZUhhbmRsZXIub3BlblR3b0J1dHRvbkRpYWxvZyhcbiAgICAgICAgICAgICc8aDI+Q29uZmlndXJlIHlvdXIgY29uZmVyZW5jZTwvaDI+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImluaXRNdXRlZFwiPicgK1xuICAgICAgICAgICAgICAgICdQYXJ0aWNpcGFudHMgam9pbiBtdXRlZDxici8+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cInJlcXVpcmVOaWNrbmFtZXNcIj4nICtcbiAgICAgICAgICAgICAgICAnUmVxdWlyZSBuaWNrbmFtZXM8YnIvPjxici8+JyArXG4gICAgICAgICAgICAgICAgJ1NldCBhIHBhc3N3b3JkIHRvIGxvY2sgeW91ciByb29tOicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJsb2NrS2V5XCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cInlvdXIgcGFzc3dvcmRcIicgK1xuICAgICAgICAgICAgICAgICdhdXRvZm9jdXM+JyxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIFwiU2F2ZVwiLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2NrS2V5JykuZm9jdXMoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSwgdikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkKCcjaW5pdE11dGVkJykuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQgaXMgY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoJyNyZXF1aXJlTmlja25hbWVzJykuaXMoXCI6Y2hlY2tlZFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQgaXMgY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2NrS2V5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tLZXknKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobG9ja0tleS52YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2hhcmVkS2V5KGxvY2tLZXkudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9ja1Jvb20odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZXMgdGhlIGFwcGxpY2F0aW9uIGluIGFuZCBvdXQgb2YgZnVsbCBzY3JlZW4gbW9kZVxuICAgICAqIChhLmsuYS4gcHJlc2VudGF0aW9uIG1vZGUgaW4gQ2hyb21lKS5cbiAgICAgKi9cbiAgICBteS50b2dnbGVGdWxsU2NyZWVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZnNFbGVtZW50ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgIGlmICghZG9jdW1lbnQubW96RnVsbFNjcmVlbiAmJiAhZG9jdW1lbnQud2Via2l0SXNGdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAvL0VudGVyIEZ1bGwgU2NyZWVuXG4gICAgICAgICAgICBpZiAoZnNFbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZnNFbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmc0VsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4oRWxlbWVudC5BTExPV19LRVlCT0FSRF9JTlBVVCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL0V4aXQgRnVsbCBTY3JlZW5cbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFVubG9ja3MgdGhlIGxvY2sgYnV0dG9uIHN0YXRlLlxuICAgICAqL1xuICAgIG15LnVubG9ja0xvY2tCdXR0b24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKFwiI2xvY2tJY29uXCIpLmhhc0NsYXNzKFwiaWNvbi1zZWN1cml0eS1sb2NrZWRcIikpXG4gICAgICAgICAgICBidXR0b25DbGljayhcIiNsb2NrSWNvblwiLCBcImljb24tc2VjdXJpdHkgaWNvbi1zZWN1cml0eS1sb2NrZWRcIik7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHRoZSBsb2NrIGJ1dHRvbiBzdGF0ZSB0byBsb2NrZWQuXG4gICAgICovXG4gICAgbXkubG9ja0xvY2tCdXR0b24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKFwiI2xvY2tJY29uXCIpLmhhc0NsYXNzKFwiaWNvbi1zZWN1cml0eVwiKSlcbiAgICAgICAgICAgIGJ1dHRvbkNsaWNrKFwiI2xvY2tJY29uXCIsIFwiaWNvbi1zZWN1cml0eSBpY29uLXNlY3VyaXR5LWxvY2tlZFwiKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvd3Mgb3IgaGlkZXMgYXV0aGVudGljYXRpb24gYnV0dG9uXG4gICAgICogQHBhcmFtIHNob3cgPHR0PnRydWU8L3R0PiB0byBzaG93IG9yIDx0dD5mYWxzZTwvdHQ+IHRvIGhpZGVcbiAgICAgKi9cbiAgICBteS5zaG93QXV0aGVudGljYXRlQnV0dG9uID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgICQoJyNhdXRoZW50aWNhdGlvbicpLmNzcyh7ZGlzcGxheTogXCJpbmxpbmVcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCgnI2F1dGhlbnRpY2F0aW9uJykuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFNob3dzIG9yIGhpZGVzIHRoZSAncmVjb3JkaW5nJyBidXR0b24uXG4gICAgbXkuc2hvd1JlY29yZGluZ0J1dHRvbiA9IGZ1bmN0aW9uIChzaG93KSB7XG4gICAgICAgIGlmICghY29uZmlnLmVuYWJsZVJlY29yZGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRpbmcnKS5jc3Moe2Rpc3BsYXk6IFwiaW5saW5lXCJ9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRpbmcnKS5jc3Moe2Rpc3BsYXk6IFwibm9uZVwifSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2V0cyB0aGUgc3RhdGUgb2YgdGhlIHJlY29yZGluZyBidXR0b25cbiAgICBteS5zZXRSZWNvcmRpbmdCdXR0b25TdGF0ZSA9IGZ1bmN0aW9uIChpc1JlY29yZGluZykge1xuICAgICAgICBpZiAoaXNSZWNvcmRpbmcpIHtcbiAgICAgICAgICAgICQoJyNyZWNvcmRCdXR0b24nKS5yZW1vdmVDbGFzcyhcImljb24tcmVjRW5hYmxlXCIpO1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLmFkZENsYXNzKFwiaWNvbi1yZWNFbmFibGUgYWN0aXZlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLnJlbW92ZUNsYXNzKFwiaWNvbi1yZWNFbmFibGUgYWN0aXZlXCIpO1xuICAgICAgICAgICAgJCgnI3JlY29yZEJ1dHRvbicpLmFkZENsYXNzKFwiaWNvbi1yZWNFbmFibGVcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gU2hvd3Mgb3IgaGlkZXMgU0lQIGNhbGxzIGJ1dHRvblxuICAgIG15LnNob3dTaXBDYWxsQnV0dG9uID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5ob3N0cy5jYWxsX2NvbnRyb2wgJiYgc2hvdykge1xuICAgICAgICAgICAgJCgnI3NpcENhbGxCdXR0b24nKS5jc3Moe2Rpc3BsYXk6IFwiaW5saW5lXCJ9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJyNzaXBDYWxsQnV0dG9uJykuY3NzKHtkaXNwbGF5OiBcIm5vbmVcIn0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHN0YXRlIG9mIHRoZSBidXR0b24uIFRoZSBidXR0b24gaGFzIGJsdWUgZ2xvdyBpZiBkZXNrdG9wXG4gICAgICogc3RyZWFtaW5nIGlzIGFjdGl2ZS5cbiAgICAgKiBAcGFyYW0gYWN0aXZlIHRoZSBzdGF0ZSBvZiB0aGUgZGVza3RvcCBzdHJlYW1pbmcuXG4gICAgICovXG4gICAgbXkuY2hhbmdlRGVza3RvcFNoYXJpbmdCdXR0b25TdGF0ZSA9IGZ1bmN0aW9uIChhY3RpdmUpIHtcbiAgICAgICAgdmFyIGJ1dHRvbiA9ICQoXCIjZGVza3RvcHNoYXJpbmcgPiBhXCIpO1xuICAgICAgICBpZiAoYWN0aXZlKVxuICAgICAgICB7XG4gICAgICAgICAgICBidXR0b24uYWRkQ2xhc3MoXCJnbG93XCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgYnV0dG9uLnJlbW92ZUNsYXNzKFwiZ2xvd1wiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gbXk7XG59KFRvb2xiYXIgfHwge30pKTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb29sYmFyOyIsInZhciBKaXRzaVBvcG92ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgbmV3IEppdHNpUG9wb3ZlciBhbmQgYXR0YWNoZXMgaXQgdG8gdGhlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBqcXVlcnkgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB0aGUgb3B0aW9ucyBmb3IgdGhlIHBvcG92ZXIuXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gSml0c2lQb3BvdmVyKGVsZW1lbnQsIG9wdGlvbnMpXG4gICAge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBza2luOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBjb250ZW50OiBcIlwiXG4gICAgICAgIH07XG4gICAgICAgIGlmKG9wdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKG9wdGlvbnMuc2tpbilcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuc2tpbiA9IG9wdGlvbnMuc2tpbjtcblxuICAgICAgICAgICAgaWYob3B0aW9ucy5jb250ZW50KVxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jb250ZW50ID0gb3B0aW9ucy5jb250ZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50SXNIb3ZlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucG9wb3ZlcklzSG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBvcG92ZXJTaG93biA9IGZhbHNlO1xuXG4gICAgICAgIGVsZW1lbnQuZGF0YShcImppdHNpX3BvcG92ZXJcIiwgdGhpcyk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSAnIDxkaXYgY2xhc3M9XCJqaXRzaXBvcG92ZXIgJyArIHRoaXMub3B0aW9ucy5za2luICtcbiAgICAgICAgICAgICdcIj48ZGl2IGNsYXNzPVwiYXJyb3dcIj48L2Rpdj48ZGl2IGNsYXNzPVwiaml0c2lwb3BvdmVyLWNvbnRlbnRcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaml0c2lQb3B1cG1lbnVQYWRkaW5nXCI+PC9kaXY+PC9kaXY+JztcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmVsZW1lbnQub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZWxlbWVudElzSG92ZXJlZCA9IHRydWU7XG4gICAgICAgICAgICBzZWxmLnNob3coKTtcbiAgICAgICAgfSkub24oXCJtb3VzZWxlYXZlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZWxlbWVudElzSG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICAgICAgICB9LCAxMCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNob3dzIHRoZSBwb3BvdmVyXG4gICAgICovXG4gICAgSml0c2lQb3BvdmVyLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNyZWF0ZVBvcG92ZXIoKTtcbiAgICAgICAgdGhpcy5wb3BvdmVyU2hvd24gPSB0cnVlO1xuXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEhpZGVzIHRoZSBwb3BvdmVyXG4gICAgICovXG4gICAgSml0c2lQb3BvdmVyLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZighdGhpcy5lbGVtZW50SXNIb3ZlcmVkICYmICF0aGlzLnBvcG92ZXJJc0hvdmVyZWQgJiYgdGhpcy5wb3BvdmVyU2hvd24pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuZm9yY2VIaWRlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSGlkZXMgdGhlIHBvcG92ZXJcbiAgICAgKi9cbiAgICBKaXRzaVBvcG92ZXIucHJvdG90eXBlLmZvcmNlSGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIi5qaXRzaXBvcG92ZXJcIikucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMucG9wb3ZlclNob3duID0gZmFsc2U7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIHBvcG92ZXIgaHRtbFxuICAgICAqL1xuICAgIEppdHNpUG9wb3Zlci5wcm90b3R5cGUuY3JlYXRlUG9wb3ZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMudGVtcGxhdGUpO1xuICAgICAgICAkKFwiLmppdHNpcG9wb3ZlciA+IC5qaXRzaXBvcG92ZXItY29udGVudFwiKS5odG1sKHRoaXMub3B0aW9ucy5jb250ZW50KTtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiLmppdHNpcG9wb3ZlclwiKS5vbihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5wb3BvdmVySXNIb3ZlcmVkID0gdHJ1ZTtcbiAgICAgICAgfSkub24oXCJtb3VzZWxlYXZlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYucG9wb3ZlcklzSG92ZXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgc2VsZi5oaWRlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucmVmcmVzaFBvc2l0aW9uKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gb2YgdGhlIHBvcG92ZXJcbiAgICAgKi9cbiAgICBKaXRzaVBvcG92ZXIucHJvdG90eXBlLnJlZnJlc2hQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcIi5qaXRzaXBvcG92ZXJcIikucG9zaXRpb24oe1xuICAgICAgICAgICAgbXk6IFwiYm90dG9tXCIsXG4gICAgICAgICAgICBhdDogXCJ0b3BcIixcbiAgICAgICAgICAgIGNvbGxpc2lvbjogXCJmaXRcIixcbiAgICAgICAgICAgIG9mOiB0aGlzLmVsZW1lbnQsXG4gICAgICAgICAgICB1c2luZzogZnVuY3Rpb24gKHBvc2l0aW9uLCBlbGVtZW50cykge1xuICAgICAgICAgICAgICAgIHZhciBjYWxjTGVmdCA9IGVsZW1lbnRzLnRhcmdldC5sZWZ0IC0gZWxlbWVudHMuZWxlbWVudC5sZWZ0ICsgZWxlbWVudHMudGFyZ2V0LndpZHRoLzI7XG4gICAgICAgICAgICAgICAgJChcIi5qaXRzaXBvcG92ZXJcIikuY3NzKHt0b3A6IHBvc2l0aW9uLnRvcCwgbGVmdDogcG9zaXRpb24ubGVmdCwgZGlzcGxheTogXCJ0YWJsZVwifSk7XG4gICAgICAgICAgICAgICAgJChcIi5qaXRzaXBvcG92ZXIgPiAuYXJyb3dcIikuY3NzKHtsZWZ0OiBjYWxjTGVmdH0pO1xuICAgICAgICAgICAgICAgICQoXCIuaml0c2lwb3BvdmVyID4gLmppdHNpUG9wdXBtZW51UGFkZGluZ1wiKS5jc3Moe2xlZnQ6IGNhbGNMZWZ0IC0gNTB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGNvbnRlbnQgb2YgcG9wb3Zlci5cbiAgICAgKiBAcGFyYW0gY29udGVudCBuZXcgY29udGVudFxuICAgICAqL1xuICAgIEppdHNpUG9wb3Zlci5wcm90b3R5cGUudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb250ZW50ID0gY29udGVudDtcbiAgICAgICAgaWYoIXRoaXMucG9wb3ZlclNob3duKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAkKFwiLmppdHNpcG9wb3ZlclwiKS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5jcmVhdGVQb3BvdmVyKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBKaXRzaVBvcG92ZXI7XG5cblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKaXRzaVBvcG92ZXI7IiwidmFyIG1lc3NhZ2VIYW5kbGVyID0gKGZ1bmN0aW9uKG15KSB7XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIG1lc3NhZ2UgdG8gdGhlIHVzZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGVTdHJpbmcgdGhlIHRpdGxlIG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1lc3NhZ2VTdHJpbmcgdGhlIHRleHQgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKi9cbiAgICBteS5vcGVuTWVzc2FnZURpYWxvZyA9IGZ1bmN0aW9uKHRpdGxlU3RyaW5nLCBtZXNzYWdlU3RyaW5nKSB7XG4gICAgICAgICQucHJvbXB0KG1lc3NhZ2VTdHJpbmcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IHRpdGxlU3RyaW5nLFxuICAgICAgICAgICAgICAgIHBlcnNpc3RlbnQ6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzIGEgbWVzc2FnZSB0byB0aGUgdXNlciB3aXRoIHR3byBidXR0b25zOiBmaXJzdCBpcyBnaXZlbiBhcyBhIHBhcmFtZXRlciBhbmQgdGhlIHNlY29uZCBpcyBDYW5jZWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGVTdHJpbmcgdGhlIHRpdGxlIG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1zZ1N0cmluZyB0aGUgdGV4dCBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBwZXJzaXN0ZW50IGJvb2xlYW4gdmFsdWUgd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtZXNzYWdlIGlzIHBlcnNpc3RlbnQgb3Igbm90XG4gICAgICogQHBhcmFtIGxlZnRCdXR0b24gdGhlIGZpc3QgYnV0dG9uJ3MgdGV4dFxuICAgICAqIEBwYXJhbSBzdWJtaXRGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gc3VibWl0XG4gICAgICogQHBhcmFtIGxvYWRlZEZ1bmN0aW9uIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgcHJvbXB0IGlzIGZ1bGx5IGxvYWRlZFxuICAgICAqIEBwYXJhbSBjbG9zZUZ1bmN0aW9uIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgcHJvbXB0IGlzIGNsb3NlZFxuICAgICAqL1xuICAgIG15Lm9wZW5Ud29CdXR0b25EaWFsb2cgPSBmdW5jdGlvbih0aXRsZVN0cmluZywgbXNnU3RyaW5nLCBwZXJzaXN0ZW50LCBsZWZ0QnV0dG9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtaXRGdW5jdGlvbiwgbG9hZGVkRnVuY3Rpb24sIGNsb3NlRnVuY3Rpb24pIHtcbiAgICAgICAgdmFyIGJ1dHRvbnMgPSB7fTtcbiAgICAgICAgYnV0dG9uc1tsZWZ0QnV0dG9uXSA9IHRydWU7XG4gICAgICAgIGJ1dHRvbnMuQ2FuY2VsID0gZmFsc2U7XG4gICAgICAgICQucHJvbXB0KG1zZ1N0cmluZywge1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlU3RyaW5nLFxuICAgICAgICAgICAgcGVyc2lzdGVudDogZmFsc2UsXG4gICAgICAgICAgICBidXR0b25zOiBidXR0b25zLFxuICAgICAgICAgICAgZGVmYXVsdEJ1dHRvbjogMSxcbiAgICAgICAgICAgIGxvYWRlZDogbG9hZGVkRnVuY3Rpb24sXG4gICAgICAgICAgICBzdWJtaXQ6IHN1Ym1pdEZ1bmN0aW9uLFxuICAgICAgICAgICAgY2xvc2U6IGNsb3NlRnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzIGEgbWVzc2FnZSB0byB0aGUgdXNlciB3aXRoIHR3byBidXR0b25zOiBmaXJzdCBpcyBnaXZlbiBhcyBhIHBhcmFtZXRlciBhbmQgdGhlIHNlY29uZCBpcyBDYW5jZWwuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGVTdHJpbmcgdGhlIHRpdGxlIG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1zZ1N0cmluZyB0aGUgdGV4dCBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBwZXJzaXN0ZW50IGJvb2xlYW4gdmFsdWUgd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtZXNzYWdlIGlzIHBlcnNpc3RlbnQgb3Igbm90XG4gICAgICogQHBhcmFtIGJ1dHRvbnMgb2JqZWN0IHdpdGggdGhlIGJ1dHRvbnMuIFRoZSBrZXlzIG11c3QgYmUgdGhlIG5hbWUgb2YgdGhlIGJ1dHRvbiBhbmQgdmFsdWUgaXMgdGhlIHZhbHVlXG4gICAgICogdGhhdCB3aWxsIGJlIHBhc3NlZCB0byBzdWJtaXRGdW5jdGlvblxuICAgICAqIEBwYXJhbSBzdWJtaXRGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gc3VibWl0XG4gICAgICogQHBhcmFtIGxvYWRlZEZ1bmN0aW9uIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgcHJvbXB0IGlzIGZ1bGx5IGxvYWRlZFxuICAgICAqL1xuICAgIG15Lm9wZW5EaWFsb2cgPSBmdW5jdGlvbih0aXRsZVN0cmluZywgbXNnU3RyaW5nLCBwZXJzaXN0ZW50LCBidXR0b25zLCBzdWJtaXRGdW5jdGlvbiwgbG9hZGVkRnVuY3Rpb24pIHtcbiAgICAgICAgJC5wcm9tcHQobXNnU3RyaW5nLCB7XG4gICAgICAgICAgICB0aXRsZTogdGl0bGVTdHJpbmcsXG4gICAgICAgICAgICBwZXJzaXN0ZW50OiBmYWxzZSxcbiAgICAgICAgICAgIGJ1dHRvbnM6IGJ1dHRvbnMsXG4gICAgICAgICAgICBkZWZhdWx0QnV0dG9uOiAxLFxuICAgICAgICAgICAgbG9hZGVkOiBsb2FkZWRGdW5jdGlvbixcbiAgICAgICAgICAgIHN1Ym1pdDogc3VibWl0RnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzIGEgZGlhbG9nIHdpdGggZGlmZmVyZW50IHN0YXRlcyB0byB0aGUgdXNlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGF0ZXNPYmplY3Qgb2JqZWN0IGNvbnRhaW5pbmcgYWxsIHRoZSBzdGF0ZXMgb2YgdGhlIGRpYWxvZ1xuICAgICAqIEBwYXJhbSBsb2FkZWRGdW5jdGlvbiBmdW5jdGlvbiB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIHByb21wdCBpcyBmdWxseSBsb2FkZWRcbiAgICAgKiBAcGFyYW0gc3RhdGVDaGFuZ2VkRnVuY3Rpb24gZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHN0YXRlIG9mIHRoZSBkaWFsb2cgaXMgY2hhbmdlZFxuICAgICAqL1xuICAgIG15Lm9wZW5EaWFsb2dXaXRoU3RhdGVzID0gZnVuY3Rpb24oc3RhdGVzT2JqZWN0LCBsb2FkZWRGdW5jdGlvbiwgc3RhdGVDaGFuZ2VkRnVuY3Rpb24pIHtcblxuXG4gICAgICAgIHZhciBteVByb21wdCA9ICQucHJvbXB0KHN0YXRlc09iamVjdCk7XG5cbiAgICAgICAgbXlQcm9tcHQub24oJ2ltcHJvbXB0dTpsb2FkZWQnLCBsb2FkZWRGdW5jdGlvbik7XG4gICAgICAgIG15UHJvbXB0Lm9uKCdpbXByb21wdHU6c3RhdGVjaGFuZ2VkJywgc3RhdGVDaGFuZ2VkRnVuY3Rpb24pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPcGVucyBuZXcgcG9wdXAgd2luZG93IGZvciBnaXZlbiA8dHQ+dXJsPC90dD4gY2VudGVyZWQgb3ZlciBjdXJyZW50XG4gICAgICogd2luZG93LlxuICAgICAqXG4gICAgICogQHBhcmFtIHVybCB0aGUgVVJMIHRvIGJlIGRpc3BsYXllZCBpbiB0aGUgcG9wdXAgd2luZG93XG4gICAgICogQHBhcmFtIHcgdGhlIHdpZHRoIG9mIHRoZSBwb3B1cCB3aW5kb3dcbiAgICAgKiBAcGFyYW0gaCB0aGUgaGVpZ2h0IG9mIHRoZSBwb3B1cCB3aW5kb3dcbiAgICAgKiBAcGFyYW0gb25Qb3B1cENsb3NlZCBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiBjYWxsZWQgd2hlbiBwb3B1cCB3aW5kb3dcbiAgICAgKiAgICAgICAgaGFzIGJlZW4gY2xvc2VkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgcG9wdXAgd2luZG93IG9iamVjdCBpZiBvcGVuZWQgc3VjY2Vzc2Z1bGx5IG9yIHVuZGVmaW5lZFxuICAgICAqICAgICAgICAgIGluIGNhc2Ugd2UgZmFpbGVkIHRvIG9wZW4gaXQocG9wdXAgYmxvY2tlZClcbiAgICAgKi9cbiAgICBteS5vcGVuQ2VudGVyZWRQb3B1cCA9IGZ1bmN0aW9uICh1cmwsIHcsIGgsIG9uUG9wdXBDbG9zZWQpIHtcbiAgICAgICAgdmFyIGwgPSB3aW5kb3cuc2NyZWVuWCArICh3aW5kb3cuaW5uZXJXaWR0aCAvIDIpIC0gKHcgLyAyKTtcbiAgICAgICAgdmFyIHQgPSB3aW5kb3cuc2NyZWVuWSArICh3aW5kb3cuaW5uZXJIZWlnaHQgLyAyKSAtIChoIC8gMik7XG4gICAgICAgIHZhciBwb3B1cCA9IHdpbmRvdy5vcGVuKFxuICAgICAgICAgICAgdXJsLCAnX2JsYW5rJyxcbiAgICAgICAgICAgICd0b3A9JyArIHQgKyAnLCBsZWZ0PScgKyBsICsgJywgd2lkdGg9JyArIHcgKyAnLCBoZWlnaHQ9JyArIGggKyAnJyk7XG4gICAgICAgIGlmIChwb3B1cCAmJiBvblBvcHVwQ2xvc2VkKSB7XG4gICAgICAgICAgICB2YXIgcG9sbFRpbWVyID0gd2luZG93LnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocG9wdXAuY2xvc2VkICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChwb2xsVGltZXIpO1xuICAgICAgICAgICAgICAgICAgICBvblBvcHVwQ2xvc2VkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9wdXA7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzIGEgZGlhbG9nIHByb21wdGluZyB0aGUgdXNlciB0byBzZW5kIGFuIGVycm9yIHJlcG9ydC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0aXRsZVN0cmluZyB0aGUgdGl0bGUgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gbXNnU3RyaW5nIHRoZSB0ZXh0IG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIGVycm9yIHRoZSBlcnJvciB0aGF0IGlzIGJlaW5nIHJlcG9ydGVkXG4gICAgICovXG4gICAgbXkub3BlblJlcG9ydERpYWxvZyA9IGZ1bmN0aW9uKHRpdGxlU3RyaW5nLCBtc2dTdHJpbmcsIGVycm9yKSB7XG4gICAgICAgIG15Lm9wZW5NZXNzYWdlRGlhbG9nKHRpdGxlU3RyaW5nLCBtc2dTdHJpbmcpO1xuICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIC8vRklYTUUgc2VuZCB0aGUgZXJyb3IgdG8gdGhlIHNlcnZlclxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAgU2hvd3MgYW4gZXJyb3IgZGlhbG9nIHRvIHRoZSB1c2VyLlxuICAgICAqIEBwYXJhbSB0aXRsZSB0aGUgdGl0bGUgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSB0aGUgdGV4dCBvZiB0aGUgbWVzc2FmZVxuICAgICAqL1xuICAgIG15LnNob3dFcnJvciA9IGZ1bmN0aW9uKHRpdGxlLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmKCEodGl0bGUgfHwgbWVzc2FnZSkpIHtcbiAgICAgICAgICAgIHRpdGxlID0gdGl0bGUgfHwgXCJPb3BzIVwiO1xuICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJUaGVyZSB3YXMgc29tZSBraW5kIG9mIGVycm9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgbWVzc2FnZUhhbmRsZXIub3Blbk1lc3NhZ2VEaWFsb2codGl0bGUsIG1lc3NhZ2UpO1xuICAgIH07XG5cbiAgICBteS5ub3RpZnkgPSBmdW5jdGlvbihkaXNwbGF5TmFtZSwgY2xzLCBtZXNzYWdlKSB7XG4gICAgICAgIHRvYXN0ci5pbmZvKFxuICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibmlja25hbWVcIj4nICtcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZSArXG4gICAgICAgICAgICAnPC9zcGFuPjxicj4nICtcbiAgICAgICAgICAgICc8c3BhbiBjbGFzcz0nICsgY2xzICsgJz4nICtcbiAgICAgICAgICAgICAgICBtZXNzYWdlICtcbiAgICAgICAgICAgICc8L3NwYW4+Jyk7XG4gICAgfTtcblxuICAgIHJldHVybiBteTtcbn0obWVzc2FnZUhhbmRsZXIgfHwge30pKTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZXNzYWdlSGFuZGxlcjtcblxuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgaHJpc3RvIG9uIDEyLzIyLzE0LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBhdmFpbGFibGUgdmlkZW8gd2lkdGguXG4gICAgICovXG4gICAgZ2V0QXZhaWxhYmxlVmlkZW9XaWR0aDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgUGFuZWxUb2dnbGVyID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9TaWRlUGFuZWxUb2dnbGVyXCIpO1xuICAgICAgICB2YXIgcmlnaHRQYW5lbFdpZHRoXG4gICAgICAgICAgICA9IFBhbmVsVG9nZ2xlci5pc1Zpc2libGUoKSA/IFBhbmVsVG9nZ2xlci5nZXRQYW5lbFNpemUoKVswXSA6IDA7XG5cbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIC0gcmlnaHRQYW5lbFdpZHRoO1xuICAgIH1cblxufTsiLCJ2YXIgSml0c2lQb3BvdmVyID0gcmVxdWlyZShcIi4uL3V0aWwvSml0c2lQb3BvdmVyXCIpO1xuXG4vKipcbiAqIENvbnN0cnVjdHMgbmV3IGNvbm5lY3Rpb24gaW5kaWNhdG9yLlxuICogQHBhcmFtIHZpZGVvQ29udGFpbmVyIHRoZSB2aWRlbyBjb250YWluZXIgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmRpY2F0b3IuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29ubmVjdGlvbkluZGljYXRvcih2aWRlb0NvbnRhaW5lciwgamlkLCBWaWRlb0xheW91dClcbntcbiAgICB0aGlzLnZpZGVvQ29udGFpbmVyID0gdmlkZW9Db250YWluZXI7XG4gICAgdGhpcy5iYW5kd2lkdGggPSBudWxsO1xuICAgIHRoaXMucGFja2V0TG9zcyA9IG51bGw7XG4gICAgdGhpcy5iaXRyYXRlID0gbnVsbDtcbiAgICB0aGlzLnNob3dNb3JlVmFsdWUgPSBmYWxzZTtcbiAgICB0aGlzLnJlc29sdXRpb24gPSBudWxsO1xuICAgIHRoaXMudHJhbnNwb3J0ID0gW107XG4gICAgdGhpcy5wb3BvdmVyID0gbnVsbDtcbiAgICB0aGlzLmppZCA9IGppZDtcbiAgICB0aGlzLmNyZWF0ZSgpO1xuICAgIHRoaXMudmlkZW9MYXlvdXQgPSBWaWRlb0xheW91dDtcbn1cblxuLyoqXG4gKiBWYWx1ZXMgZm9yIHRoZSBjb25uZWN0aW9uIHF1YWxpdHlcbiAqIEB0eXBlIHt7OTg6IHN0cmluZyxcbiAqICAgICAgICAgODE6IHN0cmluZyxcbiAqICAgICAgICAgNjQ6IHN0cmluZyxcbiAqICAgICAgICAgNDc6IHN0cmluZyxcbiAqICAgICAgICAgMzA6IHN0cmluZyxcbiAqICAgICAgICAgMDogc3RyaW5nfX1cbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5jb25uZWN0aW9uUXVhbGl0eVZhbHVlcyA9IHtcbiAgICA5ODogXCIxOHB4XCIsIC8vZnVsbFxuICAgIDgxOiBcIjE1cHhcIiwvLzQgYmFyc1xuICAgIDY0OiBcIjExcHhcIiwvLzMgYmFyc1xuICAgIDQ3OiBcIjdweFwiLC8vMiBiYXJzXG4gICAgMzA6IFwiM3B4XCIsLy8xIGJhclxuICAgIDA6IFwiMHB4XCIvL2VtcHR5XG59O1xuXG5Db25uZWN0aW9uSW5kaWNhdG9yLmdldElQID0gZnVuY3Rpb24odmFsdWUpXG57XG4gICAgcmV0dXJuIHZhbHVlLnN1YnN0cmluZygwLCB2YWx1ZS5sYXN0SW5kZXhPZihcIjpcIikpO1xufTtcblxuQ29ubmVjdGlvbkluZGljYXRvci5nZXRQb3J0ID0gZnVuY3Rpb24odmFsdWUpXG57XG4gICAgcmV0dXJuIHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5sYXN0SW5kZXhPZihcIjpcIikgKyAxLCB2YWx1ZS5sZW5ndGgpO1xufTtcblxuQ29ubmVjdGlvbkluZGljYXRvci5nZXRTdHJpbmdGcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICB2YXIgcmVzID0gXCJcIjtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspXG4gICAge1xuICAgICAgICByZXMgKz0gKGkgPT09IDA/IFwiXCIgOiBcIiwgXCIpICsgYXJyYXlbaV07XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyB0aGUgaHRtbCBjb250ZW50LlxuICogQHJldHVybnMge3N0cmluZ30gdGhlIGh0bWwgY29udGVudC5cbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUuZ2VuZXJhdGVUZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkb3dubG9hZEJpdHJhdGUsIHVwbG9hZEJpdHJhdGUsIHBhY2tldExvc3MsIHJlc29sdXRpb24sIGk7XG5cbiAgICBpZih0aGlzLmJpdHJhdGUgPT09IG51bGwpXG4gICAge1xuICAgICAgICBkb3dubG9hZEJpdHJhdGUgPSBcIk4vQVwiO1xuICAgICAgICB1cGxvYWRCaXRyYXRlID0gXCJOL0FcIjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgZG93bmxvYWRCaXRyYXRlID1cbiAgICAgICAgICAgIHRoaXMuYml0cmF0ZS5kb3dubG9hZD8gdGhpcy5iaXRyYXRlLmRvd25sb2FkICsgXCIgS2Jwc1wiIDogXCJOL0FcIjtcbiAgICAgICAgdXBsb2FkQml0cmF0ZSA9XG4gICAgICAgICAgICB0aGlzLmJpdHJhdGUudXBsb2FkPyB0aGlzLmJpdHJhdGUudXBsb2FkICsgXCIgS2Jwc1wiIDogXCJOL0FcIjtcbiAgICB9XG5cbiAgICBpZih0aGlzLnBhY2tldExvc3MgPT09IG51bGwpXG4gICAge1xuICAgICAgICBwYWNrZXRMb3NzID0gXCJOL0FcIjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcblxuICAgICAgICBwYWNrZXRMb3NzID0gXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2dyZWVuJz4mZGFycjs8L3NwYW4+XCIgK1xuICAgICAgICAgICAgKHRoaXMucGFja2V0TG9zcy5kb3dubG9hZCAhPT0gbnVsbD8gdGhpcy5wYWNrZXRMb3NzLmRvd25sb2FkIDogXCJOL0FcIikgK1xuICAgICAgICAgICAgXCIlIDxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfb3JhbmdlJz4mdWFycjs8L3NwYW4+XCIgK1xuICAgICAgICAgICAgKHRoaXMucGFja2V0TG9zcy51cGxvYWQgIT09IG51bGw/IHRoaXMucGFja2V0TG9zcy51cGxvYWQgOiBcIk4vQVwiKSArIFwiJVwiO1xuICAgIH1cblxuICAgIHZhciByZXNvbHV0aW9uVmFsdWUgPSBudWxsO1xuICAgIGlmKHRoaXMucmVzb2x1dGlvbilcbiAgICB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5yZXNvbHV0aW9uKTtcbiAgICAgICAgaWYoa2V5cy5sZW5ndGggPT0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yKHZhciBzc3JjIGluIHRoaXMucmVzb2x1dGlvbilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uVmFsdWUgPSB0aGlzLnJlc29sdXRpb25bc3NyY107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihrZXlzLmxlbmd0aCA+IDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5ZWRTc3JjID0gc2ltdWxjYXN0LmdldFJlY2VpdmluZ1NTUkModGhpcy5qaWQpO1xuICAgICAgICAgICAgcmVzb2x1dGlvblZhbHVlID0gdGhpcy5yZXNvbHV0aW9uW2Rpc3BsYXllZFNzcmNdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYodGhpcy5qaWQgPT09IG51bGwpXG4gICAge1xuICAgICAgICByZXNvbHV0aW9uID0gXCJcIjtcbiAgICAgICAgaWYodGhpcy5yZXNvbHV0aW9uID09PSBudWxsIHx8ICFPYmplY3Qua2V5cyh0aGlzLnJlc29sdXRpb24pIHx8XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLnJlc29sdXRpb24pLmxlbmd0aCA9PT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgcmVzb2x1dGlvbiA9IFwiTi9BXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZm9yKGkgaW4gdGhpcy5yZXNvbHV0aW9uKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc29sdXRpb25WYWx1ZSA9IHRoaXMucmVzb2x1dGlvbltpXTtcbiAgICAgICAgICAgICAgICBpZihyZXNvbHV0aW9uVmFsdWUpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNvbHV0aW9uVmFsdWUuaGVpZ2h0ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uVmFsdWUud2lkdGgpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdXRpb24gKz0gKHJlc29sdXRpb24gPT09IFwiXCI/IFwiXCIgOiBcIiwgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHV0aW9uVmFsdWUud2lkdGggKyBcInhcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvblZhbHVlLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZighcmVzb2x1dGlvblZhbHVlIHx8XG4gICAgICAgICFyZXNvbHV0aW9uVmFsdWUuaGVpZ2h0IHx8XG4gICAgICAgICFyZXNvbHV0aW9uVmFsdWUud2lkdGgpXG4gICAge1xuICAgICAgICByZXNvbHV0aW9uID0gXCJOL0FcIjtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgcmVzb2x1dGlvbiA9IHJlc29sdXRpb25WYWx1ZS53aWR0aCArIFwieFwiICsgcmVzb2x1dGlvblZhbHVlLmhlaWdodDtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPlwiICtcbiAgICAgICAgXCI8dHI+XCIgK1xuICAgICAgICBcIjx0ZD48c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkJpdHJhdGU6PC9zcGFuPjwvdGQ+XCIgK1xuICAgICAgICBcIjx0ZD48c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2dyZWVuJz4mZGFycjs8L3NwYW4+XCIgK1xuICAgICAgICBkb3dubG9hZEJpdHJhdGUgKyBcIiA8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX29yYW5nZSc+JnVhcnI7PC9zcGFuPlwiICtcbiAgICAgICAgdXBsb2FkQml0cmF0ZSArIFwiPC90ZD5cIiArXG4gICAgICAgIFwiPC90cj48dHI+XCIgK1xuICAgICAgICBcIjx0ZD48c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPlBhY2tldCBsb3NzOiA8L3NwYW4+PC90ZD5cIiArXG4gICAgICAgIFwiPHRkPlwiICsgcGFja2V0TG9zcyAgKyBcIjwvdGQ+XCIgK1xuICAgICAgICBcIjwvdHI+PHRyPlwiICtcbiAgICAgICAgXCI8dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5SZXNvbHV0aW9uOjwvc3Bhbj48L3RkPlwiICtcbiAgICAgICAgXCI8dGQ+XCIgKyByZXNvbHV0aW9uICsgXCI8L3RkPjwvdHI+PC90YWJsZT5cIjtcblxuICAgIGlmKHRoaXMudmlkZW9Db250YWluZXIuaWQgPT0gXCJsb2NhbFZpZGVvQ29udGFpbmVyXCIpXG4gICAgICAgIHJlc3VsdCArPSBcIjxkaXYgY2xhc3M9XFxcImppdHNpcG9wb3Zlcl9zaG93bW9yZVxcXCIgXCIgK1xuICAgICAgICAgICAgXCJvbmNsaWNrID0gXFxcIlVJLmNvbm5lY3Rpb25JbmRpY2F0b3JTaG93TW9yZSgnXCIgK1xuICAgICAgICAgICAgdGhpcy52aWRlb0NvbnRhaW5lci5pZCArIFwiJylcXFwiPlwiICtcbiAgICAgICAgICAgICh0aGlzLnNob3dNb3JlVmFsdWU/IFwiU2hvdyBsZXNzXCIgOiBcIlNob3cgTW9yZVwiKSArIFwiPC9kaXY+PGJyIC8+XCI7XG5cbiAgICBpZih0aGlzLnNob3dNb3JlVmFsdWUpXG4gICAge1xuICAgICAgICB2YXIgZG93bmxvYWRCYW5kd2lkdGgsIHVwbG9hZEJhbmR3aWR0aCwgdHJhbnNwb3J0O1xuICAgICAgICBpZih0aGlzLmJhbmR3aWR0aCA9PT0gbnVsbClcbiAgICAgICAge1xuICAgICAgICAgICAgZG93bmxvYWRCYW5kd2lkdGggPSBcIk4vQVwiO1xuICAgICAgICAgICAgdXBsb2FkQmFuZHdpZHRoID0gXCJOL0FcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIGRvd25sb2FkQmFuZHdpZHRoID0gdGhpcy5iYW5kd2lkdGguZG93bmxvYWQ/XG4gICAgICAgICAgICAgICAgdGhpcy5iYW5kd2lkdGguZG93bmxvYWQgKyBcIiBLYnBzXCIgOlxuICAgICAgICAgICAgICAgIFwiTi9BXCI7XG4gICAgICAgICAgICB1cGxvYWRCYW5kd2lkdGggPSB0aGlzLmJhbmR3aWR0aC51cGxvYWQ/XG4gICAgICAgICAgICAgICAgdGhpcy5iYW5kd2lkdGgudXBsb2FkICsgXCIgS2Jwc1wiIDpcbiAgICAgICAgICAgICAgICBcIk4vQVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIXRoaXMudHJhbnNwb3J0IHx8IHRoaXMudHJhbnNwb3J0Lmxlbmd0aCA9PT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gXCI8dHI+XCIgK1xuICAgICAgICAgICAgICAgIFwiPHRkPjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+QWRkcmVzczo8L3NwYW4+PC90ZD5cIiArXG4gICAgICAgICAgICAgICAgXCI8dGQ+IE4vQTwvdGQ+PC90cj5cIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0ge3JlbW90ZUlQOiBbXSwgbG9jYWxJUDpbXSwgcmVtb3RlUG9ydDpbXSwgbG9jYWxQb3J0OltdfTtcbiAgICAgICAgICAgIGZvcihpID0gMDsgaSA8IHRoaXMudHJhbnNwb3J0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZhciBpcCA9ICBDb25uZWN0aW9uSW5kaWNhdG9yLmdldElQKHRoaXMudHJhbnNwb3J0W2ldLmlwKTtcbiAgICAgICAgICAgICAgICB2YXIgcG9ydCA9IENvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0UG9ydCh0aGlzLnRyYW5zcG9ydFtpXS5pcCk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2FsSVAgPVxuICAgICAgICAgICAgICAgICAgICBDb25uZWN0aW9uSW5kaWNhdG9yLmdldElQKHRoaXMudHJhbnNwb3J0W2ldLmxvY2FsaXApO1xuICAgICAgICAgICAgICAgIHZhciBsb2NhbFBvcnQgPVxuICAgICAgICAgICAgICAgICAgICBDb25uZWN0aW9uSW5kaWNhdG9yLmdldFBvcnQodGhpcy50cmFuc3BvcnRbaV0ubG9jYWxpcCk7XG4gICAgICAgICAgICAgICAgaWYoZGF0YS5yZW1vdGVJUC5pbmRleE9mKGlwKSA9PSAtMSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEucmVtb3RlSVAucHVzaChpcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYoZGF0YS5yZW1vdGVQb3J0LmluZGV4T2YocG9ydCkgPT0gLTEpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnJlbW90ZVBvcnQucHVzaChwb3J0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihkYXRhLmxvY2FsSVAuaW5kZXhPZihsb2NhbElQKSA9PSAtMSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubG9jYWxJUC5wdXNoKGxvY2FsSVApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKGRhdGEubG9jYWxQb3J0LmluZGV4T2YobG9jYWxQb3J0KSA9PSAtMSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubG9jYWxQb3J0LnB1c2gobG9jYWxQb3J0KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsb2NhbFRyYW5zcG9ydCA9XG4gICAgICAgICAgICAgICAgXCI8dHI+PHRkPjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+TG9jYWwgYWRkcmVzc1wiICtcbiAgICAgICAgICAgICAgICAoZGF0YS5sb2NhbElQLmxlbmd0aCA+IDE/IFwiZXNcIiA6IFwiXCIpICsgXCI6IDwvc3Bhbj48L3RkPjx0ZD4gXCIgK1xuICAgICAgICAgICAgICAgIENvbm5lY3Rpb25JbmRpY2F0b3IuZ2V0U3RyaW5nRnJvbUFycmF5KGRhdGEubG9jYWxJUCkgK1xuICAgICAgICAgICAgICAgIFwiPC90ZD48L3RyPlwiO1xuICAgICAgICAgICAgdHJhbnNwb3J0ID1cbiAgICAgICAgICAgICAgICBcIjx0cj48dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5SZW1vdGUgYWRkcmVzc1wiK1xuICAgICAgICAgICAgICAgIChkYXRhLnJlbW90ZUlQLmxlbmd0aCA+IDE/IFwiZXNcIiA6IFwiXCIpICsgXCI6PC9zcGFuPjwvdGQ+PHRkPiBcIiArXG4gICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRTdHJpbmdGcm9tQXJyYXkoZGF0YS5yZW1vdGVJUCkgK1xuICAgICAgICAgICAgICAgIFwiPC90ZD48L3RyPlwiO1xuICAgICAgICAgICAgaWYodGhpcy50cmFuc3BvcnQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFuc3BvcnQgKz0gXCI8dHI+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjx0ZD5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5SZW1vdGUgcG9ydHM6PC9zcGFuPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8L3RkPjx0ZD5cIjtcbiAgICAgICAgICAgICAgICBsb2NhbFRyYW5zcG9ydCArPSBcIjx0cj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHRkPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkxvY2FsIHBvcnRzOjwvc3Bhbj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPC90ZD48dGQ+XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNwb3J0ICs9XG4gICAgICAgICAgICAgICAgICAgIFwiPHRyPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8dGQ+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+UmVtb3RlIHBvcnQ6PC9zcGFuPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8L3RkPjx0ZD5cIjtcbiAgICAgICAgICAgICAgICBsb2NhbFRyYW5zcG9ydCArPVxuICAgICAgICAgICAgICAgICAgICBcIjx0cj5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPHRkPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX2JsdWUnPkxvY2FsIHBvcnQ6PC9zcGFuPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCI8L3RkPjx0ZD5cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJhbnNwb3J0ICs9XG4gICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRTdHJpbmdGcm9tQXJyYXkoZGF0YS5yZW1vdGVQb3J0KTtcbiAgICAgICAgICAgIGxvY2FsVHJhbnNwb3J0ICs9XG4gICAgICAgICAgICAgICAgQ29ubmVjdGlvbkluZGljYXRvci5nZXRTdHJpbmdGcm9tQXJyYXkoZGF0YS5sb2NhbFBvcnQpO1xuICAgICAgICAgICAgdHJhbnNwb3J0ICs9IFwiPC90ZD48L3RyPlwiO1xuICAgICAgICAgICAgdHJhbnNwb3J0ICs9IGxvY2FsVHJhbnNwb3J0ICsgXCI8L3RkPjwvdHI+XCI7XG4gICAgICAgICAgICB0cmFuc3BvcnQgKz1cIjx0cj5cIiArXG4gICAgICAgICAgICAgICAgXCI8dGQ+PHNwYW4gY2xhc3M9J2ppdHNpcG9wb3Zlcl9ibHVlJz5UcmFuc3BvcnQ6PC9zcGFuPjwvdGQ+XCIgK1xuICAgICAgICAgICAgICAgIFwiPHRkPlwiICsgdGhpcy50cmFuc3BvcnRbMF0udHlwZSArIFwiPC90ZD48L3RyPlwiO1xuXG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHQgKz0gXCI8dGFibGUgIHN0eWxlPSd3aWR0aDoxMDAlJz5cIiArXG4gICAgICAgICAgICBcIjx0cj5cIiArXG4gICAgICAgICAgICBcIjx0ZD5cIiArXG4gICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfYmx1ZSc+RXN0aW1hdGVkIGJhbmR3aWR0aDo8L3NwYW4+XCIgK1xuICAgICAgICAgICAgXCI8L3RkPjx0ZD5cIiArXG4gICAgICAgICAgICBcIjxzcGFuIGNsYXNzPSdqaXRzaXBvcG92ZXJfZ3JlZW4nPiZkYXJyOzwvc3Bhbj5cIiArXG4gICAgICAgICAgICBkb3dubG9hZEJhbmR3aWR0aCArXG4gICAgICAgICAgICBcIiA8c3BhbiBjbGFzcz0naml0c2lwb3BvdmVyX29yYW5nZSc+JnVhcnI7PC9zcGFuPlwiICtcbiAgICAgICAgICAgIHVwbG9hZEJhbmR3aWR0aCArIFwiPC90ZD48L3RyPlwiO1xuXG4gICAgICAgIHJlc3VsdCArPSB0cmFuc3BvcnQgKyBcIjwvdGFibGU+XCI7XG5cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBTaG93cyBvciBoaWRlIHRoZSBhZGRpdGlvbmFsIGluZm9ybWF0aW9uLlxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS5zaG93TW9yZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNob3dNb3JlVmFsdWUgPSAhdGhpcy5zaG93TW9yZVZhbHVlO1xuICAgIHRoaXMudXBkYXRlUG9wb3ZlckRhdGEoKTtcbn07XG5cblxuZnVuY3Rpb24gY3JlYXRlSWNvbihjbGFzc2VzKVxue1xuICAgIHZhciBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgZm9yKHZhciBpIGluIGNsYXNzZXMpXG4gICAge1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tpXSk7XG4gICAgfVxuICAgIGljb24uYXBwZW5kQ2hpbGQoXG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpXCIpKS5jbGFzc0xpc3QuYWRkKFwiaWNvbi1jb25uZWN0aW9uXCIpO1xuICAgIHJldHVybiBpY29uO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGluZGljYXRvclxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIuY2xhc3NOYW1lID0gXCJjb25uZWN0aW9uaW5kaWNhdG9yXCI7XG4gICAgdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB0aGlzLnZpZGVvQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lcik7XG4gICAgdGhpcy5wb3BvdmVyID0gbmV3IEppdHNpUG9wb3ZlcihcbiAgICAgICAgJChcIiNcIiArIHRoaXMudmlkZW9Db250YWluZXIuaWQgKyBcIiA+IC5jb25uZWN0aW9uaW5kaWNhdG9yXCIpLFxuICAgICAgICB7Y29udGVudDogXCI8ZGl2IGNsYXNzPVxcXCJjb25uZWN0aW9uX2luZm9cXFwiPkNvbWUgYmFjayBoZXJlIGZvciBcIiArXG4gICAgICAgICAgICBcImNvbm5lY3Rpb24gaW5mb3JtYXRpb24gb25jZSB0aGUgY29uZmVyZW5jZSBzdGFydHM8L2Rpdj5cIixcbiAgICAgICAgICAgIHNraW46IFwiYmxhY2tcIn0pO1xuXG4gICAgdGhpcy5lbXB0eUljb24gPSB0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGNyZWF0ZUljb24oW1wiY29ubmVjdGlvblwiLCBcImNvbm5lY3Rpb25fZW1wdHlcIl0pKTtcbiAgICB0aGlzLmZ1bGxJY29uID0gdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLmFwcGVuZENoaWxkKFxuICAgICAgICBjcmVhdGVJY29uKFtcImNvbm5lY3Rpb25cIiwgXCJjb25uZWN0aW9uX2Z1bGxcIl0pKTtcblxufTtcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBpbmRpY2F0b3JcbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oKVxue1xuICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICB0aGlzLnBvcG92ZXIuZm9yY2VIaWRlKCk7XG5cbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZGF0YSBvZiB0aGUgaW5kaWNhdG9yXG4gKiBAcGFyYW0gcGVyY2VudCB0aGUgcGVyY2VudCBvZiBjb25uZWN0aW9uIHF1YWxpdHlcbiAqIEBwYXJhbSBvYmplY3QgdGhlIHN0YXRpc3RpY3MgZGF0YS5cbiAqL1xuQ29ubmVjdGlvbkluZGljYXRvci5wcm90b3R5cGUudXBkYXRlQ29ubmVjdGlvblF1YWxpdHkgPVxuZnVuY3Rpb24gKHBlcmNlbnQsIG9iamVjdCkge1xuXG4gICAgaWYocGVyY2VudCA9PT0gbnVsbClcbiAgICB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIHRoaXMucG9wb3Zlci5mb3JjZUhpZGUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICBpZih0aGlzLmNvbm5lY3Rpb25JbmRpY2F0b3JDb250YWluZXIuc3R5bGUuZGlzcGxheSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uSW5kaWNhdG9yQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICB0aGlzLnZpZGVvTGF5b3V0LnVwZGF0ZU11dGVQb3NpdGlvbih0aGlzLnZpZGVvQ29udGFpbmVyLmlkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmJhbmR3aWR0aCA9IG9iamVjdC5iYW5kd2lkdGg7XG4gICAgdGhpcy5iaXRyYXRlID0gb2JqZWN0LmJpdHJhdGU7XG4gICAgdGhpcy5wYWNrZXRMb3NzID0gb2JqZWN0LnBhY2tldExvc3M7XG4gICAgdGhpcy50cmFuc3BvcnQgPSBvYmplY3QudHJhbnNwb3J0O1xuICAgIGlmKG9iamVjdC5yZXNvbHV0aW9uKVxuICAgIHtcbiAgICAgICAgdGhpcy5yZXNvbHV0aW9uID0gb2JqZWN0LnJlc29sdXRpb247XG4gICAgfVxuICAgIGZvcih2YXIgcXVhbGl0eSBpbiBDb25uZWN0aW9uSW5kaWNhdG9yLmNvbm5lY3Rpb25RdWFsaXR5VmFsdWVzKVxuICAgIHtcbiAgICAgICAgaWYocGVyY2VudCA+PSBxdWFsaXR5KVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmZ1bGxJY29uLnN0eWxlLndpZHRoID1cbiAgICAgICAgICAgICAgICBDb25uZWN0aW9uSW5kaWNhdG9yLmNvbm5lY3Rpb25RdWFsaXR5VmFsdWVzW3F1YWxpdHldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMudXBkYXRlUG9wb3ZlckRhdGEoKTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgcmVzb2x1dGlvblxuICogQHBhcmFtIHJlc29sdXRpb24gdGhlIG5ldyByZXNvbHV0aW9uXG4gKi9cbkNvbm5lY3Rpb25JbmRpY2F0b3IucHJvdG90eXBlLnVwZGF0ZVJlc29sdXRpb24gPSBmdW5jdGlvbiAocmVzb2x1dGlvbikge1xuICAgIHRoaXMucmVzb2x1dGlvbiA9IHJlc29sdXRpb247XG4gICAgdGhpcy51cGRhdGVQb3BvdmVyRGF0YSgpO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBjb250ZW50IG9mIHRoZSBwb3BvdmVyXG4gKi9cbkNvbm5lY3Rpb25JbmRpY2F0b3IucHJvdG90eXBlLnVwZGF0ZVBvcG92ZXJEYXRhID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9wb3Zlci51cGRhdGVDb250ZW50KFxuICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPVxcXCJjb25uZWN0aW9uX2luZm9cXFwiPlwiICsgdGhpcy5nZW5lcmF0ZVRleHQoKSArIFwiPC9kaXY+XCIpO1xufTtcblxuLyoqXG4gKiBIaWRlcyB0aGUgcG9wb3ZlclxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucG9wb3Zlci5mb3JjZUhpZGUoKTtcbn07XG5cbi8qKlxuICogSGlkZXMgdGhlIGluZGljYXRvclxuICovXG5Db25uZWN0aW9uSW5kaWNhdG9yLnByb3RvdHlwZS5oaWRlSW5kaWNhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY29ubmVjdGlvbkluZGljYXRvckNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgaWYodGhpcy5wb3BvdmVyKVxuICAgICAgICB0aGlzLnBvcG92ZXIuZm9yY2VIaWRlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25JbmRpY2F0b3I7IiwidmFyIEF1ZGlvTGV2ZWxzID0gcmVxdWlyZShcIi4uL2F1ZGlvX2xldmVscy9BdWRpb0xldmVsc1wiKTtcbnZhciBBdmF0YXIgPSByZXF1aXJlKFwiLi4vYXZhdGFyL0F2YXRhclwiKTtcbnZhciBDaGF0ID0gcmVxdWlyZShcIi4uL3NpZGVfcGFubmVscy9jaGF0L0NoYXRcIik7XG52YXIgQ29udGFjdExpc3QgPSByZXF1aXJlKFwiLi4vc2lkZV9wYW5uZWxzL2NvbnRhY3RsaXN0L0NvbnRhY3RMaXN0XCIpO1xudmFyIFVJVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsL1VJVXRpbFwiKTtcbnZhciBDb25uZWN0aW9uSW5kaWNhdG9yID0gcmVxdWlyZShcIi4vQ29ubmVjdGlvbkluZGljYXRvclwiKTtcblxudmFyIGN1cnJlbnREb21pbmFudFNwZWFrZXIgPSBudWxsO1xudmFyIGxhc3ROQ291bnQgPSBjb25maWcuY2hhbm5lbExhc3ROO1xudmFyIGxvY2FsTGFzdE5Db3VudCA9IGNvbmZpZy5jaGFubmVsTGFzdE47XG52YXIgbG9jYWxMYXN0TlNldCA9IFtdO1xudmFyIGxhc3RORW5kcG9pbnRzQ2FjaGUgPSBbXTtcbnZhciBsYXN0TlBpY2t1cEppZCA9IG51bGw7XG52YXIgbGFyZ2VWaWRlb1N0YXRlID0ge1xuICAgIHVwZGF0ZUluUHJvZ3Jlc3M6IGZhbHNlLFxuICAgIG5ld1NyYzogJydcbn07XG5cbnZhciBkZWZhdWx0TG9jYWxEaXNwbGF5TmFtZSA9IFwiTWVcIjtcblxuLyoqXG4gKiBTZXRzIHRoZSBkaXNwbGF5IG5hbWUgZm9yIHRoZSBnaXZlbiB2aWRlbyBzcGFuIGlkLlxuICovXG5mdW5jdGlvbiBzZXREaXNwbGF5TmFtZSh2aWRlb1NwYW5JZCwgZGlzcGxheU5hbWUpIHtcbiAgICB2YXIgbmFtZVNwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLmRpc3BsYXluYW1lJyk7XG4gICAgdmFyIGRlZmF1bHRMb2NhbERpc3BsYXlOYW1lID0gaW50ZXJmYWNlQ29uZmlnLkRFRkFVTFRfTE9DQUxfRElTUExBWV9OQU1FO1xuXG4gICAgLy8gSWYgd2UgYWxyZWFkeSBoYXZlIGEgZGlzcGxheSBuYW1lIGZvciB0aGlzIHZpZGVvLlxuICAgIGlmIChuYW1lU3Bhbi5sZW5ndGggPiAwKSB7XG4gICAgICAgIHZhciBuYW1lU3BhbkVsZW1lbnQgPSBuYW1lU3Bhbi5nZXQoMCk7XG5cbiAgICAgICAgaWYgKG5hbWVTcGFuRWxlbWVudC5pZCA9PT0gJ2xvY2FsRGlzcGxheU5hbWUnICYmXG4gICAgICAgICAgICAkKCcjbG9jYWxEaXNwbGF5TmFtZScpLnRleHQoKSAhPT0gZGlzcGxheU5hbWUpIHtcbiAgICAgICAgICAgIGlmIChkaXNwbGF5TmFtZSAmJiBkaXNwbGF5TmFtZS5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJykuaHRtbChkaXNwbGF5TmFtZSArICcgKG1lKScpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJykudGV4dChkZWZhdWx0TG9jYWxEaXNwbGF5TmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkICsgJ19uYW1lJykuaHRtbChkaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZCArICdfbmFtZScpLnRleHQoaW50ZXJmYWNlQ29uZmlnLkRFRkFVTFRfUkVNT1RFX0RJU1BMQVlfTkFNRSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZWRpdEJ1dHRvbiA9IG51bGw7XG5cbiAgICAgICAgbmFtZVNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIG5hbWVTcGFuLmNsYXNzTmFtZSA9ICdkaXNwbGF5bmFtZSc7XG4gICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQpWzBdLmFwcGVuZENoaWxkKG5hbWVTcGFuKTtcblxuICAgICAgICBpZiAodmlkZW9TcGFuSWQgPT09ICdsb2NhbFZpZGVvQ29udGFpbmVyJykge1xuICAgICAgICAgICAgZWRpdEJ1dHRvbiA9IGNyZWF0ZUVkaXREaXNwbGF5TmFtZUJ1dHRvbigpO1xuICAgICAgICAgICAgbmFtZVNwYW4uaW5uZXJUZXh0ID0gZGVmYXVsdExvY2FsRGlzcGxheU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuYW1lU3Bhbi5pbm5lclRleHQgPSBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9SRU1PVEVfRElTUExBWV9OQU1FO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRpc3BsYXlOYW1lICYmIGRpc3BsYXlOYW1lLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG5hbWVTcGFuLmlubmVyVGV4dCA9IGRpc3BsYXlOYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlZGl0QnV0dG9uKSB7XG4gICAgICAgICAgICBuYW1lU3Bhbi5pZCA9IHZpZGVvU3BhbklkICsgJ19uYW1lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hbWVTcGFuLmlkID0gJ2xvY2FsRGlzcGxheU5hbWUnO1xuICAgICAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZClbMF0uYXBwZW5kQ2hpbGQoZWRpdEJ1dHRvbik7XG5cbiAgICAgICAgICAgIHZhciBlZGl0YWJsZVRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgZWRpdGFibGVUZXh0LmNsYXNzTmFtZSA9ICdkaXNwbGF5bmFtZSc7XG4gICAgICAgICAgICBlZGl0YWJsZVRleHQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgICAgIGVkaXRhYmxlVGV4dC5pZCA9ICdlZGl0RGlzcGxheU5hbWUnO1xuXG4gICAgICAgICAgICBpZiAoZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZWRpdGFibGVUZXh0LnZhbHVlXG4gICAgICAgICAgICAgICAgICAgID0gZGlzcGxheU5hbWUuc3Vic3RyaW5nKDAsIGRpc3BsYXlOYW1lLmluZGV4T2YoJyAobWUpJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlZGl0YWJsZVRleHQuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmU7Jyk7XG4gICAgICAgICAgICBlZGl0YWJsZVRleHQuc2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicsICdleC4gSmFuZSBQaW5rJyk7XG4gICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkKVswXS5hcHBlbmRDaGlsZChlZGl0YWJsZVRleHQpO1xuXG4gICAgICAgICAgICAkKCcjbG9jYWxWaWRlb0NvbnRhaW5lciAuZGlzcGxheW5hbWUnKVxuICAgICAgICAgICAgICAgIC5iaW5kKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGUpIHtcblxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICQoJyNsb2NhbERpc3BsYXlOYW1lJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjZWRpdERpc3BsYXlOYW1lJykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAkKCcjZWRpdERpc3BsYXlOYW1lJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnI2VkaXREaXNwbGF5TmFtZScpLnNlbGVjdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICQoJyNlZGl0RGlzcGxheU5hbWUnKS5vbmUoXCJmb2N1c291dFwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuaW5wdXREaXNwbGF5TmFtZUhhbmRsZXIodGhpcy52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICQoJyNlZGl0RGlzcGxheU5hbWUnKS5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5pbnB1dERpc3BsYXlOYW1lSGFuZGxlcih0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogR2V0cyB0aGUgc2VsZWN0b3Igb2YgdmlkZW8gdGh1bWJuYWlsIGNvbnRhaW5lciBmb3IgdGhlIHVzZXIgaWRlbnRpZmllZCBieVxuICogZ2l2ZW4gPHR0PnVzZXJKaWQ8L3R0PlxuICogQHBhcmFtIHJlc291cmNlSmlkIHVzZXIncyBKaWQgZm9yIHdob20gd2Ugd2FudCB0byBnZXQgdGhlIHZpZGVvIGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gZ2V0UGFydGljaXBhbnRDb250YWluZXIocmVzb3VyY2VKaWQpXG57XG4gICAgaWYgKCFyZXNvdXJjZUppZClcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICBpZiAocmVzb3VyY2VKaWQgPT09IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpKVxuICAgICAgICByZXR1cm4gJChcIiNsb2NhbFZpZGVvQ29udGFpbmVyXCIpO1xuICAgIGVsc2VcbiAgICAgICAgcmV0dXJuICQoXCIjcGFydGljaXBhbnRfXCIgKyByZXNvdXJjZUppZCk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgc2l6ZSBhbmQgcG9zaXRpb24gb2YgdGhlIGdpdmVuIHZpZGVvIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHZpZGVvIHRoZSB2aWRlbyBlbGVtZW50IHRvIHBvc2l0aW9uXG4gKiBAcGFyYW0gd2lkdGggdGhlIGRlc2lyZWQgdmlkZW8gd2lkdGhcbiAqIEBwYXJhbSBoZWlnaHQgdGhlIGRlc2lyZWQgdmlkZW8gaGVpZ2h0XG4gKiBAcGFyYW0gaG9yaXpvbnRhbEluZGVudCB0aGUgbGVmdCBhbmQgcmlnaHQgaW5kZW50XG4gKiBAcGFyYW0gdmVydGljYWxJbmRlbnQgdGhlIHRvcCBhbmQgYm90dG9tIGluZGVudFxuICovXG5mdW5jdGlvbiBwb3NpdGlvblZpZGVvKHZpZGVvLFxuICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsSW5kZW50LFxuICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbEluZGVudCkge1xuICAgIHZpZGVvLndpZHRoKHdpZHRoKTtcbiAgICB2aWRlby5oZWlnaHQoaGVpZ2h0KTtcbiAgICB2aWRlby5jc3MoeyAgdG9wOiB2ZXJ0aWNhbEluZGVudCArICdweCcsXG4gICAgICAgIGJvdHRvbTogdmVydGljYWxJbmRlbnQgKyAncHgnLFxuICAgICAgICBsZWZ0OiBob3Jpem9udGFsSW5kZW50ICsgJ3B4JyxcbiAgICAgICAgcmlnaHQ6IGhvcml6b250YWxJbmRlbnQgKyAncHgnfSk7XG59XG5cbi8qKlxuICogQWRkcyB0aGUgcmVtb3RlIHZpZGVvIG1lbnUgZWxlbWVudCBmb3IgdGhlIGdpdmVuIDx0dD5qaWQ8L3R0PiBpbiB0aGVcbiAqIGdpdmVuIDx0dD5wYXJlbnRFbGVtZW50PC90dD4uXG4gKlxuICogQHBhcmFtIGppZCB0aGUgamlkIGluZGljYXRpbmcgdGhlIHZpZGVvIGZvciB3aGljaCB3ZSdyZSBhZGRpbmcgYSBtZW51LlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIHBhcmVudCBlbGVtZW50IHdoZXJlIHRoaXMgbWVudSB3aWxsIGJlIGFkZGVkXG4gKi9cbmZ1bmN0aW9uIGFkZFJlbW90ZVZpZGVvTWVudShqaWQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICB2YXIgc3BhbkVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgc3BhbkVsZW1lbnQuY2xhc3NOYW1lID0gJ3JlbW90ZXZpZGVvbWVudSc7XG5cbiAgICBwYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKHNwYW5FbGVtZW50KTtcblxuICAgIHZhciBtZW51RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICBtZW51RWxlbWVudC5jbGFzc05hbWUgPSAnZmEgZmEtYW5nbGUtZG93bic7XG4gICAgbWVudUVsZW1lbnQudGl0bGUgPSAnUmVtb3RlIHVzZXIgY29udHJvbHMnO1xuICAgIHNwYW5FbGVtZW50LmFwcGVuZENoaWxkKG1lbnVFbGVtZW50KTtcblxuLy8gICAgICAgIDx1bCBjbGFzcz1cInBvcHVwbWVudVwiPlxuLy8gICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk11dGU8L2E+PC9saT5cbi8vICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5FamVjdDwvYT48L2xpPlxuLy8gICAgICAgIDwvdWw+XG5cbiAgICB2YXIgcG9wdXBtZW51RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgcG9wdXBtZW51RWxlbWVudC5jbGFzc05hbWUgPSAncG9wdXBtZW51JztcbiAgICBwb3B1cG1lbnVFbGVtZW50LmlkXG4gICAgICAgID0gJ3JlbW90ZV9wb3B1cG1lbnVfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgc3BhbkVsZW1lbnQuYXBwZW5kQ2hpbGQocG9wdXBtZW51RWxlbWVudCk7XG5cbiAgICB2YXIgbXV0ZU1lbnVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICB2YXIgbXV0ZUxpbmtJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG4gICAgdmFyIG11dGVkSW5kaWNhdG9yID0gXCI8aSBjbGFzcz0naWNvbi1taWMtZGlzYWJsZWQnPjwvaT5cIjtcblxuICAgIGlmICghbXV0ZWRBdWRpb3NbamlkXSkge1xuICAgICAgICBtdXRlTGlua0l0ZW0uaW5uZXJIVE1MID0gbXV0ZWRJbmRpY2F0b3IgKyAnTXV0ZSc7XG4gICAgICAgIG11dGVMaW5rSXRlbS5jbGFzc05hbWUgPSAnbXV0ZWxpbmsnO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbXV0ZUxpbmtJdGVtLmlubmVySFRNTCA9IG11dGVkSW5kaWNhdG9yICsgJyBNdXRlZCc7XG4gICAgICAgIG11dGVMaW5rSXRlbS5jbGFzc05hbWUgPSAnbXV0ZWxpbmsgZGlzYWJsZWQnO1xuICAgIH1cblxuICAgIG11dGVMaW5rSXRlbS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYgKCQodGhpcykuYXR0cignZGlzYWJsZWQnKSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzTXV0ZSA9IG11dGVkQXVkaW9zW2ppZF0gPT0gdHJ1ZTtcbiAgICAgICAgY29ubmVjdGlvbi5tb2RlcmF0ZS5zZXRNdXRlKGppZCwgIWlzTXV0ZSk7XG4gICAgICAgIHBvcHVwbWVudUVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsICdkaXNwbGF5Om5vbmU7Jyk7XG5cbiAgICAgICAgaWYgKGlzTXV0ZSkge1xuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBtdXRlZEluZGljYXRvciArICcgTXV0ZWQnO1xuICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgPSAnbXV0ZWxpbmsgZGlzYWJsZWQnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbm5lckhUTUwgPSBtdXRlZEluZGljYXRvciArICcgTXV0ZSc7XG4gICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9ICdtdXRlbGluayc7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbXV0ZU1lbnVJdGVtLmFwcGVuZENoaWxkKG11dGVMaW5rSXRlbSk7XG4gICAgcG9wdXBtZW51RWxlbWVudC5hcHBlbmRDaGlsZChtdXRlTWVudUl0ZW0pO1xuXG4gICAgdmFyIGVqZWN0SW5kaWNhdG9yID0gXCI8aSBjbGFzcz0nZmEgZmEtZWplY3QnPjwvaT5cIjtcblxuICAgIHZhciBlamVjdE1lbnVJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICB2YXIgZWplY3RMaW5rSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBlamVjdExpbmtJdGVtLmlubmVySFRNTCA9IGVqZWN0SW5kaWNhdG9yICsgJyBLaWNrIG91dCc7XG4gICAgZWplY3RMaW5rSXRlbS5vbmNsaWNrID0gZnVuY3Rpb24oKXtcbiAgICAgICAgY29ubmVjdGlvbi5tb2RlcmF0ZS5lamVjdChqaWQpO1xuICAgICAgICBwb3B1cG1lbnVFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3R5bGUnLCAnZGlzcGxheTpub25lOycpO1xuICAgIH07XG5cbiAgICBlamVjdE1lbnVJdGVtLmFwcGVuZENoaWxkKGVqZWN0TGlua0l0ZW0pO1xuICAgIHBvcHVwbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQoZWplY3RNZW51SXRlbSk7XG5cbiAgICB2YXIgcGFkZGluZ1NwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgcGFkZGluZ1NwYW4uY2xhc3NOYW1lID0gJ3BvcHVwbWVudVBhZGRpbmcnO1xuICAgIHBvcHVwbWVudUVsZW1lbnQuYXBwZW5kQ2hpbGQocGFkZGluZ1NwYW4pO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgcmVtb3RlIHZpZGVvIG1lbnUgZWxlbWVudCBmcm9tIHZpZGVvIGVsZW1lbnQgaWRlbnRpZmllZCBieVxuICogZ2l2ZW4gPHR0PnZpZGVvRWxlbWVudElkPC90dD4uXG4gKlxuICogQHBhcmFtIHZpZGVvRWxlbWVudElkIHRoZSBpZCBvZiBsb2NhbCBvciByZW1vdGUgdmlkZW8gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlUmVtb3RlVmlkZW9NZW51KHZpZGVvRWxlbWVudElkKSB7XG4gICAgdmFyIG1lbnVTcGFuID0gJCgnIycgKyB2aWRlb0VsZW1lbnRJZCArICc+c3Bhbi5yZW1vdGV2aWRlb21lbnUnKTtcbiAgICBpZiAobWVudVNwYW4ubGVuZ3RoKSB7XG4gICAgICAgIG1lbnVTcGFuLnJlbW92ZSgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBkYXRhIGZvciB0aGUgaW5kaWNhdG9yXG4gKiBAcGFyYW0gaWQgdGhlIGlkIG9mIHRoZSBpbmRpY2F0b3JcbiAqIEBwYXJhbSBwZXJjZW50IHRoZSBwZXJjZW50IGZvciBjb25uZWN0aW9uIHF1YWxpdHlcbiAqIEBwYXJhbSBvYmplY3QgdGhlIGRhdGFcbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3RhdHNJbmRpY2F0b3IoaWQsIHBlcmNlbnQsIG9iamVjdCkge1xuICAgIGlmKFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW2lkXSlcbiAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbaWRdLnVwZGF0ZUNvbm5lY3Rpb25RdWFsaXR5KHBlcmNlbnQsIG9iamVjdCk7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IG9mIHRoZSB2aWRlbyBkaW1lbnNpb25zLCBzbyB0aGF0IGl0IGtlZXBzIGl0J3MgYXNwZWN0XG4gKiByYXRpbyBhbmQgZml0cyBhdmFpbGFibGUgYXJlYSB3aXRoIGl0J3MgbGFyZ2VyIGRpbWVuc2lvbi4gVGhpcyBtZXRob2RcbiAqIGVuc3VyZXMgdGhhdCB3aG9sZSB2aWRlbyB3aWxsIGJlIHZpc2libGUgYW5kIGNhbiBsZWF2ZSBlbXB0eSBhcmVhcy5cbiAqXG4gKiBAcmV0dXJuIGFuIGFycmF5IHdpdGggMiBlbGVtZW50cywgdGhlIHZpZGVvIHdpZHRoIGFuZCB0aGUgdmlkZW8gaGVpZ2h0XG4gKi9cbmZ1bmN0aW9uIGdldERlc2t0b3BWaWRlb1NpemUodmlkZW9XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZGVvU3BhY2VXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9TcGFjZUhlaWdodCkge1xuICAgIGlmICghdmlkZW9XaWR0aClcbiAgICAgICAgdmlkZW9XaWR0aCA9IGN1cnJlbnRWaWRlb1dpZHRoO1xuICAgIGlmICghdmlkZW9IZWlnaHQpXG4gICAgICAgIHZpZGVvSGVpZ2h0ID0gY3VycmVudFZpZGVvSGVpZ2h0O1xuXG4gICAgdmFyIGFzcGVjdFJhdGlvID0gdmlkZW9XaWR0aCAvIHZpZGVvSGVpZ2h0O1xuXG4gICAgdmFyIGF2YWlsYWJsZVdpZHRoID0gTWF0aC5tYXgodmlkZW9XaWR0aCwgdmlkZW9TcGFjZVdpZHRoKTtcbiAgICB2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5tYXgodmlkZW9IZWlnaHQsIHZpZGVvU3BhY2VIZWlnaHQpO1xuXG4gICAgdmlkZW9TcGFjZUhlaWdodCAtPSAkKCcjcmVtb3RlVmlkZW9zJykub3V0ZXJIZWlnaHQoKTtcblxuICAgIGlmIChhdmFpbGFibGVXaWR0aCAvIGFzcGVjdFJhdGlvID49IHZpZGVvU3BhY2VIZWlnaHQpXG4gICAge1xuICAgICAgICBhdmFpbGFibGVIZWlnaHQgPSB2aWRlb1NwYWNlSGVpZ2h0O1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IGF2YWlsYWJsZUhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgIH1cblxuICAgIGlmIChhdmFpbGFibGVIZWlnaHQgKiBhc3BlY3RSYXRpbyA+PSB2aWRlb1NwYWNlV2lkdGgpXG4gICAge1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA9IHZpZGVvU3BhY2VXaWR0aDtcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0ID0gYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbztcbiAgICB9XG5cbiAgICByZXR1cm4gW2F2YWlsYWJsZVdpZHRoLCBhdmFpbGFibGVIZWlnaHRdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGVkaXQgZGlzcGxheSBuYW1lIGJ1dHRvbi5cbiAqXG4gKiBAcmV0dXJucyB0aGUgZWRpdCBidXR0b25cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRWRpdERpc3BsYXlOYW1lQnV0dG9uKCkge1xuICAgIHZhciBlZGl0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGVkaXRCdXR0b24uY2xhc3NOYW1lID0gJ2Rpc3BsYXluYW1lJztcbiAgICBVdGlsLnNldFRvb2x0aXAoZWRpdEJ1dHRvbixcbiAgICAgICAgJ0NsaWNrIHRvIGVkaXQgeW91cjxici8+ZGlzcGxheSBuYW1lJyxcbiAgICAgICAgXCJ0b3BcIik7XG4gICAgZWRpdEJ1dHRvbi5pbm5lckhUTUwgPSAnPGkgY2xhc3M9XCJmYSBmYS1wZW5jaWxcIj48L2k+JztcblxuICAgIHJldHVybiBlZGl0QnV0dG9uO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGVsZW1lbnQgaW5kaWNhdGluZyB0aGUgbW9kZXJhdG9yKG93bmVyKSBvZiB0aGUgY29uZmVyZW5jZS5cbiAqXG4gKiBAcGFyYW0gcGFyZW50RWxlbWVudCB0aGUgcGFyZW50IGVsZW1lbnQgd2hlcmUgdGhlIG93bmVyIGluZGljYXRvciB3aWxsXG4gKiBiZSBhZGRlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVNb2RlcmF0b3JJbmRpY2F0b3JFbGVtZW50KHBhcmVudEVsZW1lbnQpIHtcbiAgICB2YXIgbW9kZXJhdG9ySW5kaWNhdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaScpO1xuICAgIG1vZGVyYXRvckluZGljYXRvci5jbGFzc05hbWUgPSAnZmEgZmEtc3Rhcic7XG4gICAgcGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChtb2RlcmF0b3JJbmRpY2F0b3IpO1xuXG4gICAgVXRpbC5zZXRUb29sdGlwKHBhcmVudEVsZW1lbnQsXG4gICAgICAgIFwiVGhlIG93bmVyIG9mPGJyLz50aGlzIGNvbmZlcmVuY2VcIixcbiAgICAgICAgXCJ0b3BcIik7XG59XG5cblxudmFyIFZpZGVvTGF5b3V0ID0gKGZ1bmN0aW9uIChteSkge1xuICAgIG15LmNvbm5lY3Rpb25JbmRpY2F0b3JzID0ge307XG5cbiAgICBteS5pc0luTGFzdE4gPSBmdW5jdGlvbihyZXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gbGFzdE5Db3VudCA8IDAgLy8gbGFzdE4gaXMgZGlzYWJsZWQsIHJldHVybiB0cnVlXG4gICAgICAgICAgICB8fCAobGFzdE5Db3VudCA+IDAgJiYgbGFzdE5FbmRwb2ludHNDYWNoZS5sZW5ndGggPT0gMCkgLy8gbGFzdE5FbmRwb2ludHMgY2FjaGUgbm90IGJ1aWx0IHlldCwgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIHx8IChsYXN0TkVuZHBvaW50c0NhY2hlICYmIGxhc3RORW5kcG9pbnRzQ2FjaGUuaW5kZXhPZihyZXNvdXJjZSkgIT09IC0xKTtcbiAgICB9O1xuXG4gICAgbXkuY2hhbmdlTG9jYWxTdHJlYW0gPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIGNvbm5lY3Rpb24uamluZ2xlLmxvY2FsQXVkaW8gPSBzdHJlYW07XG4gICAgICAgIFZpZGVvTGF5b3V0LmNoYW5nZUxvY2FsVmlkZW8oc3RyZWFtLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgbXkuY2hhbmdlTG9jYWxBdWRpbyA9IGZ1bmN0aW9uKHN0cmVhbSkge1xuICAgICAgICBjb25uZWN0aW9uLmppbmdsZS5sb2NhbEF1ZGlvID0gc3RyZWFtO1xuICAgICAgICBSVEMuYXR0YWNoTWVkaWFTdHJlYW0oJCgnI2xvY2FsQXVkaW8nKSwgc3RyZWFtKTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2FsQXVkaW8nKS5hdXRvcGxheSA9IHRydWU7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2NhbEF1ZGlvJykudm9sdW1lID0gMDtcbiAgICAgICAgaWYgKHByZU11dGVkKSB7XG4gICAgICAgICAgICBzZXRBdWRpb011dGVkKHRydWUpO1xuICAgICAgICAgICAgcHJlTXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBteS5jaGFuZ2VMb2NhbFZpZGVvID0gZnVuY3Rpb24oc3RyZWFtLCBmbGlwWCkge1xuICAgICAgICBjb25uZWN0aW9uLmppbmdsZS5sb2NhbFZpZGVvID0gc3RyZWFtO1xuXG4gICAgICAgIHZhciBsb2NhbFZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgICAgICAgbG9jYWxWaWRlby5pZCA9ICdsb2NhbFZpZGVvXycgKyBSVEMuZ2V0U3RyZWFtSUQoc3RyZWFtKTtcbiAgICAgICAgbG9jYWxWaWRlby5hdXRvcGxheSA9IHRydWU7XG4gICAgICAgIGxvY2FsVmlkZW8udm9sdW1lID0gMDsgLy8gaXMgaXQgcmVxdWlyZWQgaWYgYXVkaW8gaXMgc2VwYXJhdGVkID9cbiAgICAgICAgbG9jYWxWaWRlby5vbmNvbnRleHRtZW51ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XG5cbiAgICAgICAgdmFyIGxvY2FsVmlkZW9Db250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9jYWxWaWRlb1dyYXBwZXInKTtcbiAgICAgICAgbG9jYWxWaWRlb0NvbnRhaW5lci5hcHBlbmRDaGlsZChsb2NhbFZpZGVvKTtcblxuICAgICAgICAvLyBTZXQgZGVmYXVsdCBkaXNwbGF5IG5hbWUuXG4gICAgICAgIHNldERpc3BsYXlOYW1lKCdsb2NhbFZpZGVvQ29udGFpbmVyJyk7XG5cbiAgICAgICAgaWYoIVZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW1wibG9jYWxWaWRlb0NvbnRhaW5lclwiXSkge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbXCJsb2NhbFZpZGVvQ29udGFpbmVyXCJdXG4gICAgICAgICAgICAgICAgPSBuZXcgQ29ubmVjdGlvbkluZGljYXRvcigkKFwiI2xvY2FsVmlkZW9Db250YWluZXJcIilbMF0sIG51bGwsIFZpZGVvTGF5b3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEF1ZGlvTGV2ZWxzLnVwZGF0ZUF1ZGlvTGV2ZWxDYW52YXMobnVsbCwgVmlkZW9MYXlvdXQpO1xuXG4gICAgICAgIHZhciBsb2NhbFZpZGVvU2VsZWN0b3IgPSAkKCcjJyArIGxvY2FsVmlkZW8uaWQpO1xuICAgICAgICAvLyBBZGQgY2xpY2sgaGFuZGxlciB0byBib3RoIHZpZGVvIGFuZCB2aWRlbyB3cmFwcGVyIGVsZW1lbnRzIGluIGNhc2VcbiAgICAgICAgLy8gdGhlcmUncyBubyB2aWRlby5cbiAgICAgICAgbG9jYWxWaWRlb1NlbGVjdG9yLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5oYW5kbGVWaWRlb1RodW1iQ2xpY2tlZChcbiAgICAgICAgICAgICAgICBSVEMuZ2V0VmlkZW9TcmMobG9jYWxWaWRlbyksXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnI2xvY2FsVmlkZW9Db250YWluZXInKS5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuaGFuZGxlVmlkZW9UaHVtYkNsaWNrZWQoXG4gICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKGxvY2FsVmlkZW8pLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQWRkIGhvdmVyIGhhbmRsZXJcbiAgICAgICAgJCgnI2xvY2FsVmlkZW9Db250YWluZXInKS5ob3ZlcihcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dEaXNwbGF5TmFtZSgnbG9jYWxWaWRlb0NvbnRhaW5lcicsIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghVmlkZW9MYXlvdXQuaXNMYXJnZVZpZGVvVmlzaWJsZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCBSVEMuZ2V0VmlkZW9TcmMobG9jYWxWaWRlbykgIT09IFJUQy5nZXRWaWRlb1NyYygkKCcjbGFyZ2VWaWRlbycpWzBdKSlcbiAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd0Rpc3BsYXlOYW1lKCdsb2NhbFZpZGVvQ29udGFpbmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICAvLyBBZGQgc3RyZWFtIGVuZGVkIGhhbmRsZXJcbiAgICAgICAgc3RyZWFtLm9uZW5kZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsb2NhbFZpZGVvQ29udGFpbmVyLnJlbW92ZUNoaWxkKGxvY2FsVmlkZW8pO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlUmVtb3ZlZFZpZGVvKFJUQy5nZXRWaWRlb1NyYyhsb2NhbFZpZGVvKSk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZsaXAgdmlkZW8geCBheGlzIGlmIG5lZWRlZFxuICAgICAgICBmbGlwWExvY2FsVmlkZW8gPSBmbGlwWDtcbiAgICAgICAgaWYgKGZsaXBYKSB7XG4gICAgICAgICAgICBsb2NhbFZpZGVvU2VsZWN0b3IuYWRkQ2xhc3MoXCJmbGlwVmlkZW9YXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEF0dGFjaCBXZWJSVEMgc3RyZWFtXG4gICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IHNpbXVsY2FzdC5nZXRMb2NhbFZpZGVvU3RyZWFtKCk7XG4gICAgICAgIFJUQy5hdHRhY2hNZWRpYVN0cmVhbShsb2NhbFZpZGVvU2VsZWN0b3IsIHZpZGVvU3RyZWFtKTtcblxuICAgICAgICBsb2NhbFZpZGVvU3JjID0gUlRDLmdldFZpZGVvU3JjKGxvY2FsVmlkZW8pO1xuXG4gICAgICAgIHZhciBteVJlc291cmNlSmlkID0gbnVsbDtcbiAgICAgICAgaWYoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZClcbiAgICAgICAge1xuICAgICAgICAgICBteVJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCk7XG4gICAgICAgIH1cbiAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTGFyZ2VWaWRlbyhsb2NhbFZpZGVvU3JjLCAwLFxuICAgICAgICAgICAgbXlSZXNvdXJjZUppZCk7XG5cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHJlbW92ZWQgdmlkZW8gaXMgY3VycmVudGx5IGRpc3BsYXllZCBhbmQgdHJpZXMgdG8gZGlzcGxheVxuICAgICAqIGFub3RoZXIgb25lIGluc3RlYWQuXG4gICAgICogQHBhcmFtIHJlbW92ZWRWaWRlb1NyYyBzcmMgc3RyZWFtIGlkZW50aWZpZXIgb2YgdGhlIHZpZGVvLlxuICAgICAqL1xuICAgIG15LnVwZGF0ZVJlbW92ZWRWaWRlbyA9IGZ1bmN0aW9uKHJlbW92ZWRWaWRlb1NyYykge1xuICAgICAgICBpZiAocmVtb3ZlZFZpZGVvU3JjID09PSBSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgY3VycmVudGx5IGRpc3BsYXllZCBhcyBsYXJnZVxuICAgICAgICAgICAgLy8gcGljayB0aGUgbGFzdCB2aXNpYmxlIHZpZGVvIGluIHRoZSByb3dcbiAgICAgICAgICAgIC8vIGlmIG5vYm9keSBlbHNlIGlzIGxlZnQsIHRoaXMgcGlja3MgdGhlIGxvY2FsIHZpZGVvXG4gICAgICAgICAgICB2YXIgcGlja1xuICAgICAgICAgICAgICAgID0gJCgnI3JlbW90ZVZpZGVvcz5zcGFuW2lkIT1cIm1peGVkc3RyZWFtXCJdOnZpc2libGU6bGFzdD52aWRlbycpXG4gICAgICAgICAgICAgICAgICAgIC5nZXQoMCk7XG5cbiAgICAgICAgICAgIGlmICghcGljaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIkxhc3QgdmlzaWJsZSB2aWRlbyBubyBsb25nZXIgZXhpc3RzXCIpO1xuICAgICAgICAgICAgICAgIHBpY2sgPSAkKCcjcmVtb3RlVmlkZW9zPnNwYW5baWQhPVwibWl4ZWRzdHJlYW1cIl0+dmlkZW8nKS5nZXQoMCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXBpY2sgfHwgIVJUQy5nZXRWaWRlb1NyYyhwaWNrKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUcnkgbG9jYWwgdmlkZW9cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRmFsbGJhY2sgdG8gbG9jYWwgdmlkZW8uLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHBpY2sgPSAkKCcjcmVtb3RlVmlkZW9zPnNwYW4+c3Bhbj52aWRlbycpLmdldCgwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIG11dGUgaWYgbG9jYWx2aWRlb1xuICAgICAgICAgICAgaWYgKHBpY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gcGljay5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIHZhciBqaWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmKGNvbnRhaW5lcilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNvbnRhaW5lci5pZCA9PSBcImxvY2FsVmlkZW9XcmFwcGVyXCIpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgamlkID0gVmlkZW9MYXlvdXQuZ2V0UGVlckNvbnRhaW5lclJlc291cmNlSmlkKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVMYXJnZVZpZGVvKFJUQy5nZXRWaWRlb1NyYyhwaWNrKSwgcGljay52b2x1bWUsIGppZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkZhaWxlZCB0byBlbGVjdCBsYXJnZSB2aWRlb1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgbXkub25SZW1vdGVTdHJlYW1BZGRlZCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lcjtcbiAgICAgICAgdmFyIHJlbW90ZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVtb3RlVmlkZW9zJyk7XG5cbiAgICAgICAgaWYgKHN0cmVhbS5wZWVyamlkKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbnN1cmVQZWVyQ29udGFpbmVyRXhpc3RzKHN0cmVhbS5wZWVyamlkKTtcblxuICAgICAgICAgICAgY29udGFpbmVyICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFxuICAgICAgICAgICAgICAgICAgICAncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKHN0cmVhbS5wZWVyamlkKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKS5pZDtcbiAgICAgICAgICAgIGlmIChpZCAhPT0gJ21peGVkbXNsYWJlbCdcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogZGVmYXVsdCBzdHJlYW0gaXMgYWRkZWQgYWx3YXlzIHdpdGggbmV3IGZvY3VzXG4gICAgICAgICAgICAgICAgLy8gKHRvIGJlIGludmVzdGlnYXRlZClcbiAgICAgICAgICAgICAgICAmJiBpZCAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignY2FuIG5vdCBhc3NvY2lhdGUgc3RyZWFtJyxcbiAgICAgICAgICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICAgICAgICAgICd3aXRoIGEgcGFydGljaXBhbnQnKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCB3YW50IHRvIGFkZCBpdCBoZXJlIHNpbmNlIGl0IHdpbGwgY2F1c2UgdHJvdWJsZXNcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGSVhNRTogZm9yIHRoZSBtaXhlZCBtcyB3ZSBkb250IG5lZWQgYSB2aWRlbyAtLSBjdXJyZW50bHlcbiAgICAgICAgICAgIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pZCA9ICdtaXhlZHN0cmVhbSc7XG4gICAgICAgICAgICBjb250YWluZXIuY2xhc3NOYW1lID0gJ3ZpZGVvY29udGFpbmVyJztcbiAgICAgICAgICAgIHJlbW90ZXMuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgICAgIFV0aWwucGxheVNvdW5kTm90aWZpY2F0aW9uKCd1c2VySm9pbmVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5hZGRSZW1vdGVTdHJlYW1FbGVtZW50KCBjb250YWluZXIsXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNpZCxcbiAgICAgICAgICAgICAgICBzdHJlYW0uZ2V0T3JpZ2luYWxTdHJlYW0oKSxcbiAgICAgICAgICAgICAgICBzdHJlYW0ucGVlcmppZCxcbiAgICAgICAgICAgICAgICBzdHJlYW0uc3NyYyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBteS5nZXRMYXJnZVZpZGVvU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBsYXJnZVZpZGVvU3RhdGU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZXMgdGhlIGxhcmdlIHZpZGVvIHdpdGggdGhlIGdpdmVuIG5ldyB2aWRlbyBzb3VyY2UuXG4gICAgICovXG4gICAgbXkudXBkYXRlTGFyZ2VWaWRlbyA9IGZ1bmN0aW9uKG5ld1NyYywgdm9sLCByZXNvdXJjZUppZCkge1xuICAgICAgICBjb25zb2xlLmxvZygnaG92ZXIgaW4nLCBuZXdTcmMpO1xuXG4gICAgICAgIGlmIChSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkgIT09IG5ld1NyYykge1xuXG4gICAgICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIC8vIER1ZSB0byB0aGUgc2ltdWxjYXN0IHRoZSBsb2NhbFZpZGVvU3JjIG1heSBoYXZlIGNoYW5nZWQgd2hlbiB0aGVcbiAgICAgICAgICAgIC8vIGZhZGVPdXQgZXZlbnQgdHJpZ2dlcnMuIEluIHRoYXQgY2FzZSB0aGUgZ2V0SmlkRnJvbVZpZGVvU3JjIGFuZFxuICAgICAgICAgICAgLy8gaXNWaWRlb1NyY0Rlc2t0b3AgbWV0aG9kcyB3aWxsIG5vdCBmdW5jdGlvbiBjb3JyZWN0bHkuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWxzbywgYWdhaW4gZHVlIHRvIHRoZSBzaW11bGNhc3QsIHRoZSB1cGRhdGVMYXJnZVZpZGVvIG1ldGhvZCBjYW5cbiAgICAgICAgICAgIC8vIGJlIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBhbG1vc3Qgc2ltdWx0YW5lb3VzbHkuIFRoZXJlZm9yZSwgd2VcbiAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBzdGF0ZSBoZXJlIGFuZCB1cGRhdGUgb25seSBvbmNlLlxuXG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUubmV3U3JjID0gbmV3U3JjO1xuICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLmlzVmlzaWJsZSA9ICQoJyNsYXJnZVZpZGVvJykuaXMoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUuaXNEZXNrdG9wID0gaXNWaWRlb1NyY0Rlc2t0b3AocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgaWYoamlkMlNzcmNbbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZF0gfHxcbiAgICAgICAgICAgICAgICAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkICYmXG4gICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQgPT09XG4gICAgICAgICAgICAgICAgICAgIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpKSkge1xuICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5vbGRSZXNvdXJjZUppZCA9IGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5vbGRSZXNvdXJjZUppZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkID0gcmVzb3VyY2VKaWQ7XG5cbiAgICAgICAgICAgIC8vIFNjcmVlbiBzdHJlYW0gaXMgYWxyZWFkeSByb3RhdGVkXG4gICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUuZmxpcFggPSAobmV3U3JjID09PSBsb2NhbFZpZGVvU3JjKSAmJiBmbGlwWExvY2FsVmlkZW87XG5cbiAgICAgICAgICAgIHZhciB1c2VyQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGxhcmdlVmlkZW9TdGF0ZS5vbGRSZXNvdXJjZUppZCAhPT0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgICAgIHVzZXJDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB3ZSB3YW50IHRoZSBub3RpZmljYXRpb24gdG8gdHJpZ2dlciBldmVuIGlmIHVzZXJKaWQgaXMgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIC8vIG9yIG51bGwuXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInNlbGVjdGVkZW5kcG9pbnRjaGFuZ2VkXCIsIFtsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbGFyZ2VWaWRlb1N0YXRlLnVwZGF0ZUluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUudXBkYXRlSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICB2YXIgZG9VcGRhdGUgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgQXZhdGFyLnVwZGF0ZUFjdGl2ZVNwZWFrZXJBdmF0YXJTcmMoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuZmluZEppZEZyb21SZXNvdXJjZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF1c2VyQ2hhbmdlZCAmJiBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIFJUQy5nZXRWaWRlb1NyYygkKGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkKVswXSkgPT09IG5ld1NyYylcbiAgICAgICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1N3aXRjaGluZyB0byBwcmVsb2FkZWQgdmlkZW8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVzID0gJCgnI2xhcmdlVmlkZW8nKS5wcm9wKFwiYXR0cmlidXRlc1wiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9vcCB0aHJvdWdoIGxhcmdlVmlkZW8gYXR0cmlidXRlcyBhbmQgYXBwbHkgdGhlbSBvblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJlbG9hZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhdHRyaWJ1dGVzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubmFtZSAhPT0gJ2lkJyAmJiB0aGlzLm5hbWUgIT09ICdzcmMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkLmF0dHIodGhpcy5uYW1lLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQuYXBwZW5kVG8oJCgnI2xhcmdlVmlkZW9Db250YWluZXInKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmF0dHIoJ2lkJywgJ3ByZXZpb3VzTGFyZ2VWaWRlbycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQuYXR0cignaWQnLCAnbGFyZ2VWaWRlbycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3ByZXZpb3VzTGFyZ2VWaWRlbycpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZC5vbignbG9hZGVkbWV0YWRhdGEnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWRlb1dpZHRoID0gdGhpcy52aWRlb1dpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWRlb0hlaWdodCA9IHRoaXMudmlkZW9IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQucG9zaXRpb25MYXJnZShjdXJyZW50VmlkZW9XaWR0aCwgY3VycmVudFZpZGVvSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRfc3NyYyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSVEMuc2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSwgbGFyZ2VWaWRlb1N0YXRlLm5ld1NyYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlkZW9UcmFuc2Zvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGFyZ2VWaWRlbycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3R5bGUud2Via2l0VHJhbnNmb3JtO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXJnZVZpZGVvU3RhdGUuZmxpcFggJiYgdmlkZW9UcmFuc2Zvcm0gIT09ICdzY2FsZVgoLTEpJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IFwic2NhbGVYKC0xKVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFsYXJnZVZpZGVvU3RhdGUuZmxpcFggJiYgdmlkZW9UcmFuc2Zvcm0gPT09ICdzY2FsZVgoLTEpJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhcmdlVmlkZW8nKS5zdHlsZS53ZWJraXRUcmFuc2Zvcm1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSB3YXkgd2UnbGwgYmUgbWVhc3VyaW5nIGFuZCBwb3NpdGlvbmluZyBsYXJnZSB2aWRlb1xuXG4gICAgICAgICAgICAgICAgICAgIGdldFZpZGVvU2l6ZSA9IGxhcmdlVmlkZW9TdGF0ZS5pc0Rlc2t0b3BcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZ2V0RGVza3RvcFZpZGVvU2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBnZXRDYW1lcmFWaWRlb1NpemU7XG4gICAgICAgICAgICAgICAgICAgIGdldFZpZGVvUG9zaXRpb24gPSBsYXJnZVZpZGVvU3RhdGUuaXNEZXNrdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGdldERlc2t0b3BWaWRlb1Bvc2l0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGdldENhbWVyYVZpZGVvUG9zaXRpb247XG5cblxuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGlmIHRoZSBsYXJnZSB2aWRlbyBpcyBjdXJyZW50bHkgdmlzaWJsZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gRGlzYWJsZSBwcmV2aW91cyBkb21pbmFudCBzcGVha2VyIHZpZGVvLlxuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5lbmFibGVEb21pbmFudFNwZWFrZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLm9sZFJlc291cmNlSmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEVuYWJsZSBuZXcgZG9taW5hbnQgc3BlYWtlciBpbiB0aGUgcmVtb3RlIHZpZGVvcyBzZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuZW5hYmxlRG9taW5hbnRTcGVha2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlckNoYW5nZWQgJiYgbGFyZ2VWaWRlb1N0YXRlLmlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdXNpbmcgXCJ0aGlzXCIgc2hvdWxkIGJlIG9rIGJlY2F1c2Ugd2UncmUgY2FsbGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHdpdGhpbiB0aGUgZmFkZU91dCBldmVudC5cbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykuZmFkZUluKDMwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZih1c2VyQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5maW5kSmlkRnJvbVJlc291cmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUub2xkUmVzb3VyY2VKaWQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51cGRhdGVJblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmICh1c2VyQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcjbGFyZ2VWaWRlbycpLmZhZGVPdXQoMzAwLCBkb1VwZGF0ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZG9VcGRhdGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBBdmF0YXIuc2hvd1VzZXJBdmF0YXIoXG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UoXG4gICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQpKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIG15LmhhbmRsZVZpZGVvVGh1bWJDbGlja2VkID0gZnVuY3Rpb24odmlkZW9TcmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub1Bpbm5lZEVuZHBvaW50Q2hhbmdlZEV2ZW50LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlSmlkKSB7XG4gICAgICAgIC8vIFJlc3RvcmUgc3R5bGUgZm9yIHByZXZpb3VzbHkgZm9jdXNlZCB2aWRlb1xuICAgICAgICB2YXIgb2xkQ29udGFpbmVyID0gbnVsbDtcbiAgICAgICAgaWYoZm9jdXNlZFZpZGVvSW5mbykge1xuICAgICAgICAgICAgdmFyIGZvY3VzUmVzb3VyY2VKaWQgPSBmb2N1c2VkVmlkZW9JbmZvLnJlc291cmNlSmlkO1xuICAgICAgICAgICAgb2xkQ29udGFpbmVyID0gZ2V0UGFydGljaXBhbnRDb250YWluZXIoZm9jdXNSZXNvdXJjZUppZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob2xkQ29udGFpbmVyKSB7XG4gICAgICAgICAgICBvbGRDb250YWluZXIucmVtb3ZlQ2xhc3MoXCJ2aWRlb0NvbnRhaW5lckZvY3VzZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVbmxvY2sgY3VycmVudCBmb2N1c2VkLlxuICAgICAgICBpZiAoZm9jdXNlZFZpZGVvSW5mbyAmJiBmb2N1c2VkVmlkZW9JbmZvLnNyYyA9PT0gdmlkZW9TcmMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGZvY3VzZWRWaWRlb0luZm8gPSBudWxsO1xuICAgICAgICAgICAgdmFyIGRvbWluYW50U3BlYWtlclZpZGVvID0gbnVsbDtcbiAgICAgICAgICAgIC8vIEVuYWJsZSB0aGUgY3VycmVudGx5IHNldCBkb21pbmFudCBzcGVha2VyLlxuICAgICAgICAgICAgaWYgKGN1cnJlbnREb21pbmFudFNwZWFrZXIpIHtcbiAgICAgICAgICAgICAgICBkb21pbmFudFNwZWFrZXJWaWRlb1xuICAgICAgICAgICAgICAgICAgICA9ICQoJyNwYXJ0aWNpcGFudF8nICsgY3VycmVudERvbWluYW50U3BlYWtlciArICc+dmlkZW8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmdldCgwKTtcblxuICAgICAgICAgICAgICAgIGlmIChkb21pbmFudFNwZWFrZXJWaWRlbykge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVMYXJnZVZpZGVvKFxuICAgICAgICAgICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKGRvbWluYW50U3BlYWtlclZpZGVvKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RG9taW5hbnRTcGVha2VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbm9QaW5uZWRFbmRwb2ludENoYW5nZWRFdmVudCkge1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXCJwaW5uZWRlbmRwb2ludGNoYW5nZWRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBMb2NrIG5ldyB2aWRlb1xuICAgICAgICBmb2N1c2VkVmlkZW9JbmZvID0ge1xuICAgICAgICAgICAgc3JjOiB2aWRlb1NyYyxcbiAgICAgICAgICAgIHJlc291cmNlSmlkOiByZXNvdXJjZUppZFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFVwZGF0ZSBmb2N1c2VkL3Bpbm5lZCBpbnRlcmZhY2UuXG4gICAgICAgIGlmIChyZXNvdXJjZUppZClcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGdldFBhcnRpY2lwYW50Q29udGFpbmVyKHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hZGRDbGFzcyhcInZpZGVvQ29udGFpbmVyRm9jdXNlZFwiKTtcblxuICAgICAgICAgICAgaWYgKCFub1Bpbm5lZEVuZHBvaW50Q2hhbmdlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcInBpbm5lZGVuZHBvaW50Y2hhbmdlZFwiLCBbcmVzb3VyY2VKaWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgkKCcjbGFyZ2VWaWRlbycpLmF0dHIoJ3NyYycpID09PSB2aWRlb1NyYyAmJlxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuaXNMYXJnZVZpZGVvT25Ub3AoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJpZ2dlcnMgYSBcInZpZGVvLnNlbGVjdGVkXCIgZXZlbnQuIFRoZSBcImZhbHNlXCIgcGFyYW1ldGVyIGluZGljYXRlc1xuICAgICAgICAvLyB0aGlzIGlzbid0IGEgcHJlemkuXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXCJ2aWRlby5zZWxlY3RlZFwiLCBbZmFsc2VdKTtcblxuICAgICAgICBWaWRlb0xheW91dC51cGRhdGVMYXJnZVZpZGVvKHZpZGVvU3JjLCAxLCByZXNvdXJjZUppZCk7XG5cbiAgICAgICAgJCgnYXVkaW8nKS5lYWNoKGZ1bmN0aW9uIChpZHgsIGVsKSB7XG4gICAgICAgICAgICBpZiAoZWwuaWQuaW5kZXhPZignbWl4ZWRtc2xhYmVsJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgZWwudm9sdW1lID0gMDtcbiAgICAgICAgICAgICAgICBlbC52b2x1bWUgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUG9zaXRpb25zIHRoZSBsYXJnZSB2aWRlby5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2aWRlb1dpZHRoIHRoZSBzdHJlYW0gdmlkZW8gd2lkdGhcbiAgICAgKiBAcGFyYW0gdmlkZW9IZWlnaHQgdGhlIHN0cmVhbSB2aWRlbyBoZWlnaHRcbiAgICAgKi9cbiAgICBteS5wb3NpdGlvbkxhcmdlID0gZnVuY3Rpb24gKHZpZGVvV2lkdGgsIHZpZGVvSGVpZ2h0KSB7XG4gICAgICAgIHZhciB2aWRlb1NwYWNlV2lkdGggPSAkKCcjdmlkZW9zcGFjZScpLndpZHRoKCk7XG4gICAgICAgIHZhciB2aWRlb1NwYWNlSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgICAgIHZhciB2aWRlb1NpemUgPSBnZXRWaWRlb1NpemUodmlkZW9XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb0hlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9TcGFjZUhlaWdodCk7XG5cbiAgICAgICAgdmFyIGxhcmdlVmlkZW9XaWR0aCA9IHZpZGVvU2l6ZVswXTtcbiAgICAgICAgdmFyIGxhcmdlVmlkZW9IZWlnaHQgPSB2aWRlb1NpemVbMV07XG5cbiAgICAgICAgdmFyIHZpZGVvUG9zaXRpb24gPSBnZXRWaWRlb1Bvc2l0aW9uKGxhcmdlVmlkZW9XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9IZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYWNlSGVpZ2h0KTtcblxuICAgICAgICB2YXIgaG9yaXpvbnRhbEluZGVudCA9IHZpZGVvUG9zaXRpb25bMF07XG4gICAgICAgIHZhciB2ZXJ0aWNhbEluZGVudCA9IHZpZGVvUG9zaXRpb25bMV07XG5cbiAgICAgICAgcG9zaXRpb25WaWRlbygkKCcjbGFyZ2VWaWRlbycpLFxuICAgICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvSGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWxJbmRlbnQsIHZlcnRpY2FsSW5kZW50KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvd3MvaGlkZXMgdGhlIGxhcmdlIHZpZGVvLlxuICAgICAqL1xuICAgIG15LnNldExhcmdlVmlkZW9WaXNpYmxlID0gZnVuY3Rpb24oaXNWaXNpYmxlKSB7XG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQ7XG5cbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgJCgnI2xhcmdlVmlkZW8nKS5jc3Moe3Zpc2liaWxpdHk6ICd2aXNpYmxlJ30pO1xuICAgICAgICAgICAgJCgnLndhdGVybWFyaycpLmNzcyh7dmlzaWJpbGl0eTogJ3Zpc2libGUnfSk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbmFibGVEb21pbmFudFNwZWFrZXIocmVzb3VyY2VKaWQsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJCgnI2xhcmdlVmlkZW8nKS5jc3Moe3Zpc2liaWxpdHk6ICdoaWRkZW4nfSk7XG4gICAgICAgICAgICAkKCcjYWN0aXZlU3BlYWtlcicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgICQoJy53YXRlcm1hcmsnKS5jc3Moe3Zpc2liaWxpdHk6ICdoaWRkZW4nfSk7XG4gICAgICAgICAgICBWaWRlb0xheW91dC5lbmFibGVEb21pbmFudFNwZWFrZXIocmVzb3VyY2VKaWQsIGZhbHNlKTtcbiAgICAgICAgICAgIGlmKGZvY3VzZWRWaWRlb0luZm8pIHtcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNSZXNvdXJjZUppZCA9IGZvY3VzZWRWaWRlb0luZm8ucmVzb3VyY2VKaWQ7XG4gICAgICAgICAgICAgICAgdmFyIG9sZENvbnRhaW5lciA9IGdldFBhcnRpY2lwYW50Q29udGFpbmVyKGZvY3VzUmVzb3VyY2VKaWQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG9sZENvbnRhaW5lciAmJiBvbGRDb250YWluZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBvbGRDb250YWluZXIucmVtb3ZlQ2xhc3MoXCJ2aWRlb0NvbnRhaW5lckZvY3VzZWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvY3VzZWRWaWRlb0luZm8gPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmKGZvY3VzUmVzb3VyY2VKaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UoZm9jdXNSZXNvdXJjZUppZCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGxhcmdlIHZpZGVvIGlzIGN1cnJlbnRseSB2aXNpYmxlLlxuICAgICAqXG4gICAgICogQHJldHVybiA8dHQ+dHJ1ZTwvdHQ+IGlmIHZpc2libGUsIDx0dD5mYWxzZTwvdHQ+IC0gb3RoZXJ3aXNlXG4gICAgICovXG4gICAgbXkuaXNMYXJnZVZpZGVvVmlzaWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCgnI2xhcmdlVmlkZW8nKS5pcygnOnZpc2libGUnKTtcbiAgICB9O1xuXG4gICAgbXkuaXNMYXJnZVZpZGVvT25Ub3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBFdGhlcnBhZCA9IHJlcXVpcmUoXCIuLi9ldGhlcnBhZC9FdGhlcnBhZFwiKTtcbiAgICAgICAgdmFyIFByZXppID0gcmVxdWlyZShcIi4uL3ByZXppL1ByZXppXCIpO1xuICAgICAgICByZXR1cm4gIVByZXppLmlzUHJlc2VudGF0aW9uVmlzaWJsZSgpICYmICFFdGhlcnBhZC5pc1Zpc2libGUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIGNvbnRhaW5lciBmb3IgcGFydGljaXBhbnQgaWRlbnRpZmllZCBieSBnaXZlbiBwZWVySmlkIGV4aXN0c1xuICAgICAqIGluIHRoZSBkb2N1bWVudCBhbmQgY3JlYXRlcyBpdCBldmVudHVhbGx5LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBwZWVySmlkIHBlZXIgSmlkIHRvIGNoZWNrLlxuICAgICAqIEBwYXJhbSB1c2VySWQgdXNlciBlbWFpbCBvciBpZCBmb3Igc2V0dGluZyB0aGUgYXZhdGFyXG4gICAgICogXG4gICAgICogQHJldHVybiBSZXR1cm5zIDx0dD50cnVlPC90dD4gaWYgdGhlIHBlZXIgY29udGFpbmVyIGV4aXN0cyxcbiAgICAgKiA8dHQ+ZmFsc2U8L3R0PiAtIG90aGVyd2lzZVxuICAgICAqL1xuICAgIG15LmVuc3VyZVBlZXJDb250YWluZXJFeGlzdHMgPSBmdW5jdGlvbihwZWVySmlkLCB1c2VySWQpIHtcbiAgICAgICAgQ29udGFjdExpc3QuZW5zdXJlQWRkQ29udGFjdChwZWVySmlkLCB1c2VySWQpO1xuXG4gICAgICAgIHZhciByZXNvdXJjZUppZCA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKHBlZXJKaWQpO1xuXG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9ICdwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQ7XG5cbiAgICAgICAgaWYgKCQoJyMnICsgdmlkZW9TcGFuSWQpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlJ3MgYmVlbiBhIGZvY3VzIGNoYW5nZSwgbWFrZSBzdXJlIHdlIGFkZCBmb2N1cyByZWxhdGVkXG4gICAgICAgICAgICAvLyBpbnRlcmZhY2UhIVxuICAgICAgICAgICAgaWYgKE1vZGVyYXRvci5pc01vZGVyYXRvcigpICYmICFNb2RlcmF0b3IuaXNQZWVyTW9kZXJhdG9yKHBlZXJKaWQpXG4gICAgICAgICAgICAgICAgJiYgJCgnI3JlbW90ZV9wb3B1cG1lbnVfJyArIHJlc291cmNlSmlkKS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgICAgIGFkZFJlbW90ZVZpZGVvTWVudShwZWVySmlkLFxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh2aWRlb1NwYW5JZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuYWRkUmVtb3RlVmlkZW9Db250YWluZXIocGVlckppZCwgdmlkZW9TcGFuSWQsIHVzZXJJZCk7XG4gICAgICAgICAgICBBdmF0YXIuc2V0VXNlckF2YXRhcihwZWVySmlkLCB1c2VySWQpO1xuICAgICAgICAgICAgLy8gU2V0IGRlZmF1bHQgZGlzcGxheSBuYW1lLlxuICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUodmlkZW9TcGFuSWQpO1xuXG4gICAgICAgICAgICBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1t2aWRlb1NwYW5JZF0gPVxuICAgICAgICAgICAgICAgIG5ldyBDb25uZWN0aW9uSW5kaWNhdG9yKGNvbnRhaW5lciwgcGVlckppZCwgVmlkZW9MYXlvdXQpO1xuXG4gICAgICAgICAgICB2YXIgbmlja2ZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgbmlja2ZpZWxkLmNsYXNzTmFtZSA9IFwibmlja1wiO1xuICAgICAgICAgICAgbmlja2ZpZWxkLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHJlc291cmNlSmlkKSk7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmlja2ZpZWxkKTtcblxuICAgICAgICAgICAgLy8gSW4gY2FzZSB0aGlzIGlzIG5vdCBjdXJyZW50bHkgaW4gdGhlIGxhc3QgbiB3ZSBkb24ndCBzaG93IGl0LlxuICAgICAgICAgICAgaWYgKGxvY2FsTGFzdE5Db3VudFxuICAgICAgICAgICAgICAgICYmIGxvY2FsTGFzdE5Db3VudCA+IDBcbiAgICAgICAgICAgICAgICAmJiAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5sZW5ndGggPj0gbG9jYWxMYXN0TkNvdW50ICsgMikge1xuICAgICAgICAgICAgICAgIHNob3dQZWVyQ29udGFpbmVyKHJlc291cmNlSmlkLCAnaGlkZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnJlc2l6ZVRodW1ibmFpbHMoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBteS5hZGRSZW1vdGVWaWRlb0NvbnRhaW5lciA9IGZ1bmN0aW9uKHBlZXJKaWQsIHNwYW5JZCkge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBjb250YWluZXIuaWQgPSBzcGFuSWQ7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc05hbWUgPSAndmlkZW9jb250YWluZXInO1xuICAgICAgICB2YXIgcmVtb3RlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW1vdGVWaWRlb3MnKTtcblxuICAgICAgICAvLyBJZiB0aGUgcGVlckppZCBpcyBudWxsIHRoZW4gdGhpcyB2aWRlbyBzcGFuIGNvdWxkbid0IGJlIGRpcmVjdGx5XG4gICAgICAgIC8vIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY2lwYW50ICh0aGlzIGNvdWxkIGhhcHBlbiBpbiB0aGUgY2FzZSBvZiBwcmV6aSkuXG4gICAgICAgIGlmIChNb2RlcmF0b3IuaXNNb2RlcmF0b3IoKSAmJiBwZWVySmlkICE9PSBudWxsKVxuICAgICAgICAgICAgYWRkUmVtb3RlVmlkZW9NZW51KHBlZXJKaWQsIGNvbnRhaW5lcik7XG5cbiAgICAgICAgcmVtb3Rlcy5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgICBBdWRpb0xldmVscy51cGRhdGVBdWRpb0xldmVsQ2FudmFzKHBlZXJKaWQsIFZpZGVvTGF5b3V0KTtcblxuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGF1ZGlvIG9yIHZpZGVvIHN0cmVhbSBlbGVtZW50LlxuICAgICAqL1xuICAgIG15LmNyZWF0ZVN0cmVhbUVsZW1lbnQgPSBmdW5jdGlvbiAoc2lkLCBzdHJlYW0pIHtcbiAgICAgICAgdmFyIGlzVmlkZW8gPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGggPiAwO1xuXG4gICAgICAgIHZhciBlbGVtZW50ID0gaXNWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgICAgIHZhciBpZCA9IChpc1ZpZGVvID8gJ3JlbW90ZVZpZGVvXycgOiAncmVtb3RlQXVkaW9fJylcbiAgICAgICAgICAgICAgICAgICAgKyBzaWQgKyAnXycgKyBSVEMuZ2V0U3RyZWFtSUQoc3RyZWFtKTtcblxuICAgICAgICBlbGVtZW50LmlkID0gaWQ7XG4gICAgICAgIGVsZW1lbnQuYXV0b3BsYXkgPSB0cnVlO1xuICAgICAgICBlbGVtZW50Lm9uY29udGV4dG1lbnUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcblxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9O1xuXG4gICAgbXkuYWRkUmVtb3RlU3RyZWFtRWxlbWVudFxuICAgICAgICA9IGZ1bmN0aW9uIChjb250YWluZXIsIHNpZCwgc3RyZWFtLCBwZWVySmlkLCB0aGVzc3JjKSB7XG4gICAgICAgIHZhciBuZXdFbGVtZW50SWQgPSBudWxsO1xuXG4gICAgICAgIHZhciBpc1ZpZGVvID0gc3RyZWFtLmdldFZpZGVvVHJhY2tzKCkubGVuZ3RoID4gMDtcblxuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICB2YXIgc3RyZWFtRWxlbWVudCA9IFZpZGVvTGF5b3V0LmNyZWF0ZVN0cmVhbUVsZW1lbnQoc2lkLCBzdHJlYW0pO1xuICAgICAgICAgICAgbmV3RWxlbWVudElkID0gc3RyZWFtRWxlbWVudC5pZDtcblxuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHN0cmVhbUVsZW1lbnQpO1xuXG4gICAgICAgICAgICB2YXIgc2VsID0gJCgnIycgKyBuZXdFbGVtZW50SWQpO1xuICAgICAgICAgICAgc2VsLmhpZGUoKTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIGNvbnRhaW5lciBpcyBjdXJyZW50bHkgdmlzaWJsZSB3ZSBhdHRhY2ggdGhlIHN0cmVhbS5cbiAgICAgICAgICAgIGlmICghaXNWaWRlb1xuICAgICAgICAgICAgICAgIHx8IChjb250YWluZXIub2Zmc2V0UGFyZW50ICE9PSBudWxsICYmIGlzVmlkZW8pKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvU3RyZWFtID0gc2ltdWxjYXN0LmdldFJlY2VpdmluZ1ZpZGVvU3RyZWFtKHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKHNlbCwgdmlkZW9TdHJlYW0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzVmlkZW8pXG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3JSZW1vdGVWaWRlbyhzZWwsIHRoZXNzcmMsIHN0cmVhbSwgcGVlckppZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0cmVhbS5vbmVuZGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdHJlYW0gZW5kZWQnLCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnJlbW92ZVJlbW90ZVN0cmVhbUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSwgaXNWaWRlbywgY29udGFpbmVyKTtcblxuICAgICAgICAgICAgICAgIC8vIE5PVEUoZ3ApIGl0IHNlZW1zIHRoYXQgdW5kZXIgY2VydGFpbiBjaXJjdW1zdGFuY2VzLCB0aGVcbiAgICAgICAgICAgICAgICAvLyBvbmVuZGVkIGV2ZW50IGlzIG5vdCBmaXJlZCBhbmQgdGh1cyB0aGUgY29udGFjdCBsaXN0IGlzIG5vdFxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZWQuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBUaGUgb25lbmRlZCBldmVudCBvZiBhIHN0cmVhbSBzaG91bGQgYmUgZmlyZWQgd2hlbiB0aGUgU1NSQ3NcbiAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kaW5nIHRvIHRoYXQgc3RyZWFtIGFyZSByZW1vdmVkIGZyb20gdGhlIFNEUDsgYnV0XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBkb2Vzbid0IHNlZW0gdG8gYWx3YXlzIGJlIHRoZSBjYXNlLCByZXN1bHRpbmcgaW4gZ2hvc3RcbiAgICAgICAgICAgICAgICAvLyBjb250YWN0cy5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIEluIGFuIGF0dGVtcHQgdG8gZml4IHRoZSBnaG9zdCBjb250YWN0cyBwcm9ibGVtLCBJJ20gbW92aW5nXG4gICAgICAgICAgICAgICAgLy8gdGhlIHJlbW92ZUNvbnRhY3QoKSBtZXRob2QgY2FsbCBpbiBhcHAuanMsIGluc2lkZSB0aGVcbiAgICAgICAgICAgICAgICAvLyAnbXVjLmxlZnQnIGV2ZW50IGhhbmRsZXIuXG5cbiAgICAgICAgICAgICAgICAvL2lmIChwZWVySmlkKVxuICAgICAgICAgICAgICAgIC8vICAgIENvbnRhY3RMaXN0LnJlbW92ZUNvbnRhY3QocGVlckppZCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBBZGQgY2xpY2sgaGFuZGxlci5cbiAgICAgICAgICAgIGNvbnRhaW5lci5vbmNsaWNrID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgKiBGSVhNRSBJdCB0dXJucyBvdXQgdGhhdCB2aWRlb1RodW1iIG1heSBub3QgZXhpc3QgKGlmIHRoZXJlIGlzXG4gICAgICAgICAgICAgICAgICogbm8gYWN0dWFsIHZpZGVvKS5cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9UaHVtYiA9ICQoJyMnICsgY29udGFpbmVyLmlkICsgJz52aWRlbycpLmdldCgwKTtcbiAgICAgICAgICAgICAgICBpZiAodmlkZW9UaHVtYikge1xuICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5oYW5kbGVWaWRlb1RodW1iQ2xpY2tlZChcbiAgICAgICAgICAgICAgICAgICAgICAgIFJUQy5nZXRWaWRlb1NyYyh2aWRlb1RodW1iKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQocGVlckppZCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gQWRkIGhvdmVyIGhhbmRsZXJcbiAgICAgICAgICAgICQoY29udGFpbmVyKS5ob3ZlcihcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd0Rpc3BsYXlOYW1lKGNvbnRhaW5lci5pZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpZGVvU3JjID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoJyMnICsgY29udGFpbmVyLmlkICsgJz52aWRlbycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgJCgnIycgKyBjb250YWluZXIuaWQgKyAnPnZpZGVvJykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlkZW9TcmMgPSBSVEMuZ2V0VmlkZW9TcmMoJCgnIycgKyBjb250YWluZXIuaWQgKyAnPnZpZGVvJykuZ2V0KDApKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZSB2aWRlbyBoYXMgYmVlbiBcInBpbm5lZFwiIGJ5IHRoZSB1c2VyIHdlIHdhbnQgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8ga2VlcCB0aGUgZGlzcGxheSBuYW1lIG9uIHBsYWNlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoIVZpZGVvTGF5b3V0LmlzTGFyZ2VWaWRlb1Zpc2libGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHZpZGVvU3JjICE9PSBSVEMuZ2V0VmlkZW9TcmMoJCgnI2xhcmdlVmlkZW8nKVswXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICBWaWRlb0xheW91dC5zaG93RGlzcGxheU5hbWUoY29udGFpbmVyLmlkLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXdFbGVtZW50SWQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIHJlbW90ZSBzdHJlYW0gZWxlbWVudCBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiBzdHJlYW0gYW5kXG4gICAgICogcGFyZW50IGNvbnRhaW5lci5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gc3RyZWFtIHRoZSBzdHJlYW1cbiAgICAgKiBAcGFyYW0gaXNWaWRlbyA8dHQ+dHJ1ZTwvdHQ+IGlmIGdpdmVuIDx0dD5zdHJlYW08L3R0PiBpcyBhIHZpZGVvIG9uZS5cbiAgICAgKiBAcGFyYW0gY29udGFpbmVyXG4gICAgICovXG4gICAgbXkucmVtb3ZlUmVtb3RlU3RyZWFtRWxlbWVudCA9IGZ1bmN0aW9uIChzdHJlYW0sIGlzVmlkZW8sIGNvbnRhaW5lcikge1xuICAgICAgICBpZiAoIWNvbnRhaW5lcilcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB2YXIgc2VsZWN0ID0gbnVsbDtcbiAgICAgICAgdmFyIHJlbW92ZWRWaWRlb1NyYyA9IG51bGw7XG4gICAgICAgIGlmIChpc1ZpZGVvKSB7XG4gICAgICAgICAgICBzZWxlY3QgPSAkKCcjJyArIGNvbnRhaW5lci5pZCArICc+dmlkZW8nKTtcbiAgICAgICAgICAgIHJlbW92ZWRWaWRlb1NyYyA9IFJUQy5nZXRWaWRlb1NyYyhzZWxlY3QuZ2V0KDApKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZWxlY3QgPSAkKCcjJyArIGNvbnRhaW5lci5pZCArICc+YXVkaW8nKTtcblxuXG4gICAgICAgIC8vIE1hcmsgdmlkZW8gYXMgcmVtb3ZlZCB0byBjYW5jZWwgd2FpdGluZyBsb29wKGlmIHZpZGVvIGlzIHJlbW92ZWRcbiAgICAgICAgLy8gYmVmb3JlIGhhcyBzdGFydGVkKVxuICAgICAgICBzZWxlY3QucmVtb3ZlZCA9IHRydWU7XG4gICAgICAgIHNlbGVjdC5yZW1vdmUoKTtcblxuICAgICAgICB2YXIgYXVkaW9Db3VudCA9ICQoJyMnICsgY29udGFpbmVyLmlkICsgJz5hdWRpbycpLmxlbmd0aDtcbiAgICAgICAgdmFyIHZpZGVvQ291bnQgPSAkKCcjJyArIGNvbnRhaW5lci5pZCArICc+dmlkZW8nKS5sZW5ndGg7XG5cbiAgICAgICAgaWYgKCFhdWRpb0NvdW50ICYmICF2aWRlb0NvdW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92ZSB3aG9sZSB1c2VyXCIsIGNvbnRhaW5lci5pZCk7XG4gICAgICAgICAgICBpZihWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1tjb250YWluZXIuaWRdKVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW2NvbnRhaW5lci5pZF0ucmVtb3ZlKCk7XG4gICAgICAgICAgICAvLyBSZW1vdmUgd2hvbGUgY29udGFpbmVyXG4gICAgICAgICAgICBjb250YWluZXIucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIFV0aWwucGxheVNvdW5kTm90aWZpY2F0aW9uKCd1c2VyTGVmdCcpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlbW92ZWRWaWRlb1NyYylcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZVJlbW92ZWRWaWRlbyhyZW1vdmVkVmlkZW9TcmMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93L2hpZGUgcGVlciBjb250YWluZXIgZm9yIHRoZSBnaXZlbiByZXNvdXJjZUppZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzaG93UGVlckNvbnRhaW5lcihyZXNvdXJjZUppZCwgc3RhdGUpIHtcbiAgICAgICAgdmFyIHBlZXJDb250YWluZXIgPSAkKCcjcGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICBpZiAoIXBlZXJDb250YWluZXIpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgdmFyIGlzSGlkZSA9IHN0YXRlID09PSAnaGlkZSc7XG4gICAgICAgIHZhciByZXNpemVUaHVtYm5haWxzID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCFpc0hpZGUpIHtcbiAgICAgICAgICAgIGlmICghcGVlckNvbnRhaW5lci5pcygnOnZpc2libGUnKSkge1xuICAgICAgICAgICAgICAgIHJlc2l6ZVRodW1ibmFpbHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHBlZXJDb250YWluZXIuc2hvdygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhdGUgPT0gJ3Nob3cnKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIHBlZXJDb250YWluZXIuY3NzKCctd2Via2l0LWZpbHRlcicsICcnKTtcbiAgICAgICAgICAgICAgICB2YXIgamlkID0gY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgIEF2YXRhci5zaG93VXNlckF2YXRhcihqaWQsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgLy8gaWYgKHN0YXRlID09ICdhdmF0YXInKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIC8vIHBlZXJDb250YWluZXIuY3NzKCctd2Via2l0LWZpbHRlcicsICdncmF5c2NhbGUoMTAwJSknKTtcbiAgICAgICAgICAgICAgICB2YXIgamlkID0gY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgIEF2YXRhci5zaG93VXNlckF2YXRhcihqaWQsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHBlZXJDb250YWluZXIuaXMoJzp2aXNpYmxlJykgJiYgaXNIaWRlKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXNpemVUaHVtYm5haWxzID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlZXJDb250YWluZXIuaGlkZSgpO1xuICAgICAgICAgICAgaWYoVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZF0pXG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZF0uaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc2l6ZVRodW1ibmFpbHMpIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnJlc2l6ZVRodW1ibmFpbHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHdhbnQgdG8gYmUgYWJsZSB0byBwaW4gYSBwYXJ0aWNpcGFudCBmcm9tIHRoZSBjb250YWN0IGxpc3QsIGV2ZW5cbiAgICAgICAgLy8gaWYgaGUncyBub3QgaW4gdGhlIGxhc3ROIHNldCFcbiAgICAgICAgLy8gQ29udGFjdExpc3Quc2V0Q2xpY2thYmxlKHJlc291cmNlSmlkLCAhaXNIaWRlKTtcblxuICAgIH07XG5cbiAgICBteS5pbnB1dERpc3BsYXlOYW1lSGFuZGxlciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lICYmIG5pY2tuYW1lICE9PSBuYW1lKSB7XG4gICAgICAgICAgICBuaWNrbmFtZSA9IG5hbWU7XG4gICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLmRpc3BsYXluYW1lID0gbmlja25hbWU7XG4gICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkRGlzcGxheU5hbWVUb1ByZXNlbmNlKG5pY2tuYW1lKTtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5zZW5kUHJlc2VuY2UoKTtcblxuICAgICAgICAgICAgQ2hhdC5zZXRDaGF0Q29udmVyc2F0aW9uTW9kZSh0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghJCgnI2xvY2FsRGlzcGxheU5hbWUnKS5pcyhcIjp2aXNpYmxlXCIpKSB7XG4gICAgICAgICAgICBpZiAobmlja25hbWUpXG4gICAgICAgICAgICAgICAgJCgnI2xvY2FsRGlzcGxheU5hbWUnKS50ZXh0KG5pY2tuYW1lICsgXCIgKG1lKVwiKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAkKCcjbG9jYWxEaXNwbGF5TmFtZScpXG4gICAgICAgICAgICAgICAgICAgIC50ZXh0KGludGVyZmFjZUNvbmZpZy5ERUZBVUxUX0xPQ0FMX0RJU1BMQVlfTkFNRSk7XG4gICAgICAgICAgICAkKCcjbG9jYWxEaXNwbGF5TmFtZScpLnNob3coKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJyNlZGl0RGlzcGxheU5hbWUnKS5oaWRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNob3dzL2hpZGVzIHRoZSBkaXNwbGF5IG5hbWUgb24gdGhlIHJlbW90ZSB2aWRlby5cbiAgICAgKiBAcGFyYW0gdmlkZW9TcGFuSWQgdGhlIGlkZW50aWZpZXIgb2YgdGhlIHZpZGVvIHNwYW4gZWxlbWVudFxuICAgICAqIEBwYXJhbSBpc1Nob3cgaW5kaWNhdGVzIGlmIHRoZSBkaXNwbGF5IG5hbWUgc2hvdWxkIGJlIHNob3duIG9yIGhpZGRlblxuICAgICAqL1xuICAgIG15LnNob3dEaXNwbGF5TmFtZSA9IGZ1bmN0aW9uKHZpZGVvU3BhbklkLCBpc1Nob3cpIHtcbiAgICAgICAgdmFyIG5hbWVTcGFuID0gJCgnIycgKyB2aWRlb1NwYW5JZCArICc+c3Bhbi5kaXNwbGF5bmFtZScpLmdldCgwKTtcbiAgICAgICAgaWYgKGlzU2hvdykge1xuICAgICAgICAgICAgaWYgKG5hbWVTcGFuICYmIG5hbWVTcGFuLmlubmVySFRNTCAmJiBuYW1lU3Bhbi5pbm5lckhUTUwubGVuZ3RoKSBcbiAgICAgICAgICAgICAgICBuYW1lU3Bhbi5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYW1lU3BhbilcbiAgICAgICAgICAgICAgICBuYW1lU3Bhbi5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcImRpc3BsYXk6bm9uZTtcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2hvd3MgdGhlIHByZXNlbmNlIHN0YXR1cyBtZXNzYWdlIGZvciB0aGUgZ2l2ZW4gdmlkZW8uXG4gICAgICovXG4gICAgbXkuc2V0UHJlc2VuY2VTdGF0dXMgPSBmdW5jdGlvbiAodmlkZW9TcGFuSWQsIHN0YXR1c01zZykge1xuXG4gICAgICAgIGlmICghJCgnIycgKyB2aWRlb1NwYW5JZCkubGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBObyBjb250YWluZXJcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdGF0dXNTcGFuID0gJCgnIycgKyB2aWRlb1NwYW5JZCArICc+c3Bhbi5zdGF0dXMnKTtcbiAgICAgICAgaWYgKCFzdGF0dXNTcGFuLmxlbmd0aCkge1xuICAgICAgICAgICAgLy9BZGQgc3RhdHVzIHNwYW5cbiAgICAgICAgICAgIHN0YXR1c1NwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICBzdGF0dXNTcGFuLmNsYXNzTmFtZSA9ICdzdGF0dXMnO1xuICAgICAgICAgICAgc3RhdHVzU3Bhbi5pZCA9IHZpZGVvU3BhbklkICsgJ19zdGF0dXMnO1xuICAgICAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZClbMF0uYXBwZW5kQ2hpbGQoc3RhdHVzU3Bhbik7XG5cbiAgICAgICAgICAgIHN0YXR1c1NwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLnN0YXR1cycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGlzcGxheSBzdGF0dXNcbiAgICAgICAgaWYgKHN0YXR1c01zZyAmJiBzdGF0dXNNc2cubGVuZ3RoKSB7XG4gICAgICAgICAgICAkKCcjJyArIHZpZGVvU3BhbklkICsgJ19zdGF0dXMnKS50ZXh0KHN0YXR1c01zZyk7XG4gICAgICAgICAgICBzdGF0dXNTcGFuLmdldCgwKS5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBcImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIEhpZGVcbiAgICAgICAgICAgIHN0YXR1c1NwYW4uZ2V0KDApLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIFwiZGlzcGxheTpub25lO1wiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyBhIHZpc3VhbCBpbmRpY2F0b3IgZm9yIHRoZSBtb2RlcmF0b3Igb2YgdGhlIGNvbmZlcmVuY2UuXG4gICAgICovXG4gICAgbXkuc2hvd01vZGVyYXRvckluZGljYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKE1vZGVyYXRvci5pc01vZGVyYXRvcigpKSB7XG4gICAgICAgICAgICB2YXIgaW5kaWNhdG9yU3BhbiA9ICQoJyNsb2NhbFZpZGVvQ29udGFpbmVyIC5mb2N1c2luZGljYXRvcicpO1xuXG4gICAgICAgICAgICBpZiAoaW5kaWNhdG9yU3Bhbi5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVNb2RlcmF0b3JJbmRpY2F0b3JFbGVtZW50KGluZGljYXRvclNwYW5bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5rZXlzKGNvbm5lY3Rpb24uZW11Yy5tZW1iZXJzKS5mb3JFYWNoKGZ1bmN0aW9uIChqaWQpIHtcbiAgICAgICAgICAgIHZhciBtZW1iZXIgPSBjb25uZWN0aW9uLmVtdWMubWVtYmVyc1tqaWRdO1xuICAgICAgICAgICAgaWYgKG1lbWJlci5yb2xlID09PSAnbW9kZXJhdG9yJykge1xuICAgICAgICAgICAgICAgIHZhciBtb2RlcmF0b3JJZFxuICAgICAgICAgICAgICAgICAgICA9ICdwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcblxuICAgICAgICAgICAgICAgIHZhciBtb2RlcmF0b3JDb250YWluZXJcbiAgICAgICAgICAgICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChtb2RlcmF0b3JJZCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKSA9PT0gJ2ZvY3VzJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHNlcnZlciBzaWRlIGZvY3VzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFtb2RlcmF0b3JDb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIG1vZGVyYXRvciBjb250YWluZXIgZm9yIFwiICsgamlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgbWVudVNwYW4gPSAkKCcjJyArIG1vZGVyYXRvcklkICsgJz5zcGFuLnJlbW90ZXZpZGVvbWVudScpO1xuICAgICAgICAgICAgICAgIGlmIChtZW51U3Bhbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlUmVtb3RlVmlkZW9NZW51KG1vZGVyYXRvcklkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kaWNhdG9yU3BhblxuICAgICAgICAgICAgICAgICAgICA9ICQoJyMnICsgbW9kZXJhdG9ySWQgKyAnIC5mb2N1c2luZGljYXRvcicpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpbmRpY2F0b3JTcGFuIHx8IGluZGljYXRvclNwYW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvclNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgICAgIGluZGljYXRvclNwYW4uY2xhc3NOYW1lID0gJ2ZvY3VzaW5kaWNhdG9yJztcblxuICAgICAgICAgICAgICAgICAgICBtb2RlcmF0b3JDb250YWluZXIuYXBwZW5kQ2hpbGQoaW5kaWNhdG9yU3Bhbik7XG5cbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTW9kZXJhdG9ySW5kaWNhdG9yRWxlbWVudChpbmRpY2F0b3JTcGFuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTaG93cyB2aWRlbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciBzbWFsbCB2aWRlb3MuXG4gICAgICovXG4gICAgbXkuc2hvd1ZpZGVvSW5kaWNhdG9yID0gZnVuY3Rpb24odmlkZW9TcGFuSWQsIGlzTXV0ZWQpIHtcbiAgICAgICAgdmFyIHZpZGVvTXV0ZWRTcGFuID0gJCgnIycgKyB2aWRlb1NwYW5JZCArICc+c3Bhbi52aWRlb011dGVkJyk7XG5cbiAgICAgICAgaWYgKGlzTXV0ZWQgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIGlmICh2aWRlb011dGVkU3Bhbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4ucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZih2aWRlb011dGVkU3Bhbi5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuLmNsYXNzTmFtZSA9ICd2aWRlb011dGVkJztcblxuICAgICAgICAgICAgICAgICQoJyMnICsgdmlkZW9TcGFuSWQpWzBdLmFwcGVuZENoaWxkKHZpZGVvTXV0ZWRTcGFuKTtcblxuICAgICAgICAgICAgICAgIHZhciBtdXRlZEluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgICAgICAgICAgICBtdXRlZEluZGljYXRvci5jbGFzc05hbWUgPSAnaWNvbi1jYW1lcmEtZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIFV0aWwuc2V0VG9vbHRpcChtdXRlZEluZGljYXRvcixcbiAgICAgICAgICAgICAgICAgICAgXCJQYXJ0aWNpcGFudCBoYXM8YnIvPnN0b3BwZWQgdGhlIGNhbWVyYS5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0b3BcIik7XG4gICAgICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4uYXBwZW5kQ2hpbGQobXV0ZWRJbmRpY2F0b3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVNdXRlUG9zaXRpb24odmlkZW9TcGFuSWQpO1xuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbXkudXBkYXRlTXV0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKHZpZGVvU3BhbklkKSB7XG4gICAgICAgIHZhciBhdWRpb011dGVkU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4uYXVkaW9NdXRlZCcpO1xuICAgICAgICB2YXIgY29ubmVjdGlvbkluZGljYXRvciA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPmRpdi5jb25uZWN0aW9uaW5kaWNhdG9yJyk7XG4gICAgICAgIHZhciB2aWRlb011dGVkU3BhbiA9ICQoJyMnICsgdmlkZW9TcGFuSWQgKyAnPnNwYW4udmlkZW9NdXRlZCcpO1xuICAgICAgICBpZihjb25uZWN0aW9uSW5kaWNhdG9yLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICYmIGNvbm5lY3Rpb25JbmRpY2F0b3JbMF0uc3R5bGUuZGlzcGxheSAhPSBcIm5vbmVcIikge1xuICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4uY3NzKHtyaWdodDogXCIyM3B4XCJ9KTtcbiAgICAgICAgICAgIHZpZGVvTXV0ZWRTcGFuLmNzcyh7cmlnaHQ6ICgoYXVkaW9NdXRlZFNwYW4ubGVuZ3RoID4gMD8gMjMgOiAwKSArIDMwKSArIFwicHhcIn0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4uY3NzKHtyaWdodDogXCIwcHhcIn0pO1xuICAgICAgICAgICAgdmlkZW9NdXRlZFNwYW4uY3NzKHtyaWdodDogKGF1ZGlvTXV0ZWRTcGFuLmxlbmd0aCA+IDA/IDMwIDogMCkgKyBcInB4XCJ9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTaG93cyBhdWRpbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciBzbWFsbCB2aWRlb3MuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlzTXV0ZWRcbiAgICAgKi9cbiAgICBteS5zaG93QXVkaW9JbmRpY2F0b3IgPSBmdW5jdGlvbih2aWRlb1NwYW5JZCwgaXNNdXRlZCkge1xuICAgICAgICB2YXIgYXVkaW9NdXRlZFNwYW4gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz5zcGFuLmF1ZGlvTXV0ZWQnKTtcblxuICAgICAgICBpZiAoaXNNdXRlZCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgaWYgKGF1ZGlvTXV0ZWRTcGFuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3Bhbi5wb3BvdmVyKCdoaWRlJyk7XG4gICAgICAgICAgICAgICAgYXVkaW9NdXRlZFNwYW4ucmVtb3ZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZihhdWRpb011dGVkU3Bhbi5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBhdWRpb011dGVkU3Bhbi5jbGFzc05hbWUgPSAnYXVkaW9NdXRlZCc7XG4gICAgICAgICAgICAgICAgVXRpbC5zZXRUb29sdGlwKGF1ZGlvTXV0ZWRTcGFuLFxuICAgICAgICAgICAgICAgICAgICBcIlBhcnRpY2lwYW50IGlzIG11dGVkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidG9wXCIpO1xuXG4gICAgICAgICAgICAgICAgJCgnIycgKyB2aWRlb1NwYW5JZClbMF0uYXBwZW5kQ2hpbGQoYXVkaW9NdXRlZFNwYW4pO1xuICAgICAgICAgICAgICAgIHZhciBtdXRlZEluZGljYXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKTtcbiAgICAgICAgICAgICAgICBtdXRlZEluZGljYXRvci5jbGFzc05hbWUgPSAnaWNvbi1taWMtZGlzYWJsZWQnO1xuICAgICAgICAgICAgICAgIGF1ZGlvTXV0ZWRTcGFuLmFwcGVuZENoaWxkKG11dGVkSW5kaWNhdG9yKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTXV0ZVBvc2l0aW9uKHZpZGVvU3BhbklkKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKlxuICAgICAqIFNob3dzIG9yIGhpZGVzIHRoZSBhdWRpbyBtdXRlZCBpbmRpY2F0b3Igb3ZlciB0aGUgbG9jYWwgdGh1bWJuYWlsIHZpZGVvLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNNdXRlZFxuICAgICAqL1xuICAgIG15LnNob3dMb2NhbEF1ZGlvSW5kaWNhdG9yID0gZnVuY3Rpb24oaXNNdXRlZCkge1xuICAgICAgICBWaWRlb0xheW91dC5zaG93QXVkaW9JbmRpY2F0b3IoJ2xvY2FsVmlkZW9Db250YWluZXInLCBpc011dGVkLnRvU3RyaW5nKCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRoZSBsYXJnZSB2aWRlbyBjb250YWluZXIuXG4gICAgICovXG4gICAgbXkucmVzaXplTGFyZ2VWaWRlb0NvbnRhaW5lciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ2hhdC5yZXNpemVDaGF0KCk7XG4gICAgICAgIHZhciBhdmFpbGFibGVIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IFVJVXRpbC5nZXRBdmFpbGFibGVWaWRlb1dpZHRoKCk7XG5cbiAgICAgICAgaWYgKGF2YWlsYWJsZVdpZHRoIDwgMCB8fCBhdmFpbGFibGVIZWlnaHQgPCAwKSByZXR1cm47XG5cbiAgICAgICAgJCgnI3ZpZGVvc3BhY2UnKS53aWR0aChhdmFpbGFibGVXaWR0aCk7XG4gICAgICAgICQoJyN2aWRlb3NwYWNlJykuaGVpZ2h0KGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICAgICQoJyNsYXJnZVZpZGVvQ29udGFpbmVyJykud2lkdGgoYXZhaWxhYmxlV2lkdGgpO1xuICAgICAgICAkKCcjbGFyZ2VWaWRlb0NvbnRhaW5lcicpLmhlaWdodChhdmFpbGFibGVIZWlnaHQpO1xuXG4gICAgICAgIHZhciBhdmF0YXJTaXplID0gaW50ZXJmYWNlQ29uZmlnLkFDVElWRV9TUEVBS0VSX0FWQVRBUl9TSVpFO1xuICAgICAgICB2YXIgdG9wID0gYXZhaWxhYmxlSGVpZ2h0IC8gMiAtIGF2YXRhclNpemUgLyA0ICogMztcbiAgICAgICAgJCgnI2FjdGl2ZVNwZWFrZXInKS5jc3MoJ3RvcCcsIHRvcCk7XG5cbiAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXNpemVzIHRodW1ibmFpbHMuXG4gICAgICovXG4gICAgbXkucmVzaXplVGh1bWJuYWlscyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmlkZW9TcGFjZVdpZHRoID0gJCgnI3JlbW90ZVZpZGVvcycpLndpZHRoKCk7XG5cbiAgICAgICAgdmFyIHRodW1ibmFpbFNpemUgPSBWaWRlb0xheW91dC5jYWxjdWxhdGVUaHVtYm5haWxTaXplKHZpZGVvU3BhY2VXaWR0aCk7XG4gICAgICAgIHZhciB3aWR0aCA9IHRodW1ibmFpbFNpemVbMF07XG4gICAgICAgIHZhciBoZWlnaHQgPSB0aHVtYm5haWxTaXplWzFdO1xuXG4gICAgICAgIC8vIHNpemUgdmlkZW9zIHNvIHRoYXQgd2hpbGUga2VlcGluZyBBUiBhbmQgbWF4IGhlaWdodCwgd2UgaGF2ZSBhXG4gICAgICAgIC8vIG5pY2UgZml0XG4gICAgICAgICQoJyNyZW1vdGVWaWRlb3MnKS5oZWlnaHQoaGVpZ2h0KTtcbiAgICAgICAgJCgnI3JlbW90ZVZpZGVvcz5zcGFuJykud2lkdGgod2lkdGgpO1xuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5oZWlnaHQoaGVpZ2h0KTtcblxuICAgICAgICAkKCcudXNlckF2YXRhcicpLmNzcygnbGVmdCcsICh3aWR0aCAtIGhlaWdodCkgLyAyKTtcblxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwicmVtb3RldmlkZW8ucmVzaXplZFwiLCBbd2lkdGgsIGhlaWdodF0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGVzIHRoZSBkb21pbmFudCBzcGVha2VyIFVJLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc291cmNlSmlkIHRoZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZWxlbWVudCB0b1xuICAgICAqIGFjdGl2YXRlL2RlYWN0aXZhdGVcbiAgICAgKiBAcGFyYW0gaXNFbmFibGUgaW5kaWNhdGVzIGlmIHRoZSBkb21pbmFudCBzcGVha2VyIHNob3VsZCBiZSBlbmFibGVkIG9yXG4gICAgICogZGlzYWJsZWRcbiAgICAgKi9cbiAgICBteS5lbmFibGVEb21pbmFudFNwZWFrZXIgPSBmdW5jdGlvbihyZXNvdXJjZUppZCwgaXNFbmFibGUpIHtcblxuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBudWxsO1xuICAgICAgICB2YXIgdmlkZW9Db250YWluZXJJZCA9IG51bGw7XG4gICAgICAgIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgID09PSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSkge1xuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAnbG9jYWxWaWRlb1dyYXBwZXInO1xuICAgICAgICAgICAgdmlkZW9Db250YWluZXJJZCA9ICdsb2NhbFZpZGVvQ29udGFpbmVyJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZDtcbiAgICAgICAgICAgIHZpZGVvQ29udGFpbmVySWQgPSB2aWRlb1NwYW5JZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkaXNwbGF5TmFtZSA9IHJlc291cmNlSmlkO1xuICAgICAgICB2YXIgbmFtZVNwYW4gPSAkKCcjJyArIHZpZGVvQ29udGFpbmVySWQgKyAnPnNwYW4uZGlzcGxheW5hbWUnKTtcbiAgICAgICAgaWYgKG5hbWVTcGFuLmxlbmd0aCA+IDApXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSA9IG5hbWVTcGFuLmh0bWwoKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIlVJIGVuYWJsZSBkb21pbmFudCBzcGVha2VyXCIsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIHJlc291cmNlSmlkLFxuICAgICAgICAgICAgaXNFbmFibGUpO1xuXG4gICAgICAgIHZpZGVvU3BhbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZpZGVvQ29udGFpbmVySWQpO1xuXG4gICAgICAgIGlmICghdmlkZW9TcGFuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmlkZW8gPSAkKCcjJyArIHZpZGVvU3BhbklkICsgJz52aWRlbycpO1xuXG4gICAgICAgIGlmICh2aWRlbyAmJiB2aWRlby5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoaXNFbmFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNMYXJnZVZpZGVvVmlzaWJsZSA9IFZpZGVvTGF5b3V0LmlzTGFyZ2VWaWRlb09uVG9wKCk7XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd0Rpc3BsYXlOYW1lKHZpZGVvQ29udGFpbmVySWQsIGlzTGFyZ2VWaWRlb1Zpc2libGUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF2aWRlb1NwYW4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiZG9taW5hbnRzcGVha2VyXCIpKVxuICAgICAgICAgICAgICAgICAgICB2aWRlb1NwYW4uY2xhc3NMaXN0LmFkZChcImRvbWluYW50c3BlYWtlclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dEaXNwbGF5TmFtZSh2aWRlb0NvbnRhaW5lcklkLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodmlkZW9TcGFuLmNsYXNzTGlzdC5jb250YWlucyhcImRvbWluYW50c3BlYWtlclwiKSlcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9TcGFuLmNsYXNzTGlzdC5yZW1vdmUoXCJkb21pbmFudHNwZWFrZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEF2YXRhci5zaG93VXNlckF2YXRhcihcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuZmluZEppZEZyb21SZXNvdXJjZShyZXNvdXJjZUppZCkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENhbGN1bGF0ZXMgdGhlIHRodW1ibmFpbCBzaXplLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpZGVvU3BhY2VXaWR0aCB0aGUgd2lkdGggb2YgdGhlIHZpZGVvIHNwYWNlXG4gICAgICovXG4gICAgbXkuY2FsY3VsYXRlVGh1bWJuYWlsU2l6ZSA9IGZ1bmN0aW9uICh2aWRlb1NwYWNlV2lkdGgpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBhdmFpbGFibGUgaGVpZ2h0LCB3aGljaCBpcyB0aGUgaW5uZXIgd2luZG93IGhlaWdodCBtaW51c1xuICAgICAgIC8vIDM5cHggZm9yIHRoZSBoZWFkZXIgbWludXMgMnB4IGZvciB0aGUgZGVsaW1pdGVyIGxpbmVzIG9uIHRoZSB0b3AgYW5kXG4gICAgICAgLy8gYm90dG9tIG9mIHRoZSBsYXJnZSB2aWRlbywgbWludXMgdGhlIDM2cHggc3BhY2UgaW5zaWRlIHRoZSByZW1vdGVWaWRlb3NcbiAgICAgICAvLyBjb250YWluZXIgdXNlZCBmb3IgaGlnaGxpZ2h0aW5nIHNoYWRvdy5cbiAgICAgICB2YXIgYXZhaWxhYmxlSGVpZ2h0ID0gMTAwO1xuXG4gICAgICAgIHZhciBudW12aWRzID0gJCgnI3JlbW90ZVZpZGVvcz5zcGFuOnZpc2libGUnKS5sZW5ndGg7XG4gICAgICAgIGlmIChsb2NhbExhc3ROQ291bnQgJiYgbG9jYWxMYXN0TkNvdW50ID4gMCkge1xuICAgICAgICAgICAgbnVtdmlkcyA9IE1hdGgubWluKGxvY2FsTGFzdE5Db3VudCArIDEsIG51bXZpZHMpO1xuICAgICAgICB9XG5cbiAgICAgICAvLyBSZW1vdmUgdGhlIDNweCBib3JkZXJzIGFycm91bmQgdmlkZW9zIGFuZCBib3JkZXIgYXJvdW5kIHRoZSByZW1vdGVcbiAgICAgICAvLyB2aWRlb3MgYXJlYSBhbmQgdGhlIDQgcGl4ZWxzIGJldHdlZW4gdGhlIGxvY2FsIHZpZGVvIGFuZCB0aGUgb3RoZXJzXG4gICAgICAgLy9UT0RPOiBGaW5kIG91dCB3aGVyZSB0aGUgNCBwaXhlbHMgY29tZSBmcm9tIGFuZCByZW1vdmUgdGhlbVxuICAgICAgIHZhciBhdmFpbGFibGVXaW5XaWR0aCA9IHZpZGVvU3BhY2VXaWR0aCAtIDIgKiAzICogbnVtdmlkcyAtIDcwIC0gNDtcblxuICAgICAgIHZhciBhdmFpbGFibGVXaWR0aCA9IGF2YWlsYWJsZVdpbldpZHRoIC8gbnVtdmlkcztcbiAgICAgICB2YXIgYXNwZWN0UmF0aW8gPSAxNi4wIC8gOS4wO1xuICAgICAgIHZhciBtYXhIZWlnaHQgPSBNYXRoLm1pbigxNjAsIGF2YWlsYWJsZUhlaWdodCk7XG4gICAgICAgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5taW4obWF4SGVpZ2h0LCBhdmFpbGFibGVXaWR0aCAvIGFzcGVjdFJhdGlvKTtcbiAgICAgICBpZiAoYXZhaWxhYmxlSGVpZ2h0IDwgYXZhaWxhYmxlV2lkdGggLyBhc3BlY3RSYXRpbykge1xuICAgICAgICAgICBhdmFpbGFibGVXaWR0aCA9IE1hdGguZmxvb3IoYXZhaWxhYmxlSGVpZ2h0ICogYXNwZWN0UmF0aW8pO1xuICAgICAgIH1cblxuICAgICAgIHJldHVybiBbYXZhaWxhYmxlV2lkdGgsIGF2YWlsYWJsZUhlaWdodF07XG4gICB9O1xuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgcmVtb3RlIHZpZGVvIG1lbnUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gamlkIHRoZSBqaWQgaW5kaWNhdGluZyB0aGUgdmlkZW8gZm9yIHdoaWNoIHdlJ3JlIGFkZGluZyBhIG1lbnUuXG4gICAgICogQHBhcmFtIGlzTXV0ZWQgaW5kaWNhdGVzIHRoZSBjdXJyZW50IG11dGUgc3RhdGVcbiAgICAgKi9cbiAgICBteS51cGRhdGVSZW1vdGVWaWRlb01lbnUgPSBmdW5jdGlvbihqaWQsIGlzTXV0ZWQpIHtcbiAgICAgICAgdmFyIG11dGVNZW51SXRlbVxuICAgICAgICAgICAgPSAkKCcjcmVtb3RlX3BvcHVwbWVudV8nXG4gICAgICAgICAgICAgICAgICAgICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKVxuICAgICAgICAgICAgICAgICAgICArICc+bGk+YS5tdXRlbGluaycpO1xuXG4gICAgICAgIHZhciBtdXRlZEluZGljYXRvciA9IFwiPGkgY2xhc3M9J2ljb24tbWljLWRpc2FibGVkJz48L2k+XCI7XG5cbiAgICAgICAgaWYgKG11dGVNZW51SXRlbS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBtdXRlTGluayA9IG11dGVNZW51SXRlbS5nZXQoMCk7XG5cbiAgICAgICAgICAgIGlmIChpc011dGVkID09PSAndHJ1ZScpIHtcbiAgICAgICAgICAgICAgICBtdXRlTGluay5pbm5lckhUTUwgPSBtdXRlZEluZGljYXRvciArICcgTXV0ZWQnO1xuICAgICAgICAgICAgICAgIG11dGVMaW5rLmNsYXNzTmFtZSA9ICdtdXRlbGluayBkaXNhYmxlZCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtdXRlTGluay5pbm5lckhUTUwgPSBtdXRlZEluZGljYXRvciArICcgTXV0ZSc7XG4gICAgICAgICAgICAgICAgbXV0ZUxpbmsuY2xhc3NOYW1lID0gJ211dGVsaW5rJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGRvbWluYW50IHNwZWFrZXIgcmVzb3VyY2UgamlkLlxuICAgICAqL1xuICAgIG15LmdldERvbWluYW50U3BlYWtlclJlc291cmNlSmlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY3VycmVudERvbWluYW50U3BlYWtlcjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgY29ycmVzcG9uZGluZyByZXNvdXJjZSBqaWQgdG8gdGhlIGdpdmVuIHBlZXIgY29udGFpbmVyXG4gICAgICogRE9NIGVsZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHRoZSBjb3JyZXNwb25kaW5nIHJlc291cmNlIGppZCB0byB0aGUgZ2l2ZW4gcGVlciBjb250YWluZXJcbiAgICAgKiBET00gZWxlbWVudFxuICAgICAqL1xuICAgIG15LmdldFBlZXJDb250YWluZXJSZXNvdXJjZUppZCA9IGZ1bmN0aW9uIChjb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgIHZhciBpID0gY29udGFpbmVyRWxlbWVudC5pZC5pbmRleE9mKCdwYXJ0aWNpcGFudF8nKTtcblxuICAgICAgICBpZiAoaSA+PSAwKVxuICAgICAgICAgICAgcmV0dXJuIGNvbnRhaW5lckVsZW1lbnQuaWQuc3Vic3RyaW5nKGkgKyAxMik7IFxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBPbiBjb250YWN0IGxpc3QgaXRlbSBjbGlja2VkLlxuICAgICAqL1xuICAgICQoQ29udGFjdExpc3QpLmJpbmQoJ2NvbnRhY3RjbGlja2VkJywgZnVuY3Rpb24oZXZlbnQsIGppZCkge1xuICAgICAgICBpZiAoIWppZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc291cmNlID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcbiAgICAgICAgdmFyIHZpZGVvQ29udGFpbmVyID0gJChcIiNwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlKTtcbiAgICAgICAgaWYgKHZpZGVvQ29udGFpbmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciB2aWRlb1RodW1iID0gJCgndmlkZW8nLCB2aWRlb0NvbnRhaW5lcikuZ2V0KDApO1xuICAgICAgICAgICAgLy8gSXQgaXMgbm90IGFsd2F5cyB0aGUgY2FzZSB0aGF0IGEgdmlkZW9UaHVtYiBleGlzdHMgKGlmIHRoZXJlIGlzXG4gICAgICAgICAgICAvLyBubyBhY3R1YWwgdmlkZW8pLlxuICAgICAgICAgICAgaWYgKHZpZGVvVGh1bWIpIHtcbiAgICAgICAgICAgICAgICBpZiAodmlkZW9UaHVtYi5zcmMgJiYgdmlkZW9UaHVtYi5zcmMgIT0gJycpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBXZSBoYXZlIGEgdmlkZW8gc3JjLCBncmVhdCEgTGV0J3MgdXBkYXRlIHRoZSBsYXJnZSB2aWRlb1xuICAgICAgICAgICAgICAgICAgICAvLyBub3cuXG5cbiAgICAgICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuaGFuZGxlVmlkZW9UaHVtYkNsaWNrZWQoXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWRlb1RodW1iLnNyYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgdmlkZW8gc3JjIGZvciBqaWQsIHRoZXJlJ3MgYWJzb2x1dGVseVxuICAgICAgICAgICAgICAgICAgICAvLyBubyBwb2ludCBpbiBjYWxsaW5nIGhhbmRsZVZpZGVvVGh1bWJDbGlja2VkOyBRdWl0ZVxuICAgICAgICAgICAgICAgICAgICAvLyBzaW1wbHksIGl0IHdvbid0IHdvcmsgYmVjYXVzZSBpdCBuZWVkcyBhbiBzcmMgdG8gYXR0YWNoXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBsYXJnZSB2aWRlby5cbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgLy8gSW5zdGVhZCwgd2UgdHJpZ2dlciB0aGUgcGlubmVkIGVuZHBvaW50IGNoYW5nZWQgZXZlbnQgdG9cbiAgICAgICAgICAgICAgICAgICAgLy8gbGV0IHRoZSBicmlkZ2UgYWRqdXN0IGl0cyBsYXN0TiBzZXQgZm9yIG15amlkIGFuZCBzdG9yZVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcGlubmVkIHVzZXIgaW4gdGhlIGxhc3ROUGlja3VwSmlkIHZhcmlhYmxlIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHBpY2tlZCB1cCBsYXRlciBieSB0aGUgbGFzdE4gY2hhbmdlZCBldmVudCBoYW5kbGVyLlxuXG4gICAgICAgICAgICAgICAgICAgIGxhc3ROUGlja3VwSmlkID0gamlkO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFwicGlubmVkZW5kcG9pbnRjaGFuZ2VkXCIsIFtqaWRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGppZCA9PSBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSB7XG4gICAgICAgICAgICAgICAgJChcIiNsb2NhbFZpZGVvQ29udGFpbmVyXCIpLmNsaWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE9uIGF1ZGlvIG11dGVkIGV2ZW50LlxuICAgICAqL1xuICAgICQoZG9jdW1lbnQpLmJpbmQoJ2F1ZGlvbXV0ZWQubXVjJywgZnVuY3Rpb24gKGV2ZW50LCBqaWQsIGlzTXV0ZWQpIHtcbiAgICAgICAgLypcbiAgICAgICAgIC8vIEZJWE1FOiBidXQgZm9jdXMgY2FuIG5vdCBtdXRlIGluIHRoaXMgY2FzZSA/IC0gY2hlY2tcbiAgICAgICAgaWYgKGppZCA9PT0gY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkge1xuXG4gICAgICAgICAgICAvLyBUaGUgbG9jYWwgbXV0ZSBpbmRpY2F0b3IgaXMgY29udHJvbGxlZCBsb2NhbGx5XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0qL1xuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSBudWxsO1xuICAgICAgICBpZiAoamlkID09PSBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSB7XG4gICAgICAgICAgICB2aWRlb1NwYW5JZCA9ICdsb2NhbFZpZGVvQ29udGFpbmVyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LmVuc3VyZVBlZXJDb250YWluZXJFeGlzdHMoamlkKTtcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbXV0ZWRBdWRpb3NbamlkXSA9IGlzTXV0ZWQ7XG5cbiAgICAgICAgaWYgKE1vZGVyYXRvci5pc01vZGVyYXRvcigpKSB7XG4gICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVSZW1vdGVWaWRlb01lbnUoamlkLCBpc011dGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2aWRlb1NwYW5JZClcbiAgICAgICAgICAgIFZpZGVvTGF5b3V0LnNob3dBdWRpb0luZGljYXRvcih2aWRlb1NwYW5JZCwgaXNNdXRlZCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBPbiB2aWRlbyBtdXRlZCBldmVudC5cbiAgICAgKi9cbiAgICAkKGRvY3VtZW50KS5iaW5kKCd2aWRlb211dGVkLm11YycsIGZ1bmN0aW9uIChldmVudCwgamlkLCBpc011dGVkKSB7XG4gICAgICAgIGlmKCFSVEMubXV0ZVJlbW90ZVZpZGVvU3RyZWFtKGppZCwgaXNNdXRlZCkpXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgQXZhdGFyLnNob3dVc2VyQXZhdGFyKGppZCwgaXNNdXRlZCk7XG4gICAgICAgIHZhciB2aWRlb1NwYW5JZCA9IG51bGw7XG4gICAgICAgIGlmIChqaWQgPT09IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpIHtcbiAgICAgICAgICAgIHZpZGVvU3BhbklkID0gJ2xvY2FsVmlkZW9Db250YWluZXInO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuZW5zdXJlUGVlckNvbnRhaW5lckV4aXN0cyhqaWQpO1xuICAgICAgICAgICAgdmlkZW9TcGFuSWQgPSAncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmlkZW9TcGFuSWQpXG4gICAgICAgICAgICBWaWRlb0xheW91dC5zaG93VmlkZW9JbmRpY2F0b3IodmlkZW9TcGFuSWQsIGlzTXV0ZWQpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRGlzcGxheSBuYW1lIGNoYW5nZWQuXG4gICAgICovXG4gICAgJChkb2N1bWVudCkuYmluZCgnZGlzcGxheW5hbWVjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGV2ZW50LCBqaWQsIGRpc3BsYXlOYW1lLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBudWxsO1xuICAgICAgICBpZiAoamlkID09PSAnbG9jYWxWaWRlb0NvbnRhaW5lcidcbiAgICAgICAgICAgIHx8IGppZCA9PT0gY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZCkge1xuICAgICAgICAgICAgbmFtZSA9IG5pY2tuYW1lO1xuICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUoJ2xvY2FsVmlkZW9Db250YWluZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuZW5zdXJlUGVlckNvbnRhaW5lckV4aXN0cyhqaWQpO1xuICAgICAgICAgICAgbmFtZSA9ICQoJyNwYXJ0aWNpcGFudF8nICsgU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKSArIFwiX25hbWVcIikudGV4dCgpO1xuICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUoXG4gICAgICAgICAgICAgICAgJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lLFxuICAgICAgICAgICAgICAgIHN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihBUElDb25uZWN0b3IuaXNFbmFibGVkKCkgJiYgQVBJQ29ubmVjdG9yLmlzRXZlbnRFbmFibGVkKFwiZGlzcGxheU5hbWVDaGFuZ2VcIikpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKGppZCA9PT0gJ2xvY2FsVmlkZW9Db250YWluZXInKVxuICAgICAgICAgICAgICAgIGppZCA9IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQ7XG4gICAgICAgICAgICBpZighbmFtZSB8fCBuYW1lICE9IGRpc3BsYXlOYW1lKVxuICAgICAgICAgICAgICAgIEFQSUNvbm5lY3Rvci50cmlnZ2VyRXZlbnQoXCJkaXNwbGF5TmFtZUNoYW5nZVwiLHtqaWQ6IGppZCwgZGlzcGxheW5hbWU6IGRpc3BsYXlOYW1lfSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIE9uIGRvbWluYW50IHNwZWFrZXIgY2hhbmdlZCBldmVudC5cbiAgICAgKi9cbiAgICAkKGRvY3VtZW50KS5iaW5kKCdkb21pbmFudHNwZWFrZXJjaGFuZ2VkJywgZnVuY3Rpb24gKGV2ZW50LCByZXNvdXJjZUppZCkge1xuICAgICAgICAvLyBXZSBpZ25vcmUgbG9jYWwgdXNlciBldmVudHMuXG4gICAgICAgIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgID09PSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGN1cnJlbnQgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgaWYgKHJlc291cmNlSmlkICE9PSBjdXJyZW50RG9taW5hbnRTcGVha2VyKSB7XG4gICAgICAgICAgICB2YXIgb2xkU3BlYWtlclZpZGVvU3BhbklkID0gXCJwYXJ0aWNpcGFudF9cIiArIGN1cnJlbnREb21pbmFudFNwZWFrZXIsXG4gICAgICAgICAgICAgICAgbmV3U3BlYWtlclZpZGVvU3BhbklkID0gXCJwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlSmlkO1xuICAgICAgICAgICAgaWYoJChcIiNcIiArIG9sZFNwZWFrZXJWaWRlb1NwYW5JZCArIFwiPnNwYW4uZGlzcGxheW5hbWVcIikudGV4dCgpID09PVxuICAgICAgICAgICAgICAgIGludGVyZmFjZUNvbmZpZy5ERUZBVUxUX0RPTUlOQU5UX1NQRUFLRVJfRElTUExBWV9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUob2xkU3BlYWtlclZpZGVvU3BhbklkLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKCQoXCIjXCIgKyBuZXdTcGVha2VyVmlkZW9TcGFuSWQgKyBcIj5zcGFuLmRpc3BsYXluYW1lXCIpLnRleHQoKSA9PT1cbiAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9SRU1PVEVfRElTUExBWV9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc2V0RGlzcGxheU5hbWUobmV3U3BlYWtlclZpZGVvU3BhbklkLFxuICAgICAgICAgICAgICAgICAgICBpbnRlcmZhY2VDb25maWcuREVGQVVMVF9ET01JTkFOVF9TUEVBS0VSX0RJU1BMQVlfTkFNRSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyZW50RG9taW5hbnRTcGVha2VyID0gcmVzb3VyY2VKaWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPYnRhaW4gY29udGFpbmVyIGZvciBuZXcgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgdmFyIGNvbnRhaW5lciAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgICAgICAgICAgICAgICAncGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkKTtcblxuICAgICAgICAvLyBMb2NhbCB2aWRlbyB3aWxsIG5vdCBoYXZlIGNvbnRhaW5lciBmb3VuZCwgYnV0IHRoYXQncyBva1xuICAgICAgICAvLyBzaW5jZSB3ZSBkb24ndCB3YW50IHRvIHN3aXRjaCB0byBsb2NhbCB2aWRlby5cbiAgICAgICAgaWYgKGNvbnRhaW5lciAmJiAhZm9jdXNlZFZpZGVvSW5mbylcbiAgICAgICAge1xuICAgICAgICAgICAgdmFyIHZpZGVvID0gY29udGFpbmVyLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidmlkZW9cIik7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGFyZ2UgdmlkZW8gaWYgdGhlIHZpZGVvIHNvdXJjZSBpcyBhbHJlYWR5IGF2YWlsYWJsZSxcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSB3YWl0IGZvciB0aGUgXCJ2aWRlb2FjdGl2ZS5qaW5nbGVcIiBldmVudC5cbiAgICAgICAgICAgIGlmICh2aWRlby5sZW5ndGggJiYgdmlkZW9bMF0uY3VycmVudFRpbWUgPiAwKVxuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oUlRDLmdldFZpZGVvU3JjKHZpZGVvWzBdKSwgcmVzb3VyY2VKaWQpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBPbiBsYXN0IE4gY2hhbmdlIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCB0aGF0IG5vdGlmaWVkIHVzXG4gICAgICogQHBhcmFtIGxhc3RORW5kcG9pbnRzIHRoZSBsaXN0IG9mIGxhc3QgTiBlbmRwb2ludHNcbiAgICAgKiBAcGFyYW0gZW5kcG9pbnRzRW50ZXJpbmdMYXN0TiB0aGUgbGlzdCBjdXJyZW50bHkgZW50ZXJpbmcgbGFzdCBOXG4gICAgICogZW5kcG9pbnRzXG4gICAgICovXG4gICAgJChkb2N1bWVudCkuYmluZCgnbGFzdG5jaGFuZ2VkJywgZnVuY3Rpb24gKCBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RORW5kcG9pbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRzRW50ZXJpbmdMYXN0TixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbSkge1xuICAgICAgICBpZiAobGFzdE5Db3VudCAhPT0gbGFzdE5FbmRwb2ludHMubGVuZ3RoKVxuICAgICAgICAgICAgbGFzdE5Db3VudCA9IGxhc3RORW5kcG9pbnRzLmxlbmd0aDtcblxuICAgICAgICBsYXN0TkVuZHBvaW50c0NhY2hlID0gbGFzdE5FbmRwb2ludHM7XG5cbiAgICAgICAgLy8gU2F5IEEsIEIsIEMsIEQsIEUsIGFuZCBGIGFyZSBpbiBhIGNvbmZlcmVuY2UgYW5kIExhc3ROID0gMy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gSWYgTGFzdE4gZHJvcHMgdG8sIHNheSwgMiwgYmVjYXVzZSBvZiBhZGFwdGl2aXR5LCB0aGVuIEUgc2hvdWxkIHNlZVxuICAgICAgICAvLyB0aHVtYm5haWxzIGZvciBBLCBCIGFuZCBDLiBBIGFuZCBCIGFyZSBpbiBFJ3Mgc2VydmVyIHNpZGUgTGFzdE4gc2V0LFxuICAgICAgICAvLyBzbyBFIHNlZXMgdGhlbS4gQyBpcyBvbmx5IGluIEUncyBsb2NhbCBMYXN0TiBzZXQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIElmIEYgc3RhcnRzIHRhbGtpbmcgYW5kIExhc3ROID0gMywgdGhlbiBFIHNob3VsZCBzZWUgdGh1bWJuYWlscyBmb3JcbiAgICAgICAgLy8gRiwgQSwgQi4gQiBnZXRzIFwiZWplY3RlZFwiIGZyb20gRSdzIHNlcnZlciBzaWRlIExhc3ROIHNldCwgYnV0IGl0XG4gICAgICAgIC8vIGVudGVycyBFJ3MgbG9jYWwgTGFzdE4gZWplY3RpbmcgQy5cblxuICAgICAgICAvLyBJbmNyZWFzZSB0aGUgbG9jYWwgTGFzdE4gc2V0IHNpemUsIGlmIG5lY2Vzc2FyeS5cbiAgICAgICAgaWYgKGxhc3ROQ291bnQgPiBsb2NhbExhc3ROQ291bnQpIHtcbiAgICAgICAgICAgIGxvY2FsTGFzdE5Db3VudCA9IGxhc3ROQ291bnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGxvY2FsIExhc3ROIHNldCBwcmVzZXJ2aW5nIHRoZSBvcmRlciBpbiB3aGljaCB0aGVcbiAgICAgICAgLy8gZW5kcG9pbnRzIGFwcGVhcmVkIGluIHRoZSBMYXN0Ti9sb2NhbCBMYXN0TiBzZXQuXG5cbiAgICAgICAgdmFyIG5leHRMb2NhbExhc3ROU2V0ID0gbGFzdE5FbmRwb2ludHMuc2xpY2UoMCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG9jYWxMYXN0TlNldC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5leHRMb2NhbExhc3ROU2V0Lmxlbmd0aCA+PSBsb2NhbExhc3ROQ291bnQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJlc291cmNlSmlkID0gbG9jYWxMYXN0TlNldFtpXTtcbiAgICAgICAgICAgIGlmIChuZXh0TG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBuZXh0TG9jYWxMYXN0TlNldC5wdXNoKHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxvY2FsTGFzdE5TZXQgPSBuZXh0TG9jYWxMYXN0TlNldDtcblxuICAgICAgICB2YXIgdXBkYXRlTGFyZ2VWaWRlbyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIEhhbmRsZSBMYXN0Ti9sb2NhbCBMYXN0TiBjaGFuZ2VzLlxuICAgICAgICAkKCcjcmVtb3RlVmlkZW9zPnNwYW4nKS5lYWNoKGZ1bmN0aW9uKCBpbmRleCwgZWxlbWVudCApIHtcbiAgICAgICAgICAgIHZhciByZXNvdXJjZUppZCA9IFZpZGVvTGF5b3V0LmdldFBlZXJDb250YWluZXJSZXNvdXJjZUppZChlbGVtZW50KTtcblxuICAgICAgICAgICAgdmFyIGlzUmVjZWl2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHJlc291cmNlSmlkXG4gICAgICAgICAgICAgICAgJiYgbGFzdE5FbmRwb2ludHMuaW5kZXhPZihyZXNvdXJjZUppZCkgPCAwXG4gICAgICAgICAgICAgICAgJiYgbG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA8IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlbW92ZSBmcm9tIGxhc3QgTlwiLCByZXNvdXJjZUppZCk7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdoaWRlJyk7XG4gICAgICAgICAgICAgICAgaXNSZWNlaXZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNvdXJjZUppZFxuICAgICAgICAgICAgICAgICYmICQoJyNwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQpLmlzKCc6dmlzaWJsZScpXG4gICAgICAgICAgICAgICAgJiYgbGFzdE5FbmRwb2ludHMuaW5kZXhPZihyZXNvdXJjZUppZCkgPCAwXG4gICAgICAgICAgICAgICAgJiYgbG9jYWxMYXN0TlNldC5pbmRleE9mKHJlc291cmNlSmlkKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdhdmF0YXInKTtcbiAgICAgICAgICAgICAgICBpc1JlY2VpdmVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNSZWNlaXZlZCkge1xuICAgICAgICAgICAgICAgIC8vIHJlc291cmNlSmlkIGhhcyBkcm9wcGVkIG91dCBvZiB0aGUgc2VydmVyIHNpZGUgbGFzdE4gc2V0LCBzb1xuICAgICAgICAgICAgICAgIC8vIGl0IGlzIG5vIGxvbmdlciBiZWluZyByZWNlaXZlZC4gSWYgcmVzb3VyY2VKaWQgd2FzIGJlaW5nXG4gICAgICAgICAgICAgICAgLy8gZGlzcGxheWVkIGluIHRoZSBsYXJnZSB2aWRlbyB3ZSBoYXZlIHRvIHN3aXRjaCB0byBhbm90aGVyXG4gICAgICAgICAgICAgICAgLy8gdXNlci5cbiAgICAgICAgICAgICAgICB2YXIgbGFyZ2VWaWRlb1Jlc291cmNlID0gbGFyZ2VWaWRlb1N0YXRlLnVzZXJSZXNvdXJjZUppZDtcbiAgICAgICAgICAgICAgICBpZiAoIXVwZGF0ZUxhcmdlVmlkZW8gJiYgcmVzb3VyY2VKaWQgPT09IGxhcmdlVmlkZW9SZXNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXJnZVZpZGVvID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghZW5kcG9pbnRzRW50ZXJpbmdMYXN0TiB8fCBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLmxlbmd0aCA8IDApXG4gICAgICAgICAgICBlbmRwb2ludHNFbnRlcmluZ0xhc3ROID0gbGFzdE5FbmRwb2ludHM7XG5cbiAgICAgICAgaWYgKGVuZHBvaW50c0VudGVyaW5nTGFzdE4gJiYgZW5kcG9pbnRzRW50ZXJpbmdMYXN0Ti5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLmZvckVhY2goZnVuY3Rpb24gKHJlc291cmNlSmlkKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgaXNWaXNpYmxlID0gJCgnI3BhcnRpY2lwYW50XycgKyByZXNvdXJjZUppZCkuaXMoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgICAgICAgc2hvd1BlZXJDb250YWluZXIocmVzb3VyY2VKaWQsICdzaG93Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBZGQgdG8gbGFzdCBOXCIsIHJlc291cmNlSmlkKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgamlkID0gY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWVkaWFTdHJlYW0gPSBSVEMucmVtb3RlU3RyZWFtc1tqaWRdW01lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbCA9ICQoJyNwYXJ0aWNpcGFudF8nICsgcmVzb3VyY2VKaWQgKyAnPnZpZGVvJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpZGVvU3RyZWFtID0gc2ltdWxjYXN0LmdldFJlY2VpdmluZ1ZpZGVvU3RyZWFtKFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVkaWFTdHJlYW0uc3RyZWFtKTtcbiAgICAgICAgICAgICAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKHNlbCwgdmlkZW9TdHJlYW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdE5QaWNrdXBKaWQgPT0gbWVkaWFTdHJlYW0ucGVlcmppZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXAgdGhlIGxhc3ROIHBpY2t1cCBqaWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0TlBpY2t1cEppZCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGZpcmUgdGhlIGV2ZW50cyBhZ2FpbiwgdGhleSd2ZSBhbHJlYWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZWVuIGZpcmVkIGluIHRoZSBjb250YWN0IGxpc3QgY2xpY2sgaGFuZGxlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmhhbmRsZVZpZGVvVGh1bWJDbGlja2VkKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoc2VsKS5hdHRyKCdzcmMnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChtZWRpYVN0cmVhbS5wZWVyamlkKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUxhcmdlVmlkZW8gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVtb3RlVmlkZW8oc2VsLCBtZWRpYVN0cmVhbS5zc3JjLCBtZWRpYVN0cmVhbS5zdHJlYW0sIHJlc291cmNlSmlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGVuZHBvaW50IHRoYXQgd2FzIGJlaW5nIHNob3duIGluIHRoZSBsYXJnZSB2aWRlbyBoYXMgZHJvcHBlZCBvdXRcbiAgICAgICAgLy8gb2YgdGhlIGxhc3ROIHNldCBhbmQgdGhlcmUgd2FzIG5vIGxhc3ROIHBpY2t1cCBqaWQuIFdlIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgIC8vIHRoZSBsYXJnZSB2aWRlbyBub3cuXG5cbiAgICAgICAgaWYgKHVwZGF0ZUxhcmdlVmlkZW8pIHtcblxuICAgICAgICAgICAgdmFyIHJlc291cmNlLCBjb250YWluZXIsIHNyYztcbiAgICAgICAgICAgIHZhciBteVJlc291cmNlXG4gICAgICAgICAgICAgICAgPSBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChjb25uZWN0aW9uLmVtdWMubXlyb29tamlkKTtcblxuICAgICAgICAgICAgLy8gRmluZCBvdXQgd2hpY2ggZW5kcG9pbnQgdG8gc2hvdyBpbiB0aGUgbGFyZ2UgdmlkZW8uXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RORW5kcG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2UgPSBsYXN0TkVuZHBvaW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc291cmNlIHx8IHJlc291cmNlID09PSBteVJlc291cmNlKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9ICQoXCIjcGFydGljaXBhbnRfXCIgKyByZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lci5sZW5ndGggPT0gMClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICBzcmMgPSAkKCd2aWRlbycsIGNvbnRhaW5lcikuYXR0cignc3JjJyk7XG4gICAgICAgICAgICAgICAgaWYgKCFzcmMpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgLy8gdmlkZW9TcmNUb1NzcmMgbmVlZHMgdG8gYmUgdXBkYXRlIGZvciB0aGlzIGNhbGwgdG8gc3VjY2VlZC5cbiAgICAgICAgICAgICAgICBWaWRlb0xheW91dC51cGRhdGVMYXJnZVZpZGVvKHNyYyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJChkb2N1bWVudCkuYmluZCgndmlkZW9hY3RpdmUuamluZ2xlJywgZnVuY3Rpb24gKGV2ZW50LCB2aWRlb2VsZW0pIHtcbiAgICAgICAgaWYgKHZpZGVvZWxlbS5hdHRyKCdpZCcpLmluZGV4T2YoJ21peGVkbXNsYWJlbCcpID09PSAtMSkge1xuICAgICAgICAgICAgLy8gaWdub3JlIG1peGVkbXNsYWJlbGEwIGFuZCB2MFxuXG4gICAgICAgICAgICB2aWRlb2VsZW0uc2hvdygpO1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQucmVzaXplVGh1bWJuYWlscygpO1xuXG4gICAgICAgICAgICB2YXIgdmlkZW9QYXJlbnQgPSB2aWRlb2VsZW0ucGFyZW50KCk7XG4gICAgICAgICAgICB2YXIgcGFyZW50UmVzb3VyY2VKaWQgPSBudWxsO1xuICAgICAgICAgICAgaWYgKHZpZGVvUGFyZW50KVxuICAgICAgICAgICAgICAgIHBhcmVudFJlc291cmNlSmlkXG4gICAgICAgICAgICAgICAgICAgID0gVmlkZW9MYXlvdXQuZ2V0UGVlckNvbnRhaW5lclJlc291cmNlSmlkKHZpZGVvUGFyZW50WzBdKTtcblxuICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsYXJnZSB2aWRlbyB0byB0aGUgbGFzdCBhZGRlZCB2aWRlbyBvbmx5IGlmIHRoZXJlJ3Mgbm9cbiAgICAgICAgICAgIC8vIGN1cnJlbnQgZG9taW5hbnQsIGZvY3VzZWQgc3BlYWtlciBvciBwcmV6aSBwbGF5aW5nIG9yIHVwZGF0ZSBpdCB0b1xuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgZG9taW5hbnQgc3BlYWtlci5cbiAgICAgICAgICAgIGlmICgoIWZvY3VzZWRWaWRlb0luZm8gJiZcbiAgICAgICAgICAgICAgICAhVmlkZW9MYXlvdXQuZ2V0RG9taW5hbnRTcGVha2VyUmVzb3VyY2VKaWQoKSAmJlxuICAgICAgICAgICAgICAgICFyZXF1aXJlKFwiLi4vcHJlemkvUHJlemlcIikuaXNQcmVzZW50YXRpb25WaXNpYmxlKCkpIHx8XG4gICAgICAgICAgICAgICAgKHBhcmVudFJlc291cmNlSmlkICYmXG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQuZ2V0RG9taW5hbnRTcGVha2VyUmVzb3VyY2VKaWQoKSA9PT0gcGFyZW50UmVzb3VyY2VKaWQpKSB7XG4gICAgICAgICAgICAgICAgVmlkZW9MYXlvdXQudXBkYXRlTGFyZ2VWaWRlbyhcbiAgICAgICAgICAgICAgICAgICAgUlRDLmdldFZpZGVvU3JjKHZpZGVvZWxlbVswXSksXG4gICAgICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudFJlc291cmNlSmlkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuc2hvd01vZGVyYXRvckluZGljYXRvcigpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkKGRvY3VtZW50KS5iaW5kKCdzaW11bGNhc3RsYXllcnNjaGFuZ2luZycsIGZ1bmN0aW9uIChldmVudCwgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMpIHtcbiAgICAgICAgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMuZm9yRWFjaChmdW5jdGlvbiAoZXNsKSB7XG5cbiAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGVzbC5lbmRwb2ludDtcblxuICAgICAgICAgICAgLy8gaWYgbGFzdE4gaXMgZW5hYmxlZCAqYW5kKiB0aGUgZW5kcG9pbnQgaXMgKm5vdCogaW4gdGhlIGxhc3ROIHNldCxcbiAgICAgICAgICAgIC8vIHRoZW4gaWdub3JlIHRoZSBldmVudCAoPSBkbyBub3QgcHJlbG9hZCBhbnl0aGluZykuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVGhlIGJyaWRnZSBjb3VsZCBwcm9iYWJseSBzdG9wIHNlbmRpbmcgdGhpcyBtZXNzYWdlIGlmIGl0J3MgZm9yXG4gICAgICAgICAgICAvLyBhbiBlbmRwb2ludCB0aGF0J3Mgbm90IGluIGxhc3ROLlxuXG4gICAgICAgICAgICBpZiAobGFzdE5Db3VudCAhPSAtMVxuICAgICAgICAgICAgICAgICYmIChsYXN0TkNvdW50IDwgMSB8fCBsYXN0TkVuZHBvaW50c0NhY2hlLmluZGV4T2YocmVzb3VyY2UpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcmltYXJ5U1NSQyA9IGVzbC5zaW11bGNhc3RMYXllci5wcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgLy8gR2V0IHNlc3Npb24gYW5kIHN0cmVhbSBmcm9tIHByaW1hcnkgc3NyYy5cbiAgICAgICAgICAgIHZhciByZXMgPSBzaW11bGNhc3QuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW1CeVNTUkMocHJpbWFyeVNTUkMpO1xuICAgICAgICAgICAgdmFyIHNlc3Npb24gPSByZXMuc2Vzc2lvbjtcbiAgICAgICAgICAgIHZhciBlbGVjdGVkU3RyZWFtID0gcmVzLnN0cmVhbTtcblxuICAgICAgICAgICAgaWYgKHNlc3Npb24gJiYgZWxlY3RlZFN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciBtc2lkID0gc2ltdWxjYXN0LmdldFJlbW90ZVZpZGVvU3RyZWFtSWRCeVNTUkMocHJpbWFyeVNTUkMpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFtlc2wsIHByaW1hcnlTU1JDLCBtc2lkLCBzZXNzaW9uLCBlbGVjdGVkU3RyZWFtXSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbXNpZFBhcnRzID0gbXNpZC5zcGxpdCgnICcpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHByZWxvYWQgPSAoU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoc3NyYzJqaWRbcHJpbWFyeVNTUkNdKSA9PSBsYXJnZVZpZGVvU3RhdGUudXNlclJlc291cmNlSmlkKTtcblxuICAgICAgICAgICAgICAgIGlmIChwcmVsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXJnZVZpZGVvU3RhdGUucHJlbG9hZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChsYXJnZVZpZGVvU3RhdGUucHJlbG9hZCkucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdQcmVsb2FkaW5nIHJlbW90ZSB2aWRlbycpO1xuICAgICAgICAgICAgICAgICAgICBsYXJnZVZpZGVvU3RhdGUucHJlbG9hZCA9ICQoJzx2aWRlbyBhdXRvcGxheT48L3ZpZGVvPicpO1xuICAgICAgICAgICAgICAgICAgICAvLyBzc3JjcyBhcmUgdW5pcXVlIGluIGFuIHJ0cCBzZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkX3NzcmMgPSBwcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgICAgICAgICBSVEMuYXR0YWNoTWVkaWFTdHJlYW0obGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQsIGVsZWN0ZWRTdHJlYW0pXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGEgc3RyZWFtIG9yIGEgc2Vzc2lvbi4nLCBzZXNzaW9uLCBlbGVjdGVkU3RyZWFtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBPbiBzaW11bGNhc3QgbGF5ZXJzIGNoYW5nZWQgZXZlbnQuXG4gICAgICovXG4gICAgJChkb2N1bWVudCkuYmluZCgnc2ltdWxjYXN0bGF5ZXJzY2hhbmdlZCcsIGZ1bmN0aW9uIChldmVudCwgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMpIHtcbiAgICAgICAgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMuZm9yRWFjaChmdW5jdGlvbiAoZXNsKSB7XG5cbiAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGVzbC5lbmRwb2ludDtcblxuICAgICAgICAgICAgLy8gaWYgbGFzdE4gaXMgZW5hYmxlZCAqYW5kKiB0aGUgZW5kcG9pbnQgaXMgKm5vdCogaW4gdGhlIGxhc3ROIHNldCxcbiAgICAgICAgICAgIC8vIHRoZW4gaWdub3JlIHRoZSBldmVudCAoPSBkbyBub3QgY2hhbmdlIGxhcmdlIHZpZGVvL3RodW1ibmFpbFxuICAgICAgICAgICAgLy8gU1JDcykuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gTm90ZSB0aGF0IGV2ZW4gaWYgd2UgaWdub3JlIHRoZSBcImNoYW5nZWRcIiBldmVudCBpbiB0aGlzIGV2ZW50XG4gICAgICAgICAgICAvLyBoYW5kbGVyLCB0aGUgYnJpZGdlIG11c3QgY29udGludWUgc2VuZGluZyB0aGVzZSBldmVudHMgYmVjYXVzZVxuICAgICAgICAgICAgLy8gdGhlIHNpbXVsY2FzdCBjb2RlIGluIHNpbXVsY2FzdC5qcyB1c2VzIGl0IHRvIGtub3cgd2hhdCdzIGdvaW5nXG4gICAgICAgICAgICAvLyB0byBiZSBzdHJlYW1lZCBieSB0aGUgYnJpZGdlIHdoZW4vaWYgdGhlIGVuZHBvaW50IGdldHMgYmFjayBpbnRvXG4gICAgICAgICAgICAvLyB0aGUgbGFzdE4gc2V0LlxuXG4gICAgICAgICAgICBpZiAobGFzdE5Db3VudCAhPSAtMVxuICAgICAgICAgICAgICAgICYmIChsYXN0TkNvdW50IDwgMSB8fCBsYXN0TkVuZHBvaW50c0NhY2hlLmluZGV4T2YocmVzb3VyY2UpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcmltYXJ5U1NSQyA9IGVzbC5zaW11bGNhc3RMYXllci5wcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgLy8gR2V0IHNlc3Npb24gYW5kIHN0cmVhbSBmcm9tIHByaW1hcnkgc3NyYy5cbiAgICAgICAgICAgIHZhciByZXMgPSBzaW11bGNhc3QuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW1CeVNTUkMocHJpbWFyeVNTUkMpO1xuICAgICAgICAgICAgdmFyIHNlc3Npb24gPSByZXMuc2Vzc2lvbjtcbiAgICAgICAgICAgIHZhciBlbGVjdGVkU3RyZWFtID0gcmVzLnN0cmVhbTtcblxuICAgICAgICAgICAgaWYgKHNlc3Npb24gJiYgZWxlY3RlZFN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciBtc2lkID0gc2ltdWxjYXN0LmdldFJlbW90ZVZpZGVvU3RyZWFtSWRCeVNTUkMocHJpbWFyeVNTUkMpO1xuXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdTd2l0Y2hpbmcgc2ltdWxjYXN0IHN1YnN0cmVhbS4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oW2VzbCwgcHJpbWFyeVNTUkMsIG1zaWQsIHNlc3Npb24sIGVsZWN0ZWRTdHJlYW1dKTtcblxuICAgICAgICAgICAgICAgIHZhciBtc2lkUGFydHMgPSBtc2lkLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgdmFyIHNlbFJlbW90ZVZpZGVvID0gJChbJyMnLCAncmVtb3RlVmlkZW9fJywgc2Vzc2lvbi5zaWQsICdfJywgbXNpZFBhcnRzWzBdXS5qb2luKCcnKSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgdXBkYXRlTGFyZ2VWaWRlbyA9IChTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChzc3JjMmppZFtwcmltYXJ5U1NSQ10pXG4gICAgICAgICAgICAgICAgICAgID09IGxhcmdlVmlkZW9TdGF0ZS51c2VyUmVzb3VyY2VKaWQpO1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVGb2N1c2VkVmlkZW9TcmMgPSAoZm9jdXNlZFZpZGVvSW5mbyAmJiBmb2N1c2VkVmlkZW9JbmZvLnNyYyAmJiBmb2N1c2VkVmlkZW9JbmZvLnNyYyAhPSAnJyAmJlxuICAgICAgICAgICAgICAgICAgICAoUlRDLmdldFZpZGVvU3JjKHNlbFJlbW90ZVZpZGVvWzBdKSA9PSBmb2N1c2VkVmlkZW9JbmZvLnNyYykpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVsZWN0ZWRTdHJlYW1Vcmw7XG4gICAgICAgICAgICAgICAgaWYgKGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkX3NzcmMgPT0gcHJpbWFyeVNTUkMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBSVEMuc2V0VmlkZW9TcmMoc2VsUmVtb3RlVmlkZW9bMF0sIFJUQy5nZXRWaWRlb1NyYyhsYXJnZVZpZGVvU3RhdGUucHJlbG9hZFswXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxhcmdlVmlkZW9TdGF0ZS5wcmVsb2FkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQobGFyZ2VWaWRlb1N0YXRlLnByZWxvYWQpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbGFyZ2VWaWRlb1N0YXRlLnByZWxvYWRfc3NyYyA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgUlRDLmF0dGFjaE1lZGlhU3RyZWFtKHNlbFJlbW90ZVZpZGVvLCBlbGVjdGVkU3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgamlkID0gc3NyYzJqaWRbcHJpbWFyeVNTUkNdO1xuICAgICAgICAgICAgICAgIGppZDJTc3JjW2ppZF0gPSBwcmltYXJ5U1NSQztcblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVMYXJnZVZpZGVvKSB7XG4gICAgICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LnVwZGF0ZUxhcmdlVmlkZW8oUlRDLmdldFZpZGVvU3JjKHNlbFJlbW90ZVZpZGVvWzBdKSwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVGb2N1c2VkVmlkZW9TcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9jdXNlZFZpZGVvSW5mby5zcmMgPSBSVEMuZ2V0VmlkZW9TcmMoc2VsUmVtb3RlVmlkZW9bMF0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciB2aWRlb0lkO1xuICAgICAgICAgICAgICAgIGlmKHJlc291cmNlID09IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmlkZW9JZCA9IFwibG9jYWxWaWRlb0NvbnRhaW5lclwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2aWRlb0lkID0gXCJwYXJ0aWNpcGFudF9cIiArIHJlc291cmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY29ubmVjdGlvbkluZGljYXRvciA9IFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW3ZpZGVvSWRdO1xuICAgICAgICAgICAgICAgIGlmKGNvbm5lY3Rpb25JbmRpY2F0b3IpXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rpb25JbmRpY2F0b3IudXBkYXRlUG9wb3ZlckRhdGEoKTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmluZCBhIHN0cmVhbSBvciBhIHNlc3Npb24uJywgc2Vzc2lvbiwgZWxlY3RlZFN0cmVhbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyBsb2NhbCBzdGF0c1xuICAgICAqIEBwYXJhbSBwZXJjZW50XG4gICAgICogQHBhcmFtIG9iamVjdFxuICAgICAqL1xuICAgIG15LnVwZGF0ZUxvY2FsQ29ubmVjdGlvblN0YXRzID0gZnVuY3Rpb24gKHBlcmNlbnQsIG9iamVjdCkge1xuICAgICAgICB2YXIgcmVzb2x1dGlvbiA9IG51bGw7XG4gICAgICAgIGlmKG9iamVjdC5yZXNvbHV0aW9uICE9PSBudWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICByZXNvbHV0aW9uID0gb2JqZWN0LnJlc29sdXRpb247XG4gICAgICAgICAgICBvYmplY3QucmVzb2x1dGlvbiA9IHJlc29sdXRpb25bY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZF07XG4gICAgICAgICAgICBkZWxldGUgcmVzb2x1dGlvbltjb25uZWN0aW9uLmVtdWMubXlyb29tamlkXTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVTdGF0c0luZGljYXRvcihcImxvY2FsVmlkZW9Db250YWluZXJcIiwgcGVyY2VudCwgb2JqZWN0KTtcbiAgICAgICAgZm9yKHZhciBqaWQgaW4gcmVzb2x1dGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgaWYocmVzb2x1dGlvbltqaWRdID09PSBudWxsKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIGlkID0gJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpO1xuICAgICAgICAgICAgaWYoVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbaWRdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFZpZGVvTGF5b3V0LmNvbm5lY3Rpb25JbmRpY2F0b3JzW2lkXS51cGRhdGVSZXNvbHV0aW9uKHJlc29sdXRpb25bamlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGVzIHJlbW90ZSBzdGF0cy5cbiAgICAgKiBAcGFyYW0gamlkIHRoZSBqaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzdGF0c1xuICAgICAqIEBwYXJhbSBwZXJjZW50IHRoZSBjb25uZWN0aW9uIHF1YWxpdHkgcGVyY2VudFxuICAgICAqIEBwYXJhbSBvYmplY3QgdGhlIHN0YXRzIGRhdGFcbiAgICAgKi9cbiAgICBteS51cGRhdGVDb25uZWN0aW9uU3RhdHMgPSBmdW5jdGlvbiAoamlkLCBwZXJjZW50LCBvYmplY3QpIHtcbiAgICAgICAgdmFyIHJlc291cmNlSmlkID0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQoamlkKTtcblxuICAgICAgICB2YXIgdmlkZW9TcGFuSWQgPSAncGFydGljaXBhbnRfJyArIHJlc291cmNlSmlkO1xuICAgICAgICB1cGRhdGVTdGF0c0luZGljYXRvcih2aWRlb1NwYW5JZCwgcGVyY2VudCwgb2JqZWN0KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgY29ubmVjdGlvblxuICAgICAqIEBwYXJhbSBqaWRcbiAgICAgKi9cbiAgICBteS5yZW1vdmVDb25uZWN0aW9uSW5kaWNhdG9yID0gZnVuY3Rpb24gKGppZCkge1xuICAgICAgICBpZihWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1sncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCldKVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpXS5yZW1vdmUoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSGlkZXMgdGhlIGNvbm5lY3Rpb24gaW5kaWNhdG9yXG4gICAgICogQHBhcmFtIGppZFxuICAgICAqL1xuICAgIG15LmhpZGVDb25uZWN0aW9uSW5kaWNhdG9yID0gZnVuY3Rpb24gKGppZCkge1xuICAgICAgICBpZihWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9yc1sncGFydGljaXBhbnRfJyArIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCldKVxuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbJ3BhcnRpY2lwYW50XycgKyBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpXS5oaWRlKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEhpZGVzIGFsbCB0aGUgaW5kaWNhdG9yc1xuICAgICAqL1xuICAgIG15Lm9uU3RhdHNTdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IodmFyIGluZGljYXRvciBpbiBWaWRlb0xheW91dC5jb25uZWN0aW9uSW5kaWNhdG9ycylcbiAgICAgICAge1xuICAgICAgICAgICAgVmlkZW9MYXlvdXQuY29ubmVjdGlvbkluZGljYXRvcnNbaW5kaWNhdG9yXS5oaWRlSW5kaWNhdG9yKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIG15O1xufShWaWRlb0xheW91dCB8fCB7fSkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZGVvTGF5b3V0OyIsIi8vdmFyIG5vdW5zID0gW1xuLy9dO1xudmFyIHBsdXJhbE5vdW5zID0gW1xuICAgIFwiQWxpZW5zXCIsIFwiQW5pbWFsc1wiLCBcIkFudGVsb3Blc1wiLCBcIkFudHNcIiwgXCJBcGVzXCIsIFwiQXBwbGVzXCIsIFwiQmFib29uc1wiLCBcIkJhY3RlcmlhXCIsIFwiQmFkZ2Vyc1wiLCBcIkJhbmFuYXNcIiwgXCJCYXRzXCIsXG4gICAgXCJCZWFyc1wiLCBcIkJpcmRzXCIsIFwiQm9ub2Jvc1wiLCBcIkJyaWRlc1wiLCBcIkJ1Z3NcIiwgXCJCdWxsc1wiLCBcIkJ1dHRlcmZsaWVzXCIsIFwiQ2hlZXRhaHNcIixcbiAgICBcIkNoZXJyaWVzXCIsIFwiQ2hpY2tlblwiLCBcIkNoaWxkcmVuXCIsIFwiQ2hpbXBzXCIsIFwiQ2xvd25zXCIsIFwiQ293c1wiLCBcIkNyZWF0dXJlc1wiLCBcIkRpbm9zYXVyc1wiLCBcIkRvZ3NcIiwgXCJEb2xwaGluc1wiLFxuICAgIFwiRG9ua2V5c1wiLCBcIkRyYWdvbnNcIiwgXCJEdWNrc1wiLCBcIkR3YXJmc1wiLCBcIkVhZ2xlc1wiLCBcIkVsZXBoYW50c1wiLCBcIkVsdmVzXCIsIFwiRkFJTFwiLCBcIkZhdGhlcnNcIixcbiAgICBcIkZpc2hcIiwgXCJGbG93ZXJzXCIsIFwiRnJvZ3NcIiwgXCJGcnVpdFwiLCBcIkZ1bmdpXCIsIFwiR2FsYXhpZXNcIiwgXCJHZWVzZVwiLCBcIkdvYXRzXCIsXG4gICAgXCJHb3JpbGxhc1wiLCBcIkhlZGdlaG9nc1wiLCBcIkhpcHBvc1wiLCBcIkhvcnNlc1wiLCBcIkh1bnRlcnNcIiwgXCJJbnNlY3RzXCIsIFwiS2lkc1wiLCBcIktuaWdodHNcIixcbiAgICBcIkxlbW9uc1wiLCBcIkxlbXVyc1wiLCBcIkxlb3BhcmRzXCIsIFwiTGlmZUZvcm1zXCIsIFwiTGlvbnNcIiwgXCJMaXphcmRzXCIsIFwiTWljZVwiLCBcIk1vbmtleXNcIiwgXCJNb25zdGVyc1wiLFxuICAgIFwiTXVzaHJvb21zXCIsIFwiT2N0b3BvZGVzXCIsIFwiT3Jhbmdlc1wiLCBcIk9yYW5ndXRhbnNcIiwgXCJPcmdhbmlzbXNcIiwgXCJQYW50c1wiLCBcIlBhcnJvdHNcIiwgXCJQZW5ndWluc1wiLFxuICAgIFwiUGVvcGxlXCIsIFwiUGlnZW9uc1wiLCBcIlBpZ3NcIiwgXCJQaW5lYXBwbGVzXCIsIFwiUGxhbnRzXCIsIFwiUG90YXRvZXNcIiwgXCJQcmllc3RzXCIsIFwiUmF0c1wiLCBcIlJlcHRpbGVzXCIsIFwiUmVwdGlsaWFuc1wiLFxuICAgIFwiUmhpbm9zXCIsIFwiU2VhZ3VsbHNcIiwgXCJTaGVlcFwiLCBcIlNpYmxpbmdzXCIsIFwiU25ha2VzXCIsIFwiU3BhZ2hldHRpXCIsIFwiU3BpZGVyc1wiLCBcIlNxdWlkXCIsIFwiU3F1aXJyZWxzXCIsXG4gICAgXCJTdGFyc1wiLCBcIlN0dWRlbnRzXCIsIFwiVGVhY2hlcnNcIiwgXCJUaWdlcnNcIiwgXCJUb21hdG9lc1wiLCBcIlRyZWVzXCIsIFwiVmFtcGlyZXNcIiwgXCJWZWdldGFibGVzXCIsIFwiVmlydXNlc1wiLCBcIlZ1bGNhbnNcIixcbiAgICBcIldhcmV3b2x2ZXNcIiwgXCJXZWFzZWxzXCIsIFwiV2hhbGVzXCIsIFwiV2l0Y2hlc1wiLCBcIldpemFyZHNcIiwgXCJXb2x2ZXNcIiwgXCJXb3JrZXJzXCIsIFwiV29ybXNcIiwgXCJaZWJyYXNcIlxuXTtcbi8vdmFyIHBsYWNlcyA9IFtcbi8vXCJQdWJcIiwgXCJVbml2ZXJzaXR5XCIsIFwiQWlycG9ydFwiLCBcIkxpYnJhcnlcIiwgXCJNYWxsXCIsIFwiVGhlYXRlclwiLCBcIlN0YWRpdW1cIiwgXCJPZmZpY2VcIiwgXCJTaG93XCIsIFwiR2FsbG93c1wiLCBcIkJlYWNoXCIsXG4vLyBcIkNlbWV0ZXJ5XCIsIFwiSG9zcGl0YWxcIiwgXCJSZWNlcHRpb25cIiwgXCJSZXN0YXVyYW50XCIsIFwiQmFyXCIsIFwiQ2h1cmNoXCIsIFwiSG91c2VcIiwgXCJTY2hvb2xcIiwgXCJTcXVhcmVcIiwgXCJWaWxsYWdlXCIsXG4vLyBcIkNpbmVtYVwiLCBcIk1vdmllc1wiLCBcIlBhcnR5XCIsIFwiUmVzdHJvb21cIiwgXCJFbmRcIiwgXCJKYWlsXCIsIFwiUG9zdE9mZmljZVwiLCBcIlN0YXRpb25cIiwgXCJDaXJjdXNcIiwgXCJHYXRlc1wiLCBcIkVudHJhbmNlXCIsXG4vLyBcIkJyaWRnZVwiXG4vL107XG52YXIgdmVyYnMgPSBbXG4gICAgXCJBYmFuZG9uXCIsIFwiQWRhcHRcIiwgXCJBZHZlcnRpc2VcIiwgXCJBbnN3ZXJcIiwgXCJBbnRpY2lwYXRlXCIsIFwiQXBwcmVjaWF0ZVwiLFxuICAgIFwiQXBwcm9hY2hcIiwgXCJBcmd1ZVwiLCBcIkFza1wiLCBcIkJpdGVcIiwgXCJCbG9zc29tXCIsIFwiQmx1c2hcIiwgXCJCcmVhdGhlXCIsIFwiQnJlZWRcIiwgXCJCcmliZVwiLCBcIkJ1cm5cIiwgXCJDYWxjdWxhdGVcIixcbiAgICBcIkNsZWFuXCIsIFwiQ29kZVwiLCBcIkNvbW11bmljYXRlXCIsIFwiQ29tcHV0ZVwiLCBcIkNvbmZlc3NcIiwgXCJDb25maXNjYXRlXCIsIFwiQ29uanVnYXRlXCIsIFwiQ29uanVyZVwiLCBcIkNvbnN1bWVcIixcbiAgICBcIkNvbnRlbXBsYXRlXCIsIFwiQ3Jhd2xcIiwgXCJEYW5jZVwiLCBcIkRlbGVnYXRlXCIsIFwiRGV2b3VyXCIsIFwiRGV2ZWxvcFwiLCBcIkRpZmZlclwiLCBcIkRpc2N1c3NcIixcbiAgICBcIkRpc3NvbHZlXCIsIFwiRHJpbmtcIiwgXCJFYXRcIiwgXCJFbGFib3JhdGVcIiwgXCJFbWFuY2lwYXRlXCIsIFwiRXN0aW1hdGVcIiwgXCJFeHBpcmVcIiwgXCJFeHRpbmd1aXNoXCIsXG4gICAgXCJFeHRyYWN0XCIsIFwiRkFJTFwiLCBcIkZhY2lsaXRhdGVcIiwgXCJGYWxsXCIsIFwiRmVlZFwiLCBcIkZpbmlzaFwiLCBcIkZsb3NzXCIsIFwiRmx5XCIsIFwiRm9sbG93XCIsIFwiRnJhZ21lbnRcIiwgXCJGcmVlemVcIixcbiAgICBcIkdhdGhlclwiLCBcIkdsb3dcIiwgXCJHcm93XCIsIFwiSGV4XCIsIFwiSGlkZVwiLCBcIkh1Z1wiLCBcIkh1cnJ5XCIsIFwiSW1wcm92ZVwiLCBcIkludGVyc2VjdFwiLCBcIkludmVzdGlnYXRlXCIsIFwiSmlueFwiLFxuICAgIFwiSm9rZVwiLCBcIkp1YmlsYXRlXCIsIFwiS2lzc1wiLCBcIkxhdWdoXCIsIFwiTWFuYWdlXCIsIFwiTWVldFwiLCBcIk1lcmdlXCIsIFwiTW92ZVwiLCBcIk9iamVjdFwiLCBcIk9ic2VydmVcIiwgXCJPZmZlclwiLFxuICAgIFwiUGFpbnRcIiwgXCJQYXJ0aWNpcGF0ZVwiLCBcIlBhcnR5XCIsIFwiUGVyZm9ybVwiLCBcIlBsYW5cIiwgXCJQdXJzdWVcIiwgXCJQaWVyY2VcIiwgXCJQbGF5XCIsIFwiUG9zdHBvbmVcIiwgXCJQcmF5XCIsIFwiUHJvY2xhaW1cIixcbiAgICBcIlF1ZXN0aW9uXCIsIFwiUmVhZFwiLCBcIlJlY2tvblwiLCBcIlJlam9pY2VcIiwgXCJSZXByZXNlbnRcIiwgXCJSZXNpemVcIiwgXCJSaHltZVwiLCBcIlNjcmVhbVwiLCBcIlNlYXJjaFwiLCBcIlNlbGVjdFwiLCBcIlNoYXJlXCIsIFwiU2hvb3RcIixcbiAgICBcIlNob3V0XCIsIFwiU2lnbmFsXCIsIFwiU2luZ1wiLCBcIlNrYXRlXCIsIFwiU2xlZXBcIiwgXCJTbWlsZVwiLCBcIlNtb2tlXCIsIFwiU29sdmVcIiwgXCJTcGVsbFwiLCBcIlN0ZWVyXCIsIFwiU3RpbmtcIixcbiAgICBcIlN1YnN0aXR1dGVcIiwgXCJTd2ltXCIsIFwiVGFzdGVcIiwgXCJUZWFjaFwiLCBcIlRlcm1pbmF0ZVwiLCBcIlRoaW5rXCIsIFwiVHlwZVwiLCBcIlVuaXRlXCIsIFwiVmFuaXNoXCIsIFwiV29yc2hpcFwiXG5dO1xudmFyIGFkdmVyYnMgPSBbXG4gICAgXCJBYnNlbnRseVwiLCBcIkFjY3VyYXRlbHlcIiwgXCJBY2N1c2luZ2x5XCIsIFwiQWRvcmFibHlcIiwgXCJBbGxUaGVUaW1lXCIsIFwiQWxvbmVcIiwgXCJBbHdheXNcIiwgXCJBbWF6aW5nbHlcIiwgXCJBbmdyaWx5XCIsXG4gICAgXCJBbnhpb3VzbHlcIiwgXCJBbnl3aGVyZVwiLCBcIkFwcGFsbGluZ2x5XCIsIFwiQXBwYXJlbnRseVwiLCBcIkFydGljdWxhdGVseVwiLCBcIkFzdG9uaXNoaW5nbHlcIiwgXCJCYWRseVwiLCBcIkJhcmVseVwiLFxuICAgIFwiQmVhdXRpZnVsbHlcIiwgXCJCbGluZGx5XCIsIFwiQnJhdmVseVwiLCBcIkJyaWdodGx5XCIsIFwiQnJpc2tseVwiLCBcIkJydXRhbGx5XCIsIFwiQ2FsbWx5XCIsIFwiQ2FyZWZ1bGx5XCIsIFwiQ2FzdWFsbHlcIixcbiAgICBcIkNhdXRpb3VzbHlcIiwgXCJDbGV2ZXJseVwiLCBcIkNvbnN0YW50bHlcIiwgXCJDb3JyZWN0bHlcIiwgXCJDcmF6aWx5XCIsIFwiQ3VyaW91c2x5XCIsIFwiQ3luaWNhbGx5XCIsIFwiRGFpbHlcIixcbiAgICBcIkRhbmdlcm91c2x5XCIsIFwiRGVsaWJlcmF0ZWx5XCIsIFwiRGVsaWNhdGVseVwiLCBcIkRlc3BlcmF0ZWx5XCIsIFwiRGlzY3JlZXRseVwiLCBcIkVhZ2VybHlcIiwgXCJFYXNpbHlcIiwgXCJFdXBob3JpY2x5XCIsXG4gICAgXCJFdmVubHlcIiwgXCJFdmVyeXdoZXJlXCIsIFwiRXhhY3RseVwiLCBcIkV4cGVjdGFudGx5XCIsIFwiRXh0ZW5zaXZlbHlcIiwgXCJGQUlMXCIsIFwiRmVyb2Npb3VzbHlcIiwgXCJGaWVyY2VseVwiLCBcIkZpbmVseVwiLFxuICAgIFwiRmxhdGx5XCIsIFwiRnJlcXVlbnRseVwiLCBcIkZyaWdodGVuaW5nbHlcIiwgXCJHZW50bHlcIiwgXCJHbG9yaW91c2x5XCIsIFwiR3JpbWx5XCIsIFwiR3VpbHRpbHlcIiwgXCJIYXBwaWx5XCIsXG4gICAgXCJIYXJkXCIsIFwiSGFzdGlseVwiLCBcIkhlcm9pY2FsbHlcIiwgXCJIaWdoXCIsIFwiSGlnaGx5XCIsIFwiSG91cmx5XCIsIFwiSHVtYmx5XCIsIFwiSHlzdGVyaWNhbGx5XCIsIFwiSW1tZW5zZWx5XCIsXG4gICAgXCJJbXBhcnRpYWxseVwiLCBcIkltcG9saXRlbHlcIiwgXCJJbmRpZmZlcmVudGx5XCIsIFwiSW50ZW5zZWx5XCIsIFwiSmVhbG91c2x5XCIsIFwiSm92aWFsbHlcIiwgXCJLaW5kbHlcIiwgXCJMYXppbHlcIixcbiAgICBcIkxpZ2h0bHlcIiwgXCJMb3VkbHlcIiwgXCJMb3ZpbmdseVwiLCBcIkxveWFsbHlcIiwgXCJNYWduaWZpY2VudGx5XCIsIFwiTWFsZXZvbGVudGx5XCIsIFwiTWVycmlseVwiLCBcIk1pZ2h0aWx5XCIsIFwiTWlzZXJhYmx5XCIsXG4gICAgXCJNeXN0ZXJpb3VzbHlcIiwgXCJOT1RcIiwgXCJOZXJ2b3VzbHlcIiwgXCJOaWNlbHlcIiwgXCJOb3doZXJlXCIsIFwiT2JqZWN0aXZlbHlcIiwgXCJPYm5veGlvdXNseVwiLCBcIk9ic2Vzc2l2ZWx5XCIsXG4gICAgXCJPYnZpb3VzbHlcIiwgXCJPZnRlblwiLCBcIlBhaW5mdWxseVwiLCBcIlBhdGllbnRseVwiLCBcIlBsYXlmdWxseVwiLCBcIlBvbGl0ZWx5XCIsIFwiUG9vcmx5XCIsIFwiUHJlY2lzZWx5XCIsIFwiUHJvbXB0bHlcIixcbiAgICBcIlF1aWNrbHlcIiwgXCJRdWlldGx5XCIsIFwiUmFuZG9tbHlcIiwgXCJSYXBpZGx5XCIsIFwiUmFyZWx5XCIsIFwiUmVja2xlc3NseVwiLCBcIlJlZ3VsYXJseVwiLCBcIlJlbW9yc2VmdWxseVwiLCBcIlJlc3BvbnNpYmx5XCIsXG4gICAgXCJSdWRlbHlcIiwgXCJSdXRobGVzc2x5XCIsIFwiU2FkbHlcIiwgXCJTY29ybmZ1bGx5XCIsIFwiU2VhbWxlc3NseVwiLCBcIlNlbGRvbVwiLCBcIlNlbGZpc2hseVwiLCBcIlNlcmlvdXNseVwiLCBcIlNoYWtpbHlcIixcbiAgICBcIlNoYXJwbHlcIiwgXCJTaWRld2F5c1wiLCBcIlNpbGVudGx5XCIsIFwiU2xlZXBpbHlcIiwgXCJTbGlnaHRseVwiLCBcIlNsb3dseVwiLCBcIlNseWx5XCIsIFwiU21vb3RobHlcIiwgXCJTb2Z0bHlcIiwgXCJTb2xlbW5seVwiLCBcIlN0ZWFkaWx5XCIsIFwiU3Rlcm5seVwiLCBcIlN0cmFuZ2VseVwiLCBcIlN0cm9uZ2x5XCIsIFwiU3R1bm5pbmdseVwiLCBcIlN1cmVseVwiLCBcIlRlbmRlcmx5XCIsIFwiVGhvdWdodGZ1bGx5XCIsXG4gICAgXCJUaWdodGx5XCIsIFwiVW5lYXNpbHlcIiwgXCJWYW5pc2hpbmdseVwiLCBcIlZpb2xlbnRseVwiLCBcIldhcm1seVwiLCBcIldlYWtseVwiLCBcIldlYXJpbHlcIiwgXCJXZWVrbHlcIiwgXCJXZWlyZGx5XCIsIFwiV2VsbFwiLFxuICAgIFwiV2VsbFwiLCBcIldpY2tlZGx5XCIsIFwiV2lsZGx5XCIsIFwiV2lzZWx5XCIsIFwiV29uZGVyZnVsbHlcIiwgXCJZZWFybHlcIlxuXTtcbnZhciBhZGplY3RpdmVzID0gW1xuICAgIFwiQWJvbWluYWJsZVwiLCBcIkFjY3VyYXRlXCIsIFwiQWRvcmFibGVcIiwgXCJBbGxcIiwgXCJBbGxlZ2VkXCIsIFwiQW5jaWVudFwiLCBcIkFuZ3J5XCIsIFwiQW5ncnlcIiwgXCJBbnhpb3VzXCIsIFwiQXBwYWxsaW5nXCIsXG4gICAgXCJBcHBhcmVudFwiLCBcIkFzdG9uaXNoaW5nXCIsIFwiQXR0cmFjdGl2ZVwiLCBcIkF3ZXNvbWVcIiwgXCJCYWJ5XCIsIFwiQmFkXCIsIFwiQmVhdXRpZnVsXCIsIFwiQmVuaWduXCIsIFwiQmlnXCIsIFwiQml0dGVyXCIsXG4gICAgXCJCbGluZFwiLCBcIkJsdWVcIiwgXCJCb2xkXCIsIFwiQnJhdmVcIiwgXCJCcmlnaHRcIiwgXCJCcmlza1wiLCBcIkNhbG1cIiwgXCJDYW1vdWZsYWdlZFwiLCBcIkNhc3VhbFwiLCBcIkNhdXRpb3VzXCIsXG4gICAgXCJDaG9wcHlcIiwgXCJDaG9zZW5cIiwgXCJDbGV2ZXJcIiwgXCJDb2xkXCIsIFwiQ29vbFwiLCBcIkNyYXdseVwiLCBcIkNyYXp5XCIsIFwiQ3JlZXB5XCIsIFwiQ3J1ZWxcIiwgXCJDdXJpb3VzXCIsIFwiQ3luaWNhbFwiLFxuICAgIFwiRGFuZ2Vyb3VzXCIsIFwiRGFya1wiLCBcIkRlbGljYXRlXCIsIFwiRGVzcGVyYXRlXCIsIFwiRGlmZmljdWx0XCIsIFwiRGlzY3JlZXRcIiwgXCJEaXNndWlzZWRcIiwgXCJEaXp6eVwiLFxuICAgIFwiRHVtYlwiLCBcIkVhZ2VyXCIsIFwiRWFzeVwiLCBcIkVkZ3lcIiwgXCJFbGVjdHJpY1wiLCBcIkVsZWdhbnRcIiwgXCJFbWFuY2lwYXRlZFwiLCBcIkVub3Jtb3VzXCIsIFwiRXVwaG9yaWNcIiwgXCJFdmlsXCIsXG4gICAgXCJGQUlMXCIsIFwiRmFzdFwiLCBcIkZlcm9jaW91c1wiLCBcIkZpZXJjZVwiLCBcIkZpbmVcIiwgXCJGbGF3ZWRcIiwgXCJGbHlpbmdcIiwgXCJGb29saXNoXCIsIFwiRm94eVwiLFxuICAgIFwiRnJlZXppbmdcIiwgXCJGdW5ueVwiLCBcIkZ1cmlvdXNcIiwgXCJHZW50bGVcIiwgXCJHbG9yaW91c1wiLCBcIkdvbGRlblwiLCBcIkdvb2RcIiwgXCJHcmVlblwiLCBcIkdyZWVuXCIsIFwiR3VpbHR5XCIsXG4gICAgXCJIYWlyeVwiLCBcIkhhcHB5XCIsIFwiSGFyZFwiLCBcIkhhc3R5XCIsIFwiSGF6eVwiLCBcIkhlcm9pY1wiLCBcIkhvc3RpbGVcIiwgXCJIb3RcIiwgXCJIdW1ibGVcIiwgXCJIdW1vbmdvdXNcIixcbiAgICBcIkh1bW9yb3VzXCIsIFwiSHlzdGVyaWNhbFwiLCBcIklkZWFsaXN0aWNcIiwgXCJJZ25vcmFudFwiLCBcIkltbWVuc2VcIiwgXCJJbXBhcnRpYWxcIiwgXCJJbXBvbGl0ZVwiLCBcIkluZGlmZmVyZW50XCIsXG4gICAgXCJJbmZ1cmlhdGVkXCIsIFwiSW5zaWdodGZ1bFwiLCBcIkludGVuc2VcIiwgXCJJbnRlcmVzdGluZ1wiLCBcIkludGltaWRhdGVkXCIsIFwiSW50cmlndWluZ1wiLCBcIkplYWxvdXNcIiwgXCJKb2xseVwiLCBcIkpvdmlhbFwiLFxuICAgIFwiSnVtcHlcIiwgXCJLaW5kXCIsIFwiTGF1Z2hpbmdcIiwgXCJMYXp5XCIsIFwiTGlxdWlkXCIsIFwiTG9uZWx5XCIsIFwiTG9uZ2luZ1wiLCBcIkxvdWRcIiwgXCJMb3ZpbmdcIiwgXCJMb3lhbFwiLCBcIk1hY2FicmVcIiwgXCJNYWRcIixcbiAgICBcIk1hZ2ljYWxcIiwgXCJNYWduaWZpY2VudFwiLCBcIk1hbGV2b2xlbnRcIiwgXCJNZWRpZXZhbFwiLCBcIk1lbW9yYWJsZVwiLCBcIk1lcmVcIiwgXCJNZXJyeVwiLCBcIk1pZ2h0eVwiLFxuICAgIFwiTWlzY2hpZXZvdXNcIiwgXCJNaXNlcmFibGVcIiwgXCJNb2RpZmllZFwiLCBcIk1vb2R5XCIsIFwiTW9zdFwiLCBcIk15c3RlcmlvdXNcIiwgXCJNeXN0aWNhbFwiLCBcIk5lZWR5XCIsXG4gICAgXCJOZXJ2b3VzXCIsIFwiTmljZVwiLCBcIk9iamVjdGl2ZVwiLCBcIk9ibm94aW91c1wiLCBcIk9ic2Vzc2l2ZVwiLCBcIk9idmlvdXNcIiwgXCJPcGluaW9uYXRlZFwiLCBcIk9yYW5nZVwiLFxuICAgIFwiUGFpbmZ1bFwiLCBcIlBhc3Npb25hdGVcIiwgXCJQZXJmZWN0XCIsIFwiUGlua1wiLCBcIlBsYXlmdWxcIiwgXCJQb2lzb25vdXNcIiwgXCJQb2xpdGVcIiwgXCJQb29yXCIsIFwiUG9wdWxhclwiLCBcIlBvd2VyZnVsXCIsXG4gICAgXCJQcmVjaXNlXCIsIFwiUHJlc2VydmVkXCIsIFwiUHJldHR5XCIsIFwiUHVycGxlXCIsIFwiUXVpY2tcIiwgXCJRdWlldFwiLCBcIlJhbmRvbVwiLCBcIlJhcGlkXCIsIFwiUmFyZVwiLCBcIlJlYWxcIixcbiAgICBcIlJlYXNzdXJpbmdcIiwgXCJSZWNrbGVzc1wiLCBcIlJlZFwiLCBcIlJlZ3VsYXJcIiwgXCJSZW1vcnNlZnVsXCIsIFwiUmVzcG9uc2libGVcIiwgXCJSaWNoXCIsIFwiUnVkZVwiLCBcIlJ1dGhsZXNzXCIsXG4gICAgXCJTYWRcIiwgXCJTY2FyZWRcIiwgXCJTY2FyeVwiLCBcIlNjb3JuZnVsXCIsIFwiU2NyZWFtaW5nXCIsIFwiU2VsZmlzaFwiLCBcIlNlcmlvdXNcIiwgXCJTaGFkeVwiLCBcIlNoYWt5XCIsIFwiU2hhcnBcIixcbiAgICBcIlNoaW55XCIsIFwiU2h5XCIsIFwiU2ltcGxlXCIsIFwiU2xlZXB5XCIsIFwiU2xvd1wiLCBcIlNseVwiLCBcIlNtYWxsXCIsIFwiU21hcnRcIiwgXCJTbWVsbHlcIiwgXCJTbWlsaW5nXCIsIFwiU21vb3RoXCIsXG4gICAgXCJTbXVnXCIsIFwiU29iZXJcIiwgXCJTb2Z0XCIsIFwiU29sZW1uXCIsIFwiU3F1YXJlXCIsIFwiU3F1YXJlXCIsIFwiU3RlYWR5XCIsIFwiU3RyYW5nZVwiLCBcIlN0cm9uZ1wiLFxuICAgIFwiU3R1bm5pbmdcIiwgXCJTdWJqZWN0aXZlXCIsIFwiU3VjY2Vzc2Z1bFwiLCBcIlN1cmx5XCIsIFwiU3dlZXRcIiwgXCJUYWN0ZnVsXCIsIFwiVGVuc2VcIixcbiAgICBcIlRob3VnaHRmdWxcIiwgXCJUaWdodFwiLCBcIlRpbnlcIiwgXCJUb2xlcmFudFwiLCBcIlVuZWFzeVwiLCBcIlVuaXF1ZVwiLCBcIlVuc2VlblwiLCBcIldhcm1cIiwgXCJXZWFrXCIsXG4gICAgXCJXZWlyZFwiLCBcIldlbGxDb29rZWRcIiwgXCJXaWxkXCIsIFwiV2lzZVwiLCBcIldpdHR5XCIsIFwiV29uZGVyZnVsXCIsIFwiV29ycmllZFwiLCBcIlllbGxvd1wiLCBcIllvdW5nXCIsXG4gICAgXCJaZWFsb3VzXCJcbiAgICBdO1xuLy92YXIgcHJvbm91bnMgPSBbXG4vL107XG4vL3ZhciBjb25qdW5jdGlvbnMgPSBbXG4vL1wiQW5kXCIsIFwiT3JcIiwgXCJGb3JcIiwgXCJBYm92ZVwiLCBcIkJlZm9yZVwiLCBcIkFnYWluc3RcIiwgXCJCZXR3ZWVuXCJcbi8vXTtcblxuLypcbiAqIE1hcHMgYSBzdHJpbmcgKGNhdGVnb3J5IG5hbWUpIHRvIHRoZSBhcnJheSBvZiB3b3JkcyBmcm9tIHRoYXQgY2F0ZWdvcnkuXG4gKi9cbnZhciBDQVRFR09SSUVTID1cbntcbiAgICAvL1wiX05PVU5fXCI6IG5vdW5zLFxuICAgIFwiX1BMVVJBTE5PVU5fXCI6IHBsdXJhbE5vdW5zLFxuICAgIC8vXCJfUExBQ0VfXCI6IHBsYWNlcyxcbiAgICBcIl9WRVJCX1wiOiB2ZXJicyxcbiAgICBcIl9BRFZFUkJfXCI6IGFkdmVyYnMsXG4gICAgXCJfQURKRUNUSVZFX1wiOiBhZGplY3RpdmVzXG4gICAgLy9cIl9QUk9OT1VOX1wiOiBwcm9ub3VucyxcbiAgICAvL1wiX0NPTkpVTkNUSU9OX1wiOiBjb25qdW5jdGlvbnMsXG59O1xuXG52YXIgUEFUVEVSTlMgPSBbXG4gICAgXCJfQURKRUNUSVZFX19QTFVSQUxOT1VOX19WRVJCX19BRFZFUkJfXCJcblxuICAgIC8vIEJlYXV0aWZ1bEZ1bmdpT3JTcGFnaGV0dGlcbiAgICAvL1wiX0FESkVDVElWRV9fUExVUkFMTk9VTl9fQ09OSlVOQ1RJT05fX1BMVVJBTE5PVU5fXCIsXG5cbiAgICAvLyBBbWF6aW5nbHlTY2FyeVRveVxuICAgIC8vXCJfQURWRVJCX19BREpFQ1RJVkVfX05PVU5fXCIsXG5cbiAgICAvLyBOZWl0aGVyVHJhc2hOb3JSaWZsZVxuICAgIC8vXCJOZWl0aGVyX05PVU5fTm9yX05PVU5fXCIsXG4gICAgLy9cIkVpdGhlcl9OT1VOX09yX05PVU5fXCIsXG5cbiAgICAvLyBFaXRoZXJDb3B1bGF0ZU9ySW52ZXN0aWdhdGVcbiAgICAvL1wiRWl0aGVyX1ZFUkJfT3JfVkVSQl9cIixcbiAgICAvL1wiTmVpdGhlcl9WRVJCX05vcl9WRVJCX1wiLFxuXG4gICAgLy9cIlRoZV9BREpFQ1RJVkVfX0FESkVDVElWRV9fTk9VTl9cIixcbiAgICAvL1wiVGhlX0FEVkVSQl9fQURKRUNUSVZFX19OT1VOX1wiLFxuICAgIC8vXCJUaGVfQURWRVJCX19BREpFQ1RJVkVfX05PVU5fc1wiLFxuICAgIC8vXCJUaGVfQURWRVJCX19BREpFQ1RJVkVfX1BMVVJBTE5PVU5fX1ZFUkJfXCIsXG5cbiAgICAvLyBXb2x2ZXNDb21wdXRlQmFkbHlcbiAgICAvL1wiX1BMVVJBTE5PVU5fX1ZFUkJfX0FEVkVSQl9cIixcblxuICAgIC8vIFVuaXRlRmFjaWxpdGF0ZUFuZE1lcmdlXG4gICAgLy9cIl9WRVJCX19WRVJCX0FuZF9WRVJCX1wiLFxuXG4gICAgLy9OYXN0eVdpdGNoZXNBdFRoZVB1YlxuICAgIC8vXCJfQURKRUNUSVZFX19QTFVSQUxOT1VOX0F0VGhlX1BMQUNFX1wiLFxuXTtcblxuXG4vKlxuICogUmV0dXJucyBhIHJhbmRvbSBlbGVtZW50IGZyb20gdGhlIGFycmF5ICdhcnInXG4gKi9cbmZ1bmN0aW9uIHJhbmRvbUVsZW1lbnQoYXJyKVxue1xuICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xufVxuXG4vKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBzdHJpbmcgJ3MnIGNvbnRhaW5zIG9uZSBvZiB0aGVcbiAqIHRlbXBsYXRlIHN0cmluZ3MuXG4gKi9cbmZ1bmN0aW9uIGhhc1RlbXBsYXRlKHMpXG57XG4gICAgZm9yICh2YXIgdGVtcGxhdGUgaW4gQ0FURUdPUklFUyl7XG4gICAgICAgIGlmIChzLmluZGV4T2YodGVtcGxhdGUpID49IDApe1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIG5ldyByb29tIG5hbWUuXG4gKi9cbnZhciBSb29tTmFtZUdlbmVyYXRvciA9IHtcbiAgICBnZW5lcmF0ZVJvb21XaXRob3V0U2VwYXJhdG9yOiBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICAvLyBOb3RlIHRoYXQgaWYgbW9yZSB0aGFuIG9uZSBwYXR0ZXJuIGlzIGF2YWlsYWJsZSwgdGhlIGNob2ljZSBvZiAnbmFtZScgd29uJ3QgYmUgcmFuZG9tIChuYW1lcyBmcm9tIHBhdHRlcm5zXG4gICAgICAgIC8vIHdpdGggZmV3ZXIgb3B0aW9ucyB3aWxsIGhhdmUgaGlnaGVyIHByb2JhYmlsaXR5IG9mIGJlaW5nIGNob3NlbiB0aGF0IG5hbWVzIGZyb20gcGF0dGVybnMgd2l0aCBtb3JlIG9wdGlvbnMpLlxuICAgICAgICB2YXIgbmFtZSA9IHJhbmRvbUVsZW1lbnQoUEFUVEVSTlMpO1xuICAgICAgICB2YXIgd29yZDtcbiAgICAgICAgd2hpbGUgKGhhc1RlbXBsYXRlKG5hbWUpKXtcbiAgICAgICAgICAgIGZvciAodmFyIHRlbXBsYXRlIGluIENBVEVHT1JJRVMpe1xuICAgICAgICAgICAgICAgIHdvcmQgPSByYW5kb21FbGVtZW50KENBVEVHT1JJRVNbdGVtcGxhdGVdKTtcbiAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKHRlbXBsYXRlLCB3b3JkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb29tTmFtZUdlbmVyYXRvcjtcbiIsInZhciBhbmltYXRlVGltZW91dCwgdXBkYXRlVGltZW91dDtcblxudmFyIFJvb21OYW1lR2VuZXJhdG9yID0gcmVxdWlyZShcIi4vUm9vbW5hbWVHZW5lcmF0b3JcIik7XG5cbmZ1bmN0aW9uIGVudGVyX3Jvb20oKVxue1xuICAgIHZhciB2YWwgPSAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikudmFsKCk7XG4gICAgaWYoIXZhbCkge1xuICAgICAgICB2YWwgPSAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikuYXR0cihcInJvb21fbmFtZVwiKTtcbiAgICB9XG4gICAgaWYgKHZhbCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPSBcIi9cIiArIHZhbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFuaW1hdGUod29yZCkge1xuICAgIHZhciBjdXJyZW50VmFsID0gJChcIiNlbnRlcl9yb29tX2ZpZWxkXCIpLmF0dHIoXCJwbGFjZWhvbGRlclwiKTtcbiAgICAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikuYXR0cihcInBsYWNlaG9sZGVyXCIsIGN1cnJlbnRWYWwgKyB3b3JkLnN1YnN0cigwLCAxKSk7XG4gICAgYW5pbWF0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBhbmltYXRlKHdvcmQuc3Vic3RyaW5nKDEsIHdvcmQubGVuZ3RoKSlcbiAgICB9LCA3MCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9yb29tbmFtZSgpXG57XG4gICAgdmFyIHdvcmQgPSBSb29tTmFtZUdlbmVyYXRvci5nZW5lcmF0ZVJvb21XaXRob3V0U2VwYXJhdG9yKCk7XG4gICAgJChcIiNlbnRlcl9yb29tX2ZpZWxkXCIpLmF0dHIoXCJyb29tX25hbWVcIiwgd29yZCk7XG4gICAgJChcIiNlbnRlcl9yb29tX2ZpZWxkXCIpLmF0dHIoXCJwbGFjZWhvbGRlclwiLCBcIlwiKTtcbiAgICBjbGVhclRpbWVvdXQoYW5pbWF0ZVRpbWVvdXQpO1xuICAgIGFuaW1hdGUod29yZCk7XG4gICAgdXBkYXRlVGltZW91dCA9IHNldFRpbWVvdXQodXBkYXRlX3Jvb21uYW1lLCAxMDAwMCk7XG59XG5cblxuZnVuY3Rpb24gc2V0dXBXZWxjb21lUGFnZSgpXG57XG4gICAgJChcIiN2aWRlb2NvbmZlcmVuY2VfcGFnZVwiKS5oaWRlKCk7XG4gICAgJChcIiNkb21haW5fbmFtZVwiKS50ZXh0KFxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgXCIvL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3QgKyBcIi9cIik7XG4gICAgJChcInNwYW5bbmFtZT0nYXBwTmFtZSddXCIpLnRleHQoaW50ZXJmYWNlQ29uZmlnLkFQUF9OQU1FKTtcblxuICAgIGlmIChpbnRlcmZhY2VDb25maWcuU0hPV19KSVRTSV9XQVRFUk1BUkspIHtcbiAgICAgICAgdmFyIGxlZnRXYXRlcm1hcmtEaXZcbiAgICAgICAgICAgID0gJChcIiN3ZWxjb21lX3BhZ2VfaGVhZGVyIGRpdltjbGFzcz0nd2F0ZXJtYXJrIGxlZnR3YXRlcm1hcmsnXVwiKTtcbiAgICAgICAgaWYobGVmdFdhdGVybWFya0RpdiAmJiBsZWZ0V2F0ZXJtYXJrRGl2Lmxlbmd0aCA+IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxlZnRXYXRlcm1hcmtEaXYuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgICAgICAgICBsZWZ0V2F0ZXJtYXJrRGl2LnBhcmVudCgpLmdldCgwKS5ocmVmXG4gICAgICAgICAgICAgICAgPSBpbnRlcmZhY2VDb25maWcuSklUU0lfV0FURVJNQVJLX0xJTks7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGlmIChpbnRlcmZhY2VDb25maWcuU0hPV19CUkFORF9XQVRFUk1BUkspIHtcbiAgICAgICAgdmFyIHJpZ2h0V2F0ZXJtYXJrRGl2XG4gICAgICAgICAgICA9ICQoXCIjd2VsY29tZV9wYWdlX2hlYWRlciBkaXZbY2xhc3M9J3dhdGVybWFyayByaWdodHdhdGVybWFyayddXCIpO1xuICAgICAgICBpZihyaWdodFdhdGVybWFya0RpdiAmJiByaWdodFdhdGVybWFya0Rpdi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByaWdodFdhdGVybWFya0Rpdi5jc3Moe2Rpc3BsYXk6ICdibG9jayd9KTtcbiAgICAgICAgICAgIHJpZ2h0V2F0ZXJtYXJrRGl2LnBhcmVudCgpLmdldCgwKS5ocmVmXG4gICAgICAgICAgICAgICAgPSBpbnRlcmZhY2VDb25maWcuQlJBTkRfV0FURVJNQVJLX0xJTks7XG4gICAgICAgICAgICByaWdodFdhdGVybWFya0Rpdi5nZXQoMCkuc3R5bGUuYmFja2dyb3VuZEltYWdlXG4gICAgICAgICAgICAgICAgPSBcInVybChpbWFnZXMvcmlnaHR3YXRlcm1hcmsucG5nKVwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGludGVyZmFjZUNvbmZpZy5TSE9XX1BPV0VSRURfQlkpIHtcbiAgICAgICAgJChcIiN3ZWxjb21lX3BhZ2VfaGVhZGVyPmFbY2xhc3M9J3Bvd2VyZWRieSddXCIpXG4gICAgICAgICAgICAuY3NzKHtkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgfVxuXG4gICAgJChcIiNlbnRlcl9yb29tX2J1dHRvblwiKS5jbGljayhmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBlbnRlcl9yb29tKCk7XG4gICAgfSk7XG5cbiAgICAkKFwiI2VudGVyX3Jvb21fZmllbGRcIikua2V5ZG93bihmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzIC8qIGVudGVyICovKSB7XG4gICAgICAgICAgICBlbnRlcl9yb29tKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmICghKGludGVyZmFjZUNvbmZpZy5HRU5FUkFURV9ST09NTkFNRVNfT05fV0VMQ09NRV9QQUdFID09PSBmYWxzZSkpe1xuICAgICAgICB2YXIgdXBkYXRlVGltZW91dDtcbiAgICAgICAgdmFyIGFuaW1hdGVUaW1lb3V0O1xuICAgICAgICAkKFwiI3JlbG9hZF9yb29tbmFtZVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodXBkYXRlVGltZW91dCk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoYW5pbWF0ZVRpbWVvdXQpO1xuICAgICAgICAgICAgdXBkYXRlX3Jvb21uYW1lKCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiI3JlbG9hZF9yb29tbmFtZVwiKS5zaG93KCk7XG5cblxuICAgICAgICB1cGRhdGVfcm9vbW5hbWUoKTtcbiAgICB9XG5cbiAgICAkKFwiI2Rpc2FibGVfd2VsY29tZVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uud2VsY29tZVBhZ2VEaXNhYmxlZFxuICAgICAgICAgICAgPSAkKFwiI2Rpc2FibGVfd2VsY29tZVwiKS5pcyhcIjpjaGVja2VkXCIpO1xuICAgIH0pO1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2V0dXBXZWxjb21lUGFnZTsiXX0=
