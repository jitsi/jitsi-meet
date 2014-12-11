/* jshint -W117 */
/* application specific logic */
var connection = null;
var authenticatedUser = false;
var activecall = null;
var RTC = null;
var nickname = null;
var sharedKey = '';
var focusJid = null;
var roomUrl = null;
var roomName = null;
var ssrc2jid = {};
var mediaStreams = {};
var bridgeIsDown = false;
//TODO: this array must be removed when firefox implement multistream support
var notReceivedSSRCs = [];

var jid2Ssrc = {};

/**
 * The stats collector that process stats data and triggers updates to app.js.
 * @type {StatsCollector}
 */
var statsCollector = null;

/**
 * The stats collector for the local stream.
 * @type {LocalStatsCollector}
 */
var localStatsCollector = null;

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
    Toolbar.setupButtonsFromConfig();
    RTC = setupRTC();
    if (RTC === null) {
        window.location.href = 'webrtcrequired.html';
        return;
    } else if (RTC.browser !== 'chrome' &&
        config.enableFirefoxSupport !== true) {
        window.location.href = 'chromeonly.html';
        return;
    }

    obtainAudioAndVideoPermissions(function (stream) {
        var audioStream, videoStream;
        if(window.webkitMediaStream)
        {
            var audioStream = new webkitMediaStream();
            var videoStream = new webkitMediaStream();
            var audioTracks = stream.getAudioTracks();
            var videoTracks = stream.getVideoTracks();
            for (var i = 0; i < audioTracks.length; i++) {
                audioStream.addTrack(audioTracks[i]);
            }

            for (i = 0; i < videoTracks.length; i++) {
                videoStream.addTrack(videoTracks[i]);
            }
            VideoLayout.changeLocalAudio(audioStream);
            startLocalRtpStatsCollector(audioStream);


            VideoLayout.changeLocalVideo(videoStream, true);
        }
        else
        {
            VideoLayout.changeLocalStream(stream);
            startLocalRtpStatsCollector(stream);

        }




        maybeDoJoin();
    });

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
    
    var email = SettingsMenu.getEmail();
    var displayName = SettingsMenu.getDisplayName();
    if(email) {
        connection.emuc.addEmailToPresence(email);
    } else {
        connection.emuc.addUserIdToPresence(SettingsMenu.getUID());
    }
    if(displayName) {
        connection.emuc.addDisplayNameToPresence(displayName);
    }

    if (connection.disco) {
        // for chrome, add multistream cap
    }
    connection.jingle.pc_constraints = RTC.pc_constraints;
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

/**
 * We ask for audio and video combined stream in order to get permissions and
 * not to ask twice.
 */
function obtainAudioAndVideoPermissions(callback) {
    // Get AV
    var cb = function (stream) {
        console.log('got', stream, stream.getAudioTracks().length, stream.getVideoTracks().length);
        callback(stream);
        trackUsage('localMedia', {
            audio: stream.getAudioTracks().length,
            video: stream.getVideoTracks().length
        });
    }
    getUserMediaWithConstraints(
        ['audio', 'video'],
        cb,
        function (error) {
            console.error('failed to obtain audio/video stream - trying audio only', error);
            getUserMediaWithConstraints(
                ['audio'],
                cb,
                function (error) {
                    console.error('failed to obtain audio/video stream - stop', error);
                    trackUsage('localMediaError', {
                        media: error.media || 'video',
                        name : error.name
                    });
                    messageHandler.showError("Error",
                        "Failed to obtain permissions to use the local microphone" +
                            "and/or camera.");
                }
            );
        },
        config.resolution || '360');
}

function maybeDoJoin() {
    if (connection && connection.connected && Strophe.getResourceFromJid(connection.jid) // .connected is true while connecting?
        && (connection.jingle.localAudio || connection.jingle.localVideo)) {
        doJoin();
    }
}

function generateRoomName() {
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
}

function doJoin() {
    if (!roomName) {
        generateRoomName();
    }

    Moderator.allocateConferenceFocus(
        roomName, doJoinAfterFocus);
}

