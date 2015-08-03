/* global Strophe, APP, $, config, interfaceConfig, toastr */
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
var Settings = require("./../settings/Settings");
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
var RTCBrowserType = require("../RTC/RTCBrowserType");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var UIEvents = require("../../service/UI/UIEvents");
var MemberEvents = require("../../service/members/Events");

var eventEmitter = new EventEmitter();
var roomName = null;


function promptDisplayName() {
    var message = '<h2 data-i18n="dialog.displayNameRequired">';
    message += APP.translation.translateString(
        "dialog.displayNameRequired");
    message += '</h2>' +
        '<input name="displayName" type="text" data-i18n=' +
        '"[placeholder]defaultNickname" placeholder="' +
        APP.translation.translateString(
            "defaultNickname", {name: "Jane Pink"}) +
        '" autofocus>';

    var buttonTxt
        = APP.translation.generateTranslationHTML("dialog.Ok");
    var buttons = [];
    buttons.push({title: buttonTxt, value: "ok"});

    messageHandler.openDialog(null, message,
        true,
        buttons,
        function (e, v, m, f) {
            if (v == "ok") {
                var displayName = f.displayName;
                if (displayName) {
                    VideoLayout.inputDisplayNameHandler(displayName);
                    return true;
                }
            }
            e.preventDefault();
        },
        function () {
            var form  = $.prompt.getPrompt();
            var input = form.find("input[name='displayName']");
            input.focus();
            var button = form.find("button");
            button.attr("disabled", "disabled");
            input.keyup(function () {
                if(!input.val())
                    button.attr("disabled", "disabled");
                else
                    button.removeAttr("disabled");
            });
        }
    );
}

function notifyForInitialMute() {
    messageHandler.notify(null, "notify.mutedTitle", "connected",
        "notify.muted", null, {timeOut: 120000});
}

function setupPrezi() {
    $("#reloadPresentationLink").click(function() {
        Prezi.reloadPresentation();
    });
}

