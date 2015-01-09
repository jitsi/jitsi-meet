/* jshint -W117 */
/* application specific logic */
var connection = null;
var authenticatedUser = false;
/* Initial "authentication required" dialog */
var authDialog = null;
/* Loop retry ID that wits for other user to create the room */
var authRetryId = null;
var activecall = null;
var nickname = null;
var focusMucJid = null;
var roomName = null;
var ssrc2jid = {};
var bridgeIsDown = false;
//TODO: this array must be removed when firefox implement multistream support
var notReceivedSSRCs = [];

var jid2Ssrc = {};

/**
 * Indicates whether ssrc is camera video or desktop stream.
 * FIXME: remove those maps
 */
var ssrc2videoType = {};
/**
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoInfo = null;
var mutedAudios = {};
/**
 * Remembers if we were muted by the focus.
 * @type {boolean}
 */
var forceMuted = false;
/**
 * Indicates if we have muted our audio before the conference has started.
 * @type {boolean}
 */
var preMuted = false;

var localVideoSrc = null;
var flipXLocalVideo = true;
var isFullScreen = false;
var currentVideoWidth = null;
var currentVideoHeight = null;
/**
 * Method used to calculate large video size.
 * @type {function ()}
 */
var getVideoSize;
/**
 * Method used to get large video position.
 * @type {function ()}
 */
var getVideoPosition;

/* window.onbeforeunload = closePageWarning; */

var sessionTerminated = false;

function init() {


    RTC.addStreamListener(maybeDoJoin, StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
    RTC.start();

    var jid = document.getElementById('jid').value || config.hosts.anonymousdomain || config.hosts.domain || window.location.hostname;
    connect(jid);
}

function connect(jid, password) {
    var localAudio, localVideo;
    if (connection && connection.jingle) {
        localAudio = connection.jingle.localAudio;
        localVideo = connection.jingle.localVideo;
    }
    connection = new Strophe.Connection(document.getElementById('boshURL').value || config.bosh || '/http-bind');

    var settings = UI.getSettings();
    var email = settings.email;
    var displayName = settings.displayName;
    if(email) {
        connection.emuc.addEmailToPresence(email);
    } else {
        connection.emuc.addUserIdToPresence(settings.uid);
    }
    if(displayName) {
        connection.emuc.addDisplayNameToPresence(displayName);
    }

    if (connection.disco) {
        // for chrome, add multistream cap
    }
    connection.jingle.pc_constraints = RTC.getPCConstraints();
    if (config.useIPv6) {
        // https://code.google.com/p/webrtc/issues/detail?id=2828
        if (!connection.jingle.pc_constraints.optional) connection.jingle.pc_constraints.optional = [];
        connection.jingle.pc_constraints.optional.push({googIPv6: true});
    }
    if (localAudio) connection.jingle.localAudio = localAudio;
    if (localVideo) connection.jingle.localVideo = localVideo;

    if(!password)
        password = document.getElementById('password').value;

    var anonymousConnectionFailed = false;
    connection.connect(jid, password, function (status, msg) {
        console.log('Strophe status changed to', Strophe.getStatusString(status));
        if (status === Strophe.Status.CONNECTED) {
            if (config.useStunTurn) {
                connection.jingle.getStunAndTurnCredentials();
            }
            document.getElementById('connect').disabled = true;

            console.info("My Jabber ID: " + connection.jid);

            if(password)
                authenticatedUser = true;
            maybeDoJoin();
        } else if (status === Strophe.Status.CONNFAIL) {
            if(msg === 'x-strophe-bad-non-anon-jid') {
                anonymousConnectionFailed = true;
            }
        } else if (status === Strophe.Status.DISCONNECTED) {
            if(anonymousConnectionFailed) {
                // prompt user for username and password
                $(document).trigger('passwordrequired.main');
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            // wrong password or username, prompt user
            $(document).trigger('passwordrequired.main');

        }
    });
}



function maybeDoJoin() {
    if (connection && connection.connected && Strophe.getResourceFromJid(connection.jid) // .connected is true while connecting?
        && (connection.jingle.localAudio || connection.jingle.localVideo)) {
        doJoin();
    }
}

function doJoin() {
    if (!roomName) {
        UI.generateRoomName();
    }

    Moderator.allocateConferenceFocus(
        roomName, doJoinAfterFocus);
}

function doJoinAfterFocus() {

    // Close authentication dialog if opened
    if (authDialog) {
        UI.messageHandler.closeDialog();
        authDialog = null;
    }
    // Clear retry interval, so that we don't call 'doJoinAfterFocus' twice
    if (authRetryId) {
        window.clearTimeout(authRetryId);
        authRetryId = null;
    }

    var roomjid;
    roomjid = roomName;

    if (config.useNicks) {
        var nick = window.prompt('Your nickname (optional)');
        if (nick) {
            roomjid += '/' + nick;
        } else {
            roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
        }
    } else {

        var tmpJid = Strophe.getNodeFromJid(connection.jid);

        if(!authenticatedUser)
            tmpJid = tmpJid.substr(0, 8);

        roomjid += '/' + tmpJid;
    }
    connection.emuc.doJoin(roomjid);
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

        $(document).trigger('videoactive.jingle', [selector]);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(selector, ssrc, stream, jid);
            }, 250);
    }
}

