/**
 * Abstract class representing an interface to implement a speech-to-text
 * service on.
 */
var TranscriptionService = function() {
    throw new Error("TranscriptionService is abstract and cannot be" +
        "created");
};

/**
 * This method can be used to send the recorder audio stream and
 * retrieve the answer from the transcription service from the callback
 *
 * @param byteArray the recorded audio stream as an array of bytes
 * @param callback function which will retrieve the answer
 */
TranscriptionService.prototype.send = function send(byteArray, callback){
    this.sendRequest(byteArray, this.formatResponse);
};

/**
 * Abstract method which will rend the recorder audio stream to the implemented
 * transcription service
 *
 * @param array the recorder audio stream as an array of bytes
 * @param callback function which will retrieve the answer from the service
 */
TranscriptionService.prototype.sendRequest = function(array, callback) {
    throw new Error("TranscriptionService.sendRequest is abstract");
};

/**
 * Abstract method which will parse the output from the implemented
 * transcription service to the expected format
 *
 * The transcriber class expect an array of word objects, where each word
 * object is one transcribed word by the service.
 * 
 * The expected output of this method is an array of word objects, in
 * the correct order. That is, the first object in the array is the first word
 * being said, and the last word in the array is the last word being said
 *
 * @param answer the answer from the server to be formatted
 */
TranscriptionService.prototype.formatResponse = function(answer){
    throw new Error("TranscriptionService.format is abstract");
};

module.exports = TranscriptionService;