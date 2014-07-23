/* jshint -W117 */
/* application specific logic */
var connection = null;
var focus = null;
var activecall = null;
var RTC = null;
var nickname = null;
var sharedKey = '';
var recordingToken ='';
var roomUrl = null;
var ssrc2jid = {};
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
var videoSrcToSsrc = {};
/**
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoSrc = null;
var mutedAudios = {};

var localVideoSrc = null;
var flipXLocalVideo = true;
var isFullScreen = false;
var toolbarTimeout = null;
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
    RTC = setupRTC();
    if (RTC === null) {
        window.location.href = 'webrtcrequired.html';
        return;
    } else if (RTC.browser !== 'chrome') {
        window.location.href = 'chromeonly.html';
        return;
    }

    connection = new Strophe.Connection(document.getElementById('boshURL').value || config.bosh || '/http-bind');

    if (nickname) {
        connection.emuc.addDisplayNameToPresence(nickname);
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

    var jid = document.getElementById('jid').value || config.hosts.domain || window.location.hostname;

    connection.connect(jid, document.getElementById('password').value, function (status) {
        if (status === Strophe.Status.CONNECTED) {
            console.log('connected');
            if (config.useStunTurn) {
                connection.jingle.getStunAndTurnCredentials();
            }
            obtainAudioAndVideoPermissions(function () {
                getUserMediaWithConstraints(['audio'], audioStreamReady,
                    function (error) {
                        console.error('failed to obtain audio stream - stop', error);
                    });
            });

            document.getElementById('connect').disabled = true;
        } else {
            console.log('status', status);
        }
    });
}

/**
 * HTTPS only:
 * We first ask for audio and video combined stream in order to get permissions and not to ask twice.
 * Then we dispose the stream and continue with separate audio, video streams(required for desktop sharing).
 */
function obtainAudioAndVideoPermissions(callback) {
    // This makes sense only on https sites otherwise we'll be asked for permissions every time
    if (location.protocol !== 'https:') {
        callback();
        return;
    }
    // Get AV
    getUserMediaWithConstraints(
        ['audio', 'video'],
        function (avStream) {
            avStream.stop();
            callback();
        },
        function (error) {
            console.error('failed to obtain audio/video stream - stop', error);
        });
}

function audioStreamReady(stream) {

    VideoLayout.changeLocalAudio(stream);

    startLocalRtpStatsCollector(stream);

    if (RTC.browser !== 'firefox') {
        getUserMediaWithConstraints(['video'],
                                    videoStreamReady,
                                    videoStreamFailed,
                                    config.resolution || '360');
    } else {
        doJoin();
    }
}

function videoStreamReady(stream) {
    VideoLayout.changeLocalVideo(stream, true);

    doJoin();
}

function videoStreamFailed(error) {
    console.warn("Failed to obtain video stream - continue anyway", error);

    doJoin();
}

function doJoin() {
    var roomnode = null;
    var path = window.location.pathname;
    var roomjid;

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
            roomnode = Math.random().toString(36).substr(2, 20);
            window.history.pushState('VideoChat',
                    'Room: ' + roomnode, window.location.pathname + roomnode);
        }
    }

    roomjid = roomnode + '@' + config.hosts.muc;

    if (config.useNicks) {
        var nick = window.prompt('Your nickname (optional)');
        if (nick) {
            roomjid += '/' + nick;
        } else {
            roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
        }
    } else {
        roomjid += '/' + Strophe.getNodeFromJid(connection.jid).substr(0, 8);
    }
    connection.emuc.doJoin(roomjid);
}

