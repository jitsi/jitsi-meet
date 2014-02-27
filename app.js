/* jshint -W117 */
/* application specific logic */
var connection = null;
var focus = null;
var activecall = null;
var RTC = null;
var RTCPeerConnection = null;
var nickname = null;
var sharedKey = '';
var roomUrl = null;
var ssrc2jid = {};
var localVideoSrc = null;
var preziPlayer = null;

/* window.onbeforeunload = closePageWarning; */

function init() {
    RTC = setupRTC();
    if (RTC === null) {
        window.location.href = 'webrtcrequired.html';
        return;
    } else if (RTC.browser != 'chrome') {
        window.location.href = 'chromeonly.html';
        return;
    }
    RTCPeerconnection = TraceablePeerConnection; 

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
        if (status == Strophe.Status.CONNECTED) {
            console.log('connected');
            if (config.useStunTurn) {
                connection.jingle.getStunAndTurnCredentials();
            }
            if (RTC.browser == 'firefox') {
                getUserMediaWithConstraints(['audio']);
            } else {
                getUserMediaWithConstraints(['audio', 'video'], config.resolution || '360');
            }
            document.getElementById('connect').disabled = true;
        } else {
            console.log('status', status);
        }
    });
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

$(document).bind('mediaready.jingle', function (event, stream) {
    connection.jingle.localStream = stream;
    RTC.attachMediaStream($('#localVideo'), stream);
    document.getElementById('localVideo').autoplay = true;
    document.getElementById('localVideo').volume = 0;

    localVideoSrc = document.getElementById('localVideo').src;
    updateLargeVideo(localVideoSrc, true, 0);

    $('#localVideo').click(function () {
        $(document).trigger("video.selected", [false]);
        updateLargeVideo($(this).attr('src'), true, 0);

        $('video').each(function (idx, el) {
            if (el.id.indexOf('mixedmslabel') != -1) {
                el.volume = 0;
                el.volume = 1;
            } 
        });
    });

    doJoin();
});

$(document).bind('mediafailure.jingle', function () {
    // FIXME
});
  
$(document).bind('remotestreamadded.jingle', function (event, data, sid) {
    function waitForRemoteVideo(selector, sid) {
        var sess = connection.jingle.sessions[sid];
        if (data.stream.id == 'mixedmslabel') return;
        videoTracks = data.stream.getVideoTracks();
        if (videoTracks.length === 0 || selector[0].currentTime > 0) {
            RTC.attachMediaStream(selector, data.stream); // FIXME: why do i have to do this for FF?
            $(document).trigger('callactive.jingle', [selector, sid]);
            console.log('waitForremotevideo', sess.peerconnection.iceConnectionState, sess.peerconnection.signalingState);
        } else {
            setTimeout(function () { waitForRemoteVideo(selector, sid); }, 250);
        }
    }
    var sess = connection.jingle.sessions[sid];

    // look up an associated JID for a stream id
    if (data.stream.id.indexOf('mixedmslabel') == -1) {
        var ssrclines = SDPUtil.find_lines(sess.peerconnection.remoteDescription.sdp, 'a=ssrc');
        ssrclines = ssrclines.filter(function (line) {
            return line.indexOf('mslabel:' + data.stream.label) != -1; 
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
            console.warn('no container for', data.peerjid);
            // create for now...
            // FIXME: should be removed
            container = addRemoteVideoContainer(
                    'participant_' + Strophe.getResourceFromJid(data.peerjid));
        } else {
            //console.log('found container for', data.peerjid);
        }
    } else {
        if (data.stream.id != 'mixedmslabel') {
            console.warn('can not associate stream', data.stream.id, 'with a participant');
        }
        // FIXME: for the mixed ms we dont need a video -- currently
        container = document.createElement('span');
        container.className = 'videocontainer';
        remotes.appendChild(container);
        Util.playSoundNotification('userJoined');
    }
    var vid = document.createElement('video');
    var id = 'remoteVideo_' + sid + '_' + data.stream.id;
    vid.id = id;
    vid.autoplay = true;
    vid.oncontextmenu = function () { return false; };
    container.appendChild(vid);
    // TODO: make mixedstream display:none via css?
    if (id.indexOf('mixedmslabel') != -1) {
        container.id = 'mixedstream';
        $(container).hide();
    }

    var sel = $('#' + id);
    sel.hide();
    RTC.attachMediaStream(sel, data.stream);
    waitForRemoteVideo(sel, sid);
    data.stream.onended = function () {
        console.log('stream ended', this.id);
        var src = $('#' + id).attr('src');
        if (src === $('#largeVideo').attr('src')) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video').get(0);
            // mute if localvideo
            var isLocalVideo = false;
            if (pick) {
                 if (pick.src === localVideoSrc)
                 isLocalVideo = true;

                 updateLargeVideo(pick.src, isLocalVideo, pick.volume);
            }
        }
        $('#' + id).parent().remove();
        Util.playSoundNotification('userLeft');
        resizeThumbnails();
    };
    sel.click(
        function () {
            $(document).trigger("video.selected", [false]);
            updateLargeVideo($(this).attr('src'), false, 1);
        }
    );
    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (data.peerjid && sess.peerjid == data.peerjid && 
            data.stream.getVideoTracks().length == 0 && 
            connection.jingle.localStream.getVideoTracks().length > 0) {
        window.setTimeout(function() {
            sendKeyframe(sess.peerconnection);
        }, 3000);
    }
});

