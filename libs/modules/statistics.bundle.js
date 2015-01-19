!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.statistics=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    if (!window.AudioContext)
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
},{}],2:[function(require,module,exports){
/* global focusMucJid, ssrc2jid */
/* jshint -W117 */
/**
 * Calculates packet lost percent using the number of lost packets and the
 * number of all packet.
 * @param lostPackets the number of lost packets
 * @param totalPackets the number of all packets.
 * @returns {number} packet loss percent
 */
function calculatePacketLoss(lostPackets, totalPackets) {
    if(!totalPackets || totalPackets <= 0 || !lostPackets || lostPackets <= 0)
        return 0;
    return Math.round((lostPackets/totalPackets)*100);
}

function getStatValue(item, name) {
    if(!keyMap[RTC.getBrowserType()][name])
        throw "The property isn't supported!";
    var key = keyMap[RTC.getBrowserType()][name];
    return RTC.getBrowserType() == RTCBrowserType.RTC_BROWSER_CHROME? item.stat(key) : item[key];
}

/**
 * Peer statistics data holder.
 * @constructor
 */
function PeerStats()
{
    this.ssrc2Loss = {};
    this.ssrc2AudioLevel = {};
    this.ssrc2bitrate = {};
    this.ssrc2resolution = {};
}

/**
 * The bandwidth
 * @type {{}}
 */
PeerStats.bandwidth = {};

/**
 * The bit rate
 * @type {{}}
 */
PeerStats.bitrate = {};



/**
 * The packet loss rate
 * @type {{}}
 */
PeerStats.packetLoss = null;

/**
 * Sets packets loss rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param lossRate new packet loss rate value to be set.
 */
PeerStats.prototype.setSsrcLoss = function (ssrc, lossRate)
{
    this.ssrc2Loss[ssrc] = lossRate;
};

/**
 * Sets resolution for given <tt>ssrc</tt> that belong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param resolution new resolution value to be set.
 */
PeerStats.prototype.setSsrcResolution = function (ssrc, resolution)
{
    if(resolution === null && this.ssrc2resolution[ssrc])
    {
        delete this.ssrc2resolution[ssrc];
    }
    else if(resolution !== null)
        this.ssrc2resolution[ssrc] = resolution;
};

/**
 * Sets the bit rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param bitrate new bitrate value to be set.
 */
PeerStats.prototype.setSsrcBitrate = function (ssrc, bitrate)
{
    if(this.ssrc2bitrate[ssrc])
    {
        this.ssrc2bitrate[ssrc].download += bitrate.download;
        this.ssrc2bitrate[ssrc].upload += bitrate.upload;
    }
    else {
        this.ssrc2bitrate[ssrc] = bitrate;
    }
};

/**
 * Sets new audio level(input or output) for given <tt>ssrc</tt> that identifies
 * the stream which belongs to the peer represented by this instance.
 * @param ssrc RTP stream SSRC for which current audio level value will be
 *        updated.
 * @param audioLevel the new audio level value to be set. Value is truncated to
 *        fit the range from 0 to 1.
 */
PeerStats.prototype.setSsrcAudioLevel = function (ssrc, audioLevel)
{
    // Range limit 0 - 1
    this.ssrc2AudioLevel[ssrc] = Math.min(Math.max(audioLevel, 0), 1);
};

/**
 * Array with the transport information.
 * @type {Array}
 */
PeerStats.transport = [];


/**
 * <tt>StatsCollector</tt> registers for stats updates of given
 * <tt>peerconnection</tt> in given <tt>interval</tt>. On each update particular
 * stats are extracted and put in {@link PeerStats} objects. Once the processing
 * is done <tt>audioLevelsUpdateCallback</tt> is called with <tt>this</tt>
 * instance as an event source.
 *
 * @param peerconnection webRTC peer connection object.
 * @param interval stats refresh interval given in ms.
 * @param {function(StatsCollector)} audioLevelsUpdateCallback the callback
 * called on stats update.
 * @constructor
 */
function StatsCollector(peerconnection, audioLevelsInterval, statsInterval, eventEmitter)
{
    this.peerconnection = peerconnection;
    this.baselineAudioLevelsReport = null;
    this.currentAudioLevelsReport = null;
    this.currentStatsReport = null;
    this.baselineStatsReport = null;
    this.audioLevelsIntervalId = null;
    this.eventEmitter = eventEmitter;

    /**
     * Gather PeerConnection stats once every this many milliseconds.
     */
    this.GATHER_INTERVAL = 10000;

    /**
     * Log stats via the focus once every this many milliseconds.
     */
    this.LOG_INTERVAL = 60000;

    /**
     * Gather stats and store them in this.statsToBeLogged.
     */
    this.gatherStatsIntervalId = null;

    /**
     * Send the stats already saved in this.statsToBeLogged to be logged via
     * the focus.
     */
    this.logStatsIntervalId = null;

    /**
     * Stores the statistics which will be send to the focus to be logged.
     */
    this.statsToBeLogged =
    {
        timestamps: [],
        stats: {}
    };

    // Updates stats interval
    this.audioLevelsIntervalMilis = audioLevelsInterval;

    this.statsIntervalId = null;
    this.statsIntervalMilis = statsInterval;
    // Map of jids to PeerStats
    this.jid2stats = {};
}

module.exports = StatsCollector;

/**
 * Stops stats updates.
 */
StatsCollector.prototype.stop = function ()
{
    if (this.audioLevelsIntervalId)
    {
        clearInterval(this.audioLevelsIntervalId);
        this.audioLevelsIntervalId = null;
        clearInterval(this.statsIntervalId);
        this.statsIntervalId = null;
        clearInterval(this.logStatsIntervalId);
        this.logStatsIntervalId = null;
        clearInterval(this.gatherStatsIntervalId);
        this.gatherStatsIntervalId = null;
    }
};

/**
 * Callback passed to <tt>getStats</tt> method.
 * @param error an error that occurred on <tt>getStats</tt> call.
 */
StatsCollector.prototype.errorCallback = function (error)
{
    console.error("Get stats error", error);
    this.stop();
};

/**
 * Starts stats updates.
 */
StatsCollector.prototype.start = function ()
{
    var self = this;
    this.audioLevelsIntervalId = setInterval(
        function ()
        {
            // Interval updates
            self.peerconnection.getStats(
                function (report)
                {
                    var results = null;
                    if(!report || !report.result || typeof report.result != 'function')
                    {
                        results = report;
                    }
                    else
                    {
                        results = report.result();
                    }
                    //console.error("Got interval report", results);
                    self.currentAudioLevelsReport = results;
                    self.processAudioLevelReport();
                    self.baselineAudioLevelsReport =
                        self.currentAudioLevelsReport;
                },
                self.errorCallback
            );
        },
        self.audioLevelsIntervalMilis
    );

    this.statsIntervalId = setInterval(
        function () {
            // Interval updates
            self.peerconnection.getStats(
                function (report)
                {
                    var results = null;
                    if(!report || !report.result || typeof report.result != 'function')
                    {
                        //firefox
                        results = report;
                    }
                    else
                    {
                        //chrome
                        results = report.result();
                    }
                    //console.error("Got interval report", results);
                    self.currentStatsReport = results;
                    try
                    {
                        self.processStatsReport();
                    }
                    catch (e)
                    {
                        console.error("Unsupported key:" + e, e);
                    }

                    self.baselineStatsReport = self.currentStatsReport;
                },
                self.errorCallback
            );
        },
        self.statsIntervalMilis
    );

    if (config.logStats) {
        this.gatherStatsIntervalId = setInterval(
            function () {
                self.peerconnection.getStats(
                    function (report) {
                        self.addStatsToBeLogged(report.result());
                    },
                    function () {
                    }
                );
            },
            this.GATHER_INTERVAL
        );

        this.logStatsIntervalId = setInterval(
            function() { self.logStats(); },
            this.LOG_INTERVAL);
    }
};

/**
 * Converts the stats to the format used for logging, and saves the data in
 * this.statsToBeLogged.
 * @param reports Reports as given by webkitRTCPerConnection.getStats.
 */
StatsCollector.prototype.addStatsToBeLogged = function (reports) {
    var self = this;
    var num_records = this.statsToBeLogged.timestamps.length;
    this.statsToBeLogged.timestamps.push(new Date().getTime());
    reports.map(function (report) {
        var stat = self.statsToBeLogged.stats[report.id];
        if (!stat) {
            stat = self.statsToBeLogged.stats[report.id] = {};
        }
        stat.type = report.type;
        report.names().map(function (name) {
            var values = stat[name];
            if (!values) {
                values = stat[name] = [];
            }
            while (values.length < num_records) {
                values.push(null);
            }
            values.push(report.stat(name));
        });
    });
};

StatsCollector.prototype.logStats = function () {
    if (!focusMucJid) {
        return;
    }

    var deflate = true;

    var content = JSON.stringify(this.statsToBeLogged);
    if (deflate) {
        content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
    }
    content = Base64.encode(content);

    xmpp.sendLogs(content);
    // Reset the stats
    this.statsToBeLogged.stats = {};
    this.statsToBeLogged.timestamps = [];
};
var keyMap = {};
keyMap[RTCBrowserType.RTC_BROWSER_FIREFOX] = {
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsLost": "packetsLost",
    "packetsSent": "packetsSent",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent"
};
keyMap[RTCBrowserType.RTC_BROWSER_CHROME] = {
    "receiveBandwidth": "googAvailableReceiveBandwidth",
    "sendBandwidth": "googAvailableSendBandwidth",
    "remoteAddress": "googRemoteAddress",
    "transportType": "googTransportType",
    "localAddress": "googLocalAddress",
    "activeConnection": "googActiveConnection",
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsSent": "packetsSent",
    "packetsLost": "packetsLost",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent",
    "googFrameHeightReceived": "googFrameHeightReceived",
    "googFrameWidthReceived": "googFrameWidthReceived",
    "googFrameHeightSent": "googFrameHeightSent",
    "googFrameWidthSent": "googFrameWidthSent",
    "audioInputLevel": "audioInputLevel",
    "audioOutputLevel": "audioOutputLevel"
};


/**
 * Stats processing logic.
 */
StatsCollector.prototype.processStatsReport = function () {
    if (!this.baselineStatsReport) {
        return;
    }

    for (var idx in this.currentStatsReport) {
        var now = this.currentStatsReport[idx];
        try {
            if (getStatValue(now, 'receiveBandwidth') ||
                getStatValue(now, 'sendBandwidth')) {
                PeerStats.bandwidth = {
                    "download": Math.round(
                            (getStatValue(now, 'receiveBandwidth')) / 1000),
                    "upload": Math.round(
                            (getStatValue(now, 'sendBandwidth')) / 1000)
                };
            }
        }
        catch(e){/*not supported*/}

        if(now.type == 'googCandidatePair')
        {
            var ip, type, localIP, active;
            try {
                ip = getStatValue(now, 'remoteAddress');
                type = getStatValue(now, "transportType");
                localIP = getStatValue(now, "localAddress");
                active = getStatValue(now, "activeConnection");
            }
            catch(e){/*not supported*/}
            if(!ip || !type || !localIP || active != "true")
                continue;
            var addressSaved = false;
            for(var i = 0; i < PeerStats.transport.length; i++)
            {
                if(PeerStats.transport[i].ip == ip &&
                    PeerStats.transport[i].type == type &&
                    PeerStats.transport[i].localip == localIP)
                {
                    addressSaved = true;
                }
            }
            if(addressSaved)
                continue;
            PeerStats.transport.push({localip: localIP, ip: ip, type: type});
            continue;
        }

        if(now.type == "candidatepair")
        {
            if(now.state == "succeeded")
                continue;

            var local = this.currentStatsReport[now.localCandidateId];
            var remote = this.currentStatsReport[now.remoteCandidateId];
            PeerStats.transport.push({localip: local.ipAddress + ":" + local.portNumber,
                ip: remote.ipAddress + ":" + remote.portNumber, type: local.transport});

        }

        if (now.type != 'ssrc' && now.type != "outboundrtp" &&
            now.type != "inboundrtp") {
            continue;
        }

        var before = this.baselineStatsReport[idx];
        if (!before) {
            console.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        if(!ssrc)
            continue;
        var jid = ssrc2jid[ssrc];
        if (!jid && (Date.now() - now.timestamp) < 3000) {
            console.warn("No jid for ssrc: " + ssrc);
            continue;
        }

        var jidStats = this.jid2stats[jid];
        if (!jidStats) {
            jidStats = new PeerStats();
            this.jid2stats[jid] = jidStats;
        }


        var isDownloadStream = true;
        var key = 'packetsReceived';
        if (!getStatValue(now, key))
        {
            isDownloadStream = false;
            key = 'packetsSent';
            if (!getStatValue(now, key))
            {
                console.warn("No packetsReceived nor packetSent stat found");
                continue;
            }
        }
        var packetsNow = getStatValue(now, key);
        if(!packetsNow || packetsNow < 0)
            packetsNow = 0;

        var packetsBefore = getStatValue(before, key);
        if(!packetsBefore || packetsBefore < 0)
            packetsBefore = 0;
        var packetRate = packetsNow - packetsBefore;
        if(!packetRate || packetRate < 0)
            packetRate = 0;
        var currentLoss = getStatValue(now, 'packetsLost');
        if(!currentLoss || currentLoss < 0)
            currentLoss = 0;
        var previousLoss = getStatValue(before, 'packetsLost');
        if(!previousLoss || previousLoss < 0)
            previousLoss = 0;
        var lossRate = currentLoss - previousLoss;
        if(!lossRate || lossRate < 0)
            lossRate = 0;
        var packetsTotal = (packetRate + lossRate);

        jidStats.setSsrcLoss(ssrc,
            {"packetsTotal": packetsTotal,
                "packetsLost": lossRate,
                "isDownloadStream": isDownloadStream});


        var bytesReceived = 0, bytesSent = 0;
        if(getStatValue(now, "bytesReceived"))
        {
            bytesReceived = getStatValue(now, "bytesReceived") -
                getStatValue(before, "bytesReceived");
        }

        if(getStatValue(now, "bytesSent"))
        {
            bytesSent = getStatValue(now, "bytesSent") -
                getStatValue(before, "bytesSent");
        }

        var time = Math.round((now.timestamp - before.timestamp) / 1000);
        if(bytesReceived <= 0 || time <= 0)
        {
            bytesReceived = 0;
        }
        else
        {
            bytesReceived = Math.round(((bytesReceived * 8) / time) / 1000);
        }

        if(bytesSent <= 0 || time <= 0)
        {
            bytesSent = 0;
        }
        else
        {
            bytesSent = Math.round(((bytesSent * 8) / time) / 1000);
        }

        jidStats.setSsrcBitrate(ssrc, {
            "download": bytesReceived,
            "upload": bytesSent});

        var resolution = {height: null, width: null};
        try {
            if (getStatValue(now, "googFrameHeightReceived") &&
                getStatValue(now, "googFrameWidthReceived")) {
                resolution.height = getStatValue(now, "googFrameHeightReceived");
                resolution.width = getStatValue(now, "googFrameWidthReceived");
            }
            else if (getStatValue(now, "googFrameHeightSent") &&
                getStatValue(now, "googFrameWidthSent")) {
                resolution.height = getStatValue(now, "googFrameHeightSent");
                resolution.width = getStatValue(now, "googFrameWidthSent");
            }
        }
        catch(e){/*not supported*/}

        if(resolution.height && resolution.width)
        {
            jidStats.setSsrcResolution(ssrc, resolution);
        }
        else
        {
            jidStats.setSsrcResolution(ssrc, null);
        }


    }

    var self = this;
    // Jid stats
    var totalPackets = {download: 0, upload: 0};
    var lostPackets = {download: 0, upload: 0};
    var bitrateDownload = 0;
    var bitrateUpload = 0;
    var resolutions = {};
    Object.keys(this.jid2stats).forEach(
        function (jid)
        {
            Object.keys(self.jid2stats[jid].ssrc2Loss).forEach(
                function (ssrc)
                {
                    var type = "upload";
                    if(self.jid2stats[jid].ssrc2Loss[ssrc].isDownloadStream)
                        type = "download";
                    totalPackets[type] +=
                        self.jid2stats[jid].ssrc2Loss[ssrc].packetsTotal;
                    lostPackets[type] +=
                        self.jid2stats[jid].ssrc2Loss[ssrc].packetsLost;
                }
            );
            Object.keys(self.jid2stats[jid].ssrc2bitrate).forEach(
                function (ssrc) {
                    bitrateDownload +=
                        self.jid2stats[jid].ssrc2bitrate[ssrc].download;
                    bitrateUpload +=
                        self.jid2stats[jid].ssrc2bitrate[ssrc].upload;

                    delete self.jid2stats[jid].ssrc2bitrate[ssrc];
                }
            );
            resolutions[jid] = self.jid2stats[jid].ssrc2resolution;
        }
    );

    PeerStats.bitrate = {"upload": bitrateUpload, "download": bitrateDownload};

    PeerStats.packetLoss = {
        total:
            calculatePacketLoss(lostPackets.download + lostPackets.upload,
                    totalPackets.download + totalPackets.upload),
        download:
            calculatePacketLoss(lostPackets.download, totalPackets.download),
        upload:
            calculatePacketLoss(lostPackets.upload, totalPackets.upload)
    };
    this.eventEmitter.emit("statistics.connectionstats",
        {
            "bitrate": PeerStats.bitrate,
            "packetLoss": PeerStats.packetLoss,
            "bandwidth": PeerStats.bandwidth,
            "resolution": resolutions,
            "transport": PeerStats.transport
        });
    PeerStats.transport = [];

};

/**
 * Stats processing logic.
 */
StatsCollector.prototype.processAudioLevelReport = function ()
{
    if (!this.baselineAudioLevelsReport)
    {
        return;
    }

    for (var idx in this.currentAudioLevelsReport)
    {
        var now = this.currentAudioLevelsReport[idx];

        if (now.type != 'ssrc')
        {
            continue;
        }

        var before = this.baselineAudioLevelsReport[idx];
        if (!before)
        {
            console.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        var jid = ssrc2jid[ssrc];
        if (!jid && (Date.now() - now.timestamp) < 3000)
        {
            console.warn("No jid for ssrc: " + ssrc);
            continue;
        }

        var jidStats = this.jid2stats[jid];
        if (!jidStats)
        {
            jidStats = new PeerStats();
            this.jid2stats[jid] = jidStats;
        }

        // Audio level
        var audioLevel = null;

        try {
            audioLevel = getStatValue(now, 'audioInputLevel');
            if (!audioLevel)
                audioLevel = getStatValue(now, 'audioOutputLevel');
        }
        catch(e) {/*not supported*/
            console.warn("Audio Levels are not available in the statistics.");
            clearInterval(this.audioLevelsIntervalId);
            return;
        }

        if (audioLevel)
        {
            // TODO: can't find specs about what this value really is,
            // but it seems to vary between 0 and around 32k.
            audioLevel = audioLevel / 32767;
            jidStats.setSsrcAudioLevel(ssrc, audioLevel);
            if(jid != xmpp.myJid())
                this.eventEmitter.emit("statistics.audioLevel", jid, audioLevel);
        }

    }


};
},{}],3:[function(require,module,exports){
/**
 * Created by hristo on 8/4/14.
 */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
//These lines should be uncommented when require works in app.js
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
//var RTCBrowserType = require("../../service/RTC/RTCBrowserType");
//var XMPPEvents = require("../service/xmpp/XMPPEvents");

var eventEmitter = new EventEmitter();

var localStats = null;

var rtpStats = null;

function stopLocal()
{
    if(localStats)
    {
        localStats.stop();
        localStats = null;
    }
}

function stopRemote()
{
    if(rtpStats)
    {
        rtpStats.stop();
        eventEmitter.emit("statistics.stop");
        rtpStats = null;
    }
}

function startRemoteStats (peerconnection) {
    if (config.enableRtpStats)
    {
        if(rtpStats)
        {
            rtpStats.stop();
            rtpStats = null;
        }

        rtpStats = new RTPStats(peerconnection, 200, 2000, eventEmitter);
        rtpStats.start();
    }

}

function onStreamCreated(stream)
{
    if(stream.getOriginalStream().getAudioTracks().length === 0)
        return;

    localStats = new LocalStats(stream.getOriginalStream(), 100, statistics,
        eventEmitter);
    localStats.start();
}

function onDisposeConference(onUnload) {
    stopRemote();
    if(onUnload) {
        stopLocal();
        eventEmitter.removeAllListeners();
    }
}


var statistics =
{
    /**
     * Indicates that this audio level is for local jid.
     * @type {string}
     */
    LOCAL_JID: 'local',

    addAudioLevelListener: function(listener)
    {
        eventEmitter.on("statistics.audioLevel", listener);
    },

    removeAudioLevelListener: function(listener)
    {
        eventEmitter.removeListener("statistics.audioLevel", listener);
    },

    addConnectionStatsListener: function(listener)
    {
        eventEmitter.on("statistics.connectionstats", listener);
    },

    removeConnectionStatsListener: function(listener)
    {
        eventEmitter.removeListener("statistics.connectionstats", listener);
    },


    addRemoteStatsStopListener: function(listener)
    {
        eventEmitter.on("statistics.stop", listener);
    },

    removeRemoteStatsStopListener: function(listener)
    {
        eventEmitter.removeListener("statistics.stop", listener);
    },

    stop: function () {
        stopLocal();
        stopRemote();
        if(eventEmitter)
        {
            eventEmitter.removeAllListeners();
        }
    },

    stopRemoteStatistics: function()
    {
        stopRemote();
    },

    onConferenceCreated: function (event) {
        startRemoteStats(event.peerconnection);
    },

    start: function () {
        this.addConnectionStatsListener(connectionquality.updateLocalStats);
        this.addRemoteStatsStopListener(connectionquality.stopSendingStats);
        RTC.addStreamListener(onStreamCreated,
            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
        xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
    }

};




module.exports = statistics;
},{"./LocalStatsCollector.js":1,"./RTPStatsCollector.js":2,"events":4}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3N0YXRpc3RpY3MvTG9jYWxTdGF0c0NvbGxlY3Rvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc3RhdGlzdGljcy9SVFBTdGF0c0NvbGxlY3Rvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc3RhdGlzdGljcy9zdGF0aXN0aWNzLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIFByb3ZpZGVzIHN0YXRpc3RpY3MgZm9yIHRoZSBsb2NhbCBzdHJlYW0uXG4gKi9cblxuXG4vKipcbiAqIFNpemUgb2YgdGhlIHdlYmF1ZGlvIGFuYWxpemVyIGJ1ZmZlci5cbiAqIEB0eXBlIHtudW1iZXJ9XG4gKi9cbnZhciBXRUJBVURJT19BTkFMSVpFUl9GRlRfU0laRSA9IDIwNDg7XG5cbi8qKlxuICogVmFsdWUgb2YgdGhlIHdlYmF1ZGlvIGFuYWxpemVyIHNtb290aGluZyB0aW1lIHBhcmFtZXRlci5cbiAqIEB0eXBlIHtudW1iZXJ9XG4gKi9cbnZhciBXRUJBVURJT19BTkFMSVpFUl9TTU9PVElOR19USU1FID0gMC44O1xuXG4vKipcbiAqIENvbnZlcnRzIHRpbWUgZG9tYWluIGRhdGEgYXJyYXkgdG8gYXVkaW8gbGV2ZWwuXG4gKiBAcGFyYW0gYXJyYXkgdGhlIHRpbWUgZG9tYWluIGRhdGEgYXJyYXkuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB0aGUgYXVkaW8gbGV2ZWxcbiAqL1xuZnVuY3Rpb24gdGltZURvbWFpbkRhdGFUb0F1ZGlvTGV2ZWwoc2FtcGxlcykge1xuXG4gICAgdmFyIG1heFZvbHVtZSA9IDA7XG5cbiAgICB2YXIgbGVuZ3RoID0gc2FtcGxlcy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXhWb2x1bWUgPCBzYW1wbGVzW2ldKVxuICAgICAgICAgICAgbWF4Vm9sdW1lID0gc2FtcGxlc1tpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VGbG9hdCgoKG1heFZvbHVtZSAtIDEyNykgLyAxMjgpLnRvRml4ZWQoMykpO1xufTtcblxuLyoqXG4gKiBBbmltYXRlcyBhdWRpbyBsZXZlbCBjaGFuZ2VcbiAqIEBwYXJhbSBuZXdMZXZlbCB0aGUgbmV3IGF1ZGlvIGxldmVsXG4gKiBAcGFyYW0gbGFzdExldmVsIHRoZSBsYXN0IGF1ZGlvIGxldmVsXG4gKiBAcmV0dXJucyB7TnVtYmVyfSB0aGUgYXVkaW8gbGV2ZWwgdG8gYmUgc2V0XG4gKi9cbmZ1bmN0aW9uIGFuaW1hdGVMZXZlbChuZXdMZXZlbCwgbGFzdExldmVsKVxue1xuICAgIHZhciB2YWx1ZSA9IDA7XG4gICAgdmFyIGRpZmYgPSBsYXN0TGV2ZWwgLSBuZXdMZXZlbDtcbiAgICBpZihkaWZmID4gMC4yKVxuICAgIHtcbiAgICAgICAgdmFsdWUgPSBsYXN0TGV2ZWwgLSAwLjI7XG4gICAgfVxuICAgIGVsc2UgaWYoZGlmZiA8IC0wLjQpXG4gICAge1xuICAgICAgICB2YWx1ZSA9IGxhc3RMZXZlbCArIDAuNDtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdmFsdWUgPSBuZXdMZXZlbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZS50b0ZpeGVkKDMpKTtcbn1cblxuXG4vKipcbiAqIDx0dD5Mb2NhbFN0YXRzQ29sbGVjdG9yPC90dD4gY2FsY3VsYXRlcyBzdGF0aXN0aWNzIGZvciB0aGUgbG9jYWwgc3RyZWFtLlxuICpcbiAqIEBwYXJhbSBzdHJlYW0gdGhlIGxvY2FsIHN0cmVhbVxuICogQHBhcmFtIGludGVydmFsIHN0YXRzIHJlZnJlc2ggaW50ZXJ2YWwgZ2l2ZW4gaW4gbXMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKExvY2FsU3RhdHNDb2xsZWN0b3IpfSB1cGRhdGVDYWxsYmFjayB0aGUgY2FsbGJhY2sgY2FsbGVkIG9uIHN0YXRzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExvY2FsU3RhdHNDb2xsZWN0b3Ioc3RyZWFtLCBpbnRlcnZhbCwgc3RhdGlzdGljc1NlcnZpY2UsIGV2ZW50RW1pdHRlcikge1xuICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XG4gICAgdGhpcy5pbnRlcnZhbElkID0gbnVsbDtcbiAgICB0aGlzLmludGVydmFsTWlsaXMgPSBpbnRlcnZhbDtcbiAgICB0aGlzLmV2ZW50RW1pdHRlciA9IGV2ZW50RW1pdHRlcjtcbiAgICB0aGlzLmF1ZGlvTGV2ZWwgPSAwO1xuICAgIHRoaXMuc3RhdGlzdGljc1NlcnZpY2UgPSBzdGF0aXN0aWNzU2VydmljZTtcbn1cblxuLyoqXG4gKiBTdGFydHMgdGhlIGNvbGxlY3RpbmcgdGhlIHN0YXRpc3RpY3MuXG4gKi9cbkxvY2FsU3RhdHNDb2xsZWN0b3IucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghd2luZG93LkF1ZGlvQ29udGV4dClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdmFyIGFuYWx5c2VyID0gY29udGV4dC5jcmVhdGVBbmFseXNlcigpO1xuICAgIGFuYWx5c2VyLnNtb290aGluZ1RpbWVDb25zdGFudCA9IFdFQkFVRElPX0FOQUxJWkVSX1NNT09USU5HX1RJTUU7XG4gICAgYW5hbHlzZXIuZmZ0U2l6ZSA9IFdFQkFVRElPX0FOQUxJWkVSX0ZGVF9TSVpFO1xuXG5cbiAgICB2YXIgc291cmNlID0gY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZSh0aGlzLnN0cmVhbSk7XG4gICAgc291cmNlLmNvbm5lY3QoYW5hbHlzZXIpO1xuXG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmludGVydmFsSWQgPSBzZXRJbnRlcnZhbChcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYW5hbHlzZXIuZnJlcXVlbmN5QmluQ291bnQpO1xuICAgICAgICAgICAgYW5hbHlzZXIuZ2V0Qnl0ZVRpbWVEb21haW5EYXRhKGFycmF5KTtcbiAgICAgICAgICAgIHZhciBhdWRpb0xldmVsID0gdGltZURvbWFpbkRhdGFUb0F1ZGlvTGV2ZWwoYXJyYXkpO1xuICAgICAgICAgICAgaWYoYXVkaW9MZXZlbCAhPSBzZWxmLmF1ZGlvTGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmF1ZGlvTGV2ZWwgPSBhbmltYXRlTGV2ZWwoYXVkaW9MZXZlbCwgc2VsZi5hdWRpb0xldmVsKTtcbiAgICAgICAgICAgICAgICBzZWxmLmV2ZW50RW1pdHRlci5lbWl0KFxuICAgICAgICAgICAgICAgICAgICBcInN0YXRpc3RpY3MuYXVkaW9MZXZlbFwiLFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN0YXRpc3RpY3NTZXJ2aWNlLkxPQ0FMX0pJRCxcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hdWRpb0xldmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGhpcy5pbnRlcnZhbE1pbGlzXG4gICAgKTtcblxufTtcblxuLyoqXG4gKiBTdG9wcyBjb2xsZWN0aW5nIHRoZSBzdGF0aXN0aWNzLlxuICovXG5Mb2NhbFN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmludGVydmFsSWQpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSWQpO1xuICAgICAgICB0aGlzLmludGVydmFsSWQgPSBudWxsO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxTdGF0c0NvbGxlY3RvcjsiLCIvKiBnbG9iYWwgZm9jdXNNdWNKaWQsIHNzcmMyamlkICovXG4vKiBqc2hpbnQgLVcxMTcgKi9cbi8qKlxuICogQ2FsY3VsYXRlcyBwYWNrZXQgbG9zdCBwZXJjZW50IHVzaW5nIHRoZSBudW1iZXIgb2YgbG9zdCBwYWNrZXRzIGFuZCB0aGVcbiAqIG51bWJlciBvZiBhbGwgcGFja2V0LlxuICogQHBhcmFtIGxvc3RQYWNrZXRzIHRoZSBudW1iZXIgb2YgbG9zdCBwYWNrZXRzXG4gKiBAcGFyYW0gdG90YWxQYWNrZXRzIHRoZSBudW1iZXIgb2YgYWxsIHBhY2tldHMuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBwYWNrZXQgbG9zcyBwZXJjZW50XG4gKi9cbmZ1bmN0aW9uIGNhbGN1bGF0ZVBhY2tldExvc3MobG9zdFBhY2tldHMsIHRvdGFsUGFja2V0cykge1xuICAgIGlmKCF0b3RhbFBhY2tldHMgfHwgdG90YWxQYWNrZXRzIDw9IDAgfHwgIWxvc3RQYWNrZXRzIHx8IGxvc3RQYWNrZXRzIDw9IDApXG4gICAgICAgIHJldHVybiAwO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKChsb3N0UGFja2V0cy90b3RhbFBhY2tldHMpKjEwMCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0YXRWYWx1ZShpdGVtLCBuYW1lKSB7XG4gICAgaWYoIWtleU1hcFtSVEMuZ2V0QnJvd3NlclR5cGUoKV1bbmFtZV0pXG4gICAgICAgIHRocm93IFwiVGhlIHByb3BlcnR5IGlzbid0IHN1cHBvcnRlZCFcIjtcbiAgICB2YXIga2V5ID0ga2V5TWFwW1JUQy5nZXRCcm93c2VyVHlwZSgpXVtuYW1lXTtcbiAgICByZXR1cm4gUlRDLmdldEJyb3dzZXJUeXBlKCkgPT0gUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfQ0hST01FPyBpdGVtLnN0YXQoa2V5KSA6IGl0ZW1ba2V5XTtcbn1cblxuLyoqXG4gKiBQZWVyIHN0YXRpc3RpY3MgZGF0YSBob2xkZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGVlclN0YXRzKClcbntcbiAgICB0aGlzLnNzcmMyTG9zcyA9IHt9O1xuICAgIHRoaXMuc3NyYzJBdWRpb0xldmVsID0ge307XG4gICAgdGhpcy5zc3JjMmJpdHJhdGUgPSB7fTtcbiAgICB0aGlzLnNzcmMycmVzb2x1dGlvbiA9IHt9O1xufVxuXG4vKipcbiAqIFRoZSBiYW5kd2lkdGhcbiAqIEB0eXBlIHt7fX1cbiAqL1xuUGVlclN0YXRzLmJhbmR3aWR0aCA9IHt9O1xuXG4vKipcbiAqIFRoZSBiaXQgcmF0ZVxuICogQHR5cGUge3t9fVxuICovXG5QZWVyU3RhdHMuYml0cmF0ZSA9IHt9O1xuXG5cblxuLyoqXG4gKiBUaGUgcGFja2V0IGxvc3MgcmF0ZVxuICogQHR5cGUge3t9fVxuICovXG5QZWVyU3RhdHMucGFja2V0TG9zcyA9IG51bGw7XG5cbi8qKlxuICogU2V0cyBwYWNrZXRzIGxvc3MgcmF0ZSBmb3IgZ2l2ZW4gPHR0PnNzcmM8L3R0PiB0aGF0IGJsb25nIHRvIHRoZSBwZWVyXG4gKiByZXByZXNlbnRlZCBieSB0aGlzIGluc3RhbmNlLlxuICogQHBhcmFtIHNzcmMgYXVkaW8gb3IgdmlkZW8gUlRQIHN0cmVhbSBTU1JDLlxuICogQHBhcmFtIGxvc3NSYXRlIG5ldyBwYWNrZXQgbG9zcyByYXRlIHZhbHVlIHRvIGJlIHNldC5cbiAqL1xuUGVlclN0YXRzLnByb3RvdHlwZS5zZXRTc3JjTG9zcyA9IGZ1bmN0aW9uIChzc3JjLCBsb3NzUmF0ZSlcbntcbiAgICB0aGlzLnNzcmMyTG9zc1tzc3JjXSA9IGxvc3NSYXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIHJlc29sdXRpb24gZm9yIGdpdmVuIDx0dD5zc3JjPC90dD4gdGhhdCBiZWxvbmcgdG8gdGhlIHBlZXJcbiAqIHJlcHJlc2VudGVkIGJ5IHRoaXMgaW5zdGFuY2UuXG4gKiBAcGFyYW0gc3NyYyBhdWRpbyBvciB2aWRlbyBSVFAgc3RyZWFtIFNTUkMuXG4gKiBAcGFyYW0gcmVzb2x1dGlvbiBuZXcgcmVzb2x1dGlvbiB2YWx1ZSB0byBiZSBzZXQuXG4gKi9cblBlZXJTdGF0cy5wcm90b3R5cGUuc2V0U3NyY1Jlc29sdXRpb24gPSBmdW5jdGlvbiAoc3NyYywgcmVzb2x1dGlvbilcbntcbiAgICBpZihyZXNvbHV0aW9uID09PSBudWxsICYmIHRoaXMuc3NyYzJyZXNvbHV0aW9uW3NzcmNdKVxuICAgIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuc3NyYzJyZXNvbHV0aW9uW3NzcmNdO1xuICAgIH1cbiAgICBlbHNlIGlmKHJlc29sdXRpb24gIT09IG51bGwpXG4gICAgICAgIHRoaXMuc3NyYzJyZXNvbHV0aW9uW3NzcmNdID0gcmVzb2x1dGlvbjtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgYml0IHJhdGUgZm9yIGdpdmVuIDx0dD5zc3JjPC90dD4gdGhhdCBibG9uZyB0byB0aGUgcGVlclxuICogcmVwcmVzZW50ZWQgYnkgdGhpcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSBzc3JjIGF1ZGlvIG9yIHZpZGVvIFJUUCBzdHJlYW0gU1NSQy5cbiAqIEBwYXJhbSBiaXRyYXRlIG5ldyBiaXRyYXRlIHZhbHVlIHRvIGJlIHNldC5cbiAqL1xuUGVlclN0YXRzLnByb3RvdHlwZS5zZXRTc3JjQml0cmF0ZSA9IGZ1bmN0aW9uIChzc3JjLCBiaXRyYXRlKVxue1xuICAgIGlmKHRoaXMuc3NyYzJiaXRyYXRlW3NzcmNdKVxuICAgIHtcbiAgICAgICAgdGhpcy5zc3JjMmJpdHJhdGVbc3NyY10uZG93bmxvYWQgKz0gYml0cmF0ZS5kb3dubG9hZDtcbiAgICAgICAgdGhpcy5zc3JjMmJpdHJhdGVbc3NyY10udXBsb2FkICs9IGJpdHJhdGUudXBsb2FkO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5zc3JjMmJpdHJhdGVbc3NyY10gPSBiaXRyYXRlO1xuICAgIH1cbn07XG5cbi8qKlxuICogU2V0cyBuZXcgYXVkaW8gbGV2ZWwoaW5wdXQgb3Igb3V0cHV0KSBmb3IgZ2l2ZW4gPHR0PnNzcmM8L3R0PiB0aGF0IGlkZW50aWZpZXNcbiAqIHRoZSBzdHJlYW0gd2hpY2ggYmVsb25ncyB0byB0aGUgcGVlciByZXByZXNlbnRlZCBieSB0aGlzIGluc3RhbmNlLlxuICogQHBhcmFtIHNzcmMgUlRQIHN0cmVhbSBTU1JDIGZvciB3aGljaCBjdXJyZW50IGF1ZGlvIGxldmVsIHZhbHVlIHdpbGwgYmVcbiAqICAgICAgICB1cGRhdGVkLlxuICogQHBhcmFtIGF1ZGlvTGV2ZWwgdGhlIG5ldyBhdWRpbyBsZXZlbCB2YWx1ZSB0byBiZSBzZXQuIFZhbHVlIGlzIHRydW5jYXRlZCB0b1xuICogICAgICAgIGZpdCB0aGUgcmFuZ2UgZnJvbSAwIHRvIDEuXG4gKi9cblBlZXJTdGF0cy5wcm90b3R5cGUuc2V0U3NyY0F1ZGlvTGV2ZWwgPSBmdW5jdGlvbiAoc3NyYywgYXVkaW9MZXZlbClcbntcbiAgICAvLyBSYW5nZSBsaW1pdCAwIC0gMVxuICAgIHRoaXMuc3NyYzJBdWRpb0xldmVsW3NzcmNdID0gTWF0aC5taW4oTWF0aC5tYXgoYXVkaW9MZXZlbCwgMCksIDEpO1xufTtcblxuLyoqXG4gKiBBcnJheSB3aXRoIHRoZSB0cmFuc3BvcnQgaW5mb3JtYXRpb24uXG4gKiBAdHlwZSB7QXJyYXl9XG4gKi9cblBlZXJTdGF0cy50cmFuc3BvcnQgPSBbXTtcblxuXG4vKipcbiAqIDx0dD5TdGF0c0NvbGxlY3RvcjwvdHQ+IHJlZ2lzdGVycyBmb3Igc3RhdHMgdXBkYXRlcyBvZiBnaXZlblxuICogPHR0PnBlZXJjb25uZWN0aW9uPC90dD4gaW4gZ2l2ZW4gPHR0PmludGVydmFsPC90dD4uIE9uIGVhY2ggdXBkYXRlIHBhcnRpY3VsYXJcbiAqIHN0YXRzIGFyZSBleHRyYWN0ZWQgYW5kIHB1dCBpbiB7QGxpbmsgUGVlclN0YXRzfSBvYmplY3RzLiBPbmNlIHRoZSBwcm9jZXNzaW5nXG4gKiBpcyBkb25lIDx0dD5hdWRpb0xldmVsc1VwZGF0ZUNhbGxiYWNrPC90dD4gaXMgY2FsbGVkIHdpdGggPHR0PnRoaXM8L3R0PlxuICogaW5zdGFuY2UgYXMgYW4gZXZlbnQgc291cmNlLlxuICpcbiAqIEBwYXJhbSBwZWVyY29ubmVjdGlvbiB3ZWJSVEMgcGVlciBjb25uZWN0aW9uIG9iamVjdC5cbiAqIEBwYXJhbSBpbnRlcnZhbCBzdGF0cyByZWZyZXNoIGludGVydmFsIGdpdmVuIGluIG1zLlxuICogQHBhcmFtIHtmdW5jdGlvbihTdGF0c0NvbGxlY3Rvcil9IGF1ZGlvTGV2ZWxzVXBkYXRlQ2FsbGJhY2sgdGhlIGNhbGxiYWNrXG4gKiBjYWxsZWQgb24gc3RhdHMgdXBkYXRlLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFN0YXRzQ29sbGVjdG9yKHBlZXJjb25uZWN0aW9uLCBhdWRpb0xldmVsc0ludGVydmFsLCBzdGF0c0ludGVydmFsLCBldmVudEVtaXR0ZXIpXG57XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbiA9IHBlZXJjb25uZWN0aW9uO1xuICAgIHRoaXMuYmFzZWxpbmVBdWRpb0xldmVsc1JlcG9ydCA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50QXVkaW9MZXZlbHNSZXBvcnQgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudFN0YXRzUmVwb3J0ID0gbnVsbDtcbiAgICB0aGlzLmJhc2VsaW5lU3RhdHNSZXBvcnQgPSBudWxsO1xuICAgIHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50RW1pdHRlciA9IGV2ZW50RW1pdHRlcjtcblxuICAgIC8qKlxuICAgICAqIEdhdGhlciBQZWVyQ29ubmVjdGlvbiBzdGF0cyBvbmNlIGV2ZXJ5IHRoaXMgbWFueSBtaWxsaXNlY29uZHMuXG4gICAgICovXG4gICAgdGhpcy5HQVRIRVJfSU5URVJWQUwgPSAxMDAwMDtcblxuICAgIC8qKlxuICAgICAqIExvZyBzdGF0cyB2aWEgdGhlIGZvY3VzIG9uY2UgZXZlcnkgdGhpcyBtYW55IG1pbGxpc2Vjb25kcy5cbiAgICAgKi9cbiAgICB0aGlzLkxPR19JTlRFUlZBTCA9IDYwMDAwO1xuXG4gICAgLyoqXG4gICAgICogR2F0aGVyIHN0YXRzIGFuZCBzdG9yZSB0aGVtIGluIHRoaXMuc3RhdHNUb0JlTG9nZ2VkLlxuICAgICAqL1xuICAgIHRoaXMuZ2F0aGVyU3RhdHNJbnRlcnZhbElkID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFNlbmQgdGhlIHN0YXRzIGFscmVhZHkgc2F2ZWQgaW4gdGhpcy5zdGF0c1RvQmVMb2dnZWQgdG8gYmUgbG9nZ2VkIHZpYVxuICAgICAqIHRoZSBmb2N1cy5cbiAgICAgKi9cbiAgICB0aGlzLmxvZ1N0YXRzSW50ZXJ2YWxJZCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZXMgdGhlIHN0YXRpc3RpY3Mgd2hpY2ggd2lsbCBiZSBzZW5kIHRvIHRoZSBmb2N1cyB0byBiZSBsb2dnZWQuXG4gICAgICovXG4gICAgdGhpcy5zdGF0c1RvQmVMb2dnZWQgPVxuICAgIHtcbiAgICAgICAgdGltZXN0YW1wczogW10sXG4gICAgICAgIHN0YXRzOiB7fVxuICAgIH07XG5cbiAgICAvLyBVcGRhdGVzIHN0YXRzIGludGVydmFsXG4gICAgdGhpcy5hdWRpb0xldmVsc0ludGVydmFsTWlsaXMgPSBhdWRpb0xldmVsc0ludGVydmFsO1xuXG4gICAgdGhpcy5zdGF0c0ludGVydmFsSWQgPSBudWxsO1xuICAgIHRoaXMuc3RhdHNJbnRlcnZhbE1pbGlzID0gc3RhdHNJbnRlcnZhbDtcbiAgICAvLyBNYXAgb2YgamlkcyB0byBQZWVyU3RhdHNcbiAgICB0aGlzLmppZDJzdGF0cyA9IHt9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRzQ29sbGVjdG9yO1xuXG4vKipcbiAqIFN0b3BzIHN0YXRzIHVwZGF0ZXMuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKClcbntcbiAgICBpZiAodGhpcy5hdWRpb0xldmVsc0ludGVydmFsSWQpXG4gICAge1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkKTtcbiAgICAgICAgdGhpcy5hdWRpb0xldmVsc0ludGVydmFsSWQgPSBudWxsO1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuc3RhdHNJbnRlcnZhbElkKTtcbiAgICAgICAgdGhpcy5zdGF0c0ludGVydmFsSWQgPSBudWxsO1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMubG9nU3RhdHNJbnRlcnZhbElkKTtcbiAgICAgICAgdGhpcy5sb2dTdGF0c0ludGVydmFsSWQgPSBudWxsO1xuICAgICAgICBjbGVhckludGVydmFsKHRoaXMuZ2F0aGVyU3RhdHNJbnRlcnZhbElkKTtcbiAgICAgICAgdGhpcy5nYXRoZXJTdGF0c0ludGVydmFsSWQgPSBudWxsO1xuICAgIH1cbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgcGFzc2VkIHRvIDx0dD5nZXRTdGF0czwvdHQ+IG1ldGhvZC5cbiAqIEBwYXJhbSBlcnJvciBhbiBlcnJvciB0aGF0IG9jY3VycmVkIG9uIDx0dD5nZXRTdGF0czwvdHQ+IGNhbGwuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5lcnJvckNhbGxiYWNrID0gZnVuY3Rpb24gKGVycm9yKVxue1xuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgc3RhdHMgZXJyb3JcIiwgZXJyb3IpO1xuICAgIHRoaXMuc3RvcCgpO1xufTtcblxuLyoqXG4gKiBTdGFydHMgc3RhdHMgdXBkYXRlcy5cbiAqL1xuU3RhdHNDb2xsZWN0b3IucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24gKClcbntcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5hdWRpb0xldmVsc0ludGVydmFsSWQgPSBzZXRJbnRlcnZhbChcbiAgICAgICAgZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgLy8gSW50ZXJ2YWwgdXBkYXRlc1xuICAgICAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5nZXRTdGF0cyhcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVwb3J0KVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBpZighcmVwb3J0IHx8ICFyZXBvcnQucmVzdWx0IHx8IHR5cGVvZiByZXBvcnQucmVzdWx0ICE9ICdmdW5jdGlvbicpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXBvcnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVwb3J0LnJlc3VsdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5lcnJvcihcIkdvdCBpbnRlcnZhbCByZXBvcnRcIiwgcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudEF1ZGlvTGV2ZWxzUmVwb3J0ID0gcmVzdWx0cztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wcm9jZXNzQXVkaW9MZXZlbFJlcG9ydCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmJhc2VsaW5lQXVkaW9MZXZlbHNSZXBvcnQgPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50QXVkaW9MZXZlbHNSZXBvcnQ7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZWxmLmVycm9yQ2FsbGJhY2tcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGYuYXVkaW9MZXZlbHNJbnRlcnZhbE1pbGlzXG4gICAgKTtcblxuICAgIHRoaXMuc3RhdHNJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEludGVydmFsIHVwZGF0ZXNcbiAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlcG9ydClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXJlcG9ydCB8fCAhcmVwb3J0LnJlc3VsdCB8fCB0eXBlb2YgcmVwb3J0LnJlc3VsdCAhPSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2ZpcmVmb3hcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXBvcnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2Nocm9tZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlcG9ydC5yZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoXCJHb3QgaW50ZXJ2YWwgcmVwb3J0XCIsIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRTdGF0c1JlcG9ydCA9IHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnByb2Nlc3NTdGF0c1JlcG9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5zdXBwb3J0ZWQga2V5OlwiICsgZSwgZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmJhc2VsaW5lU3RhdHNSZXBvcnQgPSBzZWxmLmN1cnJlbnRTdGF0c1JlcG9ydDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlbGYuZXJyb3JDYWxsYmFja1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZi5zdGF0c0ludGVydmFsTWlsaXNcbiAgICApO1xuXG4gICAgaWYgKGNvbmZpZy5sb2dTdGF0cykge1xuICAgICAgICB0aGlzLmdhdGhlclN0YXRzSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkU3RhdHNUb0JlTG9nZ2VkKHJlcG9ydC5yZXN1bHQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhpcy5HQVRIRVJfSU5URVJWQUxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmxvZ1N0YXRzSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7IHNlbGYubG9nU3RhdHMoKTsgfSxcbiAgICAgICAgICAgIHRoaXMuTE9HX0lOVEVSVkFMKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBzdGF0cyB0byB0aGUgZm9ybWF0IHVzZWQgZm9yIGxvZ2dpbmcsIGFuZCBzYXZlcyB0aGUgZGF0YSBpblxuICogdGhpcy5zdGF0c1RvQmVMb2dnZWQuXG4gKiBAcGFyYW0gcmVwb3J0cyBSZXBvcnRzIGFzIGdpdmVuIGJ5IHdlYmtpdFJUQ1BlckNvbm5lY3Rpb24uZ2V0U3RhdHMuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5hZGRTdGF0c1RvQmVMb2dnZWQgPSBmdW5jdGlvbiAocmVwb3J0cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbnVtX3JlY29yZHMgPSB0aGlzLnN0YXRzVG9CZUxvZ2dlZC50aW1lc3RhbXBzLmxlbmd0aDtcbiAgICB0aGlzLnN0YXRzVG9CZUxvZ2dlZC50aW1lc3RhbXBzLnB1c2gobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAgIHJlcG9ydHMubWFwKGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHN0YXQgPSBzZWxmLnN0YXRzVG9CZUxvZ2dlZC5zdGF0c1tyZXBvcnQuaWRdO1xuICAgICAgICBpZiAoIXN0YXQpIHtcbiAgICAgICAgICAgIHN0YXQgPSBzZWxmLnN0YXRzVG9CZUxvZ2dlZC5zdGF0c1tyZXBvcnQuaWRdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgc3RhdC50eXBlID0gcmVwb3J0LnR5cGU7XG4gICAgICAgIHJlcG9ydC5uYW1lcygpLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IHN0YXRbbmFtZV07XG4gICAgICAgICAgICBpZiAoIXZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHN0YXRbbmFtZV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlICh2YWx1ZXMubGVuZ3RoIDwgbnVtX3JlY29yZHMpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHJlcG9ydC5zdGF0KG5hbWUpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5TdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUubG9nU3RhdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFmb2N1c011Y0ppZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlZmxhdGUgPSB0cnVlO1xuXG4gICAgdmFyIGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRzVG9CZUxvZ2dlZCk7XG4gICAgaWYgKGRlZmxhdGUpIHtcbiAgICAgICAgY29udGVudCA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgUGFrby5kZWZsYXRlUmF3KGNvbnRlbnQpKTtcbiAgICB9XG4gICAgY29udGVudCA9IEJhc2U2NC5lbmNvZGUoY29udGVudCk7XG5cbiAgICB4bXBwLnNlbmRMb2dzKGNvbnRlbnQpO1xuICAgIC8vIFJlc2V0IHRoZSBzdGF0c1xuICAgIHRoaXMuc3RhdHNUb0JlTG9nZ2VkLnN0YXRzID0ge307XG4gICAgdGhpcy5zdGF0c1RvQmVMb2dnZWQudGltZXN0YW1wcyA9IFtdO1xufTtcbnZhciBrZXlNYXAgPSB7fTtcbmtleU1hcFtSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9GSVJFRk9YXSA9IHtcbiAgICBcInNzcmNcIjogXCJzc3JjXCIsXG4gICAgXCJwYWNrZXRzUmVjZWl2ZWRcIjogXCJwYWNrZXRzUmVjZWl2ZWRcIixcbiAgICBcInBhY2tldHNMb3N0XCI6IFwicGFja2V0c0xvc3RcIixcbiAgICBcInBhY2tldHNTZW50XCI6IFwicGFja2V0c1NlbnRcIixcbiAgICBcImJ5dGVzUmVjZWl2ZWRcIjogXCJieXRlc1JlY2VpdmVkXCIsXG4gICAgXCJieXRlc1NlbnRcIjogXCJieXRlc1NlbnRcIlxufTtcbmtleU1hcFtSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9DSFJPTUVdID0ge1xuICAgIFwicmVjZWl2ZUJhbmR3aWR0aFwiOiBcImdvb2dBdmFpbGFibGVSZWNlaXZlQmFuZHdpZHRoXCIsXG4gICAgXCJzZW5kQmFuZHdpZHRoXCI6IFwiZ29vZ0F2YWlsYWJsZVNlbmRCYW5kd2lkdGhcIixcbiAgICBcInJlbW90ZUFkZHJlc3NcIjogXCJnb29nUmVtb3RlQWRkcmVzc1wiLFxuICAgIFwidHJhbnNwb3J0VHlwZVwiOiBcImdvb2dUcmFuc3BvcnRUeXBlXCIsXG4gICAgXCJsb2NhbEFkZHJlc3NcIjogXCJnb29nTG9jYWxBZGRyZXNzXCIsXG4gICAgXCJhY3RpdmVDb25uZWN0aW9uXCI6IFwiZ29vZ0FjdGl2ZUNvbm5lY3Rpb25cIixcbiAgICBcInNzcmNcIjogXCJzc3JjXCIsXG4gICAgXCJwYWNrZXRzUmVjZWl2ZWRcIjogXCJwYWNrZXRzUmVjZWl2ZWRcIixcbiAgICBcInBhY2tldHNTZW50XCI6IFwicGFja2V0c1NlbnRcIixcbiAgICBcInBhY2tldHNMb3N0XCI6IFwicGFja2V0c0xvc3RcIixcbiAgICBcImJ5dGVzUmVjZWl2ZWRcIjogXCJieXRlc1JlY2VpdmVkXCIsXG4gICAgXCJieXRlc1NlbnRcIjogXCJieXRlc1NlbnRcIixcbiAgICBcImdvb2dGcmFtZUhlaWdodFJlY2VpdmVkXCI6IFwiZ29vZ0ZyYW1lSGVpZ2h0UmVjZWl2ZWRcIixcbiAgICBcImdvb2dGcmFtZVdpZHRoUmVjZWl2ZWRcIjogXCJnb29nRnJhbWVXaWR0aFJlY2VpdmVkXCIsXG4gICAgXCJnb29nRnJhbWVIZWlnaHRTZW50XCI6IFwiZ29vZ0ZyYW1lSGVpZ2h0U2VudFwiLFxuICAgIFwiZ29vZ0ZyYW1lV2lkdGhTZW50XCI6IFwiZ29vZ0ZyYW1lV2lkdGhTZW50XCIsXG4gICAgXCJhdWRpb0lucHV0TGV2ZWxcIjogXCJhdWRpb0lucHV0TGV2ZWxcIixcbiAgICBcImF1ZGlvT3V0cHV0TGV2ZWxcIjogXCJhdWRpb091dHB1dExldmVsXCJcbn07XG5cblxuLyoqXG4gKiBTdGF0cyBwcm9jZXNzaW5nIGxvZ2ljLlxuICovXG5TdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUucHJvY2Vzc1N0YXRzUmVwb3J0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5iYXNlbGluZVN0YXRzUmVwb3J0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpZHggaW4gdGhpcy5jdXJyZW50U3RhdHNSZXBvcnQpIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY3VycmVudFN0YXRzUmVwb3J0W2lkeF07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZ2V0U3RhdFZhbHVlKG5vdywgJ3JlY2VpdmVCYW5kd2lkdGgnKSB8fFxuICAgICAgICAgICAgICAgIGdldFN0YXRWYWx1ZShub3csICdzZW5kQmFuZHdpZHRoJykpIHtcbiAgICAgICAgICAgICAgICBQZWVyU3RhdHMuYmFuZHdpZHRoID0ge1xuICAgICAgICAgICAgICAgICAgICBcImRvd25sb2FkXCI6IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGdldFN0YXRWYWx1ZShub3csICdyZWNlaXZlQmFuZHdpZHRoJykpIC8gMTAwMCksXG4gICAgICAgICAgICAgICAgICAgIFwidXBsb2FkXCI6IE1hdGgucm91bmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGdldFN0YXRWYWx1ZShub3csICdzZW5kQmFuZHdpZHRoJykpIC8gMTAwMClcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpey8qbm90IHN1cHBvcnRlZCovfVxuXG4gICAgICAgIGlmKG5vdy50eXBlID09ICdnb29nQ2FuZGlkYXRlUGFpcicpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBpcCwgdHlwZSwgbG9jYWxJUCwgYWN0aXZlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpcCA9IGdldFN0YXRWYWx1ZShub3csICdyZW1vdGVBZGRyZXNzJyk7XG4gICAgICAgICAgICAgICAgdHlwZSA9IGdldFN0YXRWYWx1ZShub3csIFwidHJhbnNwb3J0VHlwZVwiKTtcbiAgICAgICAgICAgICAgICBsb2NhbElQID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJsb2NhbEFkZHJlc3NcIik7XG4gICAgICAgICAgICAgICAgYWN0aXZlID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJhY3RpdmVDb25uZWN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZSl7Lypub3Qgc3VwcG9ydGVkKi99XG4gICAgICAgICAgICBpZighaXAgfHwgIXR5cGUgfHwgIWxvY2FsSVAgfHwgYWN0aXZlICE9IFwidHJ1ZVwiKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgdmFyIGFkZHJlc3NTYXZlZCA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IFBlZXJTdGF0cy50cmFuc3BvcnQubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYoUGVlclN0YXRzLnRyYW5zcG9ydFtpXS5pcCA9PSBpcCAmJlxuICAgICAgICAgICAgICAgICAgICBQZWVyU3RhdHMudHJhbnNwb3J0W2ldLnR5cGUgPT0gdHlwZSAmJlxuICAgICAgICAgICAgICAgICAgICBQZWVyU3RhdHMudHJhbnNwb3J0W2ldLmxvY2FsaXAgPT0gbG9jYWxJUClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3NTYXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoYWRkcmVzc1NhdmVkKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgUGVlclN0YXRzLnRyYW5zcG9ydC5wdXNoKHtsb2NhbGlwOiBsb2NhbElQLCBpcDogaXAsIHR5cGU6IHR5cGV9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobm93LnR5cGUgPT0gXCJjYW5kaWRhdGVwYWlyXCIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKG5vdy5zdGF0ZSA9PSBcInN1Y2NlZWRlZFwiKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgbG9jYWwgPSB0aGlzLmN1cnJlbnRTdGF0c1JlcG9ydFtub3cubG9jYWxDYW5kaWRhdGVJZF07XG4gICAgICAgICAgICB2YXIgcmVtb3RlID0gdGhpcy5jdXJyZW50U3RhdHNSZXBvcnRbbm93LnJlbW90ZUNhbmRpZGF0ZUlkXTtcbiAgICAgICAgICAgIFBlZXJTdGF0cy50cmFuc3BvcnQucHVzaCh7bG9jYWxpcDogbG9jYWwuaXBBZGRyZXNzICsgXCI6XCIgKyBsb2NhbC5wb3J0TnVtYmVyLFxuICAgICAgICAgICAgICAgIGlwOiByZW1vdGUuaXBBZGRyZXNzICsgXCI6XCIgKyByZW1vdGUucG9ydE51bWJlciwgdHlwZTogbG9jYWwudHJhbnNwb3J0fSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3cudHlwZSAhPSAnc3NyYycgJiYgbm93LnR5cGUgIT0gXCJvdXRib3VuZHJ0cFwiICYmXG4gICAgICAgICAgICBub3cudHlwZSAhPSBcImluYm91bmRydHBcIikge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlID0gdGhpcy5iYXNlbGluZVN0YXRzUmVwb3J0W2lkeF07XG4gICAgICAgIGlmICghYmVmb3JlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZ2V0U3RhdFZhbHVlKG5vdywgJ3NzcmMnKSArICcgbm90IGVub3VnaCBkYXRhJyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzc3JjID0gZ2V0U3RhdFZhbHVlKG5vdywgJ3NzcmMnKTtcbiAgICAgICAgaWYoIXNzcmMpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdmFyIGppZCA9IHNzcmMyamlkW3NzcmNdO1xuICAgICAgICBpZiAoIWppZCAmJiAoRGF0ZS5ub3coKSAtIG5vdy50aW1lc3RhbXApIDwgMzAwMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gamlkIGZvciBzc3JjOiBcIiArIHNzcmMpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgamlkU3RhdHMgPSB0aGlzLmppZDJzdGF0c1tqaWRdO1xuICAgICAgICBpZiAoIWppZFN0YXRzKSB7XG4gICAgICAgICAgICBqaWRTdGF0cyA9IG5ldyBQZWVyU3RhdHMoKTtcbiAgICAgICAgICAgIHRoaXMuamlkMnN0YXRzW2ppZF0gPSBqaWRTdGF0cztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIGlzRG93bmxvYWRTdHJlYW0gPSB0cnVlO1xuICAgICAgICB2YXIga2V5ID0gJ3BhY2tldHNSZWNlaXZlZCc7XG4gICAgICAgIGlmICghZ2V0U3RhdFZhbHVlKG5vdywga2V5KSlcbiAgICAgICAge1xuICAgICAgICAgICAgaXNEb3dubG9hZFN0cmVhbSA9IGZhbHNlO1xuICAgICAgICAgICAga2V5ID0gJ3BhY2tldHNTZW50JztcbiAgICAgICAgICAgIGlmICghZ2V0U3RhdFZhbHVlKG5vdywga2V5KSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJObyBwYWNrZXRzUmVjZWl2ZWQgbm9yIHBhY2tldFNlbnQgc3RhdCBmb3VuZFwiKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFja2V0c05vdyA9IGdldFN0YXRWYWx1ZShub3csIGtleSk7XG4gICAgICAgIGlmKCFwYWNrZXRzTm93IHx8IHBhY2tldHNOb3cgPCAwKVxuICAgICAgICAgICAgcGFja2V0c05vdyA9IDA7XG5cbiAgICAgICAgdmFyIHBhY2tldHNCZWZvcmUgPSBnZXRTdGF0VmFsdWUoYmVmb3JlLCBrZXkpO1xuICAgICAgICBpZighcGFja2V0c0JlZm9yZSB8fCBwYWNrZXRzQmVmb3JlIDwgMClcbiAgICAgICAgICAgIHBhY2tldHNCZWZvcmUgPSAwO1xuICAgICAgICB2YXIgcGFja2V0UmF0ZSA9IHBhY2tldHNOb3cgLSBwYWNrZXRzQmVmb3JlO1xuICAgICAgICBpZighcGFja2V0UmF0ZSB8fCBwYWNrZXRSYXRlIDwgMClcbiAgICAgICAgICAgIHBhY2tldFJhdGUgPSAwO1xuICAgICAgICB2YXIgY3VycmVudExvc3MgPSBnZXRTdGF0VmFsdWUobm93LCAncGFja2V0c0xvc3QnKTtcbiAgICAgICAgaWYoIWN1cnJlbnRMb3NzIHx8IGN1cnJlbnRMb3NzIDwgMClcbiAgICAgICAgICAgIGN1cnJlbnRMb3NzID0gMDtcbiAgICAgICAgdmFyIHByZXZpb3VzTG9zcyA9IGdldFN0YXRWYWx1ZShiZWZvcmUsICdwYWNrZXRzTG9zdCcpO1xuICAgICAgICBpZighcHJldmlvdXNMb3NzIHx8IHByZXZpb3VzTG9zcyA8IDApXG4gICAgICAgICAgICBwcmV2aW91c0xvc3MgPSAwO1xuICAgICAgICB2YXIgbG9zc1JhdGUgPSBjdXJyZW50TG9zcyAtIHByZXZpb3VzTG9zcztcbiAgICAgICAgaWYoIWxvc3NSYXRlIHx8IGxvc3NSYXRlIDwgMClcbiAgICAgICAgICAgIGxvc3NSYXRlID0gMDtcbiAgICAgICAgdmFyIHBhY2tldHNUb3RhbCA9IChwYWNrZXRSYXRlICsgbG9zc1JhdGUpO1xuXG4gICAgICAgIGppZFN0YXRzLnNldFNzcmNMb3NzKHNzcmMsXG4gICAgICAgICAgICB7XCJwYWNrZXRzVG90YWxcIjogcGFja2V0c1RvdGFsLFxuICAgICAgICAgICAgICAgIFwicGFja2V0c0xvc3RcIjogbG9zc1JhdGUsXG4gICAgICAgICAgICAgICAgXCJpc0Rvd25sb2FkU3RyZWFtXCI6IGlzRG93bmxvYWRTdHJlYW19KTtcblxuXG4gICAgICAgIHZhciBieXRlc1JlY2VpdmVkID0gMCwgYnl0ZXNTZW50ID0gMDtcbiAgICAgICAgaWYoZ2V0U3RhdFZhbHVlKG5vdywgXCJieXRlc1JlY2VpdmVkXCIpKVxuICAgICAgICB7XG4gICAgICAgICAgICBieXRlc1JlY2VpdmVkID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJieXRlc1JlY2VpdmVkXCIpIC1cbiAgICAgICAgICAgICAgICBnZXRTdGF0VmFsdWUoYmVmb3JlLCBcImJ5dGVzUmVjZWl2ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZihnZXRTdGF0VmFsdWUobm93LCBcImJ5dGVzU2VudFwiKSlcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZXNTZW50ID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJieXRlc1NlbnRcIikgLVxuICAgICAgICAgICAgICAgIGdldFN0YXRWYWx1ZShiZWZvcmUsIFwiYnl0ZXNTZW50XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRpbWUgPSBNYXRoLnJvdW5kKChub3cudGltZXN0YW1wIC0gYmVmb3JlLnRpbWVzdGFtcCkgLyAxMDAwKTtcbiAgICAgICAgaWYoYnl0ZXNSZWNlaXZlZCA8PSAwIHx8IHRpbWUgPD0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZXNSZWNlaXZlZCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBieXRlc1JlY2VpdmVkID0gTWF0aC5yb3VuZCgoKGJ5dGVzUmVjZWl2ZWQgKiA4KSAvIHRpbWUpIC8gMTAwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihieXRlc1NlbnQgPD0gMCB8fCB0aW1lIDw9IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJ5dGVzU2VudCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBieXRlc1NlbnQgPSBNYXRoLnJvdW5kKCgoYnl0ZXNTZW50ICogOCkgLyB0aW1lKSAvIDEwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgamlkU3RhdHMuc2V0U3NyY0JpdHJhdGUoc3NyYywge1xuICAgICAgICAgICAgXCJkb3dubG9hZFwiOiBieXRlc1JlY2VpdmVkLFxuICAgICAgICAgICAgXCJ1cGxvYWRcIjogYnl0ZXNTZW50fSk7XG5cbiAgICAgICAgdmFyIHJlc29sdXRpb24gPSB7aGVpZ2h0OiBudWxsLCB3aWR0aDogbnVsbH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVIZWlnaHRSZWNlaXZlZFwiKSAmJlxuICAgICAgICAgICAgICAgIGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lV2lkdGhSZWNlaXZlZFwiKSkge1xuICAgICAgICAgICAgICAgIHJlc29sdXRpb24uaGVpZ2h0ID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVIZWlnaHRSZWNlaXZlZFwiKTtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLndpZHRoID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVXaWR0aFJlY2VpdmVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVIZWlnaHRTZW50XCIpICYmXG4gICAgICAgICAgICAgICAgZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVXaWR0aFNlbnRcIikpIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLmhlaWdodCA9IGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lSGVpZ2h0U2VudFwiKTtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLndpZHRoID0gZ2V0U3RhdFZhbHVlKG5vdywgXCJnb29nRnJhbWVXaWR0aFNlbnRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSl7Lypub3Qgc3VwcG9ydGVkKi99XG5cbiAgICAgICAgaWYocmVzb2x1dGlvbi5oZWlnaHQgJiYgcmVzb2x1dGlvbi53aWR0aClcbiAgICAgICAge1xuICAgICAgICAgICAgamlkU3RhdHMuc2V0U3NyY1Jlc29sdXRpb24oc3NyYywgcmVzb2x1dGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICBqaWRTdGF0cy5zZXRTc3JjUmVzb2x1dGlvbihzc3JjLCBudWxsKTtcbiAgICAgICAgfVxuXG5cbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gSmlkIHN0YXRzXG4gICAgdmFyIHRvdGFsUGFja2V0cyA9IHtkb3dubG9hZDogMCwgdXBsb2FkOiAwfTtcbiAgICB2YXIgbG9zdFBhY2tldHMgPSB7ZG93bmxvYWQ6IDAsIHVwbG9hZDogMH07XG4gICAgdmFyIGJpdHJhdGVEb3dubG9hZCA9IDA7XG4gICAgdmFyIGJpdHJhdGVVcGxvYWQgPSAwO1xuICAgIHZhciByZXNvbHV0aW9ucyA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHRoaXMuamlkMnN0YXRzKS5mb3JFYWNoKFxuICAgICAgICBmdW5jdGlvbiAoamlkKVxuICAgICAgICB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzZWxmLmppZDJzdGF0c1tqaWRdLnNzcmMyTG9zcykuZm9yRWFjaChcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoc3NyYylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gXCJ1cGxvYWRcIjtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMkxvc3Nbc3NyY10uaXNEb3dubG9hZFN0cmVhbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgPSBcImRvd25sb2FkXCI7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsUGFja2V0c1t0eXBlXSArPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMkxvc3Nbc3NyY10ucGFja2V0c1RvdGFsO1xuICAgICAgICAgICAgICAgICAgICBsb3N0UGFja2V0c1t0eXBlXSArPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMkxvc3Nbc3NyY10ucGFja2V0c0xvc3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJiaXRyYXRlKS5mb3JFYWNoKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChzc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpdHJhdGVEb3dubG9hZCArPVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMmJpdHJhdGVbc3NyY10uZG93bmxvYWQ7XG4gICAgICAgICAgICAgICAgICAgIGJpdHJhdGVVcGxvYWQgKz1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJiaXRyYXRlW3NzcmNdLnVwbG9hZDtcblxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMmJpdHJhdGVbc3NyY107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJlc29sdXRpb25zW2ppZF0gPSBzZWxmLmppZDJzdGF0c1tqaWRdLnNzcmMycmVzb2x1dGlvbjtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICBQZWVyU3RhdHMuYml0cmF0ZSA9IHtcInVwbG9hZFwiOiBiaXRyYXRlVXBsb2FkLCBcImRvd25sb2FkXCI6IGJpdHJhdGVEb3dubG9hZH07XG5cbiAgICBQZWVyU3RhdHMucGFja2V0TG9zcyA9IHtcbiAgICAgICAgdG90YWw6XG4gICAgICAgICAgICBjYWxjdWxhdGVQYWNrZXRMb3NzKGxvc3RQYWNrZXRzLmRvd25sb2FkICsgbG9zdFBhY2tldHMudXBsb2FkLFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFBhY2tldHMuZG93bmxvYWQgKyB0b3RhbFBhY2tldHMudXBsb2FkKSxcbiAgICAgICAgZG93bmxvYWQ6XG4gICAgICAgICAgICBjYWxjdWxhdGVQYWNrZXRMb3NzKGxvc3RQYWNrZXRzLmRvd25sb2FkLCB0b3RhbFBhY2tldHMuZG93bmxvYWQpLFxuICAgICAgICB1cGxvYWQ6XG4gICAgICAgICAgICBjYWxjdWxhdGVQYWNrZXRMb3NzKGxvc3RQYWNrZXRzLnVwbG9hZCwgdG90YWxQYWNrZXRzLnVwbG9hZClcbiAgICB9O1xuICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQoXCJzdGF0aXN0aWNzLmNvbm5lY3Rpb25zdGF0c1wiLFxuICAgICAgICB7XG4gICAgICAgICAgICBcImJpdHJhdGVcIjogUGVlclN0YXRzLmJpdHJhdGUsXG4gICAgICAgICAgICBcInBhY2tldExvc3NcIjogUGVlclN0YXRzLnBhY2tldExvc3MsXG4gICAgICAgICAgICBcImJhbmR3aWR0aFwiOiBQZWVyU3RhdHMuYmFuZHdpZHRoLFxuICAgICAgICAgICAgXCJyZXNvbHV0aW9uXCI6IHJlc29sdXRpb25zLFxuICAgICAgICAgICAgXCJ0cmFuc3BvcnRcIjogUGVlclN0YXRzLnRyYW5zcG9ydFxuICAgICAgICB9KTtcbiAgICBQZWVyU3RhdHMudHJhbnNwb3J0ID0gW107XG5cbn07XG5cbi8qKlxuICogU3RhdHMgcHJvY2Vzc2luZyBsb2dpYy5cbiAqL1xuU3RhdHNDb2xsZWN0b3IucHJvdG90eXBlLnByb2Nlc3NBdWRpb0xldmVsUmVwb3J0ID0gZnVuY3Rpb24gKClcbntcbiAgICBpZiAoIXRoaXMuYmFzZWxpbmVBdWRpb0xldmVsc1JlcG9ydClcbiAgICB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpZHggaW4gdGhpcy5jdXJyZW50QXVkaW9MZXZlbHNSZXBvcnQpXG4gICAge1xuICAgICAgICB2YXIgbm93ID0gdGhpcy5jdXJyZW50QXVkaW9MZXZlbHNSZXBvcnRbaWR4XTtcblxuICAgICAgICBpZiAobm93LnR5cGUgIT0gJ3NzcmMnKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBiZWZvcmUgPSB0aGlzLmJhc2VsaW5lQXVkaW9MZXZlbHNSZXBvcnRbaWR4XTtcbiAgICAgICAgaWYgKCFiZWZvcmUpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihnZXRTdGF0VmFsdWUobm93LCAnc3NyYycpICsgJyBub3QgZW5vdWdoIGRhdGEnKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNzcmMgPSBnZXRTdGF0VmFsdWUobm93LCAnc3NyYycpO1xuICAgICAgICB2YXIgamlkID0gc3NyYzJqaWRbc3NyY107XG4gICAgICAgIGlmICghamlkICYmIChEYXRlLm5vdygpIC0gbm93LnRpbWVzdGFtcCkgPCAzMDAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJObyBqaWQgZm9yIHNzcmM6IFwiICsgc3NyYyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBqaWRTdGF0cyA9IHRoaXMuamlkMnN0YXRzW2ppZF07XG4gICAgICAgIGlmICghamlkU3RhdHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGppZFN0YXRzID0gbmV3IFBlZXJTdGF0cygpO1xuICAgICAgICAgICAgdGhpcy5qaWQyc3RhdHNbamlkXSA9IGppZFN0YXRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXVkaW8gbGV2ZWxcbiAgICAgICAgdmFyIGF1ZGlvTGV2ZWwgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhdWRpb0xldmVsID0gZ2V0U3RhdFZhbHVlKG5vdywgJ2F1ZGlvSW5wdXRMZXZlbCcpO1xuICAgICAgICAgICAgaWYgKCFhdWRpb0xldmVsKVxuICAgICAgICAgICAgICAgIGF1ZGlvTGV2ZWwgPSBnZXRTdGF0VmFsdWUobm93LCAnYXVkaW9PdXRwdXRMZXZlbCcpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpIHsvKm5vdCBzdXBwb3J0ZWQqL1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQXVkaW8gTGV2ZWxzIGFyZSBub3QgYXZhaWxhYmxlIGluIHRoZSBzdGF0aXN0aWNzLlwiKTtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5hdWRpb0xldmVsc0ludGVydmFsSWQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF1ZGlvTGV2ZWwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIFRPRE86IGNhbid0IGZpbmQgc3BlY3MgYWJvdXQgd2hhdCB0aGlzIHZhbHVlIHJlYWxseSBpcyxcbiAgICAgICAgICAgIC8vIGJ1dCBpdCBzZWVtcyB0byB2YXJ5IGJldHdlZW4gMCBhbmQgYXJvdW5kIDMyay5cbiAgICAgICAgICAgIGF1ZGlvTGV2ZWwgPSBhdWRpb0xldmVsIC8gMzI3Njc7XG4gICAgICAgICAgICBqaWRTdGF0cy5zZXRTc3JjQXVkaW9MZXZlbChzc3JjLCBhdWRpb0xldmVsKTtcbiAgICAgICAgICAgIGlmKGppZCAhPSB4bXBwLm15SmlkKCkpXG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdChcInN0YXRpc3RpY3MuYXVkaW9MZXZlbFwiLCBqaWQsIGF1ZGlvTGV2ZWwpO1xuICAgICAgICB9XG5cbiAgICB9XG5cblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgaHJpc3RvIG9uIDgvNC8xNC5cbiAqL1xudmFyIExvY2FsU3RhdHMgPSByZXF1aXJlKFwiLi9Mb2NhbFN0YXRzQ29sbGVjdG9yLmpzXCIpO1xudmFyIFJUUFN0YXRzID0gcmVxdWlyZShcIi4vUlRQU3RhdHNDb2xsZWN0b3IuanNcIik7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKTtcbi8vVGhlc2UgbGluZXMgc2hvdWxkIGJlIHVuY29tbWVudGVkIHdoZW4gcmVxdWlyZSB3b3JrcyBpbiBhcHAuanNcbi8vdmFyIFN0cmVhbUV2ZW50VHlwZXMgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvU3RyZWFtRXZlbnRUeXBlcy5qc1wiKTtcbi8vdmFyIFJUQ0Jyb3dzZXJUeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1JUQ0Jyb3dzZXJUeXBlXCIpO1xuLy92YXIgWE1QUEV2ZW50cyA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlL3htcHAvWE1QUEV2ZW50c1wiKTtcblxudmFyIGV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxudmFyIGxvY2FsU3RhdHMgPSBudWxsO1xuXG52YXIgcnRwU3RhdHMgPSBudWxsO1xuXG5mdW5jdGlvbiBzdG9wTG9jYWwoKVxue1xuICAgIGlmKGxvY2FsU3RhdHMpXG4gICAge1xuICAgICAgICBsb2NhbFN0YXRzLnN0b3AoKTtcbiAgICAgICAgbG9jYWxTdGF0cyA9IG51bGw7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdG9wUmVtb3RlKClcbntcbiAgICBpZihydHBTdGF0cylcbiAgICB7XG4gICAgICAgIHJ0cFN0YXRzLnN0b3AoKTtcbiAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoXCJzdGF0aXN0aWNzLnN0b3BcIik7XG4gICAgICAgIHJ0cFN0YXRzID0gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0UmVtb3RlU3RhdHMgKHBlZXJjb25uZWN0aW9uKSB7XG4gICAgaWYgKGNvbmZpZy5lbmFibGVSdHBTdGF0cylcbiAgICB7XG4gICAgICAgIGlmKHJ0cFN0YXRzKVxuICAgICAgICB7XG4gICAgICAgICAgICBydHBTdGF0cy5zdG9wKCk7XG4gICAgICAgICAgICBydHBTdGF0cyA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBydHBTdGF0cyA9IG5ldyBSVFBTdGF0cyhwZWVyY29ubmVjdGlvbiwgMjAwLCAyMDAwLCBldmVudEVtaXR0ZXIpO1xuICAgICAgICBydHBTdGF0cy5zdGFydCgpO1xuICAgIH1cblxufVxuXG5mdW5jdGlvbiBvblN0cmVhbUNyZWF0ZWQoc3RyZWFtKVxue1xuICAgIGlmKHN0cmVhbS5nZXRPcmlnaW5hbFN0cmVhbSgpLmdldEF1ZGlvVHJhY2tzKCkubGVuZ3RoID09PSAwKVxuICAgICAgICByZXR1cm47XG5cbiAgICBsb2NhbFN0YXRzID0gbmV3IExvY2FsU3RhdHMoc3RyZWFtLmdldE9yaWdpbmFsU3RyZWFtKCksIDEwMCwgc3RhdGlzdGljcyxcbiAgICAgICAgZXZlbnRFbWl0dGVyKTtcbiAgICBsb2NhbFN0YXRzLnN0YXJ0KCk7XG59XG5cbmZ1bmN0aW9uIG9uRGlzcG9zZUNvbmZlcmVuY2Uob25VbmxvYWQpIHtcbiAgICBzdG9wUmVtb3RlKCk7XG4gICAgaWYob25VbmxvYWQpIHtcbiAgICAgICAgc3RvcExvY2FsKCk7XG4gICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cblxudmFyIHN0YXRpc3RpY3MgPVxue1xuICAgIC8qKlxuICAgICAqIEluZGljYXRlcyB0aGF0IHRoaXMgYXVkaW8gbGV2ZWwgaXMgZm9yIGxvY2FsIGppZC5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIExPQ0FMX0pJRDogJ2xvY2FsJyxcblxuICAgIGFkZEF1ZGlvTGV2ZWxMaXN0ZW5lcjogZnVuY3Rpb24obGlzdGVuZXIpXG4gICAge1xuICAgICAgICBldmVudEVtaXR0ZXIub24oXCJzdGF0aXN0aWNzLmF1ZGlvTGV2ZWxcIiwgbGlzdGVuZXIpO1xuICAgIH0sXG5cbiAgICByZW1vdmVBdWRpb0xldmVsTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwic3RhdGlzdGljcy5hdWRpb0xldmVsXCIsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgYWRkQ29ubmVjdGlvblN0YXRzTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKFwic3RhdGlzdGljcy5jb25uZWN0aW9uc3RhdHNcIiwgbGlzdGVuZXIpO1xuICAgIH0sXG5cbiAgICByZW1vdmVDb25uZWN0aW9uU3RhdHNMaXN0ZW5lcjogZnVuY3Rpb24obGlzdGVuZXIpXG4gICAge1xuICAgICAgICBldmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoXCJzdGF0aXN0aWNzLmNvbm5lY3Rpb25zdGF0c1wiLCBsaXN0ZW5lcik7XG4gICAgfSxcblxuXG4gICAgYWRkUmVtb3RlU3RhdHNTdG9wTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKFwic3RhdGlzdGljcy5zdG9wXCIsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlUmVtb3RlU3RhdHNTdG9wTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwic3RhdGlzdGljcy5zdG9wXCIsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBzdG9wTG9jYWwoKTtcbiAgICAgICAgc3RvcFJlbW90ZSgpO1xuICAgICAgICBpZihldmVudEVtaXR0ZXIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdG9wUmVtb3RlU3RhdGlzdGljczogZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgc3RvcFJlbW90ZSgpO1xuICAgIH0sXG5cbiAgICBvbkNvbmZlcmVuY2VDcmVhdGVkOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgc3RhcnRSZW1vdGVTdGF0cyhldmVudC5wZWVyY29ubmVjdGlvbik7XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYWRkQ29ubmVjdGlvblN0YXRzTGlzdGVuZXIoY29ubmVjdGlvbnF1YWxpdHkudXBkYXRlTG9jYWxTdGF0cyk7XG4gICAgICAgIHRoaXMuYWRkUmVtb3RlU3RhdHNTdG9wTGlzdGVuZXIoY29ubmVjdGlvbnF1YWxpdHkuc3RvcFNlbmRpbmdTdGF0cyk7XG4gICAgICAgIFJUQy5hZGRTdHJlYW1MaXN0ZW5lcihvblN0cmVhbUNyZWF0ZWQsXG4gICAgICAgICAgICBTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfTE9DQUxfQ1JFQVRFRCk7XG4gICAgICAgIHhtcHAuYWRkTGlzdGVuZXIoWE1QUEV2ZW50cy5ESVNQT1NFX0NPTkZFUkVOQ0UsIG9uRGlzcG9zZUNvbmZlcmVuY2UpO1xuICAgIH1cblxufTtcblxuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0aXN0aWNzOyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiJdfQ==
