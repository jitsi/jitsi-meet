import audioRecorder from './audioRecorder';
import SphinxService from
    './transcriptionServices/SphinxTranscriptionService';



var transcriber =  {

    audioRecorder: audioRecorder,

    transcriptionService: new SphinxService()
};


transcriber.start = function start() {
  audioRecorder.start();
};


transcriber.stop = function stop() {
    audioRecorder.stop();
    audioRecorder.getByteArrays().forEach(function(byteArray){
        this.transcriptionService.send(byteArray, byteArrayCallBack);
    });
};

/**
 * Call back function which gets
 */
var byteArrayCallBack = function(answer){

};

/**
 * Returns the AudioRecorder module to add and remove tracks to
 */
transcriber.getAudioRecorder = function getAudioRecorder() {
    return this.audioRecorder;
};


module.exports = transcriber;