// an attempt to work around https://github.com/jitsi/jitmeet/issues/32
function sendKeyframe(pc) {
    console.log('sendkeyframe', pc.iceConnectionState);
    if (pc.iceConnectionState != 'connected') return; // safe...
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

function demonstrateabug(pc) {
    // funny way of doing mute. the subsequent offer contains things like rtcp-mux
    // and triggers all new ice candidates (ice restart)
    // this code is here to demonstrate a bug
    pc.createOffer(
        function (offer) {
            console.log(offer);
            var sdp = new SDP(offer.sdp);
            if (sdp.media.length > 1) {
                sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                sdp.raw = sdp.session + sdp.media.join('');
                offer.sdp = sdp.raw;
                pc.setLocalDescription(offer,
                    function () {
                        console.log('mute SLD ok');
                    },
                    function(error) {
                        console.log('mute SLD error');
                    }
                );
            }
        },
        function (error) {
            console.warn(error);
        },
        {mandatory: {OfferToReceiveAudio: true, OfferToReceiveVideo: false}}
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
    if (videoelem.attr('id').indexOf('mixedmslabel') == -1) {
        // ignore mixedmslabela0 and v0
        videoelem.show();
        resizeThumbnails();

        updateLargeVideo(videoelem.attr('src'), false, 1);

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

            directions[type] = (SDPUtil.find_line(media, 'a=sendrecv') || SDPUtil.find_line(media, 'a=recvonly') || SDPUtil.find_line('a=sendonly') || SDPUtil.find_line('a=inactive') || 'a=sendrecv').substr(2);
        }
    });
    console.log('new ssrcs', newssrcs);

    var i = 0;
    Object.keys(newssrcs).forEach(function (mtype) {
        i++;
        connection.emuc.addMediaToPresence(i, mtype, newssrcs[mtype], directions[mtype]);
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
    console.log(focus);

    var videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
    var container = addRemoteVideoContainer(videoSpanId);

    if (info.displayName)
        showDisplayName(videoSpanId, info.displayName);

    var nickfield = document.createElement('span');
    nickfield.appendChild(document.createTextNode(Strophe.getResourceFromJid(jid)));
    container.appendChild(nickfield);
    resizeThumbnails();

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

    $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
        //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
        ssrc2jid[ssrc.getAttribute('ssrc')] = jid;
    });
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
    if (focus === null && connection.emuc.myroomjid == connection.emuc.list_members[0]) {
        console.log('welcome to our new focus... myself');
        focus = new ColibriFocus(connection, config.hosts.bridge);
        if (Object.keys(connection.emuc.members).length > 0) {
            focus.makeConference(Object.keys(connection.emuc.members));
        }
        $(document).trigger('focusechanged.muc', [focus]);
    } 
    else if (focus && Object.keys(connection.emuc.members).length === 0) {
        console.log('everyone left');
        if (focus !== null) {
            // FIXME: closing the connection is a hack to avoid some 
            // problemswith reinit
            if (focus.peerconnection !== null) {
                focus.peerconnection.close();
            }
            focus = new ColibriFocus(connection, config.hosts.bridge);
        }
    }
    if (connection.emuc.getPrezi(jid)) {
        $(document).trigger('presentationremoved.muc', [jid, connection.emuc.getPrezi(jid)]);
    }
});

