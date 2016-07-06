/* global $, JitsiMeetJs */

const NEW_TRACK_EVENT = JitsiMeetJS.events.conference.TRACK_ADDED;

/**
 * main variable
 */
var audioRecorder= {
    //audio streams get added to the array
    streams: []
};


/**
 * Adds an eventListener to the TRACK_ADDED event
 * so that any newly created track gets added to our recorder
 */
audioRecorder.initListener = function(streams) {
    NEW_TRACK_EVENT.addEventListener(function (name, event) {
        console.log("new track got added: " + event);
        //streams.push(event.GETSTREAMSSOMEHOW); // FIXME
    })
};

/**
 *
 */
audioRecorder.startAudioRecording = function () {
    console.log("started recording of the audio (not really :( )");
};

/**
 * export the main variable auoRecorder
 */
module.exports = audioRecorder;



