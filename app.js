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

    var jid = document.getElementById('jid').value || config.hosts.domain || window.location.hostname;

    connection.connect(jid, document.getElementById('password').value, function (status) {
        if (status == Strophe.Status.CONNECTED) {
            console.log('connected');
            if (RTC.browser == 'firefox') {
                getUserMediaWithConstraints(['audio']);
            } else {
                getUserMediaWithConstraints(['audio', 'video'], '360');
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
        roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
    }
    connection.emuc.doJoin(roomjid);
}

$(document).bind('mediaready.jingle', function (event, stream) {
    connection.jingle.localStream = stream;
    RTC.attachMediaStream($('#localVideo'), stream);
    document.getElementById('localVideo').muted = true;
    document.getElementById('localVideo').autoplay = true;
    document.getElementById('localVideo').volume = 0;

    updateLargeVideo(document.getElementById('localVideo').src, true);

    $('#localVideo').click(function () {
        updateLargeVideo($(this).attr('src'), true);
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

    var vid = document.createElement('video');
    // FIXME: the span should not be created here but on muc join
    var span = document.createElement('span');
    if (data.peerjid) {
        // FIXME: how to name this span? data.peerjid is not set for jingle clients
        span.id = 'participant_' + Strophe.getResourceFromJid(data.peerjid);
    } else if (data.stream.id != 'mixedmslabel') {
        console.warn('can not associate stream', data.stream.id, 'with a participant');
    }
    span.className = 'videocontainer';
    var id = 'remoteVideo_' + sid + '_' + data.stream.id;
    vid.id = id;
    vid.autoplay = true;
    vid.oncontextmenu = function () { return false; };
    var remotes = document.getElementById('remoteVideos');
    span.appendChild(vid);
    if (id.indexOf('mixedmslabel') != -1) {
        $(span).hide();
    }
    remotes.appendChild(span);
    var sel = $('#' + id);
    sel.hide();
    RTC.attachMediaStream(sel, data.stream);
    waitForRemoteVideo(sel, sid);
    data.stream.onended = function () {
        console.log('stream ended', this.id);
        var src = $('#' + id).attr('src');
        // FIXME: likewise, the parent should not be removed here
        // but on MUC part
        $('#' + id).parent().remove();
        if (src === $('#largeVideo').attr('src')) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick = $('#remoteVideos>span:visible:last>video').get(0);
            // mute if localvideo
            document.getElementById('largeVideo').volume = pick.volume;
            document.getElementById('largeVideo').src = pick.src;
        }
        resizeThumbnails();
    };
    sel.click(
        function () {
            updateLargeVideo($(this).attr('src'), false);
        }
    );
});

$(document).bind('callincoming.jingle', function (event, sid) {
    var sess = connection.jingle.sessions[sid];
    // TODO: check affiliation and/or role
    console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
    sess.sendAnswer();
    sess.accept();
});

$(document).bind('callactive.jingle', function (event, videoelem, sid) {
    if (videoelem.attr('id').indexOf('mixedmslabel') == -1) {
        // ignore mixedmslabela0 and v0
        videoelem.show();
        resizeThumbnails();

        document.getElementById('largeVideo').volume = 1;
        $('#largeVideo').attr('src', videoelem.attr('src'));
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
    // just blast off presence for everything -- TODO: optimize
    var pres = $pres({to: connection.emuc.myroomjid });
    pres.c('x', {xmlns: 'http://jabber.org/protocol/muc'}).up();

    pres.c('media', {xmlns: 'http://estos.de/ns/mjs'});
    Object.keys(newssrcs).forEach(function (mtype) {
        pres.c('source', {type: mtype, ssrc: newssrcs[mtype]}).up();
    });
    pres.up();
    connection.send(pres);
});

$(document).bind('joined.muc', function (event, jid, info) {
    updateRoomUrl(window.location.href);

    // Once we've joined the muc show the toolbar
    showToolbar();

    if (Object.keys(connection.emuc.members).length < 1) {
        focus = new ColibriFocus(connection, config.hosts.bridge);
    }
});

$(document).bind('entered.muc', function (event, jid, info, pres) {
    console.log('entered', jid, info);
    console.log(focus);

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
    // FIXME: this should actually hide the video already for a nicer UX

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

/**
 * Updates the large video with the given new video source.
 */
function updateLargeVideo(newSrc, localVideo) {
    console.log('hover in', newSrc);
    if ($('#largeVideo').attr('src') != newSrc) {
        if (!localVideo)
            document.getElementById('largeVideo').volume = 1;
        else
            document.getElementById('largeVideo').volume = 0;

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
    resizeThumbnails();
}

function resizeThumbnails() {
    // Calculate the available height, which is the inner window height minus 39px for the header
    // minus 4px for the delimiter lines on the top and bottom of the large video,
    // minus the 36px space inside the remoteVideos container used for highlighting shadow.
    var availableHeight = window.innerHeight - $('#largeVideo').height() - 79;
    var numvids = $('#remoteVideos>span:visible').length;
    // Remove the 1px borders arround videos.
    var availableWinWidth = $('#remoteVideos').width() - 2 * numvids;
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

function dump(elem, filename) {
    console.log("ELEMENT", elem);
    elem = elem.parentNode;
    elem.download = filename || 'xmpplog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = {};
    data.time = new Date();
    data.url = window.location.href;
    data.ua = navigator.userAgent;
    if (connection.logger) {
        data.xmpp = connection.logger.log;
    }
    if (connection.jingle) {
        Object.keys(connection.jingle.sessions).forEach(function (sid) {
            var session = connection.jingle.sessions[sid];
            if (session.peerconnection && session.peerconnection.updateLog) {
                // FIXME: should probably be a .dump call
                data["jingle_" + session.sid] = session.peerconnection.updateLog;
            }
        });
    }
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}

/*
 * Appends the given message to the chat conversation.
 */
// <a onclick="dump(event.target);">my download button</a>
function dump(elem, filename){
    elem = elem.parentNode;
    elem.download = filename || 'xmpplog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = {};
    data.time = new Date();
    data.url = window.location.href;
    data.ua = navigator.userAgent;
    if (connection.logger) {
        data.xmpp = connection.logger.log;
    }
    if (connection.jingle) {
        Object.keys(connection.jingle.sessions).forEach(function (sid) {
            var session = connection.jingle.sessions[sid];
            if (session.peerconnection && session.peerconnection.updateLog) {
                // FIXME: should probably be a .dump call
                data["jingle_" + session.sid] = session.peerconnection.updateLog;
            }
        });
    }
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
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    console.log("LOCK", sharedKey);
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
