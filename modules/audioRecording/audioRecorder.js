/* global $, JitsiMeetJs, MediaRecorder*/

/**
 * options passed along when the MediaRecorder gets created
 */
const AUDIO_WEBM = "audio/webm";
const AUDIO_OGG  = "audio/ogg";
const MEDIA_RECORDING_OPTIONS_CHROME = {mimeType: AUDIO_WEBM}; //for chrome
const MEDIA_RECORDING_OPTIONS_FIREFOX = {mimeType: AUDIO_OGG}; //for ff

/**
 * File type to convert data into when it's downloaded
 */
const FILE_TYPE = {type: 'audio/webm'};

/**
 * Object holding all the information needed for recording a single track
 */
var TrackRecorder = function(track){
    // The JitsiTrack holding the stream
    this.track = track;
    // The MediaRecorder recording the stream
    this.recorder = null;
    // The array of data chunks recorded from the stream
    this.data = null;
};

/**
 * Determines which kind of audio recording the browser supports
 * chrome supports "audio/webm" and firefox supports "audio/ogg"
 */
function determineCorrectFileType()
{
    if(MediaRecorder.isTypeSupported(AUDIO_WEBM)) {
        return AUDIO_WEBM;
    }
    else if(MediaRecorder.isTypeSupported(AUDIO_OGG)) {
        return AUDIO_OGG;
    }
    else {
        throw new Error("unable to create a MediaRecorder with the" +
            "right mimetype!")
    }
}

/**
 * main exported object of the file, holding all
 * relevant functions and variables for the outside world
 */
var audioRecorder= {
    // array of TrackRecorders, where each trackRecorder
    // holds the JitsiTrack, MediaRecorder and recorder data
    recorders: [],

    //get which file type is supported by the current browser
    fileType: determineCorrectFileType()
};

/**
 * Adds a new TrackRecorder object to the array.
 *
 * @param track the track potentially holding an audio stream
 */
audioRecorder.giveTrack = function (track) {
    if(track.isAudioTrack()) {
        console.log("added a track to the audioRecorder module");
        audioRecorder.recorders.push(new TrackRecorder(track));
    }
};

/**
 * Starts the audio recording of every local and remote track
 */
audioRecorder.startAudioRecording = function () {
    //loop through all stored tracks and create a mediaRecorder for each stream
    audioRecorder.recorders.forEach(function(trackRecorder){
        //creates the recorder if not already created
        if(trackRecorder.recorder == null) {
            // Create a new stream which only holds the audio track
            var originalStream = trackRecorder.track.getOriginalStream();
            var stream = createEmptyStream();
            originalStream.getAudioTracks().forEach(function(track){
                stream.addTrack(track);
            });
            // Create the recorder
            trackRecorder.recorder = new MediaRecorder(stream,
                {mimeType: audioRecorder.fileType});
            // function handling a dataEvent, e.g the stream gets new data
            trackRecorder.recorder.ondataavailable = function (dataEvent) {
                if(dataEvent.data.size > 0) {
                    trackRecorder.data.push(dataEvent.data);
                }
            };
        }
        //array for holding the recorder data. Resets it when
        //audio already has been recorder once
        trackRecorder.data = [];
    });

    //start all the mediaRecorders
    audioRecorder.recorders.forEach(function(trackRecorder){
        trackRecorder.recorder.start();
    });

    //log that recording has started
    console.log("Started the recording of the audio. There are currently " +
        audioRecorder.recorders.length + " recorders active.");
};

/**
 * Stops the audio recording of every local and remote track
 */
audioRecorder.stopAudioRecording = function() {
   audioRecorder.recorders.forEach(function(trackRecorder){
       trackRecorder.recorder.stop();
   });
};

/**
 * link hacking to download all recorded audio streams
 */
audioRecorder.download = function () {
    audioRecorder.recorders.forEach(function (trackRecorder) {
        var blob = new Blob(trackRecorder.data, {type: audioRecorder.fileType});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = 'test.' + audioRecorder.fileType.split("/")[1];
        a.click();
        window.URL.revokeObjectURL(url);
    });
};

/**
 * Creates a empty MediaStream object which can be used
 * to add MediaStreamTracks to
 * @returns MediaStream
 */
function createEmptyStream() {
    // Firefox supports creation of a clean empty MediaStream
    // so test if it's firefox by just returning
    // a new instance
    try {
        return new MediaStream();
    }
    // if it's chrome we need to make it the dirty way...
    catch(e){
        if(e instanceof ReferenceError)
        {
            return new webkitMediaStream();
        }
        else {
            throw new Error("cannot create a clean MediaStream");
        }
    }
}

/**
 * export the main object audioRecorder
 */
module.exports = audioRecorder;