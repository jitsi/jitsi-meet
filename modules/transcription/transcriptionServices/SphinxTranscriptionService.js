/* global config,  XMLHttpRequest */
import TranscriptionService from "../transcriptionService";

var SphinxService = function () {
    var url = getURL();
    return new TranscriptionService(send, parse);
};

SphinxService.prototype = new TranscriptionService();


SphinxService.prototype.sendRequest = function(byteArray, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if(request.readyState === XMLHttpRequest.DONE && request.status === 200)
        {
            callback(request.responseText);
        }
    };

    request.open("POST", this.url);
    request.send(byteArray);
};

function parse(answer) {

}

function getURL() {
    if(config.sphinxURL === undefined){
        throw error("config does not contain an url to a Sphinx4 http server")
    }
    else {
        return config.sphinxURL;
    }
}

module.exports = SphinxService;