function setupChat() {
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

function streamHandler(stream, isMuted) {
    switch (stream.type) {
        case "audio":
            VideoLayout.changeLocalAudio(stream, isMuted);
            break;
        case "video":
            VideoLayout.changeLocalVideo(stream, isMuted);
            break;
        case "stream":
            VideoLayout.changeLocalStream(stream, isMuted);
            break;
    }
}

function onXmppConnectionFailed(stropheErrorMsg) {

    var title = APP.translation.generateTranslationHTML(
        "dialog.error");

    var message;
    if (stropheErrorMsg) {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectErrorWithMsg", {msg: stropheErrorMsg});
    } else {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectError");
    }

    messageHandler.openDialog(
        title, message, true, {}, function (e, v, m, f) { return false; });
}

function onDisposeConference(unload) {
    Toolbar.showAuthenticateButton(false);
}

function onDisplayNameChanged(jid, displayName) {
    ContactList.onDisplayNameChange(jid, displayName);
    SettingsMenu.onDisplayNameChange(jid, displayName);
    VideoLayout.onDisplayNameChanged(jid, displayName);
}

function registerListeners() {
    APP.RTC.addStreamListener(streamHandler,
        StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
    APP.RTC.addStreamListener(streamHandler,
        StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED);
    APP.RTC.addStreamListener(function (stream) {
        VideoLayout.onRemoteStreamAdded(stream);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CREATED);
    APP.RTC.addStreamListener(function (jid) {
        VideoLayout.onVideoTypeChanged(jid);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CHANGED);
    APP.RTC.addListener(RTCEvents.LASTN_CHANGED, onLastNChanged);
    APP.RTC.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED,
        function (resourceJid) {
        VideoLayout.onDominantSpeakerChanged(resourceJid);
    });
    APP.RTC.addListener(RTCEvents.LASTN_ENDPOINT_CHANGED,
        function (lastNEndpoints, endpointsEnteringLastN, stream) {
            VideoLayout.onLastNEndpointsChanged(lastNEndpoints,
                endpointsEnteringLastN, stream);
        });
    APP.RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED,
        function (devices) {
            VideoLayout.setDeviceAvailabilityIcons(null, devices);
        });
    APP.RTC.addListener(RTCEvents.VIDEO_MUTE, UI.setVideoMuteButtonsState);
    APP.RTC.addListener(RTCEvents.DATA_CHANNEL_OPEN, function() {
        // when the data channel becomes available, tell the bridge about video
        // selections so that it can do adaptive simulcast,
        // we want the notification to trigger even if userJid is undefined,
        // or null.
        var userJid = APP.UI.getLargeVideoJid();
        eventEmitter.emit(UIEvents.SELECTED_ENDPOINT, userJid);
    });
    APP.statistics.addAudioLevelListener(function(jid, audioLevel) {
        var resourceJid;
        if(jid === APP.statistics.LOCAL_JID) {
            resourceJid = AudioLevels.LOCAL_LEVEL;
            if(APP.RTC.localAudio.isMuted()) {
                audioLevel = 0;
            }
        } else {
            resourceJid = Strophe.getResourceFromJid(jid);
        }

        AudioLevels.updateAudioLevel(resourceJid, audioLevel,
            UI.getLargeVideoJid());
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
    APP.xmpp.addListener(XMPPEvents.CONNECTION_FAILED, onXmppConnectionFailed);
    APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
    APP.xmpp.addListener(XMPPEvents.GRACEFUL_SHUTDOWN, function () {
        messageHandler.openMessageDialog(
            'dialog.serviceUnavailable',
            'dialog.gracefulShutdown'
        );
    });
    APP.xmpp.addListener(XMPPEvents.RESERVATION_ERROR, function (code, msg) {
        var title = APP.translation.generateTranslationHTML(
            "dialog.reservationError");
        var message = APP.translation.generateTranslationHTML(
            "dialog.reservationErrorMsg", {code: code, msg: msg});
        messageHandler.openDialog(
            title,
            message,
            true, {},
            function (event, value, message, formVals) {
                return false;
            }
        );
    });
    APP.xmpp.addListener(XMPPEvents.KICKED, function () {
        messageHandler.openMessageDialog("dialog.sessTerminated",
            "dialog.kickMessage");
    });
    APP.xmpp.addListener(XMPPEvents.MUC_DESTROYED, function (reason) {
        //FIXME: use Session Terminated from translation, but
        // 'reason' text comes from XMPP packet and is not translated
        var title = APP.translation.generateTranslationHTML("dialog.sessTerminated");
        messageHandler.openDialog(
            title, reason, true, {},
            function (event, value, message, formVals) {
                return false;
            }
        );
    });
    APP.xmpp.addListener(XMPPEvents.BRIDGE_DOWN, function () {
        messageHandler.showError("dialog.error",
            "dialog.bridgeUnavailable");
    });
    APP.xmpp.addListener(XMPPEvents.USER_ID_CHANGED, function (from, id) {
        Avatar.setUserAvatar(from, id);
    });
    APP.xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, onDisplayNameChanged);
    APP.xmpp.addListener(XMPPEvents.MUC_JOINED, onMucJoined);
    APP.xmpp.addListener(XMPPEvents.LOCAL_ROLE_CHANGED, onLocalRoleChanged);
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_JOINED, onMucMemberJoined);
    APP.xmpp.addListener(XMPPEvents.MUC_ROLE_CHANGED, onMucRoleChanged);
    APP.xmpp.addListener(XMPPEvents.PRESENCE_STATUS, onMucPresenceStatus);
    APP.xmpp.addListener(XMPPEvents.SUBJECT_CHANGED, chatSetSubject);
    APP.xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, updateChatConversation);
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_LEFT, onMucMemberLeft);
    APP.xmpp.addListener(XMPPEvents.PASSWORD_REQUIRED, onPasswordRequired);
    APP.xmpp.addListener(XMPPEvents.CHAT_ERROR_RECEIVED, chatAddError);
    APP.xmpp.addListener(XMPPEvents.ETHERPAD, initEtherpad);
    APP.xmpp.addListener(XMPPEvents.AUTHENTICATION_REQUIRED,
        onAuthenticationRequired);
    APP.xmpp.addListener(XMPPEvents.DEVICE_AVAILABLE,
        function (resource, devices) {
            VideoLayout.setDeviceAvailabilityIcons(resource, devices);
        });

    APP.xmpp.addListener(XMPPEvents.AUDIO_MUTED, VideoLayout.onAudioMute);
    APP.xmpp.addListener(XMPPEvents.VIDEO_MUTED, VideoLayout.onVideoMute);
    APP.xmpp.addListener(XMPPEvents.AUDIO_MUTED_BY_FOCUS, function(doMuteAudio) {
        UI.setAudioMuted(doMuteAudio);
    });
    APP.members.addListener(MemberEvents.DTMF_SUPPORT_CHANGED,
                            onDtmfSupportChanged);
    APP.xmpp.addListener(XMPPEvents.START_MUTED_SETTING_CHANGED, function (audio, video) {
        SettingsMenu.setStartMuted(audio, video);
    });
    APP.xmpp.addListener(XMPPEvents.START_MUTED_FROM_FOCUS, function (audio, video) {
        UI.setInitialMuteFromFocus(audio, video);
    });

    APP.xmpp.addListener(XMPPEvents.JINGLE_FATAL_ERROR, function (session, error) {
        UI.messageHandler.showError("dialog.sorry",
            "dialog.internalError");
    });

    APP.xmpp.addListener(XMPPEvents.SET_LOCAL_DESCRIPTION_ERROR, function() {
        messageHandler.showError("dialog.error",
                                        "dialog.SLDFailure");
    });
    APP.xmpp.addListener(XMPPEvents.SET_REMOTE_DESCRIPTION_ERROR, function() {
        messageHandler.showError("dialog.error",
            "dialog.SRDFailure");
    });
    APP.xmpp.addListener(XMPPEvents.CREATE_ANSWER_ERROR, function() {
        messageHandler.showError();
    });
    APP.xmpp.addListener(XMPPEvents.PROMPT_FOR_LOGIN, function() {
        // FIXME: re-use LoginDialog which supports retries
        UI.showLoginPopup(connect);
    });
    
    APP.xmpp.addListener(XMPPEvents.FOCUS_DISCONNECTED, function(focusComponent, retrySec) {
        UI.messageHandler.notify(
            null, "notify.focus",
            'disconnected', "notify.focusFail",
            {component: focusComponent, ms: retrySec});
    });
    
    APP.xmpp.addListener(XMPPEvents.ROOM_JOIN_ERROR, function(pres) {
        UI.messageHandler.openReportDialog(null,
            "dialog.joinError", pres);
    });
    APP.xmpp.addListener(XMPPEvents.ROOM_CONNECT_ERROR, function(pres) {
        UI.messageHandler.openReportDialog(null,
            "dialog.connectError", pres);
    });

    APP.xmpp.addListener(XMPPEvents.READY_TO_JOIN, function() {
        var roomName = UI.generateRoomName();
        APP.xmpp.allocateConferenceFocus(roomName, UI.checkForNicknameAndJoin);
    });
    
    //NicknameHandler emits this event
    UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        APP.xmpp.addToPresence("displayName", nickname);
    });

    UI.addListener(UIEvents.LARGEVIDEO_INIT, function () {
        AudioLevels.init();
    });

    // Listens for video interruption events.
    APP.xmpp.addListener(XMPPEvents.CONNECTION_INTERRUPTED, VideoLayout.onVideoInterrupted);
    // Listens for video restores events.
    APP.xmpp.addListener(XMPPEvents.CONNECTION_RESTORED, VideoLayout.onVideoRestored);
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
    APP.RTC.setVideoMute(mute,
        UI.setVideoMuteButtonsState,
        options);
}