function doJoinAfterFocus() {

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
//            messageHandler.showError('Warning', 'No ssrc was given for the video.');
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
    if(RTC.browser == "firefox")
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

    // NOTE(gp) now that we have simulcast, a media stream can have more than 1
    // ssrc. We should probably take that into account in our MediaStream
    // wrapper.
    var mediaStream = new MediaStream(data, sid, thessrc);
    var jid = data.peerjid || connection.emuc.myroomjid;
    if(!mediaStreams[jid]) {
        mediaStreams[jid] = {};
    }
    mediaStreams[jid][mediaStream.type] = mediaStream;

    var container;
    var remotes = document.getElementById('remoteVideos');

    if (data.peerjid) {
        VideoLayout.ensurePeerContainerExists(data.peerjid);

        container  = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(data.peerjid));
    } else {
        if (data.stream.id !== 'mixedmslabel'
            // FIXME: default stream is added always with new focus
            // (to be investigated)
            && data.stream.id !== 'default') {
            console.error('can not associate stream',
                data.stream.id,
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

    var isVideo = data.stream.getVideoTracks().length > 0;

    if (container) {
        VideoLayout.addRemoteStreamElement( container,
                                            sid,
                                            data.stream,
                                            data.peerjid,
                                            thessrc);
    }

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
                            messageHandler.showError();
                        }
                    );
                },
                function (error) {
                    console.log('triggerKeyframe createAnswer failed', error);
                    messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('triggerKeyframe setRemoteDescription failed', error);
            messageHandler.showError();
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
                            messageHandler.showError('Error',
                                'Oops! Something went wrong and we failed to ' +
                                    'mute! (SLD Failure)');
                        }
                    );
                },
                function (error) {
                    console.log(error);
                    messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('muteVideo SRD error');
            messageHandler.showError('Error',
                'Oops! Something went wrong and we failed to stop video!' +
                    '(SRD Failure)');

        }
    );
}

/**
 * Callback for audio levels changed.
 * @param jid JID of the user
 * @param audioLevel the audio level value
 */
function audioLevelUpdated(jid, audioLevel)
{
    var resourceJid;
    if(jid === LocalStatsCollector.LOCAL_JID)
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

    AudioLevels.updateAudioLevel(resourceJid, audioLevel);
}

/**
 * Starts the {@link StatsCollector} if the feature is enabled in config.js.
 */
function startRtpStatsCollector()
{
    stopRTPStatsCollector();
    if (config.enableRtpStats)
    {
        statsCollector = new StatsCollector(
            getConferenceHandler().peerconnection, 200, audioLevelUpdated, 2000,
            ConnectionQuality.updateLocalStats);
        statsCollector.start();
    }
}

/**
 * Stops the {@link StatsCollector}.
 */
function stopRTPStatsCollector()
{
    if (statsCollector)
    {
        statsCollector.stop();
        statsCollector = null;
        ConnectionQuality.stopSendingStats();
    }
}

/**
 * Starts the {@link LocalStatsCollector} if the feature is enabled in config.js
 * @param stream the stream that will be used for collecting statistics.
 */
function startLocalRtpStatsCollector(stream)
{
    if(config.enableRtpStats)
    {
        localStatsCollector = new LocalStatsCollector(stream, 100, audioLevelUpdated);
        localStatsCollector.start();
    }
}

/**
 * Stops the {@link LocalStatsCollector}.
 */
function stopLocalRtpStatsCollector()
{
    if(localStatsCollector)
    {
        localStatsCollector.stop();
        localStatsCollector = null;
    }
}

$(document).bind('callincoming.jingle', function (event, sid) {
    var sess = connection.jingle.sessions[sid];

    // TODO: do we check activecall == null?
    activecall = sess;

    startRtpStatsCollector();

    // Bind data channel listener in case we're a regular participant
    if (config.openSctp)
    {
        bindDataChannelListener(sess.peerconnection);
    }

    // TODO: check affiliation and/or role
    console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
    sess.usedrip = true; // not-so-naive trickle ice
    sess.sendAnswer();
    sess.accept();

});

$(document).bind('conferenceCreated.jingle', function (event, focus)
{
    startRtpStatsCollector();
});

$(document).bind('conferenceCreated.jingle', function (event, focus)
{
    // Bind data channel listener in case we're the focus
    if (config.openSctp)
    {
        bindDataChannelListener(focus.peerconnection);
    }
});

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

$(document).bind('joined.muc', function (event, jid, info) {
    updateRoomUrl(window.location.href);
    document.getElementById('localNick').appendChild(
        document.createTextNode(Strophe.getResourceFromJid(jid) + ' (me)')
    );

    // Add myself to the contact list.
    ContactList.addContact(jid, SettingsMenu.getEmail() || SettingsMenu.getUID());

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    var displayName = !config.displayJids
        ? info.displayName : Strophe.getResourceFromJid(jid);

    if (displayName)
        $(document).trigger('displaynamechanged',
                            ['localVideoContainer', displayName + ' (me)']);
});

