!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.UI=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var UI = {};

var VideoLayout = require("./videolayout/VideoLayout.js");
var AudioLevels = require("./audio_levels/AudioLevels.js");
var Prezi = require("./prezi/Prezi.js");
var Etherpad = require("./etherpad/Etherpad.js");
var Chat = require("./side_pannels/chat/Chat.js");
var Toolbar = require("./toolbars/Toolbar");
var ToolbarToggler = require("./toolbars/ToolbarToggler");
var BottomToolbar = require("./toolbars/BottomToolbar");
var ContactList = require("./side_pannels/contactlist/ContactList");
var Avatar = require("./avatar/Avatar");
var EventEmitter = require("events");
var SettingsMenu = require("./side_pannels/settings/SettingsMenu");
var Settings = require("./side_pannels/settings/Settings");
var PanelToggler = require("./side_pannels/SidePanelToggler");
var RoomNameGenerator = require("./welcome_page/RoomnameGenerator");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;
var Authentication  = require("./authentication/Authentication");
var UIUtil = require("./util/UIUtil");
var NicknameHandler = require("./util/NicknameHandler");

var eventEmitter = new EventEmitter();
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
    RTC.addListener(RTCEvents.LASTN_CHANGED, onLastNChanged);
    RTC.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED, function (resourceJid) {
        VideoLayout.onDominantSpeakerChanged(resourceJid);
    });
    RTC.addListener(RTCEvents.LASTN_ENDPOINT_CHANGED,
        function (lastNEndpoints, endpointsEnteringLastN, stream) {
            VideoLayout.onLastNEndpointsChanged(lastNEndpoints,
                endpointsEnteringLastN, stream);
        });
    RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGED,
        function (endpointSimulcastLayers) {
           VideoLayout.onSimulcastLayersChanged(endpointSimulcastLayers);
        });
    RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGING,
        function (endpointSimulcastLayers) {
            VideoLayout.onSimulcastLayersChanging(endpointSimulcastLayers);
        });
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
    xmpp.addListener(XMPPEvents.LOCALROLE_CHANGED, onLocalRoleChange);
    xmpp.addListener(XMPPEvents.MUC_ENTER, onMucEntered);
    xmpp.addListener(XMPPEvents.MUC_ROLE_CHANGED, onMucRoleChanged);
    xmpp.addListener(XMPPEvents.PRESENCE_STATUS, onMucPresenceStatus);
    xmpp.addListener(XMPPEvents.SUBJECT_CHANGED, chatSetSubject);
    xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, updateChatConversation);
    xmpp.addListener(XMPPEvents.MUC_LEFT, onMucLeft);
    xmpp.addListener(XMPPEvents.PASSWORD_REQUIRED, onPasswordReqiured);
    xmpp.addListener(XMPPEvents.CHAT_ERROR_RECEIVED, chatAddError);
    xmpp.addListener(XMPPEvents.ETHERPAD, initEtherpad);
    connectionquality.addListener(CQEvents.LOCALSTATS_UPDATED,
        VideoLayout.updateLocalConnectionStats);
    connectionquality.addListener(CQEvents.REMOTESTATS_UPDATED,
        VideoLayout.updateConnectionStats);
    connectionquality.addListener(CQEvents.STOP,
        VideoLayout.onStatsStop);
    xmpp.addListener(XMPPEvents.AUTHENTICATION_REQUIRED, onAuthenticationRequired);


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

    VideoLayout.resizeLargeVideoContainer();
    $("#videospace").mousemove(function () {
        return ToolbarToggler.showToolbar();
    });
    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});


    NicknameHandler.init(eventEmitter);
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

function chatAddError(errorMessage, originalText)
{
    return Chat.chatAddError(errorMessage, originalText);
};

function chatSetSubject(text)
{
    return Chat.chatSetSubject(text);
};

