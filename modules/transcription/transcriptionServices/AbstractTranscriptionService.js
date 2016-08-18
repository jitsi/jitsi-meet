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
 * @param {RecordingResult} recordingResult a recordingResult object which
 * includes the recorded audio stream as a blob
 * @param {Function} callback  which will retrieve the a RecordingResult with
 *        the answer as a WordArray
 */
TranscriptionService.prototype.send = function send(recordingResult, callback){
    var t = this;
    this.sendRequest(recordingResult.blob, function(response){
        if(!t.verify(response)){
               console.log("the retrieved response from the server" +
                   " is not valid!");
            recordingResult.wordArray = [];
            callback(recordingResult);
        }
        else{
            recordingResult.wordArray = t.formatResponse(response);
            callback(recordingResult);
        }
    });
};

/**
 * Abstract method which will rend the recorder audio stream to the implemented
 * transcription service and will retrieve an answer, which will be
 * called on the given callback method
 *
 * @param {Blob} audioBlob the recorded audio stream as a single Blob
 * @param {function} callback function which will retrieve the answer
 *                            from the service
 */
TranscriptionService.prototype.sendRequest = function(audioBlob, callback) {
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
 * @param response the answer from the speech-to-text server which needs to be
 *                 formatted
 * @return {Array<Word>} an array of Word objects
 */
TranscriptionService.prototype.formatResponse = function(response){
    throw new Error("TranscriptionService.format is abstract");
};

/**
 * Abstract method which will verify that the response from the server is valid
 *
 * @param response the response from the server
 * @return {boolean} true if response is valid, false otherwise
 */
TranscriptionService.prototype.verify = function(response){
      throw new Error("TranscriptionService.verify is abstract");
};

module.exports = TranscriptionService;