$(document).bind('remotestreamadded.jingle', function (event, data, sid) {
    waitForPresence(data, sid);
});

function waitForPresence(data, sid) {
    var sess = connection.jingle.sessions[sid];

    var thessrc;

    // look up an associated JID for a stream id
    if (data.stream.id && data.stream.id.indexOf('mixedmslabel') === -1) {
        // look only at a=ssrc: and _not_ at a=ssrc-group: lines

        var ssrclines
            = SDPUtil.find_lines(sess.peerconnection.remoteDescription.sdp, 'a=ssrc:');
        ssrclines = ssrclines.filter(function (line) {
            // NOTE(gp) previously we filtered on the mslabel, but that property
            // is not always present.
            // return line.indexOf('mslabel:' + data.stream.label) !== -1;

            return ((line.indexOf('msid:' + data.stream.id) !== -1));
        });
        if (ssrclines.length) {
            thessrc = ssrclines[0].substring(7).split(' ')[0];

            // We signal our streams (through Jingle to the focus) before we set
            // our presence (through which peers associate remote streams to
            // jids). So, it might arrive that a remote stream is added but
            // ssrc2jid is not yet updated and thus data.peerjid cannot be
            // successfully set. Here we wait for up to a second for the
            // presence to arrive.

            if (!ssrc2jid[thessrc]) {
                // TODO(gp) limit wait duration to 1 sec.
                setTimeout(function(d, s) {
                    return function() {
                            waitForPresence(d, s);
                    }
                }(data, sid), 250);
                return;
            }

            // ok to overwrite the one from focus? might save work in colibri.js
            console.log('associated jid', ssrc2jid[thessrc], data.peerjid);
            if (ssrc2jid[thessrc]) {
                data.peerjid = ssrc2jid[thessrc];
            }
        }
    }

    //TODO: this code should be removed when firefox implement multistream support
    if(RTC.getBrowserType() == RTCBrowserType.RTC_BROWSER_FIREFOX)
    {
        if((notReceivedSSRCs.length == 0) ||
            !ssrc2jid[notReceivedSSRCs[notReceivedSSRCs.length - 1]])
        {
            // TODO(gp) limit wait duration to 1 sec.
            setTimeout(function(d, s) {
                return function() {
                    waitForPresence(d, s);
                }
            }(data, sid), 250);
            return;
        }

        thessrc = notReceivedSSRCs.pop();
        if (ssrc2jid[thessrc]) {
            data.peerjid = ssrc2jid[thessrc];
        }
    }

    RTC.createRemoteStream(data, sid, thessrc);

    var isVideo = data.stream.getVideoTracks().length > 0;
    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (isVideo &&
        data.peerjid && sess.peerjid === data.peerjid &&
        data.stream.getVideoTracks().length === 0 &&
        connection.jingle.localVideo.getVideoTracks().length > 0) {
        //
        window.setTimeout(function () {
            sendKeyframe(sess.peerconnection);
        }, 3000);
    }
}