function onResize() {
    Chat.resizeChat();
    VideoLayout.resizeLargeVideoContainer();
}

function bindEvents() {
    /**
     * Resizes and repositions videos in full screen mode.
     */
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        onResize);

    $(window).resize(onResize);
}

UI.start = function (init) {
    document.title = interfaceConfig.APP_NAME;
    var setupWelcomePage = null;
    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled ||
            window.localStorage.welcomePageDisabled == "false")) {
        $("#videoconference_page").hide();
        if (!setupWelcomePage)
            setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    $("#welcome_page").hide();

    $("#videospace").mousemove(function () {
        return ToolbarToggler.showToolbar();
    });
    // Set the defaults for prompt dialogs.
    $.prompt.setDefaults({persistent: false});


    registerListeners();

    VideoLayout.init(eventEmitter);
    NicknameHandler.init(eventEmitter);

    bindEvents();
    setupPrezi();
    setupToolbars();
    setupChat();


    document.title = interfaceConfig.APP_NAME;

    $("#downloadlog").click(function (event) {
        dump(event.target);
    });

    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled ||
            window.localStorage.welcomePageDisabled == "false")) {
        $("#videoconference_page").hide();
        if (!setupWelcomePage)
            setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    $("#welcome_page").hide();

    // Display notice message at the top of the toolbar
    if (config.noticeMessage) {
        $('#noticeText').text(config.noticeMessage);
        $('#notice').css({display: 'block'});
    }

    if(config.requireDisplayName) {
        var currentSettings = Settings.getSettings();
        if (!currentSettings.displayName) {
            promptDisplayName();
        }
    }

    init();

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

function chatAddError(errorMessage, originalText) {
    return Chat.chatAddError(errorMessage, originalText);
}

function chatSetSubject(text) {
    return Chat.chatSetSubject(text);
}

function updateChatConversation(from, displayName, message, myjid, stamp) {
    return Chat.updateChatConversation(from, displayName, message, myjid, stamp);
}

function onMucJoined(jid, info) {
    Toolbar.updateRoomUrl(window.location.href);
    var meHTML = APP.translation.generateTranslationHTML("me");
    $("#localNick").html(Strophe.getResourceFromJid(jid) + " (" + meHTML + ")");

    var settings = Settings.getSettings();

    // Make sure we configure our avatar id, before creating avatar for us
    Avatar.setUserAvatar(jid, settings.email || settings.uid);

    // Add myself to the contact list.
    ContactList.addContact(jid);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    var displayName =
        config.displayJids ? Strophe.getResourceFromJid(jid) : info.displayName;

    if (displayName)
        onDisplayNameChanged('localVideoContainer', displayName);


    VideoLayout.mucJoined();
}

function initEtherpad(name) {
    Etherpad.init(name);
}

function onMucMemberLeft(jid) {
    console.log('left.muc', jid);
    var displayName = $('#participant_' + Strophe.getResourceFromJid(jid) +
        '>.displayname').html();
    messageHandler.notify(displayName,'notify.somebody',
        'disconnected',
        'notify.disconnected');
    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.members.size()) {
        UIUtil.playSoundNotification('userLeft');
    }

    ContactList.removeContact(jid);

    VideoLayout.participantLeft(jid);
}