$(document).bind('remotestreamadded.jingle', function (event, data, sid) {
    function waitForRemoteVideo(selector, sid, ssrc) {
        if (selector.removed) {
            console.warn("media removed before had started", selector);
            return;
        }
        var sess = connection.jingle.sessions[sid];
        if (data.stream.id === 'mixedmslabel') return;
        var videoTracks = data.stream.getVideoTracks();
//        console.log("waiting..", videoTracks, selector[0]);

        if (videoTracks.length === 0 || selector[0].currentTime > 0) {
            RTC.attachMediaStream(selector, data.stream); // FIXME: why do i have to do this for FF?

            // FIXME: add a class that will associate peer Jid, video.src, it's ssrc and video type
            //        in order to get rid of too many maps
            if (ssrc) {
                videoSrcToSsrc[sel.attr('src')] = ssrc;
            } else {
                console.warn("No ssrc given for video", sel);
            }

            $(document).trigger('callactive.jingle', [selector, sid]);
            console.log('waitForremotevideo', sess.peerconnection.iceConnectionState, sess.peerconnection.signalingState);
        } else {
            setTimeout(function () { waitForRemoteVideo(selector, sid, ssrc); }, 250);
        }
    }
    var sess = connection.jingle.sessions[sid];

    var thessrc;
    // look up an associated JID for a stream id
    if (data.stream.id.indexOf('mixedmslabel') === -1) {
        var ssrclines = SDPUtil.find_lines(sess.peerconnection.remoteDescription.sdp, 'a=ssrc');
        ssrclines = ssrclines.filter(function (line) {
            return line.indexOf('mslabel:' + data.stream.label) !== -1;
        });
        if (ssrclines.length) {
            thessrc = ssrclines[0].substring(7).split(' ')[0];
            // ok to overwrite the one from focus? might save work in colibri.js
            console.log('associated jid', ssrc2jid[thessrc], data.peerjid);
            if (ssrc2jid[thessrc]) {
                data.peerjid = ssrc2jid[thessrc];
            }
        }
    }

    var container;
    var remotes = document.getElementById('remoteVideos');

    if (data.peerjid) {
        VideoLayout.ensurePeerContainerExists(data.peerjid);
        container  = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(data.peerjid));
    } else {
        if (data.stream.id !== 'mixedmslabel') {
            console.error(  'can not associate stream',
                            data.stream.id,
                            'with a participant');
            // We don't want to add it here since it will cause troubles
            return;
        }
        // FIXME: for the mixed ms we dont need a video -- currently
        container = document.createElement('span');
        container.className = 'videocontainer';
        remotes.appendChild(container);
        Util.playSoundNotification('userJoined');
    }

    var isVideo = data.stream.getVideoTracks().length > 0;
    var vid = isVideo ? document.createElement('video') : document.createElement('audio');
    var id = (isVideo ? 'remoteVideo_' : 'remoteAudio_') + sid + '_' + data.stream.id;

    vid.id = id;
    vid.autoplay = true;
    vid.oncontextmenu = function () { return false; };

    container.appendChild(vid);

    // TODO: make mixedstream display:none via css?
    if (id.indexOf('mixedmslabel') !== -1) {
        container.id = 'mixedstream';
        $(container).hide();
    }

    var sel = $('#' + id);
    sel.hide();
    RTC.attachMediaStream(sel, data.stream);

    if (isVideo) {
        waitForRemoteVideo(sel, sid, thessrc);
    }

    data.stream.onended = function () {
        console.log('stream ended', this.id);

        // Mark video as removed to cancel waiting loop(if video is removed before has started)
        sel.removed = true;
        sel.remove();

        var audioCount = $('#' + container.id + '>audio').length;
        var videoCount = $('#' + container.id + '>video').length;
        if (!audioCount && !videoCount) {
            console.log("Remove whole user", container.id);
            // Remove whole container
            container.remove();
            Util.playSoundNotification('userLeft');
            VideoLayout.resizeThumbnails();
        }

        VideoLayout.checkChangeLargeVideo(vid.src);
    };

    // Add click handler.
    container.onclick = function (event) {
        /*
         * FIXME It turns out that videoThumb may not exist (if there is no
         * actual video).
         */
        var videoThumb = $('#' + container.id + '>video').get(0);

        if (videoThumb)
            VideoLayout.handleVideoThumbClicked(videoThumb.src);

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
                videoSrc = $('#' + container.id + '>video').get(0).src;
            }

            // If the video has been "pinned" by the user we want to keep the
            // display name on place.
            if (!VideoLayout.isLargeVideoVisible()
                    || videoSrc !== $('#largeVideo').attr('src'))
                VideoLayout.showDisplayName(container.id, false);
        }
    );

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
});

