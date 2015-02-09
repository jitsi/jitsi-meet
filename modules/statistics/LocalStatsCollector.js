/**
 * Provides statistics for the local stream.
 */


/**
 * Size of the webaudio analizer buffer.
 * @type {number}
 */
var WEBAUDIO_ANALIZER_FFT_SIZE = 2048;

/**
 * Value of the webaudio analizer smoothing time parameter.
 * @type {number}
 */
var WEBAUDIO_ANALIZER_SMOOTING_TIME = 0.8;

/**
 * Converts time domain data array to audio level.
 * @param array the time domain data array.
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
};

/**
 * Animates audio level change
 * @param newLevel the new audio level
 * @param lastLevel the last audio level
 * @returns {Number} the audio level to be set
 */
function animateLevel(newLevel, lastLevel)
{
    var value = 0;
    var diff = lastLevel - newLevel;
    if(diff > 0.2)
    {
        value = lastLevel - 0.2;
    }
    else if(diff < -0.4)
    {
        value = lastLevel + 0.4;
    }
    else
    {
        value = newLevel;
    }

    return parseFloat(value.toFixed(3));
}


/**
 * <tt>LocalStatsCollector</tt> calculates statistics for the local stream.
 *
 * @param stream the local stream
 * @param interval stats refresh interval given in ms.
 * @param {function(LocalStatsCollector)} updateCallback the callback called on stats
 *                                   update.
 * @constructor
 */
function LocalStatsCollector(stream, interval, statisticsService, eventEmitter) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.stream = stream;
    this.intervalId = null;
    this.intervalMilis = interval;
    this.eventEmitter = eventEmitter;
    this.audioLevel = 0;
    this.statisticsService = statisticsService;
}

/**
 * Starts the collecting the statistics.
 */
LocalStatsCollector.prototype.start = function () {
    if (config.disableAudioLevels || !window.AudioContext)
        return;

    var context = new AudioContext();
    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = WEBAUDIO_ANALIZER_SMOOTING_TIME;
    analyser.fftSize = WEBAUDIO_ANALIZER_FFT_SIZE;


    var source = context.createMediaStreamSource(this.stream);
    source.connect(analyser);


    var self = this;

    this.intervalId = setInterval(
        function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(array);
            var audioLevel = timeDomainDataToAudioLevel(array);
            if(audioLevel != self.audioLevel) {
                self.audioLevel = animateLevel(audioLevel, self.audioLevel);
                self.eventEmitter.emit(
                    "statistics.audioLevel",
                    self.statisticsService.LOCAL_JID,
                    self.audioLevel);
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