// an attempt to work around https://github.com/jitsi/jitmeet/issues/32
function sendKeyframe(pc) {
    console.log('sendkeyframe', pc.iceConnectionState);
    if (pc.iceConnectionState !== 'connected') return; // safe...
    pc.setRemoteDescription(
        pc.remoteDescription,
        function () {
            pc.createAnswer(
                function (modifiedAnswer) {
                    pc.setLocalDescription(
                        modifiedAnswer,
                        function () {
                            // noop
                        },
                        function (error) {
                            console.log('triggerKeyframe setLocalDescription failed', error);
                            UI.messageHandler.showError();
                        }
                    );
                },
                function (error) {
                    console.log('triggerKeyframe createAnswer failed', error);
                    UI.messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('triggerKeyframe setRemoteDescription failed', error);
            UI.messageHandler.showError();
        }
    );
}

// Really mute video, i.e. dont even send black frames
function muteVideo(pc, unmute) {
    // FIXME: this probably needs another of those lovely state safeguards...
    // which checks for iceconn == connected and sigstate == stable
    pc.setRemoteDescription(pc.remoteDescription,
        function () {
            pc.createAnswer(
                function (answer) {
                    var sdp = new SDP(answer.sdp);
                    if (sdp.media.length > 1) {
                        if (unmute)
                            sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                        else
                            sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                        sdp.raw = sdp.session + sdp.media.join('');
                        answer.sdp = sdp.raw;
                    }
                    pc.setLocalDescription(answer,
                        function () {
                            console.log('mute SLD ok');
                        },
                        function (error) {
                            console.log('mute SLD error');
                            UI.messageHandler.showError('Error',
                                'Oops! Something went wrong and we failed to ' +
                                    'mute! (SLD Failure)');
                        }
                    );
                },
                function (error) {
                    console.log(error);
                    UI.messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('muteVideo SRD error');
            UI.messageHandler.showError('Error',
                'Oops! Something went wrong and we failed to stop video!' +
                    '(SRD Failure)');

        }
    );
}

$(document).bind('setLocalDescription.jingle', function (event, sid) {
    // put our ssrcs into presence so other clients can identify our stream
    var sess = connection.jingle.sessions[sid];
    var newssrcs = [];
    var media = simulcast.parseMedia(sess.peerconnection.localDescription);
    media.forEach(function (media) {

        if(Object.keys(media.sources).length > 0) {
            // TODO(gp) maybe exclude FID streams?
            Object.keys(media.sources).forEach(function (ssrc) {
                newssrcs.push({
                    'ssrc': ssrc,
                    'type': media.type,
                    'direction': media.direction
                });
            });
        }
        else if(sess.localStreamsSSRC && sess.localStreamsSSRC[media.type])
        {
            newssrcs.push({
                'ssrc': sess.localStreamsSSRC[media.type],
                'type': media.type,
                'direction': media.direction
            });
        }

    });

    console.log('new ssrcs', newssrcs);

    // Have to clear presence map to get rid of removed streams
    connection.emuc.clearPresenceMedia();

    if (newssrcs.length > 0) {
        for (var i = 1; i <= newssrcs.length; i ++) {
            // Change video type to screen
            if (newssrcs[i-1].type === 'video' && isUsingScreenStream) {
                newssrcs[i-1].type = 'screen';
            }
            connection.emuc.addMediaToPresence(i,
                newssrcs[i-1].type, newssrcs[i-1].ssrc, newssrcs[i-1].direction);
        }

        connection.emuc.sendPresence();
    }
});

$(document).bind('iceconnectionstatechange.jingle', function (event, sid, session) {
    switch (session.peerconnection.iceConnectionState) {
    case 'checking': 
        session.timeChecking = (new Date()).getTime();
        session.firstconnect = true;
        break;
    case 'completed': // on caller side
    case 'connected':
        if (session.firstconnect) {
            session.firstconnect = false;
            var metadata = {};
            metadata.setupTime = (new Date()).getTime() - session.timeChecking;
            session.peerconnection.getStats(function (res) {
                if(res && res.result) {
                    res.result().forEach(function (report) {
                        if (report.type == 'googCandidatePair' && report.stat('googActiveConnection') == 'true') {
                            metadata.localCandidateType = report.stat('googLocalCandidateType');
                            metadata.remoteCandidateType = report.stat('googRemoteCandidateType');

                            // log pair as well so we can get nice pie charts
                            metadata.candidatePair = report.stat('googLocalCandidateType') + ';' + report.stat('googRemoteCandidateType');

                            if (report.stat('googRemoteAddress').indexOf('[') === 0) {
                                metadata.ipv6 = true;
                            }
                        }
                    });
                    trackUsage('iceConnected', metadata);
                }
            });
        }
        break;
    }
});

$(document).bind('presence.muc', function (event, jid, info, pres) {

    //check if the video bridge is available
    if($(pres).find(">bridgeIsDown").length > 0 && !bridgeIsDown) {
        bridgeIsDown = true;
        UI.messageHandler.showError("Error",
            "Jitsi Videobridge is currently unavailable. Please try again later!");
    }

    if (info.isFocus)
    {
        return;
    }

    // Remove old ssrcs coming from the jid
    Object.keys(ssrc2jid).forEach(function (ssrc) {
        if (ssrc2jid[ssrc] == jid) {
            delete ssrc2jid[ssrc];
            delete ssrc2videoType[ssrc];
        }
    });

    $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
        //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
        var ssrcV = ssrc.getAttribute('ssrc');
        ssrc2jid[ssrcV] = jid;
        notReceivedSSRCs.push(ssrcV);

        var type = ssrc.getAttribute('type');
        ssrc2videoType[ssrcV] = type;

        // might need to update the direction if participant just went from sendrecv to recvonly
        if (type === 'video' || type === 'screen') {
            var el = $('#participant_'  + Strophe.getResourceFromJid(jid) + '>video');
            switch (ssrc.getAttribute('direction')) {
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
    });

    var displayName = !config.displayJids
        ? info.displayName : Strophe.getResourceFromJid(jid);

    if (displayName && displayName.length > 0)
        $(document).trigger('displaynamechanged',
                            [jid, displayName]);
    /*if (focus !== null && info.displayName !== null) {
        focus.setEndpointDisplayName(jid, info.displayName);
    }*/

    //check if the video bridge is available
    if($(pres).find(">bridgeIsDown").length > 0 && !bridgeIsDown) {
        bridgeIsDown = true;
        UI.messageHandler.showError("Error",
            "Jitsi Videobridge is currently unavailable. Please try again later!");
    }

    var id = $(pres).find('>userID').text();
    var email = $(pres).find('>email');
    if(email.length > 0) {
        id = email.text();
    }
    UI.setUserAvatar(jid, id);

});

$(document).bind('kicked.muc', function (event, jid) {
    console.info(jid + " has been kicked from MUC!");
    if (connection.emuc.myroomjid === jid) {
        sessionTerminated = true;
        disposeConference(false);
        connection.emuc.doLeave();
        UI.messageHandler.openMessageDialog("Session Terminated",
            "Ouch! You have been kicked out of the meet!");
    }
});

$(document).bind('passwordrequired.main', function (event) {
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
                    connect(username.value, password.value);
                }
            }
        },
        function (event) {
            document.getElementById('passwordrequired.username').focus();
        }
    );
});

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
    if (connection.emuc.myroomjid &&
        Strophe.getResourceFromJid(connection.emuc.myroomjid) === jid) {
        // local video
        isDesktop = isUsingScreenStream;
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

function getConferenceHandler() {
    return activecall;
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
    if (connection && connection.jingle.localVideo) {
        var session = getConferenceHandler();

        if (session) {
            session.setVideoMute(
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
                    connection.emuc.addVideoInfoToPresence(mute);
                    connection.emuc.sendPresence();
                },
                options);
        }
    }
}

