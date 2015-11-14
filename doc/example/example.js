//var options = {
//    hosts: {
//        domain: "prod-us-east-1-app-xmpp1.internal.meet.hipchat.ninja",
//        focus: "focus.prod-us-east-1-app-xmpp1.internal.meet.hipchat.ninja",
//        muc: "conference.prod-us-east-1-app-xmpp1.internal.meet.hipchat.ninja", // FIXME: use XEP-0030
//    },
//    bosh: "https://xmpp1-meet.hipchat.me/http-bind", // FIXME: use xep-0156 for that
//    clientNode: "http://prod-us-east-1-app-xmpp1.internal.meet.hipchat.ninja/jitsimeet" // The name of client node advertised in XEP-0115 'c' stanza
//};

var options = {
    hosts: {
        domain: 'hristo.jitsi.net',
        muc: 'conference.hristo.jitsi.net', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.hristo.jitsi.net', // FIXME: use XEP-0030
    },
    bosh: '//hristo.jitsi.net/http-bind', // FIXME: use xep-0156 for that
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
}



// var options = {
//     hosts: {
//         domain: 'whatever.jitsi.net',
//         muc: 'conference.whatever.jitsi.net', // FIXME: use XEP-0030
//         bridge: 'jitsi-videobridge.whatever.jitsi.net', // FIXME: use XEP-0030
//     },
//     bosh: '//whatever.jitsi.net/http-bind?ROOM_NAME=conference2', // FIXME: use xep-0156 for that
//     clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
// }


var confOptions = {
    openSctp: true,
    disableAudioLevels: true
}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks)
{
    localTracks = tracks;
    tracks[0].attach($("#localAudio"));
    tracks[1].attach($("#localVideo"));
    for(var i = 0; i < localTracks.length; i++)
    {
        console.log(localTracks[i]);
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    var participant = track.getParitcipantId();
    if(!remoteTracks[participant])
        remoteTracks[participant] = [];
    remoteTracks[participant].push(track);
    var id = participant + track.getType();
    if(track.getType() == "video") {
        $("body").append("<video autoplay='1' id='" + participant + "video' />");
    } else {
        $("body").append("<audio autoplay='1' id='" + participant + "audio' />");
    }
    track.attach($("#" + id));
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined () {
    console.log("conference joined!");
    for(var i = 0; i < localTracks.length; i++)
    {
        room.addTrack(localTracks[i]);
    }
}

function onUserLeft(id) {
    if(!remoteTracks[id])
        return;
    var tracks = remoteTracks[id];
    for(var i = 0; i< tracks.length; i++)
        tracks[i].detach($("#" + id + tracks[i].getType()))
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess(){
    room = connection.initJitsiConference("conference2", confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, function () {
        console.debug("track removed!!!");
    });
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, function(id){ remoteTracks[id] = [];});
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function (track) {
        console.debug(track.getType() + " - " + track.isMuted());
    });
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, function (userID, displayName) {
        console.debug(userID + " - " + displayName);
    });
    room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      function(userID, audioLevel){
          // console.log(userID + " - " + audioLevel);
      });
    room.join();
};

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed(){console.error("Connection Failed!")};

/**
 * This function is called when we disconnect.
 */
function disconnect(){
    console.log("disconnect!");
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
}

function unload() {
//    room.leave();
    connection.disconnect();
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);



// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);

JitsiMeetJS.init();

JitsiMeetJS.enumerateDevices(function (devices) {
    for(var i = 0; i < devices.length; i++)
    {
        var device = devices[i];
        if(device.kind === "videoinput")
            $("#videoDevices").append("<option value=\"" + device.deviceId +
                "\">" + device.label + "</option>");
    }
})

var connection = null;
var room = null;
var localTracks = [];
var remoteTracks = {};


/**
 * Starts the conference with the selected device
 */
function selectDevice() {
    var videoID = $("#videoDevices").val();
    JitsiMeetJS.createLocalTracks({resolution: "720", cameraDeviceId: videoID}).then(onLocalTracks);
    connection = new JitsiMeetJS.JitsiConnection(null, null, options);

    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);

    connection.connect();
}
