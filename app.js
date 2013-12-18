/* jshint -W117 */
/* application specific logic */
var connection = null;
var focus = null;
var RTC;
var RTCPeerConnection = null;
var nickname = null;
var sharedKey = '';
var roomUrl = null;

function init() {
    RTC = setupRTC();
    if (RTC === null) {
        window.location.href = '/webrtcrequired.html';
        return;
    } else if (RTC.browser != 'chrome') {
        window.location.href = '/chromeonly.html';
        return;
    }
    RTCPeerconnection = RTC.peerconnection;

    connection = new Strophe.Connection(document.getElementById('boshURL').value || config.bosh || '/http-bind');
    /*
    connection.rawInput = function (data) { console.log('RECV: ' + data); };
    connection.rawOutput = function (data) { console.log('SEND: ' + data); };
    */
    connection.jingle.pc_constraints = RTC.pc_constraints;

    var jid = document.getElementById('jid').value || config.hosts.domain || window.location.hostname;

    connection.connect(jid, document.getElementById('password').value, function (status) {
        if (status == Strophe.Status.CONNECTED) {
            console.log('connected');
            getUserMediaWithConstraints(['audio', 'video'], '360');
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
    if (path.length > 1) {
        roomnode = path.substr(1).toLowerCase();
    } else {
        roomnode = Math.random().toString(36).substr(2, 20);
        window.history.pushState('VideoChat', 'Room: ' + roomnode, window.location.pathname + roomnode);
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

    document.getElementById('largeVideo').volume = 0;
    document.getElementById('largeVideo').src = document.getElementById('localVideo').src;
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
    var vid = document.createElement('video');
    var id = 'remoteVideo_' + sid + '_' + data.stream.id;
    vid.id = id;
    vid.autoplay = true;
    vid.oncontextmenu = function () { return false; };
    var remotes = document.getElementById('remoteVideos');
    remotes.appendChild(vid);
    var sel = $('#' + id);
    sel.hide();
    RTC.attachMediaStream(sel, data.stream);
    waitForRemoteVideo(sel, sid);
    data.stream.onended = function () {
        console.log('stream ended', this.id);
        var src = $('#' + id).attr('src');
        $('#' + id).remove();
        if (src === $('#largeVideo').attr('src')) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick = $('#remoteVideos :visible:last').get(0);
            // mute if localvideo
            document.getElementById('largeVideo').volume = pick.volume;
            document.getElementById('largeVideo').src = pick.src;
        }
        resizeThumbnails();
    };
    sel.click(
        function () {
            console.log('hover in', $(this).attr('src'));
            var newSrc = $(this).attr('src');
            if ($('#largeVideo').attr('src') != newSrc) {
                document.getElementById('largeVideo').volume = 1;
                $('#largeVideo').fadeOut(300, function () {
                    $(this).attr('src', newSrc);
                    $(this).fadeIn(300);
                });
            }
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
    console.log('call active');
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


$(document).bind('joined.muc', function (event, jid, info) {
    console.log('onJoinComplete', info);
    updateRoomUrl(window.location.href);

    // Once we've joined the muc show the toolbar
    showToolbar();

    if (Object.keys(connection.emuc.members).length < 1) {
        focus = new ColibriFocus(connection, config.hosts.bridge);
        return;
    }
});

$(document).bind('entered.muc', function (event, jid, info) {
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
    $('#largeVideo').width(availableWidth);
    $('#largeVideo').height(availableWidth / aspectRatio);
    resizeThumbnails();
}

function resizeThumbnails() {
    // Calculate the available height, which is the inner window height minus 39px for the header
    // minus 4px for the delimiter lines on the top and bottom of the large video,
    // minus the 36px space inside the remoteVideos container used for highlighting shadow.
    var availableHeight = window.innerHeight - $('#largeVideo').height() - 79;
    var numvids = $('#remoteVideos>video:visible').length;
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
    $('#remoteVideos').height(availableHeight + 36); // add the 2*18px border used for highlighting shadow.
    $('#remoteVideos>video:visible').width(availableWidth);
    $('#remoteVideos>video:visible').height(availableHeight);
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

function buttonClick(id, classname) {
    $(id).toggleClass(classname); // add the class to the clicked element
}

function openLockDialog() {
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
                    sharedKey = '';
                    lockRoom();
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

                    if (lockKey.value != null)
                    {
                        sharedKey = lockKey.value;
                        lockRoom(true);
                    }
                }
            }
        });
}

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

function lockRoom(lock) {
    connection.emuc.lockRoom(sharedKey);
    
    buttonClick("#lockIcon", "fa fa-unlock fa-lg fa fa-lock fa-lg");
}

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

function showToolbar() {
    $('#toolbar').css({visibility:"visible"});
}

function updateRoomUrl(newRoomUrl) {
    roomUrl = newRoomUrl;
}
