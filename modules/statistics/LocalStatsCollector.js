/* global config */
/**
 * Provides statistics for the local stream.
 */

var RTCBrowserType = require('../RTC/RTCBrowserType');

/**
 * Size of the webaudio analyzer buffer.
 * @type {number}
 */
var WEBAUDIO_ANALYZER_FFT_SIZE = 2048;

/**
 * Value of the webaudio analyzer smoothing time parameter.
 * @type {number}
 */
var WEBAUDIO_ANALYZER_SMOOTING_TIME = 0.8;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var context = null;

if(window.AudioContext) {
    context = new AudioContext();
}

/**
 * Converts time domain data array to audio level.
 * @param samples the time domain data array.
 * @returns {number} the audio level
 */
function timeDomainDataToAudioLevel(samples) {

    var maxVolume = 0;

    var length = samples.length;

    for (var i = 0; i < length; i++) {
        if (maxVolume < samples[i])
            maxVolume = samples[i];
    }

    return parseFloat(((maxVolume - 127) / 128).toFixed(3));
}

/**
 * Animates audio level change
 * @param newLevel the new audio level
 * @param lastLevel the last audio level
 * @returns {Number} the audio level to be set
 */
function animateLevel(newLevel, lastLevel) {
    var value = 0;
    var diff = lastLevel - newLevel;
    if(diff > 0.2) {
        value = lastLevel - 0.2;
    }
    else if(diff < -0.4) {
        value = lastLevel + 0.4;
    }
    else {
        value = newLevel;
    }

    return parseFloat(value.toFixed(3));
}


/**
 * <tt>LocalStatsCollector</tt> calculates statistics for the local stream.
 *
 * @param stream the local stream
 * @param interval stats refresh interval given in ms.
 * @param callback function that receives the audio levels.
 * @constructor
 */
function LocalStatsCollector(stream, interval, callback) {
    this.stream = stream;
    this.intervalId = null;
    this.intervalMilis = interval;
    this.audioLevel = 0;
    this.callback = callback;
}

/**
 * Starts the collecting the statistics.
 */
LocalStatsCollector.prototype.start = function () {
    if (!context ||
        RTCBrowserType.isTemasysPluginUsed())
        return;

    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = WEBAUDIO_ANALYZER_SMOOTING_TIME;
    analyser.fftSize = WEBAUDIO_ANALYZER_FFT_SIZE;

    var source = context.createMediaStreamSource(this.stream);
    source.connect(analyser);


    var self = this;

    this.intervalId = setInterval(
        function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(array);
            var audioLevel = timeDomainDataToAudioLevel(array);
            if (audioLevel != self.audioLevel) {
                self.audioLevel = animateLevel(audioLevel, self.audioLevel);
                self.callback(self.audioLevel);
            }
        },
        this.intervalMilis
    );
};

/**
 * Stops collecting the statistics.
 */
LocalStatsCollector.prototype.stop = function () {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

module.exports = LocalStatsCollector;