$(document).bind('presence.muc', function (event, jid, info, pres) {
    $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
        //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
        ssrc2jid[ssrc.getAttribute('ssrc')] = jid;

        // might need to update the direction if participant just went from sendrecv to recvonly
        if (ssrc.getAttribute('type') == 'video') {
            var el = $('#participant_'  + Strophe.getResourceFromJid(jid) + '>video');
            switch(ssrc.getAttribute('direction')) {
            case 'sendrecv':
                el.show(); 
                break;
            case 'recvonly':
                el.hide();
                break;
            }
        }
    });

    if (info.displayName) {
        if (jid === connection.emuc.myroomjid)
            showDisplayName('localVideoContainer', info.displayName + ' (me)');
        else
            showDisplayName('participant_' + Strophe.getResourceFromJid(jid), info.displayName);
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

                        if (lockKey.value != null)
                        {
                            setSharedKey(lockKey.value);
                            connection.emuc.doJoin(jid, lockKey.value);
                        }
                    }
                }
            });
});

/*
 * Presentation has been removed.
 */
$(document).bind('presentationremoved.muc', function(event, jid, presUrl) {
    console.log('presentation removed', presUrl);
    var presId = getPresentationId(presUrl);
    setPresentationVisible(false);
    $('#participant_' + Strophe.getResourceFromJid(jid) + '_' + presId).remove();
    $('#presentation>iframe').remove();
    if (preziPlayer != null) {
        preziPlayer.destroy();
        preziPlayer = null;
    }
});

/*
 * Presentation has been added.
 */