/**
 * Returns the JID of the user to whom given <tt>videoSrc</tt> belongs.
 * @param videoSrc the video "src" identifier.
 * @returns {null | String} the JID of the user to whom given <tt>videoSrc</tt>
 *                   belongs.
 */
function getJidFromVideoSrc(videoSrc)
{
    if (videoSrc === localVideoSrc)
        return connection.emuc.myroomjid;

    var ssrc = videoSrcToSsrc[videoSrc];
    if (!ssrc)
    {
        return null;
    }
    return ssrc2jid[ssrc];
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
                        }
                    );
                },
                function (error) {
                    console.log('triggerKeyframe createAnswer failed', error);
                }
            );
        },
        function (error) {
            console.log('triggerKeyframe setRemoteDescription failed', error);
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
                        }
                    );
                },
                function (error) {
                    console.log(error);
                }
            );
        },
        function (error) {
            console.log('muteVideo SRD error');
        }
    );
}

/**
 * Callback called by {@link StatsCollector} in intervals supplied to it's
 * constructor.
 * @param statsCollector {@link StatsCollector} source of the event.
 */
function statsUpdated(statsCollector)
{
    Object.keys(statsCollector.jid2stats).forEach(function (jid)
    {
        var peerStats = statsCollector.jid2stats[jid];
        Object.keys(peerStats.ssrc2AudioLevel).forEach(function (ssrc)
        {
            if (jid !== connection.emuc.myRoomJid)
                AudioLevels.updateAudioLevel(   Strophe.getResourceFromJid(jid),
                                                peerStats.ssrc2AudioLevel[ssrc]);
        });
    });
}

/**
 * Callback called by {@link LocalStatsCollector} in intervals supplied to it's
 * constructor.
 * @param statsCollector {@link LocalStatsCollector} source of the event.
 */
function localStatsUpdated(statsCollector)
{
    if (connection.emuc.myRoomJid)
        AudioLevels.updateAudioLevel(
                Strophe.getResourceFromJid(connection.emuc.myRoomJid),
                statsCollector.audioLevel);
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
            getConferenceHandler().peerconnection, 200, statsUpdated);

        stopLocalRtpStatsCollector();

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
        localStatsCollector = new LocalStatsCollector(stream, 200, localStatsUpdated);
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

$(document).bind('callactive.jingle', function (event, videoelem, sid) {
    if (videoelem.attr('id').indexOf('mixedmslabel') === -1) {
        // ignore mixedmslabela0 and v0
        videoelem.show();
        VideoLayout.resizeThumbnails();

        // Update the large video to the last added video only if there's no
        // current active or focused speaker.
        if (!focusedVideoSrc && !VideoLayout.getDominantSpeakerResourceJid())
            VideoLayout.updateLargeVideo(videoelem.attr('src'), 1);

        VideoLayout.showFocusIndicator();
    }
});

$(document).bind('callterminated.jingle', function (event, sid, jid, reason) {
    // Leave the room if my call has been remotely terminated.
    if (connection.emuc.joined && focus == null && reason === 'kick') {
        sessionTerminated = true;
        connection.emuc.doLeave();
        openMessageDialog(  "Session Terminated",
                            "Ouch! You have been kicked out of the meet!");
    }
});