function onLocalRoleChanged(jid, info, pres, isModerator) {
    console.info("My role changed, new role: " + info.role);
    onModeratorStatusChanged(isModerator);
    VideoLayout.showModeratorIndicator();
    SettingsMenu.onRoleChanged();

    if (isModerator) {
        Authentication.closeAuthenticationWindow();
        messageHandler.notify(null, "notify.me",
            'connected', "notify.moderator");
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
}

function onPasswordRequired(callback) {
    // password is required
    Toolbar.lockLockButton();
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="lockKey" type="text" data-i18n=' +
        '"[placeholder]dialog.password" placeholder="' +
        APP.translation.translateString("dialog.password") +
        '" autofocus>';

    messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {},
        null,
        function (e, v, m, f) {
            if (v) {
                var lockKey = f.lockKey;
                if (lockKey) {
                    Toolbar.setSharedKey(lockKey);
                    callback(lockKey);
                }
            }
        },
        ':input:first'
    );
}

/**
 * The dialpad button is shown iff there is at least one member that supports
 * DTMF (e.g. jigasi).
 */
function onDtmfSupportChanged(dtmfSupport) {
    //TODO: enable when the UI is ready
    //Toolbar.showDialPadButton(dtmfSupport);
}

function onMucMemberJoined(jid, id, displayName) {
    messageHandler.notify(displayName,'notify.somebody',
        'connected',
        'notify.connected');

    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.members.size())
        UIUtil.playSoundNotification('userJoined');

    // Configure avatar
    Avatar.setUserAvatar(jid, id);

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid);
}

