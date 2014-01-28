/* jshint -W117 */
/* application specific logic */
var connection = null;
var focus = null;
var RTC;
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
            window.history.pushState('VideoChat', 'Room: ' + roomnode, window.location.pathname + roomnode);
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
        videoTracks = data.stream.getVideoTracks();
        if (videoTracks.length === 0 || selector[0].currentTime > 0) {
            RTC.attachMediaStream(selector, data.stream); // FIXME: why do i have to do this for FF?
            $(document).trigger('callactive.jingle', [selector, sid]);
            console.log('waitForremotevideo', sess.peerconnection.iceConnectionState, sess.peerconnection.signalingState);
        } else {
            setTimeout(function () { waitForRemoteVideo(selector, sid); }, 100);
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
        container  = document.getElementById('participant_' + Strophe.getResourceFromJid(data.peerjid));
        if (!container) {
            console.warn('no container for', data.peerjid);
            // create for now...
            // FIXME: should be removed
            container = addRemoteVideoContainer('participant_' + Strophe.getResourceFromJid(data.peerjid));
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
        resizeThumbnails();
    };
    sel.click(
        function () {
            updateLargeVideo($(this).attr('src'), false, 1);
        }
    );
});

$(document).bind('callincoming.jingle', function (event, sid) {
    var sess = connection.jingle.sessions[sid];
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
    var localSDP = new SDP(sess.peerconnection.localDescription.sdp);
    localSDP.media.forEach(function (media) {
        var type = SDPUtil.parse_mline(media.split('\r\n')[0]).media;
        var ssrc = SDPUtil.find_line(media, 'a=ssrc:').substring(7).split(' ')[0];
        // assumes a single local ssrc
        newssrcs[type] = ssrc;
    });
    console.log('new ssrcs', newssrcs);

    var i = 0;
    Object.keys(newssrcs).forEach(function (mtype) {
        i++;
        connection.emuc.addMediaToPresence(i, mtype, newssrcs[mtype]);
    });
    connection.emuc.sendPresence();
});

$(document).bind('joined.muc', function (event, jid, info) {
    updateRoomUrl(window.location.href);
    document.getElementById('localNick').appendChild(
        document.createTextNode(Strophe.getResourceFromJid(jid) + ' (you)')
    );

    if (Object.keys(connection.emuc.members).length < 1) {
        focus = new ColibriFocus(connection, config.hosts.bridge);
    }
                 
    // Once we've joined the muc show the toolbar
    showToolbar();
});

$(document).bind('entered.muc', function (event, jid, info, pres) {
    console.log('entered', jid, info);
    console.log(focus);
    
    var container = addRemoteVideoContainer('participant_' + Strophe.getResourceFromJid(jid));

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

    showFocusIndicator();

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

    if (Object.keys(connection.emuc.members).length === 0) {
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
    });
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
                            setSharedKey(lockKey);
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
            if ($('#largeVideo').css('visibility') == 'hidden')
                $('#reloadPresentation').css({display:'inline-block'});
        },
        function (event) {
            if ($('#largeVideo').css('visibility') == 'visible')
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

//    $('#presentation>iframe').load(function (){
//        console.log("IFRAME LOADED!!!!!!!!!!!!!!!!");
//    });
//    $('#presentation>iframe').ready(function (){
//        console.log("IFRAME READY!!!!!!!!!!!!!!!!");
//    });
                 
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
    for (var idx = 0; idx < connection.jingle.localStream.getVideoTracks().length; idx++) {
        connection.jingle.localStream.getVideoTracks()[idx].enabled = !connection.jingle.localStream.getVideoTracks()[idx].enabled;
    }
}

function toggleAudio() {
    if (!(connection && connection.jingle.localStream)) return;
    for (var idx = 0; idx < connection.jingle.localStream.getAudioTracks().length; idx++) {
        connection.jingle.localStream.getAudioTracks()[idx].enabled = !connection.jingle.localStream.getAudioTracks()[idx].enabled;
    }
}

function resizeLarge() {
    var availableHeight = window.innerHeight;
    var chatspaceWidth = $('#chatspace').width();

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
    $('#presentation>iframe').width(availableWidth);
    $('#presentation>iframe').height(availableWidth / aspectRatio);
    
    resizeThumbnails();
}