$(document).bind('entered.muc', function (event, jid, info, pres) {
    console.log('entered', jid, info);
    if (info.isFocus)
    {
        focusJid = jid;
        console.info("Ignore focus: " + jid +", real JID: " + info.jid);
        // We don't want this notification for the focus.
        // messageHandler.notify('Focus', 'connected', 'connected');
        return;
    }

    messageHandler.notify(info.displayName || 'Somebody',
        'connected',
        'connected');

    // Add Peer's container
    var id = $(pres).find('>userID').text();
    var email = $(pres).find('>email');
    if(email.length > 0) {
        id = email.text();
    }
    VideoLayout.ensurePeerContainerExists(jid,id);

    if(APIConnector.isEnabled() && APIConnector.isEventEnabled("participantJoined"))
    {
        APIConnector.triggerEvent("participantJoined",{jid: jid});
    }

    /*if (focus !== null) {
        // FIXME: this should prepare the video
        if (focus.confid === null) {
            console.log('make new conference with', jid);
            focus.makeConference(Object.keys(connection.emuc.members),
                function(error) {
                    connection.emuc.addBridgeIsDownToPresence();
                    connection.emuc.sendPresence();
                }
            );
            Toolbar.showRecordingButton(true);
        } else {
            console.log('invite', jid, 'into conference');
            focus.addNewParticipant(jid);
        }
    }*/
});

$(document).bind('left.muc', function (event, jid) {
    console.log('left.muc', jid);
    var displayName = $('#participant_' + Strophe.getResourceFromJid(jid) +
        '>.displayname').text();
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

    if(APIConnector.isEnabled() && APIConnector.isEventEnabled("participantLeft"))
    {
        APIConnector.triggerEvent("participantLeft",{jid: jid});
    }

    delete jid2Ssrc[jid];

    // Unlock large video
    if (focusedVideoInfo && focusedVideoInfo.jid === jid)
    {
        console.info("Focused video owner has left the conference");
        focusedVideoInfo = null;
    }

    connection.jingle.terminateByJid(jid);

    if (connection.emuc.getPrezi(jid)) {
        $(document).trigger('presentationremoved.muc',
                            [jid, connection.emuc.getPrezi(jid)]);
    }
});

$(document).bind('presence.muc', function (event, jid, info, pres) {

    //check if the video bridge is available
    if($(pres).find(">bridgeIsDown").length > 0 && !bridgeIsDown) {
        bridgeIsDown = true;
        messageHandler.showError("Error",
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
        messageHandler.showError("Error",
            "Jitsi Videobridge is currently unavailable. Please try again later!");
    }

    var id = $(pres).find('>userID').text();
    var email = $(pres).find('>email');
    if(email.length > 0) {
        id = email.text();
    }
    Avatar.setUserAvatar(jid, id);

});

$(document).bind('presence.status.muc', function (event, jid, info, pres) {

    VideoLayout.setPresenceStatus(
        'participant_' + Strophe.getResourceFromJid(jid), info.status);

});

$(document).bind('kicked.muc', function (event, jid) {
    console.info(jid + " has been kicked from MUC!");
    if (connection.emuc.myroomjid === jid) {
        sessionTerminated = true;
        disposeConference(false);
        connection.emuc.doLeave();
        messageHandler.openMessageDialog("Session Terminated",
            "Ouch! You have been kicked out of the meet!");
    }
});

$(document).bind('passwordrequired.muc', function (event, jid) {
    console.log('on password required', jid);

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
                    setSharedKey(lockKey.value);
                    connection.emuc.doJoin(jid, lockKey.value);
                }
            }
        }
    );
});

$(document).bind('passwordrequired.main', function (event) {
    console.log('password is required');

    messageHandler.openTwoButtonDialog(null,
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

function toggleVideo() {
    buttonClick("#video", "icon-camera icon-camera-disabled");
    if (!(connection && connection.jingle.localVideo))
        return;

    var sess = getConferenceHandler();
    if (sess) {
        sess.toggleVideoMute(
            function (isMuted) {
                if (isMuted) {
                    $('#video').removeClass("icon-camera");
                    $('#video').addClass("icon-camera icon-camera-disabled");
                } else {
                    $('#video').removeClass("icon-camera icon-camera-disabled");
                    $('#video').addClass("icon-camera");
                }
                connection.emuc.addVideoInfoToPresence(isMuted);
                connection.emuc.sendPresence();
            }
        );
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
    VideoLayout.showLocalAudioIndicator(mute);

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

// Starts or stops the recording for the conference.
function toggleRecording() {
    Recording.toggleRecording();
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

$(document).ready(function () {
    document.title = interfaceConfig.APP_NAME;
    if(APIConnector.isEnabled())
        APIConnector.init();

    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled
                || window.localStorage.welcomePageDisabled == "false"))
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
            update_roomname();
        }

        $("#disable_welcome").click(function () {
            window.localStorage.welcomePageDisabled
                = $("#disable_welcome").is(":checked");
        });

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
    Chat.init();

    $('body').popover({ selector: '[data-toggle=popover]',
        trigger: 'click hover',
        content: function() {
            return this.getAttribute("content") +
                   KeyboardShortcut.getShortcut(this.getAttribute("shortcut"));
        }
    });

    Moderator.init();

    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});

    // Set default desktop sharing method
    setDesktopSharing(config.desktopSharing);
    // Initialize Chrome extension inline installs
    if (config.chromeExtensionId) {
        initInlineInstalls();
    }

    // By default we use camera
    getVideoSize = getCameraVideoSize;
    getVideoPosition = getCameraVideoPosition;

    VideoLayout.resizeLargeVideoContainer();
    $(window).resize(function () {
        VideoLayout.resizeLargeVideoContainer();
        VideoLayout.positionLarge();
    });
    // Listen for large video size updates
    document.getElementById('largeVideo')
        .addEventListener('loadedmetadata', function (e) {
            currentVideoWidth = this.videoWidth;
            currentVideoHeight = this.videoHeight;
            VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
        });

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
    })

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
    stopRTPStatsCollector();
    if(onUnload) {
        stopLocalRtpStatsCollector();
    }
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

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    if (lock)
        connection.emuc.lockRoom(sharedKey);
    else
        connection.emuc.lockRoom('');
}

