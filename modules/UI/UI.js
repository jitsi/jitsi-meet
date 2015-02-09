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
var CQEvents = require("../../service/connectionquality/CQEvents");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");

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
    APP.RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);

    APP.RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED);
    APP.RTC.addStreamListener(function (stream) {
        VideoLayout.onRemoteStreamAdded(stream);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CREATED);
    APP.RTC.addListener(RTCEvents.LASTN_CHANGED, onLastNChanged);
    APP.RTC.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED, function (resourceJid) {
        VideoLayout.onDominantSpeakerChanged(resourceJid);
    });
    APP.RTC.addListener(RTCEvents.LASTN_ENDPOINT_CHANGED,
        function (lastNEndpoints, endpointsEnteringLastN, stream) {
            VideoLayout.onLastNEndpointsChanged(lastNEndpoints,
                endpointsEnteringLastN, stream);
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGED,
        function (endpointSimulcastLayers) {
           VideoLayout.onSimulcastLayersChanged(endpointSimulcastLayers);
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGING,
        function (endpointSimulcastLayers) {
            VideoLayout.onSimulcastLayersChanging(endpointSimulcastLayers);
        });
    VideoLayout.init(eventEmitter);

    APP.statistics.addAudioLevelListener(function(jid, audioLevel)
    {
        var resourceJid;
        if(jid === APP.statistics.LOCAL_JID)
        {
            resourceJid = AudioLevels.LOCAL_LEVEL;
            if(APP.RTC.localAudio.isMuted())
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
    APP.desktopsharing.addListener(function () {
        ToolbarToggler.showDesktopSharingButton();
    }, DesktopSharingEventTypes.INIT);
    APP.desktopsharing.addListener(
        Toolbar.changeDesktopSharingButtonState,
        DesktopSharingEventTypes.SWITCHING_DONE);
    APP.connectionquality.addListener(CQEvents.LOCALSTATS_UPDATED,
        VideoLayout.updateLocalConnectionStats);
    APP.connectionquality.addListener(CQEvents.REMOTESTATS_UPDATED,
        VideoLayout.updateConnectionStats);
    APP.connectionquality.addListener(CQEvents.STOP,
        VideoLayout.onStatsStop);
    APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
    APP.xmpp.addListener(XMPPEvents.KICKED, function () {
        messageHandler.openMessageDialog("Session Terminated",
            "Ouch! You have been kicked out of the meet!");
    });
    APP.xmpp.addListener(XMPPEvents.BRIDGE_DOWN, function () {
        messageHandler.showError("Error",
            "Jitsi Videobridge is currently unavailable. Please try again later!");
    });
    APP.xmpp.addListener(XMPPEvents.USER_ID_CHANGED, function (from, id) {
        Avatar.setUserAvatar(from, id);
    });
    APP.xmpp.addListener(XMPPEvents.CHANGED_STREAMS, function (jid, changedStreams) {
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
    APP.xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, onDisplayNameChanged);
    APP.xmpp.addListener(XMPPEvents.MUC_JOINED, onMucJoined);
    APP.xmpp.addListener(XMPPEvents.LOCALROLE_CHANGED, onLocalRoleChange);
    APP.xmpp.addListener(XMPPEvents.MUC_ENTER, onMucEntered);
    APP.xmpp.addListener(XMPPEvents.MUC_ROLE_CHANGED, onMucRoleChanged);
    APP.xmpp.addListener(XMPPEvents.PRESENCE_STATUS, onMucPresenceStatus);
    APP.xmpp.addListener(XMPPEvents.SUBJECT_CHANGED, chatSetSubject);
    APP.xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, updateChatConversation);
    APP.xmpp.addListener(XMPPEvents.MUC_LEFT, onMucLeft);
    APP.xmpp.addListener(XMPPEvents.PASSWORD_REQUIRED, onPasswordReqiured);
    APP.xmpp.addListener(XMPPEvents.CHAT_ERROR_RECEIVED, chatAddError);
    APP.xmpp.addListener(XMPPEvents.ETHERPAD, initEtherpad);
    APP.xmpp.addListener(XMPPEvents.AUTHENTICATION_REQUIRED, onAuthenticationRequired);


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
    APP.xmpp.setVideoMute(
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

UI.start = function (init) {
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

    SettingsMenu.init();

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
            APP.xmpp.isExternalAuthEnabled() && !APP.xmpp.isModerator());

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


UI.toggleSmileys = function () {
    Chat.toggleSmileys();
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

UI.inputDisplayNameHandler = function (value) {
    VideoLayout.inputDisplayNameHandler(value);
};


UI.getLargeVideoState = function()
{
    return VideoLayout.getLargeVideoState();
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

UI.getCredentials = function () {
    var settings = this.getSettings();
    return {
        bosh: document.getElementById('boshURL').value,
        password: document.getElementById('password').value,
        jid: document.getElementById('jid').value,
        email: settings.email,
        displayName: settings.displayName,
        uid: settings.uid
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
    APP.xmpp.joinRoom(roomName, config.useNicks, nick);
};


function dump(elem, filename) {
    elem = elem.parentNode;
    elem.download = filename || 'meetlog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = APP.xmpp.populateData();
    var metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    var log = APP.xmpp.getLogger();
    if (log) {
        metadata.xmpp = log;
    }
    data.metadata = metadata;
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}

UI.getRoomName = function () {
    return roomName;
};

/**
 * Mutes/unmutes the local video.
 */
UI.toggleVideo = function () {
    UIUtil.buttonClick("#video", "icon-camera icon-camera-disabled");

    setVideoMute(!APP.RTC.localVideo.isMuted());
};

/**
 * Mutes / unmutes audio for the local participant.
 */
UI.toggleAudio = function() {
    UI.setAudioMuted(!APP.RTC.localAudio.isMuted());
};

/**
 * Sets muted audio state for the local participant.
 */
UI.setAudioMuted = function (mute) {

    if(!APP.xmpp.setAudioMute(mute, function () {
        VideoLayout.showLocalAudioIndicator(mute);

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

//Used by torture
UI.showToolbar = function () {
    return ToolbarToggler.showToolbar();
}

//Used by torture
UI.dockToolbar = function (isDock) {
    return ToolbarToggler.dockToolbar(isDock);
}

module.exports = UI;