$(document).bind('presentationadded.muc', function (event, jid, presUrl, currentSlide) {
    console.log("presentation added", presUrl);

    var presId = getPresentationId(presUrl);
    var elementId = 'participant_' + Strophe.getResourceFromJid(jid) + '_' + presId;

    var container = addRemoteVideoContainer(elementId);
    resizeThumbnails();

    var controlsEnabled = false;
    if (jid === connection.emuc.myroomjid)
        controlsEnabled = true;

    setPresentationVisible(true);
    $('#largeVideoContainer').hover(
        function (event) {
            if (isPresentationVisible())
                $('#reloadPresentation').css({display:'inline-block'});
        },
        function (event) {
            if (!isPresentationVisible())
                $('#reloadPresentation').css({display:'none'});
            else {
                var e = event.toElement || event.relatedTarget;

                while(e && e.parentNode && e.parentNode != window) {
                    if (e.parentNode == this ||  e ==  this) {
                        return false;
                    }
                    e = e.parentNode;
                }
                $('#reloadPresentation').css({display:'none'});
            }
        });

    preziPlayer = new PreziPlayer(
                'presentation',
                {preziId: presId,
                width: $('#largeVideoContainer').width(),
                height: $('#largeVideoContainer').height(),
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

    $("#" + elementId).css('background-image','url(../images/avatarprezi.png)');
    $("#" + elementId).click(
        function () {
            setPresentationVisible(true);
        }
    );
});

/*
 * Indicates presentation slide change.
 */
$(document).bind('gotoslide.muc', function (event, jid, presUrl, current) {
    if (preziPlayer) {
        preziPlayer.flyToStep(current);
    }
});

/**
 * Returns the presentation id from the given url.
 */
function getPresentationId (presUrl) {
    var presIdTmp = presUrl.substring(presUrl.indexOf("prezi.com/") + 10);
    return presIdTmp.substring(0, presIdTmp.indexOf('/'));
}

/*
 * Reloads the current presentation.
 */
function reloadPresentation() {
    var iframe = document.getElementById(preziPlayer.options.preziId);
    iframe.src = iframe.src;
}

/*
 * Shows/hides a presentation.
 */
function setPresentationVisible(visible) {
    if (visible) {
        // Trigger the video.selected event to indicate a change in the large video.
        $(document).trigger("video.selected", [true]);

        $('#largeVideo').fadeOut(300, function () {
            $('#largeVideo').css({visibility:'hidden'});
            $('#presentation>iframe').fadeIn(300, function() {
                $('#presentation>iframe').css({opacity:'1'});
            });
        });
    }
    else {
        if ($('#presentation>iframe')) {
            $('#presentation>iframe').fadeOut(300, function () {
                $('#presentation>iframe').css({opacity:'0'});
                $('#largeVideo').fadeIn(300, function() {
                    $('#largeVideo').css({visibility:'visible'});
                });
            });
        }
    }
}

var isPresentationVisible = function () {
    return ($('#presentation>iframe') != null && $('#presentation>iframe').css('opacity') == 1);
}

/**
 * Updates the large video with the given new video source.
 */
function updateLargeVideo(newSrc, localVideo, vol) {
    console.log('hover in', newSrc);

    setPresentationVisible(false);

    if ($('#largeVideo').attr('src') != newSrc) {

        document.getElementById('largeVideo').volume = vol;

        $('#largeVideo').fadeOut(300, function () {
            $(this).attr('src', newSrc);

            var videoTransform = document.getElementById('largeVideo').style.webkitTransform;
            if (localVideo && videoTransform != 'scaleX(-1)') {
                document.getElementById('largeVideo').style.webkitTransform = "scaleX(-1)";
            }
            else if (!localVideo && videoTransform == 'scaleX(-1)') {
                document.getElementById('largeVideo').style.webkitTransform = "none";
            }

            $(this).fadeIn(300);
        });
    }
}

function toggleVideo() {
    if (!(connection && connection.jingle.localStream)) return;
    var ismuted = false;
    for (var idx = 0; idx < connection.jingle.localStream.getVideoTracks().length; idx++) {
        ismuted = !connection.jingle.localStream.getVideoTracks()[idx].enabled;
    }
    for (var idx = 0; idx < connection.jingle.localStream.getVideoTracks().length; idx++) {
        connection.jingle.localStream.getVideoTracks()[idx].enabled = !connection.jingle.localStream.getVideoTracks()[idx].enabled;
    }
    var sess = focus || activecall;
    if (!sess) {
        return;
    }
    sess.pendingop = ismuted ? 'unmute' : 'mute';
    sess.modifySources();
}

function toggleAudio() {
    if (!(connection && connection.jingle.localStream)) return;
    for (var idx = 0; idx < connection.jingle.localStream.getAudioTracks().length; idx++) {
        connection.jingle.localStream.getAudioTracks()[idx].enabled = !connection.jingle.localStream.getAudioTracks()[idx].enabled;
    }
}

var resizeLarge = function () {
    Chat.resizeChat();
    var availableHeight = window.innerHeight;
    var chatspaceWidth = $('#chatspace').is(":visible")
                            ? $('#chatspace').width()
                            : 0;

    var numvids = $('#remoteVideos>video:visible').length;
    if (numvids < 5)
        availableHeight -= 100; // min thumbnail height for up to 4 videos
    else
        availableHeight -= 50; // min thumbnail height for more than 5 videos

    availableHeight -= 79; // padding + link ontop
    var availableWidth = window.innerWidth - chatspaceWidth;
    var aspectRatio = 16.0 / 9.0;
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }
    if (availableWidth < 0 || availableHeight < 0) return;
    $('#largeVideo').parent().width(availableWidth);
    $('#largeVideo').parent().height(availableWidth / aspectRatio);

    if ($('#presentation>iframe')) {
        $('#presentation>iframe').width(availableWidth);
        $('#presentation>iframe').height(availableWidth / aspectRatio);
    }

    if ($('#etherpad>iframe')) {
        $('#etherpad>iframe').width(availableWidth);
        $('#etherpad>iframe').height(availableWidth / aspectRatio);
    }

    resizeThumbnails();
};

function resizeThumbnails() {
    // Calculate the available height, which is the inner window height minus 39px for the header
    // minus 2px for the delimiter lines on the top and bottom of the large video,
    // minus the 36px space inside the remoteVideos container used for highlighting shadow.
    var availableHeight = window.innerHeight - $('#largeVideo').height() - 59;
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

    // size videos so that while keeping AR and max height, we have a nice fit
    $('#remoteVideos').height(availableHeight);
    $('#remoteVideos>span').width(availableWidth);
    $('#remoteVideos>span').height(availableHeight);
}

$(document).ready(function () {
    Chat.init();

    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});

    resizeLarge();
    $(window).resize(function () {
        resizeLarge();
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
});

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

/*
 * Changes the style class of the element given by id.
 */
function buttonClick(id, classname) {
    $(id).toggleClass(classname); // add the class to the clicked element
}

/*
 * Opens the lock room dialog.
 */
function openLockDialog() {
    // Only the focus is able to set a shared key.
    if (focus == null) {
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

/*
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

/*
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

/*
 * Opens the Prezi dialog, from which the user could choose a presentation to load.
 */
function openPreziDialog() {
    var myprezi = connection.emuc.getPrezi(connection.emuc.myroomjid);
    if (myprezi) {
        $.prompt("Are you sure you would like to remove your Prezi?",
                {
                title: "Remove Prezi",
                buttons: { "Remove": true, "Cancel": false},
                defaultButton: 1,
                submit: function(e,v,m,f){
                if(v)
                {
                    connection.emuc.removePreziFromPresence();
                    connection.emuc.sendPresence();
                }
            }
        });
    }
    else if (preziPlayer != null) {
        $.prompt("Another participant is already sharing a Prezi." +
                "This conference allows only one Prezi at a time.",
                 {
                 title: "Share a Prezi",
                 buttons: { "Ok": true},
                 defaultButton: 0,
                 submit: function(e,v,m,f){
                    $.prompt.close();
                 }
                 });
    }
    else {
        var openPreziState = {
        state0: {
            html:   '<h2>Share a Prezi</h2>' +
                    '<input id="preziUrl" type="text" placeholder="e.g. http://prezi.com/wz7vhjycl7e6/my-prezi" autofocus>',
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
                            var presIdTmp = urlValue.substring(urlValue.indexOf("prezi.com/") + 10);
                            if (!Util.isAlphanumeric(presIdTmp)
                                    || presIdTmp.indexOf('/') < 2) {
                                $.prompt.goToState('state1');
                                return false;
                            }
                            else {
                                connection.emuc.addPreziToPresence(urlValue, 0);
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

        var myPrompt = jQuery.prompt(openPreziState);

        myPrompt.on('impromptu:loaded', function(e) {
                    document.getElementById('preziUrl').focus();
                    });
        myPrompt.on('impromptu:statechanged', function(e) {
                    document.getElementById('preziUrl').focus();
                    });
    }
}

/*
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    if (lock)
        connection.emuc.lockRoom(sharedKey);
    else
        connection.emuc.lockRoom('');

    updateLockButton();
}

/*
 * Sets the shared key.
 */
function setSharedKey(sKey) {
    sharedKey = sKey;
}

/*
 * Updates the lock button state.
 */
function updateLockButton() {
    buttonClick("#lockIcon", "fa fa-unlock fa-lg fa fa-lock fa-lg");
}

/*
 * Shows the call main toolbar.
 */
function showToolbar() {
    $('#toolbar').css({visibility:"visible"});
    if (focus != null)
    {
//        TODO: Enable settings functionality. Need to uncomment the settings button in index.html.
//        $('#settingsButton').css({visibility:"visible"});
    }
}

/*
 * Updates the room invite url.
 */
function updateRoomUrl(newRoomUrl) {
    roomUrl = newRoomUrl;
}

/*
 * Warning to the user that the conference window is about to be closed.
 */
function closePageWarning() {
    if (focus != null)
        return "You are the owner of this conference call and you are about to end it.";
    else
        return "You are about to leave this conversation.";
}

/*
 * Shows a visual indicator for the focus of the conference.
 * Currently if we're not the owner of the conference we obtain the focus
 * from the connection.jingle.sessions.
 */
function showFocusIndicator() {
    if (focus != null) {
        var indicatorSpan = $('#localVideoContainer .focusindicator');

        if (indicatorSpan.children().length == 0)
        {
            createFocusIndicatorElement(indicatorSpan[0]);
        }
    }
    else if (Object.keys(connection.jingle.sessions).length > 0) {
        // If we're only a participant the focus will be the only session we have.
        var session = connection.jingle.sessions[Object.keys(connection.jingle.sessions)[0]];
        var focusId = 'participant_' + Strophe.getResourceFromJid(session.peerjid);
        var focusContainer = document.getElementById(focusId);
        var indicatorSpan = $('#' + focusId + ' .focusindicator');

        if (!indicatorSpan || indicatorSpan.length == 0) {
            indicatorSpan = document.createElement('span');
            indicatorSpan.className = 'focusindicator';
            focusContainer.appendChild(indicatorSpan);
            
            createFocusIndicatorElement(indicatorSpan);
        }
    }
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
    focusIndicator.title = "The owner of this conference"
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
            document.webkitCancelFullScreen();
        }
    }
}

/**
 * Shows the display name for the given video.
 */
function showDisplayName(videoSpanId, displayName) {
    var escDisplayName = Util.escapeHtml(displayName);

    var nameSpan = $('#' + videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        var nameSpanElement = nameSpan.get(0);

        if (nameSpanElement.id == 'localDisplayName'
            && $('#localDisplayName').html() != escDisplayName)
            $('#localDisplayName').html(escDisplayName);
        else
            $('#' + videoSpanId + '_name').html(escDisplayName);
    }
    else {
        var editButton = null;

        if (videoSpanId == 'localVideoContainer') {
            editButton = createEditDisplayNameButton();
        }
        if (escDisplayName.length) {
            nameSpan = document.createElement('span');
            nameSpan.className = 'displayname';
            nameSpan.innerHTML = escDisplayName;
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

            if (escDisplayName.length)
                editableText.value
                    = escDisplayName.substring(0, escDisplayName.indexOf(' (me)'));

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
                    if (nickname != name) {
                        nickname = Util.escapeHtml(name);
                        window.localStorage.displayname = nickname;
                        connection.emuc.addDisplayNameToPresence(nickname);
                        connection.emuc.sendPresence();

                        Chat.setChatConversationMode(true);
                    }

                    if (!$('#localDisplayName').is(":visible")) {
                        $('#localDisplayName').html(nickname + " (me)");
                        $('#localDisplayName').show();
                        $('#editDisplayName').hide();
                    }
                };

                $('#editDisplayName').one("focusout", function (e) {
                    inputDisplayNameHandler(this.value);
                });

                $('#editDisplayName').on('keydown', function (e) {
                    if (e.keyCode == 13) {
                        e.preventDefault();
                        inputDisplayNameHandler(this.value);
                    }
                });
            });
        }
    }
}

function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}
