/* global JitsiMeetJs, MediaRecorder, MediaStream, webkitMediaStream*/

/**
 * Possible audio formats MIME types
 */
const AUDIO_WEBM = "audio/webm";    // Supported in chrome
const AUDIO_OGG  = "audio/ogg";     // Supported in firefox

/**
 * A TrackRecorder object holds all the information needed for recording a
 * single JitsiTrack (either remote of local)
 * @param track The JitsiTrack the object is holding
 */
var TrackRecorder = function(track){
    // The JitsiTrack holding the stream
    this.track = track;
    // The MediaRecorder recording the stream
    this.recorder = null;
    // The array of data chunks recorded from the stream
    // acts as a buffer until the data is stored on disk
    this.data = null;
};

/**
 * Creates a TrackRecorder object. Also creates the MediaRecorder and
 * data array for the trackRecorder.
 * @param track the JitsiTrack holding the audio MediaStream(s)
 */
function instantiateTrackRecorder(track)
{
    var trackRecorder = new TrackRecorder(track);
    // Create a new stream which only holds the audio track
    var originalStream = trackRecorder.track.getOriginalStream();
    var stream = createEmptyStream();
    originalStream.getAudioTracks().forEach(function(track){
        stream.addTrack(track);
    });
    // Create the MediaRecorder
    trackRecorder.recorder = new MediaRecorder(stream,
        {mimeType: audioRecorder.fileType});
    //array for holding the recorder data. Resets it when
    //audio already has been recorder once
    trackRecorder.data = [];
    // function handling a dataEvent, e.g the stream gets new data
    trackRecorder.recorder.ondataavailable = function (dataEvent) {
        if(dataEvent.data.size > 0) {
            trackRecorder.data.push(dataEvent.data);
        }
    };

    return trackRecorder;
}

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
            "right mimetype!");
    }
}

/**
 * main exported object of the file, holding all
 * relevant functions and variables for the outside world
 */
var audioRecorder = {
    // array of TrackRecorders, where each trackRecorder
    // holds the JitsiTrack, MediaRecorder and recorder data
    recorders: [],

    //get which file type is supported by the current browser
    fileType: determineCorrectFileType(),

    //boolean flag for active recording
    isRecording: false
};

/**
 * Adds a new TrackRecorder object to the array.
 *
 * @param track the track potentially holding an audio stream
 */
audioRecorder.addTrack = function (track) {
    if(track.isAudioTrack()) {
        //create the track recorder
        var trackRecorder = instantiateTrackRecorder(track);
        //push it to the local array of all recorders
        audioRecorder.recorders.push(trackRecorder);
        //if we're already recording, immediately start recording this new track
        if(audioRecorder.isRecording)        {
            trackRecorder.recorder.start();
        }
    }
};

/**
 * Notifies the module that a specific track has stopped, e.g partipant left
 * the conference.
 * This method will tell the MediaRecorder of the specific track to stop
 * recording,
 */
audioRecorder.removeTrack = function(track){
    //todo implement
};

/**
 * Starts the audio recording of every local and remote track
 */
audioRecorder.start = function () {
    if(audioRecorder.isRecording) {
        throw new Error("audiorecorder is already recording");
    }
    // set boolean isRecording flag to true so if new participants join the
    // conference, that track can instantly start recording as well
    audioRecorder.isRecording = true;
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
audioRecorder.stop = function() {
    //set the boolean flag to false
    audioRecorder.isRecording = false;
    //stop all recorders
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
 *
 * @returns {Array}
 */
audioRecorder.getBlobs = function () {
    var array = [];
    audioRecorder.recorders.forEach(function (recorder) {
        array.push(new Blob(recorder.data, {type: audioRecorder.fileType}));
    });
    return array;
};

/**
 * Gets the mime type of the recorder audio
 * @returns {String} the mime type of the recorder audio
 */
audioRecorder.getFileType = function () {
    return this.fileType;
};

/**
 * Creates a empty MediaStream object which can be used
 * to add MediaStreamTracks to
 * @returns MediaStream
 */
function createEmptyStream() {
    // Firefox supports the MediaStream object
    try {
        return new MediaStream();
    }
    // if it's chrome we have to use their webKit version
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