$(document).on('inlastnchanged', function (event, oldValue, newValue) {
    if (config.muteLocalVideoIfNotInLastN) {
        setVideoMute(!newValue, { 'byUser': false });
    }
});

/**
 * Mutes/unmutes the local video.
 */
function toggleVideo() {
    buttonClick("#video", "icon-camera icon-camera-disabled");

    if (connection && connection.jingle.localVideo) {
        var session = getConferenceHandler();

        if (session) {
            setVideoMute(!session.isVideoMute());
        }
    }
}

/**
 * Mutes / unmutes audio for the local participant.
 */
function toggleAudio() {
    setAudioMuted(!isAudioMuted());
}

/**
 * Sets muted audio state for the local participant.
 */
function setAudioMuted(mute) {
    if (!(connection && connection.jingle.localAudio)) {
        preMuted = mute;
        // We still click the button.
        buttonClick("#mute", "icon-microphone icon-mic-disabled");
        return;
    }

    if (forceMuted && !mute) {
        console.info("Asking focus for unmute");
        connection.moderate.setMute(connection.emuc.myroomjid, mute);
        // FIXME: wait for result before resetting muted status
        forceMuted = false;
    }

    if (mute == isAudioMuted()) {
        // Nothing to do
        return;
    }

    // It is not clear what is the right way to handle multiple tracks.
    // So at least make sure that they are all muted or all unmuted and
    // that we send presence just once.
    var localAudioTracks = connection.jingle.localAudio.getAudioTracks();
    if (localAudioTracks.length > 0) {
        for (var idx = 0; idx < localAudioTracks.length; idx++) {
            localAudioTracks[idx].enabled = !mute;
        }
    }
    // isMuted is the opposite of audioEnabled
    connection.emuc.addAudioInfoToPresence(mute);
    connection.emuc.sendPresence();
    UI.showLocalAudioIndicator(mute);

    buttonClick("#mute", "icon-microphone icon-mic-disabled");
}