function updateChatConversation(from, displayName, message) {
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

function initEtherpad(name) {
    Etherpad.init(name);
};

function onMucLeft(jid) {
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

    VideoLayout.participantLeft(jid);

};


function onLocalRoleChange(jid, info, pres, isModerator, isExternalAuthEnabled)
{

    console.info("My role changed, new role: " + info.role);
    onModeratorStatusChanged(isModerator);
    VideoLayout.showModeratorIndicator();
    Toolbar.showAuthenticateButton(
            isExternalAuthEnabled && !isModerator);

    if (isModerator) {
        Authentication.closeAuthenticationWindow();
        messageHandler.notify(
            'Me', 'connected', 'Moderator rights granted !');
    }
}

function onModeratorStatusChanged(isModerator) {

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

function onPasswordReqiured(callback) {
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
}
function onMucEntered(jid, id, displayName) {
    messageHandler.notify(displayName || 'Somebody',
        'connected',
        'connected');

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid,id);
}

function onMucPresenceStatus( jid, info) {
    VideoLayout.setPresenceStatus(
            'participant_' + Strophe.getResourceFromJid(jid), info.status);
}

function onMucRoleChanged(role, displayName) {
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
}

function onAuthenticationRequired(intervalCallback) {
    Authentication.openAuthenticationDialog(
        roomName, intervalCallback, function () {
            Toolbar.authenticateClicked();
        });
};


function onLastNChanged(oldValue, newValue) {
    if (config.muteLocalVideoIfNotInLastN) {
        setVideoMute(!newValue, { 'byUser': false });
    }
}

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

UI.setRecordingButtonState = function (state) {
    Toolbar.setRecordingButtonState(state);
};

UI.inputDisplayNameHandler = function (value) {
    VideoLayout.inputDisplayNameHandler(value);
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
    xmpp.joinRoom(roomName, config.useNicks, nick);
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

UI.addListener = function (type, listener) {
    eventEmitter.on(type, listener);
}

UI.clickOnVideo = function (videoNumber) {
    var remoteVideos = $(".videocontainer:not(#mixedstream)");
    if (remoteVideos.length > videoNumber) {
        remoteVideos[videoNumber].click();
    }
}

module.exports = UI;


},{"./audio_levels/AudioLevels.js":2,"./authentication/Authentication":4,"./avatar/Avatar":5,"./etherpad/Etherpad.js":6,"./prezi/Prezi.js":7,"./side_pannels/SidePanelToggler":9,"./side_pannels/chat/Chat.js":10,"./side_pannels/contactlist/ContactList":14,"./side_pannels/settings/Settings":15,"./side_pannels/settings/SettingsMenu":16,"./toolbars/BottomToolbar":17,"./toolbars/Toolbar":18,"./toolbars/ToolbarToggler":19,"./util/MessageHandler":21,"./util/NicknameHandler":22,"./util/UIUtil":23,"./videolayout/VideoLayout.js":25,"./welcome_page/RoomnameGenerator":26,"./welcome_page/WelcomePage":27,"events":28}],2:[function(require,module,exports){
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
},{"../side_pannels/settings/Settings":15,"../videolayout/VideoLayout":25}],6:[function(require,module,exports){
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

},{"../prezi/Prezi":7,"../util/UIUtil":23,"../videolayout/VideoLayout":25}],7:[function(require,module,exports){
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");
var VideoLayout = require("../videolayout/VideoLayout");
var messageHandler = require("../util/MessageHandler");
var PreziPlayer = require("./PreziPlayer");

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
                                    = encodeURI(UIUtil.escapeHtml(preziUrl.value));

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

},{"../toolbars/ToolbarToggler":19,"../util/MessageHandler":21,"../util/UIUtil":23,"../videolayout/VideoLayout":25,"./PreziPlayer":8}],8:[function(require,module,exports){
(function() {
    "use strict";
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    window.PreziPlayer = (function() {

        PreziPlayer.API_VERSION = 1;
        PreziPlayer.CURRENT_STEP = 'currentStep';
        PreziPlayer.CURRENT_ANIMATION_STEP = 'currentAnimationStep';
        PreziPlayer.CURRENT_OBJECT = 'currentObject';
        PreziPlayer.STATUS_LOADING = 'loading';
        PreziPlayer.STATUS_READY = 'ready';
        PreziPlayer.STATUS_CONTENT_READY = 'contentready';
        PreziPlayer.EVENT_CURRENT_STEP = "currentStepChange";
        PreziPlayer.EVENT_CURRENT_ANIMATION_STEP = "currentAnimationStepChange";
        PreziPlayer.EVENT_CURRENT_OBJECT = "currentObjectChange";
        PreziPlayer.EVENT_STATUS = "statusChange";
        PreziPlayer.EVENT_PLAYING = "isAutoPlayingChange";
        PreziPlayer.EVENT_IS_MOVING = "isMovingChange";
        PreziPlayer.domain = "https://prezi.com";
        PreziPlayer.path = "/player/";
        PreziPlayer.players = {};
        PreziPlayer.binded_methods = ['changesHandler'];

        PreziPlayer.createMultiplePlayers = function(optionArray){
            for(var i=0; i<optionArray.length; i++) {
                var optionSet = optionArray[i];
                new PreziPlayer(optionSet.id, optionSet);
            };
        };

        PreziPlayer.messageReceived = function(event){
            var message, item, player;
            try {
                message = JSON.parse(event.data);
            } catch (e) {}
            if (message.id && (player = PreziPlayer.players[message.id])){
                if (player.options.debug === true) {
                    if (console && console.log) console.log('received', message);
                }
                if (message.type === "changes"){
                    player.changesHandler(message);
                }
                for (var i=0; i<player.callbacks.length; i++) {
                    item = player.callbacks[i];
                    if (item && message.type === item.event){
                        item.callback(message);
                    }
                }
            }
        };

        function PreziPlayer(id, options) {
            var params, paramString = "", _this = this;
            if (PreziPlayer.players[id]){
                PreziPlayer.players[id].destroy();
            }
            for(var i=0; i<PreziPlayer.binded_methods.length; i++) {
                var method_name = PreziPlayer.binded_methods[i];
                _this[method_name] = __bind(_this[method_name], _this);
            };
            options = options || {};
            this.options = options;
            this.values = {'status': PreziPlayer.STATUS_LOADING};
            this.values[PreziPlayer.CURRENT_STEP] = 0;
            this.values[PreziPlayer.CURRENT_ANIMATION_STEP] = 0;
            this.values[PreziPlayer.CURRENT_OBJECT] = null;
            this.callbacks = [];
            this.id = id;
            this.embedTo = document.getElementById(id);
            if (!this.embedTo) {
                throw "The element id is not available.";
            }
            this.iframe = document.createElement('iframe');
            params = [
                { name: 'oid', value: options.preziId },
                { name: 'explorable', value: options.explorable ? 1 : 0 },
                { name: 'controls', value: options.controls ? 1 : 0 }
            ];
            for(var i=0; i<params.length; i++) {
                var param = params[i];
                paramString += (i===0 ? "?" : "&") + param.name + "=" + param.value;
            };
            this.iframe.src = PreziPlayer.domain + PreziPlayer.path + paramString;
            this.iframe.frameBorder = 0;
            this.iframe.scrolling = "no";
            this.iframe.width = options.width || 640;
            this.iframe.height = options.height || 480;
            this.embedTo.innerHTML = '';
            // JITSI: IN CASE SOMETHING GOES WRONG.
            try {
                this.embedTo.appendChild(this.iframe);
            }
            catch (err) {
                console.log("CATCH ERROR");
            }

            // JITSI: Increase interval from 200 to 500, which fixes prezi
            // crashes for us.
            this.initPollInterval = setInterval(function(){
                _this.sendMessage({'action': 'init'});
            }, 500);
            PreziPlayer.players[id] = this;
        }

        PreziPlayer.prototype.changesHandler = function(message) {
            var key, value, j, item;
            if (this.initPollInterval) {
                clearInterval(this.initPollInterval);
                this.initPollInterval = false;
            }
            for (key in message.data) {
                if (message.data.hasOwnProperty(key)){
                    value = message.data[key];
                    this.values[key] = value;
                    for (j=0; j<this.callbacks.length; j++) {
                        item = this.callbacks[j];
                        if (item && item.event === key + "Change"){
                            item.callback({type: item.event, value: value});
                        }
                    }
                }
            }
        };

        PreziPlayer.prototype.destroy = function() {
            if (this.initPollInterval) {
                clearInterval(this.initPollInterval);
                this.initPollInterval = false;
            }
            this.embedTo.innerHTML = '';
        };

        PreziPlayer.prototype.sendMessage = function(message) {
            if (this.options.debug === true) {
                if (console && console.log) console.log('sent', message);
            }
            message.version = PreziPlayer.API_VERSION;
            message.id = this.id;
            return this.iframe.contentWindow.postMessage(JSON.stringify(message), '*');
        };

        PreziPlayer.prototype.nextStep = /* nextStep is DEPRECATED */
        PreziPlayer.prototype.flyToNextStep = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToNextStep']
            });
        };

        PreziPlayer.prototype.previousStep = /* previousStep is DEPRECATED */
        PreziPlayer.prototype.flyToPreviousStep = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToPrevStep']
            });
        };

        PreziPlayer.prototype.toStep = /* toStep is DEPRECATED */
        PreziPlayer.prototype.flyToStep = function(step, animation_step) {
            var obj = this;
            // check animation_step
            if (animation_step > 0 &&
                obj.values.animationCountOnSteps &&
                obj.values.animationCountOnSteps[step] <= animation_step) {
                animation_step = obj.values.animationCountOnSteps[step];
            }
            // jump to animation steps by calling flyToNextStep()
            function doAnimationSteps() {
                if (obj.values.isMoving == true) {
                    setTimeout(doAnimationSteps, 100); // wait until the flight ends
                    return;
                }
                while (animation_step-- > 0) {
                    obj.flyToNextStep(); // do the animation steps
                }
            }
            setTimeout(doAnimationSteps, 200); // 200ms is the internal "reporting" time
            // jump to the step
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToStep', step]
            });
        };

        PreziPlayer.prototype.toObject = /* toObject is DEPRECATED */
        PreziPlayer.prototype.flyToObject = function(objectId) {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToObject', objectId]
            });
        };

        PreziPlayer.prototype.play = function(defaultDelay) {
            return this.sendMessage({
                'action': 'present',
                'data': ['startAutoPlay', defaultDelay]
            });
        };

        PreziPlayer.prototype.stop = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['stopAutoPlay']
            });
        };

        PreziPlayer.prototype.pause = function(defaultDelay) {
            return this.sendMessage({
                'action': 'present',
                'data': ['pauseAutoPlay', defaultDelay]
            });
        };

        PreziPlayer.prototype.getCurrentStep = function() {
            return this.values.currentStep;
        };

        PreziPlayer.prototype.getCurrentAnimationStep = function() {
            return this.values.currentAnimationStep;
        };

        PreziPlayer.prototype.getCurrentObject = function() {
            return this.values.currentObject;
        };

        PreziPlayer.prototype.getStatus = function() {
            return this.values.status;
        };

        PreziPlayer.prototype.isPlaying = function() {
            return this.values.isAutoPlaying;
        };

        PreziPlayer.prototype.getStepCount = function() {
            return this.values.stepCount;
        };

        PreziPlayer.prototype.getAnimationCountOnSteps = function() {
            return this.values.animationCountOnSteps;
        };

        PreziPlayer.prototype.getTitle = function() {
            return this.values.title;
        };

        PreziPlayer.prototype.setDimensions = function(dims) {
            for (var parameter in dims) {
                this.iframe[parameter] = dims[parameter];
            }
        }

        PreziPlayer.prototype.getDimensions = function() {
            return {
                width: parseInt(this.iframe.width, 10),
                height: parseInt(this.iframe.height, 10)
            }
        }

        PreziPlayer.prototype.on = function(event, callback) {
            this.callbacks.push({
                event: event,
                callback: callback
            });
        };

        PreziPlayer.prototype.off = function(event, callback) {
            var j, item;
            if (event === undefined) {
                this.callbacks = [];
            }
            j = this.callbacks.length;
            while (j--) {
                item = this.callbacks[j];
                if (item && item.event === event && (callback === undefined || item.callback === callback)){
                    this.callbacks.splice(j, 1);
                }
            }
        };

        if (window.addEventListener) {
            window.addEventListener('message', PreziPlayer.messageReceived, false);
        } else {
            window.attachEvent('onmessage', PreziPlayer.messageReceived);
        }

        return PreziPlayer;

    })();

})();