function resizeThumbnails() {
    // Calculate the available height, which is the inner window height minus 39px for the header
    // minus 4px for the delimiter lines on the top and bottom of the large video,
    // minus the 36px space inside the remoteVideos container used for highlighting shadow.
    var availableHeight = window.innerHeight - $('#largeVideo').height() - 79;
    var numvids = $('#remoteVideos>span:visible').length;
    // Remove the 1px borders arround videos.
    var availableWinWidth = $('#remoteVideos').width() - 2 * numvids - 50;
    var availableWidth = availableWinWidth / numvids;
    var aspectRatio = 16.0 / 9.0;
    var maxHeight = Math.min(160, availableHeight);
    availableHeight = Math.min(maxHeight, availableWidth / aspectRatio);
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }
    // size videos so that while keeping AR and max height, we have a nice fit
    $('#remoteVideos').height(availableHeight+26); // add the 2*18px-padding-top border used for highlighting shadow.
    $('#remoteVideos>span').width(availableWidth);
    $('#remoteVideos>span').height(availableHeight);
}

$(document).ready(function () {
    $('#nickinput').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            var val = this.value;
            this.value = '';
            if (!nickname) {
                nickname = val;
                $('#nickname').css({visibility:"hidden"});
                $('#chatconversation').css({visibility:'visible'});
                $('#usermsg').css({visibility:'visible'});
                $('#usermsg').focus();
                return;
            }
        }
    });

    $('#usermsg').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            var message = this.value;
            $('#usermsg').val('').trigger('autosize.resize');
            this.focus();
            connection.emuc.sendMessage(message, nickname);
        }
    });

    $('#usermsg').autosize();

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
 * Appends the given message to the chat conversation.
 */
function updateChatConversation(nick, message)
{
    var divClassName = '';
    if (nickname == nick)
        divClassName = "localuser";
    else
        divClassName = "remoteuser";
    
    $('#chatconversation').append('<div class="' + divClassName + '"><b>' + nick + ': </b>' + message + '</div>');
    $('#chatconversation').animate({ scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
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
                            setSharedKey(lockKey.value);
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
    $.prompt('<input id="inviteLinkRef" type="text" value="' + roomUrl + '" onclick="this.select();">',
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
        $.prompt("Another participant is already sharing a Prezi. This conference allows only one Prezi at a time.",
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
                        if (preziUrl.value.indexOf('http://prezi.com/') != 0
                            && preziUrl.value.indexOf('https://prezi.com/') != 0)
                        {
                            $.prompt.goToState('state1');
                            return false;
                        }
                        else {
                            var presIdTmp = preziUrl.value.substring(preziUrl.value.indexOf("prezi.com/") + 10);
                            if (presIdTmp.indexOf('/') < 2) {
                                $.prompt.goToState('state1');
                                return false;
                            }
                            else {
                                connection.emuc.addPreziToPresence(preziUrl.value, 0);
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
 * Opens / closes the chat area.
 */
function openChat() {
    var chatspace = $('#chatspace');
    var videospace = $('#videospace');
    var chatspaceWidth = chatspace.width();

    if (chatspace.css("opacity") == 1) {
        chatspace.animate({opacity: 0}, "fast");
        chatspace.animate({width: 0}, "slow");
        videospace.animate({right: 0, width:"100%"}, "slow");
    }
    else {
        chatspace.animate({width:"20%"}, "slow");
        chatspace.animate({opacity: 1}, "slow");
        videospace.animate({right:chatspaceWidth, width:"80%"}, "slow");
    }
    
    // Request the focus in the nickname field or the chat input field.
    if ($('#nickinput').is(':visible'))
        $('#nickinput').focus();
    else
        $('#usermsg').focus();
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
        var localVideoToolbar = document.getElementById('localVideoToolbar');

        if (localVideoToolbar.childNodes.length === 0)
        {
            createFocusIndicatorElement(localVideoToolbar);
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

/*
 * Creates the element indicating the focus of the conference.
 */
function createFocusIndicatorElement(parentElement) {
    var focusIndicator = document.createElement('i');
    focusIndicator.className = 'fa fa-star';
    focusIndicator.title = "The owner of this conference"
    parentElement.appendChild(focusIndicator);
}