/**
 * Checks whether the audio is muted or not.
 * @returns {boolean} true if audio is muted and false if not.
 */
function isAudioMuted()
{
    var localAudio = connection.jingle.localAudio;
    for (var idx = 0; idx < localAudio.getAudioTracks().length; idx++) {
        if(localAudio.getAudioTracks()[idx].enabled === true)
            return false;
    }
    return true;
}

$(document).ready(function () {

    if(APIConnector.isEnabled())
        APIConnector.init();

    UI.start();
    statistics.start();
    
    Moderator.init();

    // Set default desktop sharing method
    setDesktopSharing(config.desktopSharing);
    // Initialize Chrome extension inline installs
    if (config.chromeExtensionId) {
        initInlineInstalls();
    }
});

$(window).bind('beforeunload', function () {
    if (connection && connection.connected) {
        // ensure signout
        $.ajax({
            type: 'POST',
            url: config.bosh,
            async: false,
            cache: false,
            contentType: 'application/xml',
            data: "<body rid='" + (connection.rid || connection._proto.rid)
                + "' xmlns='http://jabber.org/protocol/httpbind' sid='"
                + (connection.sid || connection._proto.sid)
                + "' type='terminate'><presence xmlns='jabber:client' type='unavailable'/></body>",
            success: function (data) {
                console.log('signed out');
                console.log(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('signout error', textStatus + ' (' + errorThrown + ')');
            }
        });
    }
    disposeConference(true);
    if(APIConnector.isEnabled())
        APIConnector.dispose();
});

function disposeConference(onUnload) {
    UI.onDisposeConference(onUnload);
    var handler = getConferenceHandler();
    if (handler && handler.peerconnection) {
        // FIXME: probably removing streams is not required and close() should
        // be enough
        if (connection.jingle.localAudio) {
            handler.peerconnection.removeStream(connection.jingle.localAudio, onUnload);
        }
        if (connection.jingle.localVideo) {
            handler.peerconnection.removeStream(connection.jingle.localVideo, onUnload);
        }
        handler.peerconnection.close();
    }
    statistics.onDisposeConference(onUnload);
    activecall = null;
}

function dump(elem, filename) {
    elem = elem.parentNode;
    elem.download = filename || 'meetlog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = populateData();
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}


/**
 * Populates the log data
 */
function populateData() {
    var data = {};
    if (connection.jingle) {
        Object.keys(connection.jingle.sessions).forEach(function (sid) {
            var session = connection.jingle.sessions[sid];
            if (session.peerconnection && session.peerconnection.updateLog) {
                // FIXME: should probably be a .dump call
                data["jingle_" + session.sid] = {
                    updateLog: session.peerconnection.updateLog,
                    stats: session.peerconnection.stats,
                    url: window.location.href
                };
            }
        });
    }
    var metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    if (connection.logger) {
        metadata.xmpp = connection.logger.log;
    }
    data.metadata = metadata;
    return data;
}

/**
 * Changes the style class of the element given by id.
 */
function buttonClick(id, classname) {
    $(id).toggleClass(classname); // add the class to the clicked element
}