$(document).bind('setLocalDescription.jingle', function (event, sid) {
    // put our ssrcs into presence so other clients can identify our stream
    var sess = connection.jingle.sessions[sid];
    var newssrcs = {};
    var directions = {};
    var localSDP = new SDP(sess.peerconnection.localDescription.sdp);
    localSDP.media.forEach(function (media) {
        var type = SDPUtil.parse_mid(SDPUtil.find_line(media, 'a=mid:'));

        if (SDPUtil.find_line(media, 'a=ssrc:')) {
            // assumes a single local ssrc
            var ssrc = SDPUtil.find_line(media, 'a=ssrc:').substring(7).split(' ')[0];
            newssrcs[type] = ssrc;

            directions[type] = (
                SDPUtil.find_line(media, 'a=sendrecv') ||
                SDPUtil.find_line(media, 'a=recvonly') ||
                SDPUtil.find_line(media, 'a=sendonly') ||
                SDPUtil.find_line(media, 'a=inactive') ||
                'a=sendrecv').substr(2);
        }
    });
    console.log('new ssrcs', newssrcs);

    // Have to clear presence map to get rid of removed streams
    connection.emuc.clearPresenceMedia();
    var i = 0;
    Object.keys(newssrcs).forEach(function (mtype) {
        i++;
        var type = mtype;
        // Change video type to screen
        if (mtype === 'video' && isUsingScreenStream) {
            type = 'screen';
        }
        connection.emuc.addMediaToPresence(i, type, newssrcs[mtype], directions[mtype]);
    });
    if (i > 0) {
        connection.emuc.sendPresence();
    }
});

$(document).bind('joined.muc', function (event, jid, info) {
    updateRoomUrl(window.location.href);
    document.getElementById('localNick').appendChild(
        document.createTextNode(Strophe.getResourceFromJid(jid) + ' (me)')
    );

    if (Object.keys(connection.emuc.members).length < 1) {
        focus = new ColibriFocus(connection, config.hosts.bridge);
        if (nickname !== null) {
            focus.setEndpointDisplayName(connection.emuc.myroomjid,
                                         nickname);
        }
        Toolbar.showRecordingButton(false);
    }

    if (focus && config.etherpad_base) {
        Etherpad.init();
    }

    VideoLayout.showFocusIndicator();

    // Once we've joined the muc show the toolbar
    Toolbar.showToolbar();

    var displayName = '';
    if (info.displayName)
        displayName = info.displayName + ' (me)';

    VideoLayout.setDisplayName('localVideoContainer', displayName);
});

$(document).bind('entered.muc', function (event, jid, info, pres) {
    console.log('entered', jid, info);

    console.log('is focus?' + focus ? 'true' : 'false');

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid);

    if (focus !== null) {
        // FIXME: this should prepare the video
        if (focus.confid === null) {
            console.log('make new conference with', jid);
            focus.makeConference(Object.keys(connection.emuc.members));
            Toolbar.showRecordingButton(true);
        } else {
            console.log('invite', jid, 'into conference');
            focus.addNewParticipant(jid);
        }
    }
    else if (sharedKey) {
        Toolbar.updateLockButton();
    }
});

$(document).bind('left.muc', function (event, jid) {
    console.log('left.muc', jid);
    // Need to call this with a slight delay, otherwise the element couldn't be
    // found for some reason.
    window.setTimeout(function () {
        var container = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(jid));
        if (container) {
            // hide here, wait for video to close before removing
            $(container).hide();
            VideoLayout.resizeThumbnails();
        }
    }, 10);

    // Unlock large video
    if (focusedVideoSrc)
    {
        if (getJidFromVideoSrc(focusedVideoSrc) === jid)
        {
            console.info("Focused video owner has left the conference");
            focusedVideoSrc = null;
        }
    }

    connection.jingle.terminateByJid(jid);

    if (focus == null
            // I shouldn't be the one that left to enter here.
            && jid !== connection.emuc.myroomjid
            && connection.emuc.myroomjid === connection.emuc.list_members[0]
            // If our session has been terminated for some reason
            // (kicked, hangup), don't try to become the focus
            && !sessionTerminated) {
        console.log('welcome to our new focus... myself');
        focus = new ColibriFocus(connection, config.hosts.bridge);
        if (nickname !== null) {
            focus.setEndpointDisplayName(connection.emuc.myroomjid,
                                         nickname);
        }

        if (Object.keys(connection.emuc.members).length > 0) {
            focus.makeConference(Object.keys(connection.emuc.members));
            Toolbar.showRecordingButton(true);
        }
        $(document).trigger('focusechanged.muc', [focus]);
    }
    else if (focus && Object.keys(connection.emuc.members).length === 0) {
        console.log('everyone left');
        // FIXME: closing the connection is a hack to avoid some
        // problems with reinit
        disposeConference();
        focus = new ColibriFocus(connection, config.hosts.bridge);
        if (nickname !== null) {
            focus.setEndpointDisplayName(connection.emuc.myroomjid,
                                         nickname);
        }
        Toolbar.showRecordingButton(false);
    }
    if (connection.emuc.getPrezi(jid)) {
        $(document).trigger('presentationremoved.muc',
                            [jid, connection.emuc.getPrezi(jid)]);
    }
});