function onMucPresenceStatus(jid, info) {
    VideoLayout.setPresenceStatus(Strophe.getResourceFromJid(jid), info.status);
}

function onMucRoleChanged(role, displayName) {
    VideoLayout.showModeratorIndicator();

    if (role === 'moderator') {
        var messageKey, messageOptions = {};
        if (!displayName) {
            messageKey = "notify.grantedToUnknown";
        }
        else {
            messageKey = "notify.grantedTo";
            messageOptions = {to: displayName};
        }
        messageHandler.notify(
            displayName,'notify.somebody',
            'connected', messageKey,
            messageOptions);
    }
}

function onAuthenticationRequired(intervalCallback) {
    Authentication.openAuthenticationDialog(
        roomName, intervalCallback, function () {
            Toolbar.authenticateClicked();
        });
}


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

UI.getLargeVideoJid = function() {
    return VideoLayout.getLargeVideoJid();
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


UI.connectionIndicatorShowMore = function(jid) {
    return VideoLayout.showMore(jid);
};

UI.showLoginPopup = function(callback) {
    console.log('password is required');
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ' +
        'placeholder="user@domain.net" autofocus>' +
        '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';
    UI.messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {
            if (v) {
                if (f.username !== null && f.password != null) {
                    callback(f.username, f.password);
                }
            }
        },
        null, null, ':input:first'

    );
};

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
    var data = APP.xmpp.getJingleLog();
    var metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    var log = APP.xmpp.getXmppLog();
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

UI.setInitialMuteFromFocus = function (muteAudio, muteVideo) {
    if (muteAudio || muteVideo)
        notifyForInitialMute();
    if (muteAudio)
        UI.setAudioMuted(true);
    if (muteVideo)
        UI.setVideoMute(true);
};

/**
 * Mutes/unmutes the local video.
 */
UI.toggleVideo = function () {
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
UI.setAudioMuted = function (mute, earlyMute) {
    var audioMute = null;
    if (earlyMute)
        audioMute = function (mute, cb) {
            return APP.xmpp.sendAudioInfoPresence(mute, cb);
        };
    else
        audioMute = function (mute, cb) {
            return APP.xmpp.setAudioMute(mute, cb);
        };
    if (!audioMute(mute, function () {
            VideoLayout.showLocalAudioIndicator(mute);

            UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
        })) {
        // We still click the button.
        UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
        return;
    }
};

UI.addListener = function (type, listener) {
    eventEmitter.on(type, listener);
};

UI.clickOnVideo = function (videoNumber) {
    var remoteVideos = $(".videocontainer:not(#mixedstream)");
    if (remoteVideos.length > videoNumber) {
        remoteVideos[videoNumber].click();
    }
};

//Used by torture
UI.showToolbar = function () {
    return ToolbarToggler.showToolbar();
};

//Used by torture
UI.dockToolbar = function (isDock) {
    return ToolbarToggler.dockToolbar(isDock);
};

UI.setVideoMuteButtonsState = function (mute) {
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
};

UI.userAvatarChanged = function (resourceJid, thumbUrl, contactListUrl) {
    VideoLayout.userAvatarChanged(resourceJid, thumbUrl);
    ContactList.userAvatarChanged(resourceJid, contactListUrl);
    if(resourceJid === APP.xmpp.myResource())
        SettingsMenu.changeAvatar(thumbUrl);
};

UI.setVideoMute = setVideoMute;

module.exports = UI;

