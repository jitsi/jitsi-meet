import audioRecorder from './audioRecorder';
import SphinxService from
    './transcriptionServices/SphinxTranscriptionService';

/**
 *
 * @type {{audioRecorder, transcriptionService}}
 */
var transcriber =  {

    audioRecorder: audioRecorder,

    transcriptionService: new SphinxService()
};


transcriber.start = function start() {
  audioRecorder.start();
};


transcriber.stop = function stop() {
    console.log("stopping transcription and sending audio files");
    audioRecorder.stop();
    audioRecorder.getBlobs().forEach(function(audioFileBlob){
        transcriber.transcriptionService.send(audioFileBlob, blobCallBack);
    });
};

/**
 * This method gets the answer from the transcription service
 */
var blobCallBack = function(answer){
    console.log(answer);
};

/**
 * Returns the AudioRecorder module to add and remove tracks to
 */
transcriber.getAudioRecorder = function getAudioRecorder() {
    return this.audioRecorder;
};


module.exports = transcriber;