module.exports = PreziPlayer;

},{}],9:[function(require,module,exports){
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
},{"../toolbars/ToolbarToggler":19,"../util/UIUtil":23,"../videolayout/VideoLayout":25,"./chat/Chat":10,"./contactlist/ContactList":14,"./settings/Settings":15,"./settings/SettingsMenu":16}],10:[function(require,module,exports){
/* global $, Util, nickname:true, showToolbar */
var Replacement = require("./Replacement");
var CommandsProcessor = require("./Commands");
var ToolbarToggler = require("../../toolbars/ToolbarToggler");
var smileys = require("./smileys.json").smileys;
var NicknameHandler = require("../../util/NicknameHandler");
var UIUtil = require("../../util/UIUtil");

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
        var leftIndent = (UIUtil.getTextWidth(chatButtonElement) -
            UIUtil.getTextWidth(unreadMsgElement)) / 2;
        var topIndent = (UIUtil.getTextHeight(chatButtonElement) -
            UIUtil.getTextHeight(unreadMsgElement)) / 2 - 3;

        unreadMsgElement.setAttribute(
            'style',
                'top:' + topIndent +
                '; left:' + leftIndent + ';');

        var chatBottomButtonElement
            = document.getElementById('chatBottomButton').parentNode;
        var bottomLeftIndent = (UIUtil.getTextWidth(chatBottomButtonElement) -
            UIUtil.getTextWidth(unreadMsgBottomElement)) / 2;
        var bottomTopIndent = (UIUtil.getTextHeight(chatBottomButtonElement) -
            UIUtil.getTextHeight(unreadMsgBottomElement)) / 2 - 2;

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
        if(NicknameHandler.getNickname())
            Chat.setChatConversationMode(true);
        NicknameHandler.addListener(UIEvents.NICKNAME_CHANGED,
            function (nickname) {
                Chat.setChatConversationMode(true);
            });

        $('#nickinput').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var val = UIUtil.escapeHtml(this.value);
                this.value = '';
                if (!NicknameHandler.getNickname()) {
                    NicknameHandler.setNickname(val);

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
                    var message = UIUtil.escapeHtml(value);
                    xmpp.sendChatMessage(message, NicknameHandler.getNickname());
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
                UIUtil.playSoundNotification('chatNotification');
                setVisualNotification(true);
            }
        }

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        var escMessage = message.replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        var escDisplayName = UIUtil.escapeHtml(displayName);
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
        errorMessage = UIUtil.escapeHtml(errorMessage);
        originalText = UIUtil.escapeHtml(originalText);

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
        $('#subject').html(Replacement.linkify(UIUtil.escapeHtml(subject)));
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
},{"../../toolbars/ToolbarToggler":19,"../../util/NicknameHandler":22,"../../util/UIUtil":23,"../SidePanelToggler":9,"./Commands":11,"./Replacement":12,"./smileys.json":13}],11:[function(require,module,exports){
var UIUtil = require("../../util/UIUtil");

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
    var topic = UIUtil.escapeHtml(commandArguments);
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
},{"../../util/UIUtil":23}],12:[function(require,module,exports){
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

},{"./smileys.json":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){

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
},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
var Avatar = require("../../avatar/Avatar");
var Settings = require("./Settings");
var UIUtil = require("../../util/UIUtil");


var SettingsMenu = {

    update: function() {
        var newDisplayName = UIUtil.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = UIUtil.escapeHtml($('#setEmail').get(0).value);

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
},{"../../avatar/Avatar":5,"../../util/UIUtil":23,"./Settings":15}],17:[function(require,module,exports){
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

},{"../side_pannels/SidePanelToggler":9}],18:[function(require,module,exports){
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
                        callback(UIUtil.escapeHtml(token.value));
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
                                Toolbar.setSharedKey(UIUtil.escapeHtml(lockKey.value));
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
},{"../authentication/Authentication":4,"../etherpad/Etherpad":6,"../prezi/Prezi":7,"../side_pannels/SidePanelToggler":9,"../util/MessageHandler":21,"../util/UIUtil":23,"./BottomToolbar":17}],19:[function(require,module,exports){
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
var nickname = null;
var eventEmitter = null;

var NickanameHandler = {
    init: function (emitter) {
        eventEmitter = emitter;
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
            nickname = storedDisplayName;
        }
    },
    setNickname: function (newNickname) {
        if (!newNickname || nickname === newNickname)
            return;

        nickname = newNickname;
        window.localStorage.displayname = nickname;
        eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newNickname);
    },
    getNickname: function () {
        return nickname;
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }
};

module.exports = NickanameHandler;
},{}],23:[function(require,module,exports){
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
    },
    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    getTextWidth: function (el) {
        return (el.clientWidth + 1);
    },

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    getTextHeight: function (el) {
        return (el.clientHeight + 1);
    },

    /**
     * Plays the sound given by id.
     *
     * @param id the identifier of the audio element.
     */
    playSoundNotification: function (id) {
        document.getElementById(id).play();
    },

    /**
     * Escapes the given text.
     */
    escapeHtml: function (unsafeText) {
        return $('<div/>').text(unsafeText).html();
    },

    imageToGrayScale: function (canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i = 0, n = pixels.length; i < n; i += 4) {
            var grayscale
                = pixels[i] * .3 + pixels[i+1] * .59 + pixels[i+2] * .11;
            pixels[i  ] = grayscale;        // red
            pixels[i+1] = grayscale;        // green
            pixels[i+2] = grayscale;        // blue
            // pixels[i+3]              is alpha
        }
        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    },

    setTooltip: function (element, tooltipText, position) {
        element.setAttribute("data-content", tooltipText);
        element.setAttribute("data-toggle", "popover");
        element.setAttribute("data-placement", position);
        element.setAttribute("data-html", true);
        element.setAttribute("data-container", "body");
    }


};
},{"../side_pannels/SidePanelToggler":9}],24:[function(require,module,exports){
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
},{"../util/JitsiPopover":20}],25:[function(require,module,exports){
var AudioLevels = require("../audio_levels/AudioLevels");
var Avatar = require("../avatar/Avatar");
var Chat = require("../side_pannels/chat/Chat");
var ContactList = require("../side_pannels/contactlist/ContactList");
var UIUtil = require("../util/UIUtil");
var ConnectionIndicator = require("./ConnectionIndicator");
var NicknameHandler = require("../util/NicknameHandler");

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
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoInfo = null;

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
    UIUtil.setTooltip(editButton,
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

    UIUtil.setTooltip(parentElement,
        "The owner of<br/>this conference",
        "top");
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
        if(stream.videoType == "screen")
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
            UIUtil.playSoundNotification('userJoined');
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
            largeVideoState.isDesktop = RTC.isVideoSrcDesktop(resourceJid);
            if(largeVideoState.userResourceJid) {
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

            UIUtil.playSoundNotification('userLeft');
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
        NicknameHandler.setNickname(name);

        if (!$('#localDisplayName').is(":visible")) {
            if (NicknameHandler.getNickname())
                $('#localDisplayName').text(NicknameHandler.getNickname() + " (me)");
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
                UIUtil.setTooltip(mutedIndicator,
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
                UIUtil.setTooltip(audioMutedSpan,
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
                    $(document).trigger("pinnedendpointchanged", [Strophe.getResourceFromJid(jid)]);
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
        if (jid === 'localVideoContainer'
            || jid === xmpp.myJid()) {
            setDisplayName('localVideoContainer',
                           displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
                displayName,
                status);
        }

    };

    /**
     * On dominant speaker changed event.
     */
    my.onDominantSpeakerChanged = function (resourceJid) {
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
    };

    /**
     * On last N change event.
     *
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    my.onLastNEndpointsChanged = function ( lastNEndpoints,
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
    };

    my.onSimulcastLayersChanging = function (endpointSimulcastLayers) {
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

                var preload = (Strophe.getResourceFromJid(xmpp.getJidFromSSRC(primarySSRC)) == largeVideoState.userResourceJid);

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
    };

    /**
     * On simulcast layers changed event.
     */
    my.onSimulcastLayersChanged = function (endpointSimulcastLayers) {
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

                var updateLargeVideo = (Strophe.getResourceFromJid(xmpp.getJidFromSSRC(primarySSRC))
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

                var jid = xmpp.getJidFromSSRC(primarySSRC);

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
    };

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

    my.participantLeft = function (jid) {
        // Unlock large video
        if (focusedVideoInfo && focusedVideoInfo.jid === jid)
        {
            console.info("Focused video owner has left the conference");
            focusedVideoInfo = null;
        }
    }

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;
},{"../audio_levels/AudioLevels":2,"../avatar/Avatar":5,"../etherpad/Etherpad":6,"../prezi/Prezi":7,"../side_pannels/chat/Chat":10,"../side_pannels/contactlist/ContactList":14,"../util/NicknameHandler":22,"../util/UIUtil":23,"./ConnectionIndicator":24}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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
},{"./RoomnameGenerator":26}],28:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[1])(1)
});