$(document).bind('presence.muc', function (event, jid, info, pres) {

    // Remove old ssrcs coming from the jid
    Object.keys(ssrc2jid).forEach(function (ssrc) {
        if (ssrc2jid[ssrc] == jid) {
            delete ssrc2jid[ssrc];
        }
        if (ssrc2videoType[ssrc] == jid) {
            delete ssrc2videoType[ssrc];
        }
    });

    $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
        //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
        var ssrcV = ssrc.getAttribute('ssrc');
        ssrc2jid[ssrcV] = jid;

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
                //VideoLayout.checkChangeLargeVideo(el);
                break;
            }
        }
    });

    if (jid === connection.emuc.myroomjid) {
        VideoLayout.setDisplayName('localVideoContainer',
                                    info.displayName);
    } else {
        VideoLayout.ensurePeerContainerExists(jid);
        VideoLayout.setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
                info.displayName);
    }

    if (focus !== null && info.displayName !== null) {
        focus.setEndpointDisplayName(jid, info.displayName);
    }
});

$(document).bind('passwordrequired.muc', function (event, jid) {
    console.log('on password required', jid);

    $.prompt('<h2>Password required</h2>' +
        '<input id="lockKey" type="text" placeholder="shared key" autofocus>', {
        persistent: true,
        buttons: { "Ok": true, "Cancel": false},
        defaultButton: 1,
        loaded: function (event) {
            document.getElementById('lockKey').focus();
        },
        submit: function (e, v, m, f) {
            if (v) {
                var lockKey = document.getElementById('lockKey');

                if (lockKey.value !== null) {
                    setSharedKey(lockKey.value);
                    connection.emuc.doJoin(jid, lockKey.value);
                }
            }
        }
    });
});

/**
 * Checks if video identified by given src is desktop stream.
 * @param videoSrc eg.
 * blob:https%3A//pawel.jitsi.net/9a46e0bd-131e-4d18-9c14-a9264e8db395
 * @returns {boolean}
 */
function isVideoSrcDesktop(videoSrc) {
    // FIXME: fix this mapping mess...
    // figure out if large video is desktop stream or just a camera
    var isDesktop = false;
    if (localVideoSrc === videoSrc) {
        // local video
        isDesktop = isUsingScreenStream;
    } else {
        // Do we have associations...
        var videoSsrc = videoSrcToSsrc[videoSrc];
        if (videoSsrc) {
            var videoType = ssrc2videoType[videoSsrc];
            if (videoType) {
                // Finally there...
                isDesktop = videoType === 'screen';
            } else {
                console.error("No video type for ssrc: " + videoSsrc);
            }
        } else {
            console.error("No ssrc for src: " + videoSrc);
        }
    }
    return isDesktop;
}

function getConferenceHandler() {
    return focus ? focus : activecall;
}

function toggleVideo() {
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
            }
        );
    }

    sess = focus || activecall;
    if (!sess) {
        return;
    }

    sess.pendingop = ismuted ? 'unmute' : 'mute';
//    connection.emuc.addVideoInfoToPresence(!ismuted);
//    connection.emuc.sendPresence();

    sess.modifySources();
}

/**
 * Mutes / unmutes audio for the local participant.
 */
function toggleAudio() {
    if (!(connection && connection.jingle.localAudio)) {
        preMuted = true;
        // We still click the button.
        buttonClick("#mute", "icon-microphone icon-mic-disabled");
        return;
    }

    var localAudio = connection.jingle.localAudio;
    for (var idx = 0; idx < localAudio.getAudioTracks().length; idx++) {
        var audioEnabled = localAudio.getAudioTracks()[idx].enabled;

        localAudio.getAudioTracks()[idx].enabled = !audioEnabled;
        // isMuted is the opposite of audioEnabled
        connection.emuc.addAudioInfoToPresence(audioEnabled);
        connection.emuc.sendPresence();
    }

    buttonClick("#mute", "icon-microphone icon-mic-disabled");
}