/**
 * Sets the shared key.
 */
function setSharedKey(sKey) {
    sharedKey = sKey;
}

/**
 * Updates the room invite url.
 */
function updateRoomUrl(newRoomUrl) {
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
 * Warning to the user that the conference window is about to be closed.
 */
function closePageWarning() {
    /*
    FIXME: do we need a warning when the focus is a server-side one now ?
    if (focus !== null)
        return "You are the owner of this conference call and"
                + " you are about to end it.";
    else*/
    return "You are about to leave this conversation.";
}

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

        if (isFullScreen) {
            setView("fullscreen");
        }
        else {
            setView("default");
        }
    }
);

/**
 * Sets the current view.
 */
function setView(viewName) {
//    if (viewName == "fullscreen") {
//        document.getElementById('videolayout_fullscreen').disabled  = false;
//        document.getElementById('videolayout_default').disabled  = true;
//    }
//    else {
//        document.getElementById('videolayout_default').disabled  = false;
//        document.getElementById('videolayout_fullscreen').disabled  = true;
//    }
}

$(document).bind('error.jingle',
    function (event, session, error)
    {
        console.error("Jingle error", error);
    }
);

$(document).bind('fatalError.jingle',
    function (event, session, error)
    {
        sessionTerminated = true;
        connection.emuc.doLeave();
        messageHandler.showError(  "Sorry",
            "Internal application error[setRemoteDescription]");
    }
);

function onSelectedEndpointChanged(userJid)
{
    console.log('selected endpoint changed: ', userJid);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'SelectedEndpointChangedEvent',
                    'selectedEndpoint': (!userJid || userJid == null)
                        ? null : userJid
                }));

                return true;
            }
        });
    }
}

$(document).bind("selectedendpointchanged", function(event, userJid) {
    onSelectedEndpointChanged(userJid);
});

function onPinnedEndpointChanged(userJid)
{
    console.log('pinned endpoint changed: ', userJid);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'PinnedEndpointChangedEvent',
                    'pinnedEndpoint': (!userJid || userJid == null)
                        ? null : Strophe.getResourceFromJid(userJid)
                }));

                return true;
            }
        });
    }
}

$(document).bind("pinnedendpointchanged", function(event, userJid) {
    onPinnedEndpointChanged(userJid);
});

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
                    connection.rayo.dial(
                        numberInput.value, 'fromnumber', roomName);
                }
            }
        },
        function (event) {
            document.getElementById('sipNumber').focus();
        }
    );
}

function hangup() {
    disposeConference();
    sessionTerminated = true;
    connection.emuc.doLeave();
    if(config.enableWelcomePage)
    {
        setTimeout(function()
        {
            window.localStorage.welcomePageDisabled = false;
            window.location.pathname = "/";
        }, 10000);

    }

    $.prompt("Session Terminated",
        {
            title: "You hung up the call",
            persistent: true,
            buttons: {
                "Join again": true
            },
            closeText: '',
            submit: function(event, value, message, formVals)
            {
                window.location.reload();
                return false;
            }

        }
    );

}

$(document).on('videomuted.muc', function(event, jid, value) {
    if(mediaStreams[jid] && mediaStreams[jid][MediaStream.VIDEO_TYPE]) {
        var stream = mediaStreams[jid][MediaStream.VIDEO_TYPE];
        var isMuted = (value === "true");
        if (isMuted != stream.muted) {
            stream.muted = isMuted;
            Avatar.showUserAvatar(jid, isMuted);
        }
    }
});
