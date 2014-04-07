/* jshint -W117 */
/* application specific logic */
var connection = null;
var focus = null;
var activecall = null;
var RTC = null;
var nickname = null;
var sharedKey = '';
var roomUrl = null;
var ssrc2jid = {};

/**
 * Indicates whether ssrc is camera video or desktop stream.
 * FIXME: remove those maps
 */
var ssrc2videoType = {};
var videoSrcToSsrc = {};

var localVideoSrc = null;
var flipXLocalVideo = true;
var isFullScreen = false;
var toolbarTimeout = null;
var currentVideoWidth = null;
var currentVideoHeight = null;
/**
 * Method used to calculate large video size.
 * @type {function()}
 */
var getVideoSize;
/**
 * Method used to get large video position.
 * @type {function()}
 */
var getVideoPosition;

/* window.onbeforeunload = closePageWarning; */

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
            obtainAudioAndVideoPermissions(function(){
                getUserMediaWithConstraints( ['audio'], audioStreamReady,
                    function(error){
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
function obtainAudioAndVideoPermissions(callback){
    // This makes sense only on https sites otherwise we'll be asked for permissions every time
    if(location.protocol !== 'https:') {
        callback();
        return;
    }
    // Get AV
    getUserMediaWithConstraints(
        ['audio', 'video'],
        function(avStream) {
            avStream.stop();
            callback();
        },
        function(error){
            console.error('failed to obtain audio/video stream - stop', error);
        });
}

function audioStreamReady(stream) {

    change_local_audio(stream);

    if(RTC.browser !== 'firefox') {
        getUserMediaWithConstraints( ['video'], videoStreamReady, videoStreamFailed, config.resolution || '360' );
    } else {
        doJoin();
    }
}

function videoStreamReady(stream) {

    change_local_video(stream, true);

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
        roomjid += '/' + Strophe.getNodeFromJid(connection.jid).substr(0,8);
    }
    connection.emuc.doJoin(roomjid);
}

function change_local_audio(stream) {
    connection.jingle.localAudio = stream;
    RTC.attachMediaStream($('#localAudio'), stream);
    document.getElementById('localAudio').autoplay = true;
    document.getElementById('localAudio').volume = 0;
}

function change_local_video(stream, flipX) {

    connection.jingle.localVideo = stream;

    var localVideo = document.createElement('video');
    localVideo.id = 'localVideo_'+stream.id;
    localVideo.autoplay = true;
    localVideo.volume = 0; // is it required if audio is separated ?
    localVideo.oncontextmenu = function () { return false; };

    var localVideoContainer = document.getElementById('localVideoWrapper');
    localVideoContainer.appendChild(localVideo);

    var localVideoSelector = $('#' + localVideo.id);
    // Add click handler
    localVideoSelector.click(function () { handleVideoThumbClicked(localVideo.src); } );
    // Add stream ended handler
    stream.onended = function () {
        localVideoContainer.removeChild(localVideo);
        checkChangeLargeVideo(localVideo.src);
    };
    // Flip video x axis if needed
    flipXLocalVideo = flipX;
    if(flipX) {
        localVideoSelector.addClass("flipVideoX");
    }
    // Attach WebRTC stream
    RTC.attachMediaStream(localVideoSelector, stream);

    localVideoSrc = localVideo.src;
    updateLargeVideo(localVideoSrc, 0);
}

$(document).bind('remotestreamadded.jingle', function (event, data, sid) {
    function waitForRemoteVideo(selector, sid, ssrc) {
        if(selector.removed) {
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
            if(ssrc) {
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
        container  = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(data.peerjid));
        if (!container) {
            console.error('no container for', data.peerjid);
        } else {
            //console.log('found container for', data.peerjid);
        }
    } else {
        if (data.stream.id !== 'mixedmslabel') {
            console.error('can not associate stream', data.stream.id, 'with a participant');
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

    if(isVideo) {
        waitForRemoteVideo(sel, sid, thessrc);
    }

    data.stream.onended = function () {
        console.log('stream ended', this.id);

        // Mark video as removed to cancel waiting loop(if video is removed before has started)
        sel.removed = true;
        sel.remove();

        var audioCount = $('#'+container.id+'>audio').length;
        var videoCount = $('#'+container.id+'>video').length;
        if(!audioCount && !videoCount) {
            console.log("Remove whole user");
            // Remove whole container
            container.remove();
            Util.playSoundNotification('userLeft');
            resizeThumbnails();
        }

        checkChangeLargeVideo(vid.src);
    };

    // Add click handler
    sel.click(function () { handleVideoThumbClicked(vid.src); });

    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (isVideo
        && data.peerjid && sess.peerjid === data.peerjid &&
           data.stream.getVideoTracks().length === 0 &&
           connection.jingle.localVideo.getVideoTracks().length > 0) {
        window.setTimeout(function() {
            sendKeyframe(sess.peerconnection);
        }, 3000);
    }
});

function handleVideoThumbClicked(videoSrc) {

    $(document).trigger("video.selected", [false]);

    updateLargeVideo(videoSrc, 1);

    $('audio').each(function (idx, el) {
        if (el.id.indexOf('mixedmslabel') !== -1) {
            el.volume = 0;
            el.volume = 1;
        }
    });
}

/**
 * Checks if removed video is currently displayed and tries to display another one instead.
 * @param removedVideoSrc src stream identifier of the video.
 */
function checkChangeLargeVideo(removedVideoSrc){
    if (removedVideoSrc === $('#largeVideo').attr('src')) {
        // this is currently displayed as large
        // pick the last visible video in the row
        // if nobody else is left, this picks the local video
        var pick = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video').get(0);

        if(!pick) {
            console.info("Last visible video no longer exists");
            pick = $('#remoteVideos>span[id!="mixedstream"]>video').get(0);
            if(!pick) {
                // Try local video
                console.info("Fallback to local video...");
                pick = $('#remoteVideos>span>span>video').get(0);
            }
        }

        // mute if localvideo
        if (pick) {
            updateLargeVideo(pick.src, pick.volume);
        } else {
            console.warn("Failed to elect large video");
        }
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
                    pc.setLocalDescription(modifiedAnswer,
                        function () {
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

// really mute video, i.e. dont even send black frames
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
                        function(error) {
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

$(document).bind('callincoming.jingle', function (event, sid) {
    var sess = connection.jingle.sessions[sid];

    // TODO: do we check activecall == null?
    activecall = sess;

    // TODO: check affiliation and/or role
    console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
    sess.usedrip = true; // not-so-naive trickle ice
    sess.sendAnswer();
    sess.accept();

});

$(document).bind('callactive.jingle', function (event, videoelem, sid) {
    if (videoelem.attr('id').indexOf('mixedmslabel') === -1) {
        // ignore mixedmslabela0 and v0
        videoelem.show();
        resizeThumbnails();

        updateLargeVideo(videoelem.attr('src'), 1);

        showFocusIndicator();
    }
});

$(document).bind('callterminated.jingle', function (event, sid, reason) {
    // FIXME
});

$(document).bind('setLocalDescription.jingle', function (event, sid) {
    // put our ssrcs into presence so other clients can identify our stream
    var sess = connection.jingle.sessions[sid];
    var newssrcs = {};
    var directions = {};
    var localSDP = new SDP(sess.peerconnection.localDescription.sdp);
    localSDP.media.forEach(function (media) {
        var type = SDPUtil.parse_mline(media.split('\r\n')[0]).media;

        if (SDPUtil.find_line(media, 'a=ssrc:')) {
            // assumes a single local ssrc
            var ssrc = SDPUtil.find_line(media, 'a=ssrc:').substring(7).split(' ')[0];
            newssrcs[type] = ssrc;

            directions[type] = (
                SDPUtil.find_line(media, 'a=sendrecv')
                || SDPUtil.find_line(media, 'a=recvonly')
                || SDPUtil.find_line('a=sendonly')
                || SDPUtil.find_line('a=inactive')
                || 'a=sendrecv' ).substr(2);
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
        if(mtype === 'video' && isUsingScreenStream) {
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
    }

    if (focus && config.etherpad_base) {
        Etherpad.init();
    }

    showFocusIndicator();

    // Once we've joined the muc show the toolbar
    showToolbar();

    var displayName = '';
    if (info.displayName)
        displayName = info.displayName + ' (me)';

    showDisplayName('localVideoContainer', displayName);
});

$(document).bind('entered.muc', function (event, jid, info, pres) {
    console.log('entered', jid, info);
    console.log('is focus?' + focus ? 'true' : 'false');

    // Add Peer's container
    ensurePeerContainerExists(jid);

    if (focus !== null) {
        // FIXME: this should prepare the video
        if (focus.confid === null) {
            console.log('make new conference with', jid);
            focus.makeConference(Object.keys(connection.emuc.members));
        } else {
            console.log('invite', jid, 'into conference');
            focus.addNewParticipant(jid);
        }
    }
    else if (sharedKey) {
        updateLockButton();
    }
});

$(document).bind('left.muc', function (event, jid) {
    console.log('left', jid);
    connection.jingle.terminateByJid(jid);
    var container = document.getElementById('participant_' + Strophe.getResourceFromJid(jid));
    if (container) {
        // hide here, wait for video to close before removing
        $(container).hide();
        resizeThumbnails();
    }
    if (focus === null && connection.emuc.myroomjid === connection.emuc.list_members[0]) {
        console.log('welcome to our new focus... myself');
        focus = new ColibriFocus(connection, config.hosts.bridge);
        if (Object.keys(connection.emuc.members).length > 0) {
            focus.makeConference(Object.keys(connection.emuc.members));
        }
        $(document).trigger('focusechanged.muc', [focus]);
    }
    else if (focus && Object.keys(connection.emuc.members).length === 0) {
        console.log('everyone left');
        // FIXME: closing the connection is a hack to avoid some
        // problemswith reinit
        disposeConference();
        focus = new ColibriFocus(connection, config.hosts.bridge);
    }
    if (connection.emuc.getPrezi(jid)) {
        $(document).trigger('presentationremoved.muc', [jid, connection.emuc.getPrezi(jid)]);
    }
});

$(document).bind('presence.muc', function (event, jid, info, pres) {

    // Remove old ssrcs coming from the jid
    Object.keys(ssrc2jid).forEach(function(ssrc){
       if(ssrc2jid[ssrc] == jid){
           delete ssrc2jid[ssrc];
       }
       if(ssrc2videoType == jid){
           delete  ssrc2videoType[ssrc];
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
            switch(ssrc.getAttribute('direction')) {
            case 'sendrecv':
                el.show();
                break;
            case 'recvonly':
                el.hide();
                // FIXME: Check if we have to change large video
                //checkChangeLargeVideo(el);
                break;
            }
        }
    });

    if (info.displayName) {
        if (jid === connection.emuc.myroomjid) {
            showDisplayName('localVideoContainer', info.displayName + ' (me)');
        } else {
            ensurePeerContainerExists(jid);
            showDisplayName('participant_' + Strophe.getResourceFromJid(jid), info.displayName);
        }
    }
});

$(document).bind('passwordrequired.muc', function (event, jid) {
    console.log('on password required', jid);

    $.prompt('<h2>Password required</h2>' +
            '<input id="lockKey" type="text" placeholder="shared key" autofocus>',
             {
                persistent: true,
                buttons: { "Ok": true , "Cancel": false},
                defaultButton: 1,
                loaded: function(event) {
                    document.getElementById('lockKey').focus();
                },
                submit: function(e,v,m,f){
                    if(v)
                    {
                        var lockKey = document.getElementById('lockKey');

                        if (lockKey.value !== null)
                        {
                            setSharedKey(lockKey.value);
                            connection.emuc.doJoin(jid, lockKey.value);
                        }
                    }
                }
            });
});

$(document).bind('audiomuted.muc', function (event, jid, isMuted) {
    var videoSpanId = null;
    if (jid === connection.emuc.myroomjid) {
        videoSpanId = 'localVideoContainer';
    } else {
        ensurePeerContainerExists(jid);
        videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
    }

    if (videoSpanId)
        showAudioIndicator(videoSpanId, isMuted);
});

$(document).bind('videomuted.muc', function (event, jid, isMuted) {
    var videoSpanId = null;
    if (jid === connection.emuc.myroomjid) {
        videoSpanId = 'localVideoContainer';
    } else {
        ensurePeerContainerExists(jid);
        videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
    }

    if (videoSpanId)
        showAudioIndicator(videoSpanId, isMuted);
});

/**
 * Updates the large video with the given new video source.
 */
function updateLargeVideo(newSrc, vol) {
    console.log('hover in', newSrc);

    if ($('#largeVideo').attr('src') != newSrc) {

        var isVisible = $('#largeVideo').is(':visible');

        $('#largeVideo').fadeOut(300, function () {
            $(this).attr('src', newSrc);

            // Screen stream is already rotated
            var flipX = (newSrc === localVideoSrc) && flipXLocalVideo;

            var videoTransform = document.getElementById('largeVideo').style.webkitTransform;
            if (flipX && videoTransform !== 'scaleX(-1)') {
                document.getElementById('largeVideo').style.webkitTransform = "scaleX(-1)";
            }
            else if (!flipX && videoTransform === 'scaleX(-1)') {
                document.getElementById('largeVideo').style.webkitTransform = "none";
            }

            // Change the way we'll be measuring and positioning large video
            var isDesktop = isVideoSrcDesktop(newSrc);
            getVideoSize = isDesktop ? getDesktopVideoSize : getCameraVideoSize;
            getVideoPosition = isDesktop ? getDesktopVideoPosition : getCameraVideoPosition;

            if (isVisible)
                $(this).fadeIn(300);
        });
    }
}

/**
 * Checks if video identified by given src is desktop stream.
 * @param videoSrc eg. blob:https%3A//pawel.jitsi.net/9a46e0bd-131e-4d18-9c14-a9264e8db395
 * @returns {boolean}
 */
function isVideoSrcDesktop(videoSrc){
    // FIXME: fix this mapping mess...
    // figure out if large video is desktop stream or just a camera
    var isDesktop = false;
    if(localVideoSrc === videoSrc) {
        // local video
        isDesktop = isUsingScreenStream;
    } else {
        // Do we have associations...
        var videoSsrc = videoSrcToSsrc[videoSrc];
        if(videoSsrc) {
            var videoType = ssrc2videoType[videoSsrc];
            if(videoType) {
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

/**
 * Shows/hides the large video.
 */
function setLargeVideoVisible(isVisible) {
    if (isVisible) {
        $('#largeVideo').css({visibility:'visible'});
        $('.watermark').css({visibility:'visible'});
    }
    else {
        $('#largeVideo').css({visibility:'hidden'});
        $('.watermark').css({visibility:'hidden'});
    }
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
            function(isMuted){
                if(isMuted) {
                    $('#video').removeClass("icon-camera");
                    $('#video').addClass("icon-camera icon-camera-disabled");
                } else {
                    $('#video').removeClass("icon-camera icon-camera-disabled");
                    $('#video').addClass("icon-camera");
                }
            }
        );
    }

    var sess = focus || activecall;
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
    if (!(connection && connection.jingle.localAudio))
        return;
    var localAudio = connection.jingle.localAudio;
    for (var idx = 0; idx < localAudio.getAudioTracks().length; idx++) {
        var audioEnabled = localAudio.getAudioTracks()[idx].enabled;

        localAudio.getAudioTracks()[idx].enabled = !audioEnabled;
        connection.emuc.addAudioInfoToPresence(audioEnabled); //isMuted is the opposite of audioEnabled
        connection.emuc.sendPresence();
    }
}

/**
 * Positions the large video.
 *
 * @param videoWidth the stream video width
 * @param videoHeight the stream video height
 */
var positionLarge = function(videoWidth, videoHeight) {
    var videoSpaceWidth = $('#videospace').width();
    var videoSpaceHeight = window.innerHeight;

    var videoSize = getVideoSize(   videoWidth,
                                    videoHeight,
                                    videoSpaceWidth,
                                    videoSpaceHeight);

    var largeVideoWidth = videoSize[0];
    var largeVideoHeight = videoSize[1];

    var videoPosition = getVideoPosition(   largeVideoWidth,
                                            largeVideoHeight,
                                            videoSpaceWidth,
                                            videoSpaceHeight);

    var horizontalIndent = videoPosition[0];
    var verticalIndent = videoPosition[1];

    positionVideo(  $('#largeVideo'),
                    largeVideoWidth,
                    largeVideoHeight,
                    horizontalIndent, verticalIndent);
};

/**
 * Returns an array of the video horizontal and vertical indents,
 * so that if fits its parent.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getCameraVideoPosition(   videoWidth,
                                   videoHeight,
                                   videoSpaceWidth,
                                   videoSpaceHeight) {
    // Parent height isn't completely calculated when we position the video in
    // full screen mode and this is why we use the screen height in this case.
    // Need to think it further at some point and implement it properly.
    var isFullScreen = document.fullScreen
                        || document.mozFullScreen
                        || document.webkitIsFullScreen; 
    if (isFullScreen)
        videoSpaceHeight = window.innerHeight;

    var horizontalIndent = (videoSpaceWidth - videoWidth)/2;
    var verticalIndent = (videoSpaceHeight - videoHeight)/2;

    return [horizontalIndent, verticalIndent];
}

/**
 * Returns an array of the video horizontal and vertical indents.
 * Centers horizontally and top aligns vertically.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getDesktopVideoPosition(  videoWidth,
                                   videoHeight,
                                   videoSpaceWidth,
                                   videoSpaceHeight) {

    var horizontalIndent = (videoSpaceWidth - videoWidth)/2;

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
        availableWidth = availableHeight*aspectRatio;
    }

    if (availableHeight*aspectRatio < videoSpaceWidth) {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Returns an array of the video dimensions, so that it keeps it's aspect ratio and fits available area with it's
 * larger dimension. This method ensures that whole video will be visible and can leave empty areas.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getDesktopVideoSize( videoWidth,
                              videoHeight,
                              videoSpaceWidth,
                              videoSpaceHeight )
{
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
        availableWidth = availableHeight*aspectRatio;
    }

    if (availableHeight*aspectRatio >= videoSpaceWidth)
    {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
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
function positionVideo( video,
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

var resizeLargeVideoContainer = function () {
    Chat.resizeChat();
    var availableHeight = window.innerHeight;
    var availableWidth = Util.getAvailableVideoWidth();

    if (availableWidth < 0 || availableHeight < 0) return;

    $('#videospace').width(availableWidth);
    $('#videospace').height(availableHeight);
    $('#largeVideoContainer').width(availableWidth);
    $('#largeVideoContainer').height(availableHeight);

    resizeThumbnails();
};

var calculateThumbnailSize = function() {
 // Calculate the available height, which is the inner window height minus
    // 39px for the header minus 2px for the delimiter lines on the top and
    // bottom of the large video, minus the 36px space inside the remoteVideos
    // container used for highlighting shadow.
    var availableHeight = 100;

    var numvids = $('#remoteVideos>span:visible').length;

    // Remove the 1px borders arround videos and the chat width.
    var availableWinWidth = $('#remoteVideos').width() - 2 * numvids - 50;
    var availableWidth = availableWinWidth / numvids;
    var aspectRatio = 16.0 / 9.0;
    var maxHeight = Math.min(160, availableHeight);
    availableHeight = Math.min(maxHeight, availableWidth / aspectRatio);
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }

    return [availableWidth, availableHeight];
};

function resizeThumbnails() {
    var thumbnailSize = calculateThumbnailSize();
    var width = thumbnailSize[0];
    var height = thumbnailSize[1];

    // size videos so that while keeping AR and max height, we have a nice fit
    $('#remoteVideos').height(height);
    $('#remoteVideos>span').width(width);
    $('#remoteVideos>span').height(height);
}

$(document).ready(function () {
    Chat.init();

    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});

    // Set default desktop sharing method
    setDesktopSharing(config.desktopSharing);
    // Initialize Chrome extension inline installs
    if(config.chromeExtensionId)
    {
        initInlineInstalls();
    }

    // By default we use camera
    getVideoSize = getCameraVideoSize;
    getVideoPosition = getCameraVideoPosition;

    resizeLargeVideoContainer();
    $(window).resize(function () {
        resizeLargeVideoContainer();
        positionLarge();
    });
    // Listen for large video size updates
    document.getElementById('largeVideo')
        .addEventListener('loadedmetadata', function(e){
            currentVideoWidth = this.videoWidth;
            currentVideoHeight = this.videoHeight;
            positionLarge(currentVideoWidth, currentVideoHeight);
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
    disposeConference();
});

function disposeConference() {
    var handler = getConferenceHandler();
    if(handler && handler.peerconnection) {
        // FIXME: probably removing streams is not required and close() should be enough
        if(connection.jingle.localAudio) {
            handler.peerconnection.removeStream(connection.jingle.localAudio);
        }
        if(connection.jingle.localVideo) {
            handler.peerconnection.removeStream(connection.jingle.localVideo);
        }
        handler.peerconnection.close();
    }
    focus = null;
    activecall = null;
}

function dump(elem, filename){
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
                    url: window.location.href}
                ;
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
 * Opens the lock room dialog.
 */
function openLockDialog() {
    // Only the focus is able to set a shared key.
    if (focus === null) {
        if (sharedKey)
            $.prompt("This conversation is currently protected by a shared secret key.",
                 {
                 title: "Secrect key",
                 persistent: false
                 });
        else
            $.prompt("This conversation isn't currently protected by a secret key. Only the owner of the conference could set a shared key.",
                     {
                     title: "Secrect key",
                     persistent: false
                     });
    }
    else {
        if (sharedKey)
            $.prompt("Are you sure you would like to remove your secret key?",
                     {
                     title: "Remove secrect key",
                     persistent: false,
                     buttons: { "Remove": true, "Cancel": false},
                     defaultButton: 1,
                     submit: function(e,v,m,f){
                     if(v)
                     {
                        setSharedKey('');
                        lockRoom(false);
                     }
                     }
                     });
        else
            $.prompt('<h2>Set a secrect key to lock your room</h2>' +
                     '<input id="lockKey" type="text" placeholder="your shared key" autofocus>',
                     {
                     persistent: false,
                     buttons: { "Save": true , "Cancel": false},
                     defaultButton: 1,
                     loaded: function(event) {
                     document.getElementById('lockKey').focus();
                     },
                     submit: function(e,v,m,f){
                     if(v)
                     {
                        var lockKey = document.getElementById('lockKey');

                        if (lockKey.value)
                        {
                            setSharedKey(Util.escapeHtml(lockKey.value));
                            lockRoom(true);
                        }
                     }
                }
            });
    }
}

/**
 * Opens the invite link dialog.
 */
function openLinkDialog() {
    $.prompt('<input id="inviteLinkRef" type="text" value="'
            + encodeURI(roomUrl) + '" onclick="this.select();" readonly>',
             {
             title: "Share this link with everyone you want to invite",
             persistent: false,
             buttons: { "Cancel": false},
             loaded: function(event) {
             document.getElementById('inviteLinkRef').select();
             }
             });
}

/**
 * Opens the settings dialog.
 */
function openSettingsDialog() {
    $.prompt('<h2>Configure your conference</h2>' +
             '<input type="checkbox" id="initMuted"> Participants join muted<br/>' +
             '<input type="checkbox" id="requireNicknames"> Require nicknames<br/><br/>' +
             'Set a secrect key to lock your room: <input id="lockKey" type="text" placeholder="your shared key" autofocus>',
             {
                persistent: false,
                buttons: { "Save": true , "Cancel": false},
                defaultButton: 1,
                loaded: function(event) {
                    document.getElementById('lockKey').focus();
                },
                submit: function(e,v,m,f){
                    if(v)
                    {
                        if ($('#initMuted').is(":checked"))
                        {
                            // it is checked
                        }

                        if ($('#requireNicknames').is(":checked"))
                        {
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
             });
}

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    if (lock)
        connection.emuc.lockRoom(sharedKey);
    else
        connection.emuc.lockRoom('');

    updateLockButton();
}

/**
 * Sets the shared key.
 */
function setSharedKey(sKey) {
    sharedKey = sKey;
}

/**
 * Updates the lock button state.
 */
function updateLockButton() {
    buttonClick("#lockIcon", "icon-security icon-security-locked");
}

/**
 * Hides the toolbar.
 */
var hideToolbar = function() {

    var isToolbarHover = false;
    $('#header').find('*').each(function(){
        var id = $(this).attr('id');
        if ($("#" + id + ":hover").length > 0) {
            isToolbarHover = true;
        }
    });

    clearTimeout(toolbarTimeout);
    toolbarTimeout = null;

    if (!isToolbarHover) {
        $('#header').hide("slide", { direction: "up", duration: 300});
    }
    else {
        toolbarTimeout = setTimeout(hideToolbar, 2000);
    }
};

/**
 * Shows the call main toolbar.
 */
function showToolbar() {
    if (!$('#header').is(':visible')) {
        $('#header').show("slide", { direction: "up", duration: 300});

        if (toolbarTimeout) {
            clearTimeout(toolbarTimeout);
            toolbarTimeout = null;
        }
        toolbarTimeout = setTimeout(hideToolbar, 2000);
    }

    if (focus != null)
    {
//        TODO: Enable settings functionality. Need to uncomment the settings button in index.html.
//        $('#settingsButton').css({visibility:"visible"});
    }

    // Show/hide desktop sharing button
    showDesktopSharingButton();
}

/**
 * Docks/undocks the toolbar.
 *
 * @param isDock indicates what operation to perform
 */
function dockToolbar(isDock) {
    if (isDock) {
        // First make sure the toolbar is shown.
        if (!$('#header').is(':visible')) {
            showToolbar();
        }
        // Then clear the time out, to dock the toolbar.
        clearTimeout(toolbarTimeout);
        toolbarTimeout = null;
    }
    else {
        if (!$('#header').is(':visible')) {
            showToolbar();
        }
        else {
            toolbarTimeout = setTimeout(hideToolbar, 2000);
        }
    }
}

/**
 * Updates the room invite url.
 */
function updateRoomUrl(newRoomUrl) {
    roomUrl = newRoomUrl;
}

/**
 * Warning to the user that the conference window is about to be closed.
 */
function closePageWarning() {
    if (focus !== null)
        return "You are the owner of this conference call and you are about to end it.";
    else
        return "You are about to leave this conversation.";
}

/**
 * Shows a visual indicator for the focus of the conference.
 * Currently if we're not the owner of the conference we obtain the focus
 * from the connection.jingle.sessions.
 */
function showFocusIndicator() {
    if (focus !== null) {
        var indicatorSpan = $('#localVideoContainer .focusindicator');

        if (indicatorSpan.children().length === 0)
        {
            createFocusIndicatorElement(indicatorSpan[0]);
        }
    }
    else if (Object.keys(connection.jingle.sessions).length > 0) {
        // If we're only a participant the focus will be the only session we have.
        var session = connection.jingle.sessions[Object.keys(connection.jingle.sessions)[0]];
        var focusId = 'participant_' + Strophe.getResourceFromJid(session.peerjid);
        var focusContainer = document.getElementById(focusId);
        if(!focusContainer) {
            console.error("No focus container!");
            return;
        }
        var indicatorSpan = $('#' + focusId + ' .focusindicator');

        if (!indicatorSpan || indicatorSpan.length === 0) {
            indicatorSpan = document.createElement('span');
            indicatorSpan.className = 'focusindicator';
            focusContainer.appendChild(indicatorSpan);

            createFocusIndicatorElement(indicatorSpan);
        }
    }
}

/**
 * Checks if container for participant identified by given peerJid exists in the document and creates it eventually.
 * @param peerJid peer Jid to check.
 */
function ensurePeerContainerExists(peerJid){

    var peerResource = Strophe.getResourceFromJid(peerJid);
    var videoSpanId = 'participant_' + peerResource;

    if($('#'+videoSpanId).length > 0) {
        return;
    }

    var container = addRemoteVideoContainer(videoSpanId);

    var nickfield = document.createElement('span');
    nickfield.className = "nick";
    nickfield.appendChild(document.createTextNode(peerResource));
    container.appendChild(nickfield);
    resizeThumbnails();
}

function addRemoteVideoContainer(id) {
    var container = document.createElement('span');
    container.id = id;
    container.className = 'videocontainer';
    var remotes = document.getElementById('remoteVideos');
    remotes.appendChild(container);
    return container;
}

/**
 * Creates the element indicating the focus of the conference.
 */
function createFocusIndicatorElement(parentElement) {
    var focusIndicator = document.createElement('i');
    focusIndicator.className = 'fa fa-star';
    focusIndicator.title = "The owner of this conference";
    parentElement.appendChild(focusIndicator);
}

/**
 * Toggles the application in and out of full screen mode
 * (a.k.a. presentation mode in Chrome).
 */
function toggleFullScreen() {
    var fsElement = document.documentElement;

    if (!document.mozFullScreen && !document.webkitIsFullScreen){

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
}

/**
 * Shows the display name for the given video.
 */
function showDisplayName(videoSpanId, displayName) {
    var nameSpan = $('#' + videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        var nameSpanElement = nameSpan.get(0);

        if (nameSpanElement.id === 'localDisplayName'
            && $('#localDisplayName').text() !== displayName)
            $('#localDisplayName').text(displayName);
        else
            $('#' + videoSpanId + '_name').text(displayName);
    }
    else {
        var editButton = null;

        if (videoSpanId === 'localVideoContainer') {
            editButton = createEditDisplayNameButton();
        }
        if (displayName.length) {
            nameSpan = document.createElement('span');
            nameSpan.className = 'displayname';
            nameSpan.innerText = displayName;
            $('#' + videoSpanId)[0].appendChild(nameSpan);
        }

        if (!editButton) {
            nameSpan.id = videoSpanId + '_name';
        }
        else {
            nameSpan.id = 'localDisplayName';
            $('#' + videoSpanId)[0].appendChild(editButton);

            var editableText = document.createElement('input');
            editableText.className = 'displayname';
            editableText.id = 'editDisplayName';

            if (displayName.length)
                editableText.value
                    = displayName.substring(0, displayName.indexOf(' (me)'));

            editableText.setAttribute('style', 'display:none;');
            editableText.setAttribute('placeholder', 'ex. Jane Pink');
            $('#' + videoSpanId)[0].appendChild(editableText);

            $('#localVideoContainer .displayname').bind("click", function(e) {
                e.preventDefault();
                $('#localDisplayName').hide();
                $('#editDisplayName').show();
                $('#editDisplayName').focus();
                $('#editDisplayName').select();

                var inputDisplayNameHandler = function(name) {
                    if (nickname !== name) {
                        nickname = name;
                        window.localStorage.displayname = nickname;
                        connection.emuc.addDisplayNameToPresence(nickname);
                        connection.emuc.sendPresence();

                        Chat.setChatConversationMode(true);
                    }

                    if (!$('#localDisplayName').is(":visible")) {
                        $('#localDisplayName').text(nickname + " (me)");
                        $('#localDisplayName').show();
                        $('#editDisplayName').hide();
                    }
                };

                $('#editDisplayName').one("focusout", function (e) {
                    inputDisplayNameHandler(this.value);
                });

                $('#editDisplayName').on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        inputDisplayNameHandler(this.value);
                    }
                });
            });
        }
    }
}

/**
 * Creates the edit display name button.
 * 
 * @returns the edit button
 */
function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}

/**
 * Shows audio muted indicator over small videos.
 */
function showAudioIndicator(videoSpanId, isMuted) {
    var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');

    if (isMuted === 'false') {
        if (audioMutedSpan.length > 0) {
            audioMutedSpan.remove();
        }
    }
    else {
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');

        audioMutedSpan = document.createElement('span');
        audioMutedSpan.className = 'audioMuted';
        if (videoMutedSpan) {
            audioMutedSpan.right = '30px';
        }
        $('#' + videoSpanId)[0].appendChild(audioMutedSpan);

        var mutedIndicator = document.createElement('i');
        mutedIndicator.className = 'icon-mic-disabled';
        mutedIndicator.title = "Participant is muted";
        audioMutedSpan.appendChild(mutedIndicator);
    }
}

/**
 * Shows video muted indicator over small videos.
 */
function showVideoIndicator(videoSpanId, isMuted) {
    var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');

    if (isMuted === 'false') {
        if (videoMutedSpan.length > 0) {
            videoMutedSpan.remove();
        }
    }
    else {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');

        videoMutedSpan = document.createElement('span');
        videoMutedSpan.className = 'videoMuted';
        if (audioMutedSpan) {
            videoMutedSpan.right = '30px';
        }
        $('#' + videoSpanId)[0].appendChild(videoMutedSpan);

        var mutedIndicator = document.createElement('i');
        mutedIndicator.className = 'icon-camera-disabled';
        mutedIndicator.title = "Participant has stopped the camera.";
        videoMutedSpan.appendChild(mutedIndicator);
    }
}

/**
 * Resizes and repositions videos in full screen mode.
 */
$(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function() {
            resizeLargeVideoContainer();
            positionLarge();
            isFullScreen = document.fullScreen
                                || document.mozFullScreen
                                || document.webkitIsFullScreen;

            if (isFullScreen) {
                setView("fullscreen");
            }
            else {
                setView("default");
            }
});

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