// Starts or stops the recording for the conference.
function toggleRecording() {
    if (focus === null || focus.confid === null) {
        console.log('non-focus, or conference not yet organized: not enabling recording');
        return;
    }

    if (!recordingToken)
    {
        $.prompt('<h2>Enter recording token</h2>' +
                '<input id="recordingToken" type="text" placeholder="token" autofocus>',
            {
                persistent: false,
                buttons: { "Save": true, "Cancel": false},
                defaultButton: 1,
                loaded: function (event) {
                    document.getElementById('recordingToken').focus();
                },
                submit: function (e, v, m, f) {
                    if (v) {
                        var token = document.getElementById('recordingToken');

                        if (token.value) {
                            setRecordingToken(Util.escapeHtml(token.value));
                            toggleRecording();
                        }
                    }
                }
            }
        );

        return;
    }

    var oldState = focus.recordingEnabled;
    Toolbar.toggleRecordingButtonState();
    focus.setRecording(!oldState,
                        recordingToken,
                        function (state) {
                            console.log("New recording state: ", state);
                            if (state == oldState) //failed to change, reset the token because it might have been wrong
                            {
                                Toolbar.toggleRecordingButtonState();
                                setRecordingToken(null);
                            }
                        }
    );


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
    Chat.init();

    $('body').popover({ selector: '[data-toggle=popover]',
                        trigger: 'click hover'});

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
            data: "<body rid='" + (connection.rid || connection._proto.rid) + "' xmlns='http://jabber.org/protocol/httpbind' sid='" + (connection.sid || connection._proto.sid) + "' type='terminate'><presence xmlns='jabber:client' type='unavailable'/></body>",
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
});

function disposeConference(onUnload) {
    var handler = getConferenceHandler();
    if (handler && handler.peerconnection) {
        // FIXME: probably removing streams is not required and close() should be enough
        if (connection.jingle.localAudio) {
            handler.peerconnection.removeStream(connection.jingle.localAudio);
        }
        if (connection.jingle.localVideo) {
            handler.peerconnection.removeStream(connection.jingle.localVideo);
        }
        handler.peerconnection.close();
    }
    stopRTPStatsCollector();
    if(!onUnload) {
        startLocalRtpStatsCollector(connection.jingle.localAudio);
    }
    else
    {
        stopLocalRtpStatsCollector();
    }
    focus = null;
    activecall = null;
}

function dump(elem, filename) {
    elem = elem.parentNode;
    elem.download = filename || 'meetlog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
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
    metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    if (connection.logger) {
        metadata.xmpp = connection.logger.log;
    }
    data.metadata = metadata;
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}

/**
 * Changes the style class of the element given by id.
 */
function buttonClick(id, classname) {
    $(id).toggleClass(classname); // add the class to the clicked element
}

/**
 * Shows a message to the user.
 *
 * @param titleString the title of the message
 * @param messageString the text of the message
 */
function openMessageDialog(titleString, messageString) {
    $.prompt(messageString,
        {
            title: titleString,
            persistent: false
        }
    );
}

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    if (lock)
        connection.emuc.lockRoom(sharedKey);
    else
        connection.emuc.lockRoom('');

    Toolbar.updateLockButton();
}

/**
 * Sets the shared key.
 */
function setSharedKey(sKey) {
    sharedKey = sKey;
}

function setRecordingToken(token) {
    recordingToken = token;
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
    if (focus !== null)
        return "You are the owner of this conference call and"
                + " you are about to end it.";
    else
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



$(document).bind('fatalError.jingle',
    function (event, session, error)
    {
        sessionTerminated = true;
        connection.emuc.doLeave();
        openMessageDialog(  "Sorry",
            "Your browser version is too old. Please update and try again...");
    }
);
