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
                    catch(e)
                    {
                        console.error("Unsupported key:" + e);
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

    // XEP-0337-ish
    var message = $msg({to: focusMucJid, type: 'normal'});
    message.c('log', { xmlns: 'urn:xmpp:eventlog',
        id: 'PeerConnectionStats'});
    message.c('message').t(content).up();
    if (deflate) {
        message.c('tag', {name: "deflated", value: "true"}).up();
    }
    message.up();

    connection.send(message);

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
        if (!jid) {
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
        if (!jid)
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
            if(jid != connection.emuc.myroomjid)
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
    if(stream.getAudioTracks().length === 0)
        return;

    localStats = new LocalStats(stream, 100, this,
        eventEmitter);
    localStats.start();
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

    onDisposeConference: function (onUnload) {
        stopRemote();
        if(onUnload) {
            stopLocal();
            eventEmitter.removeAllListeners();
        }
    },

    start: function () {
        RTC.addStreamListener(onStreamCreated,
            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3N0YXRpc3RpY3MvTG9jYWxTdGF0c0NvbGxlY3Rvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc3RhdGlzdGljcy9SVFBTdGF0c0NvbGxlY3Rvci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc3RhdGlzdGljcy9zdGF0aXN0aWNzLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBQcm92aWRlcyBzdGF0aXN0aWNzIGZvciB0aGUgbG9jYWwgc3RyZWFtLlxuICovXG5cblxuLyoqXG4gKiBTaXplIG9mIHRoZSB3ZWJhdWRpbyBhbmFsaXplciBidWZmZXIuXG4gKiBAdHlwZSB7bnVtYmVyfVxuICovXG52YXIgV0VCQVVESU9fQU5BTElaRVJfRkZUX1NJWkUgPSAyMDQ4O1xuXG4vKipcbiAqIFZhbHVlIG9mIHRoZSB3ZWJhdWRpbyBhbmFsaXplciBzbW9vdGhpbmcgdGltZSBwYXJhbWV0ZXIuXG4gKiBAdHlwZSB7bnVtYmVyfVxuICovXG52YXIgV0VCQVVESU9fQU5BTElaRVJfU01PT1RJTkdfVElNRSA9IDAuODtcblxuLyoqXG4gKiBDb252ZXJ0cyB0aW1lIGRvbWFpbiBkYXRhIGFycmF5IHRvIGF1ZGlvIGxldmVsLlxuICogQHBhcmFtIGFycmF5IHRoZSB0aW1lIGRvbWFpbiBkYXRhIGFycmF5LlxuICogQHJldHVybnMge251bWJlcn0gdGhlIGF1ZGlvIGxldmVsXG4gKi9cbmZ1bmN0aW9uIHRpbWVEb21haW5EYXRhVG9BdWRpb0xldmVsKHNhbXBsZXMpIHtcblxuICAgIHZhciBtYXhWb2x1bWUgPSAwO1xuXG4gICAgdmFyIGxlbmd0aCA9IHNhbXBsZXMubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAobWF4Vm9sdW1lIDwgc2FtcGxlc1tpXSlcbiAgICAgICAgICAgIG1heFZvbHVtZSA9IHNhbXBsZXNbaV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoKChtYXhWb2x1bWUgLSAxMjcpIC8gMTI4KS50b0ZpeGVkKDMpKTtcbn07XG5cbi8qKlxuICogQW5pbWF0ZXMgYXVkaW8gbGV2ZWwgY2hhbmdlXG4gKiBAcGFyYW0gbmV3TGV2ZWwgdGhlIG5ldyBhdWRpbyBsZXZlbFxuICogQHBhcmFtIGxhc3RMZXZlbCB0aGUgbGFzdCBhdWRpbyBsZXZlbFxuICogQHJldHVybnMge051bWJlcn0gdGhlIGF1ZGlvIGxldmVsIHRvIGJlIHNldFxuICovXG5mdW5jdGlvbiBhbmltYXRlTGV2ZWwobmV3TGV2ZWwsIGxhc3RMZXZlbClcbntcbiAgICB2YXIgdmFsdWUgPSAwO1xuICAgIHZhciBkaWZmID0gbGFzdExldmVsIC0gbmV3TGV2ZWw7XG4gICAgaWYoZGlmZiA+IDAuMilcbiAgICB7XG4gICAgICAgIHZhbHVlID0gbGFzdExldmVsIC0gMC4yO1xuICAgIH1cbiAgICBlbHNlIGlmKGRpZmYgPCAtMC40KVxuICAgIHtcbiAgICAgICAgdmFsdWUgPSBsYXN0TGV2ZWwgKyAwLjQ7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHZhbHVlID0gbmV3TGV2ZWw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUudG9GaXhlZCgzKSk7XG59XG5cblxuLyoqXG4gKiA8dHQ+TG9jYWxTdGF0c0NvbGxlY3RvcjwvdHQ+IGNhbGN1bGF0ZXMgc3RhdGlzdGljcyBmb3IgdGhlIGxvY2FsIHN0cmVhbS5cbiAqXG4gKiBAcGFyYW0gc3RyZWFtIHRoZSBsb2NhbCBzdHJlYW1cbiAqIEBwYXJhbSBpbnRlcnZhbCBzdGF0cyByZWZyZXNoIGludGVydmFsIGdpdmVuIGluIG1zLlxuICogQHBhcmFtIHtmdW5jdGlvbihMb2NhbFN0YXRzQ29sbGVjdG9yKX0gdXBkYXRlQ2FsbGJhY2sgdGhlIGNhbGxiYWNrIGNhbGxlZCBvbiBzdGF0c1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBMb2NhbFN0YXRzQ29sbGVjdG9yKHN0cmVhbSwgaW50ZXJ2YWwsIHN0YXRpc3RpY3NTZXJ2aWNlLCBldmVudEVtaXR0ZXIpIHtcbiAgICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xuICAgIHRoaXMuaW50ZXJ2YWxJZCA9IG51bGw7XG4gICAgdGhpcy5pbnRlcnZhbE1pbGlzID0gaW50ZXJ2YWw7XG4gICAgdGhpcy5ldmVudEVtaXR0ZXIgPSBldmVudEVtaXR0ZXI7XG4gICAgdGhpcy5hdWRpb0xldmVsID0gMDtcbiAgICB0aGlzLnN0YXRpc3RpY3NTZXJ2aWNlID0gc3RhdGlzdGljc1NlcnZpY2U7XG59XG5cbi8qKlxuICogU3RhcnRzIHRoZSBjb2xsZWN0aW5nIHRoZSBzdGF0aXN0aWNzLlxuICovXG5Mb2NhbFN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXdpbmRvdy5BdWRpb0NvbnRleHQpXG4gICAgICAgIHJldHVybjtcblxuICAgIHZhciBjb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgIHZhciBhbmFseXNlciA9IGNvbnRleHQuY3JlYXRlQW5hbHlzZXIoKTtcbiAgICBhbmFseXNlci5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSBXRUJBVURJT19BTkFMSVpFUl9TTU9PVElOR19USU1FO1xuICAgIGFuYWx5c2VyLmZmdFNpemUgPSBXRUJBVURJT19BTkFMSVpFUl9GRlRfU0laRTtcblxuXG4gICAgdmFyIHNvdXJjZSA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2UodGhpcy5zdHJlYW0pO1xuICAgIHNvdXJjZS5jb25uZWN0KGFuYWx5c2VyKTtcblxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5pbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcnJheSA9IG5ldyBVaW50OEFycmF5KGFuYWx5c2VyLmZyZXF1ZW5jeUJpbkNvdW50KTtcbiAgICAgICAgICAgIGFuYWx5c2VyLmdldEJ5dGVUaW1lRG9tYWluRGF0YShhcnJheSk7XG4gICAgICAgICAgICB2YXIgYXVkaW9MZXZlbCA9IHRpbWVEb21haW5EYXRhVG9BdWRpb0xldmVsKGFycmF5KTtcbiAgICAgICAgICAgIGlmKGF1ZGlvTGV2ZWwgIT0gc2VsZi5hdWRpb0xldmVsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5hdWRpb0xldmVsID0gYW5pbWF0ZUxldmVsKGF1ZGlvTGV2ZWwsIHNlbGYuYXVkaW9MZXZlbCk7XG4gICAgICAgICAgICAgICAgc2VsZi5ldmVudEVtaXR0ZXIuZW1pdChcbiAgICAgICAgICAgICAgICAgICAgXCJzdGF0aXN0aWNzLmF1ZGlvTGV2ZWxcIixcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0aXN0aWNzU2VydmljZS5MT0NBTF9KSUQsXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYXVkaW9MZXZlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRoaXMuaW50ZXJ2YWxNaWxpc1xuICAgICk7XG5cbn07XG5cbi8qKlxuICogU3RvcHMgY29sbGVjdGluZyB0aGUgc3RhdGlzdGljcy5cbiAqL1xuTG9jYWxTdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElkKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElkKTtcbiAgICAgICAgdGhpcy5pbnRlcnZhbElkID0gbnVsbDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsU3RhdHNDb2xsZWN0b3I7IiwiLyogZ2xvYmFsIGZvY3VzTXVjSmlkLCBzc3JjMmppZCAqL1xuLyoganNoaW50IC1XMTE3ICovXG4vKipcbiAqIENhbGN1bGF0ZXMgcGFja2V0IGxvc3QgcGVyY2VudCB1c2luZyB0aGUgbnVtYmVyIG9mIGxvc3QgcGFja2V0cyBhbmQgdGhlXG4gKiBudW1iZXIgb2YgYWxsIHBhY2tldC5cbiAqIEBwYXJhbSBsb3N0UGFja2V0cyB0aGUgbnVtYmVyIG9mIGxvc3QgcGFja2V0c1xuICogQHBhcmFtIHRvdGFsUGFja2V0cyB0aGUgbnVtYmVyIG9mIGFsbCBwYWNrZXRzLlxuICogQHJldHVybnMge251bWJlcn0gcGFja2V0IGxvc3MgcGVyY2VudFxuICovXG5mdW5jdGlvbiBjYWxjdWxhdGVQYWNrZXRMb3NzKGxvc3RQYWNrZXRzLCB0b3RhbFBhY2tldHMpIHtcbiAgICBpZighdG90YWxQYWNrZXRzIHx8IHRvdGFsUGFja2V0cyA8PSAwIHx8ICFsb3N0UGFja2V0cyB8fCBsb3N0UGFja2V0cyA8PSAwKVxuICAgICAgICByZXR1cm4gMDtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgobG9zdFBhY2tldHMvdG90YWxQYWNrZXRzKSoxMDApO1xufVxuXG5mdW5jdGlvbiBnZXRTdGF0VmFsdWUoaXRlbSwgbmFtZSkge1xuICAgIGlmKCFrZXlNYXBbUlRDLmdldEJyb3dzZXJUeXBlKCldW25hbWVdKVxuICAgICAgICB0aHJvdyBcIlRoZSBwcm9wZXJ0eSBpc24ndCBzdXBwb3J0ZWQhXCI7XG4gICAgdmFyIGtleSA9IGtleU1hcFtSVEMuZ2V0QnJvd3NlclR5cGUoKV1bbmFtZV07XG4gICAgcmV0dXJuIFJUQy5nZXRCcm93c2VyVHlwZSgpID09IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0NIUk9NRT8gaXRlbS5zdGF0KGtleSkgOiBpdGVtW2tleV07XG59XG5cbi8qKlxuICogUGVlciBzdGF0aXN0aWNzIGRhdGEgaG9sZGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBlZXJTdGF0cygpXG57XG4gICAgdGhpcy5zc3JjMkxvc3MgPSB7fTtcbiAgICB0aGlzLnNzcmMyQXVkaW9MZXZlbCA9IHt9O1xuICAgIHRoaXMuc3NyYzJiaXRyYXRlID0ge307XG4gICAgdGhpcy5zc3JjMnJlc29sdXRpb24gPSB7fTtcbn1cblxuLyoqXG4gKiBUaGUgYmFuZHdpZHRoXG4gKiBAdHlwZSB7e319XG4gKi9cblBlZXJTdGF0cy5iYW5kd2lkdGggPSB7fTtcblxuLyoqXG4gKiBUaGUgYml0IHJhdGVcbiAqIEB0eXBlIHt7fX1cbiAqL1xuUGVlclN0YXRzLmJpdHJhdGUgPSB7fTtcblxuXG5cbi8qKlxuICogVGhlIHBhY2tldCBsb3NzIHJhdGVcbiAqIEB0eXBlIHt7fX1cbiAqL1xuUGVlclN0YXRzLnBhY2tldExvc3MgPSBudWxsO1xuXG4vKipcbiAqIFNldHMgcGFja2V0cyBsb3NzIHJhdGUgZm9yIGdpdmVuIDx0dD5zc3JjPC90dD4gdGhhdCBibG9uZyB0byB0aGUgcGVlclxuICogcmVwcmVzZW50ZWQgYnkgdGhpcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSBzc3JjIGF1ZGlvIG9yIHZpZGVvIFJUUCBzdHJlYW0gU1NSQy5cbiAqIEBwYXJhbSBsb3NzUmF0ZSBuZXcgcGFja2V0IGxvc3MgcmF0ZSB2YWx1ZSB0byBiZSBzZXQuXG4gKi9cblBlZXJTdGF0cy5wcm90b3R5cGUuc2V0U3NyY0xvc3MgPSBmdW5jdGlvbiAoc3NyYywgbG9zc1JhdGUpXG57XG4gICAgdGhpcy5zc3JjMkxvc3Nbc3NyY10gPSBsb3NzUmF0ZTtcbn07XG5cbi8qKlxuICogU2V0cyByZXNvbHV0aW9uIGZvciBnaXZlbiA8dHQ+c3NyYzwvdHQ+IHRoYXQgYmVsb25nIHRvIHRoZSBwZWVyXG4gKiByZXByZXNlbnRlZCBieSB0aGlzIGluc3RhbmNlLlxuICogQHBhcmFtIHNzcmMgYXVkaW8gb3IgdmlkZW8gUlRQIHN0cmVhbSBTU1JDLlxuICogQHBhcmFtIHJlc29sdXRpb24gbmV3IHJlc29sdXRpb24gdmFsdWUgdG8gYmUgc2V0LlxuICovXG5QZWVyU3RhdHMucHJvdG90eXBlLnNldFNzcmNSZXNvbHV0aW9uID0gZnVuY3Rpb24gKHNzcmMsIHJlc29sdXRpb24pXG57XG4gICAgaWYocmVzb2x1dGlvbiA9PT0gbnVsbCAmJiB0aGlzLnNzcmMycmVzb2x1dGlvbltzc3JjXSlcbiAgICB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNzcmMycmVzb2x1dGlvbltzc3JjXTtcbiAgICB9XG4gICAgZWxzZSBpZihyZXNvbHV0aW9uICE9PSBudWxsKVxuICAgICAgICB0aGlzLnNzcmMycmVzb2x1dGlvbltzc3JjXSA9IHJlc29sdXRpb247XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIGJpdCByYXRlIGZvciBnaXZlbiA8dHQ+c3NyYzwvdHQ+IHRoYXQgYmxvbmcgdG8gdGhlIHBlZXJcbiAqIHJlcHJlc2VudGVkIGJ5IHRoaXMgaW5zdGFuY2UuXG4gKiBAcGFyYW0gc3NyYyBhdWRpbyBvciB2aWRlbyBSVFAgc3RyZWFtIFNTUkMuXG4gKiBAcGFyYW0gYml0cmF0ZSBuZXcgYml0cmF0ZSB2YWx1ZSB0byBiZSBzZXQuXG4gKi9cblBlZXJTdGF0cy5wcm90b3R5cGUuc2V0U3NyY0JpdHJhdGUgPSBmdW5jdGlvbiAoc3NyYywgYml0cmF0ZSlcbntcbiAgICBpZih0aGlzLnNzcmMyYml0cmF0ZVtzc3JjXSlcbiAgICB7XG4gICAgICAgIHRoaXMuc3NyYzJiaXRyYXRlW3NzcmNdLmRvd25sb2FkICs9IGJpdHJhdGUuZG93bmxvYWQ7XG4gICAgICAgIHRoaXMuc3NyYzJiaXRyYXRlW3NzcmNdLnVwbG9hZCArPSBiaXRyYXRlLnVwbG9hZDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuc3NyYzJiaXRyYXRlW3NzcmNdID0gYml0cmF0ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldHMgbmV3IGF1ZGlvIGxldmVsKGlucHV0IG9yIG91dHB1dCkgZm9yIGdpdmVuIDx0dD5zc3JjPC90dD4gdGhhdCBpZGVudGlmaWVzXG4gKiB0aGUgc3RyZWFtIHdoaWNoIGJlbG9uZ3MgdG8gdGhlIHBlZXIgcmVwcmVzZW50ZWQgYnkgdGhpcyBpbnN0YW5jZS5cbiAqIEBwYXJhbSBzc3JjIFJUUCBzdHJlYW0gU1NSQyBmb3Igd2hpY2ggY3VycmVudCBhdWRpbyBsZXZlbCB2YWx1ZSB3aWxsIGJlXG4gKiAgICAgICAgdXBkYXRlZC5cbiAqIEBwYXJhbSBhdWRpb0xldmVsIHRoZSBuZXcgYXVkaW8gbGV2ZWwgdmFsdWUgdG8gYmUgc2V0LiBWYWx1ZSBpcyB0cnVuY2F0ZWQgdG9cbiAqICAgICAgICBmaXQgdGhlIHJhbmdlIGZyb20gMCB0byAxLlxuICovXG5QZWVyU3RhdHMucHJvdG90eXBlLnNldFNzcmNBdWRpb0xldmVsID0gZnVuY3Rpb24gKHNzcmMsIGF1ZGlvTGV2ZWwpXG57XG4gICAgLy8gUmFuZ2UgbGltaXQgMCAtIDFcbiAgICB0aGlzLnNzcmMyQXVkaW9MZXZlbFtzc3JjXSA9IE1hdGgubWluKE1hdGgubWF4KGF1ZGlvTGV2ZWwsIDApLCAxKTtcbn07XG5cbi8qKlxuICogQXJyYXkgd2l0aCB0aGUgdHJhbnNwb3J0IGluZm9ybWF0aW9uLlxuICogQHR5cGUge0FycmF5fVxuICovXG5QZWVyU3RhdHMudHJhbnNwb3J0ID0gW107XG5cblxuLyoqXG4gKiA8dHQ+U3RhdHNDb2xsZWN0b3I8L3R0PiByZWdpc3RlcnMgZm9yIHN0YXRzIHVwZGF0ZXMgb2YgZ2l2ZW5cbiAqIDx0dD5wZWVyY29ubmVjdGlvbjwvdHQ+IGluIGdpdmVuIDx0dD5pbnRlcnZhbDwvdHQ+LiBPbiBlYWNoIHVwZGF0ZSBwYXJ0aWN1bGFyXG4gKiBzdGF0cyBhcmUgZXh0cmFjdGVkIGFuZCBwdXQgaW4ge0BsaW5rIFBlZXJTdGF0c30gb2JqZWN0cy4gT25jZSB0aGUgcHJvY2Vzc2luZ1xuICogaXMgZG9uZSA8dHQ+YXVkaW9MZXZlbHNVcGRhdGVDYWxsYmFjazwvdHQ+IGlzIGNhbGxlZCB3aXRoIDx0dD50aGlzPC90dD5cbiAqIGluc3RhbmNlIGFzIGFuIGV2ZW50IHNvdXJjZS5cbiAqXG4gKiBAcGFyYW0gcGVlcmNvbm5lY3Rpb24gd2ViUlRDIHBlZXIgY29ubmVjdGlvbiBvYmplY3QuXG4gKiBAcGFyYW0gaW50ZXJ2YWwgc3RhdHMgcmVmcmVzaCBpbnRlcnZhbCBnaXZlbiBpbiBtcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oU3RhdHNDb2xsZWN0b3IpfSBhdWRpb0xldmVsc1VwZGF0ZUNhbGxiYWNrIHRoZSBjYWxsYmFja1xuICogY2FsbGVkIG9uIHN0YXRzIHVwZGF0ZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdGF0c0NvbGxlY3RvcihwZWVyY29ubmVjdGlvbiwgYXVkaW9MZXZlbHNJbnRlcnZhbCwgc3RhdHNJbnRlcnZhbCwgZXZlbnRFbWl0dGVyKVxue1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24gPSBwZWVyY29ubmVjdGlvbjtcbiAgICB0aGlzLmJhc2VsaW5lQXVkaW9MZXZlbHNSZXBvcnQgPSBudWxsO1xuICAgIHRoaXMuY3VycmVudEF1ZGlvTGV2ZWxzUmVwb3J0ID0gbnVsbDtcbiAgICB0aGlzLmN1cnJlbnRTdGF0c1JlcG9ydCA9IG51bGw7XG4gICAgdGhpcy5iYXNlbGluZVN0YXRzUmVwb3J0ID0gbnVsbDtcbiAgICB0aGlzLmF1ZGlvTGV2ZWxzSW50ZXJ2YWxJZCA9IG51bGw7XG4gICAgdGhpcy5ldmVudEVtaXR0ZXIgPSBldmVudEVtaXR0ZXI7XG5cbiAgICAvKipcbiAgICAgKiBHYXRoZXIgUGVlckNvbm5lY3Rpb24gc3RhdHMgb25jZSBldmVyeSB0aGlzIG1hbnkgbWlsbGlzZWNvbmRzLlxuICAgICAqL1xuICAgIHRoaXMuR0FUSEVSX0lOVEVSVkFMID0gMTAwMDA7XG5cbiAgICAvKipcbiAgICAgKiBMb2cgc3RhdHMgdmlhIHRoZSBmb2N1cyBvbmNlIGV2ZXJ5IHRoaXMgbWFueSBtaWxsaXNlY29uZHMuXG4gICAgICovXG4gICAgdGhpcy5MT0dfSU5URVJWQUwgPSA2MDAwMDtcblxuICAgIC8qKlxuICAgICAqIEdhdGhlciBzdGF0cyBhbmQgc3RvcmUgdGhlbSBpbiB0aGlzLnN0YXRzVG9CZUxvZ2dlZC5cbiAgICAgKi9cbiAgICB0aGlzLmdhdGhlclN0YXRzSW50ZXJ2YWxJZCA9IG51bGw7XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIHRoZSBzdGF0cyBhbHJlYWR5IHNhdmVkIGluIHRoaXMuc3RhdHNUb0JlTG9nZ2VkIHRvIGJlIGxvZ2dlZCB2aWFcbiAgICAgKiB0aGUgZm9jdXMuXG4gICAgICovXG4gICAgdGhpcy5sb2dTdGF0c0ludGVydmFsSWQgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogU3RvcmVzIHRoZSBzdGF0aXN0aWNzIHdoaWNoIHdpbGwgYmUgc2VuZCB0byB0aGUgZm9jdXMgdG8gYmUgbG9nZ2VkLlxuICAgICAqL1xuICAgIHRoaXMuc3RhdHNUb0JlTG9nZ2VkID1cbiAgICB7XG4gICAgICAgIHRpbWVzdGFtcHM6IFtdLFxuICAgICAgICBzdGF0czoge31cbiAgICB9O1xuXG4gICAgLy8gVXBkYXRlcyBzdGF0cyBpbnRlcnZhbFxuICAgIHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbE1pbGlzID0gYXVkaW9MZXZlbHNJbnRlcnZhbDtcblxuICAgIHRoaXMuc3RhdHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICB0aGlzLnN0YXRzSW50ZXJ2YWxNaWxpcyA9IHN0YXRzSW50ZXJ2YWw7XG4gICAgLy8gTWFwIG9mIGppZHMgdG8gUGVlclN0YXRzXG4gICAgdGhpcy5qaWQyc3RhdHMgPSB7fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0c0NvbGxlY3RvcjtcblxuLyoqXG4gKiBTdG9wcyBzdGF0cyB1cGRhdGVzLlxuICovXG5TdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkKVxuICAgIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmF1ZGlvTGV2ZWxzSW50ZXJ2YWxJZCk7XG4gICAgICAgIHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnN0YXRzSW50ZXJ2YWxJZCk7XG4gICAgICAgIHRoaXMuc3RhdHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmxvZ1N0YXRzSW50ZXJ2YWxJZCk7XG4gICAgICAgIHRoaXMubG9nU3RhdHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmdhdGhlclN0YXRzSW50ZXJ2YWxJZCk7XG4gICAgICAgIHRoaXMuZ2F0aGVyU3RhdHNJbnRlcnZhbElkID0gbnVsbDtcbiAgICB9XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIHBhc3NlZCB0byA8dHQ+Z2V0U3RhdHM8L3R0PiBtZXRob2QuXG4gKiBAcGFyYW0gZXJyb3IgYW4gZXJyb3IgdGhhdCBvY2N1cnJlZCBvbiA8dHQ+Z2V0U3RhdHM8L3R0PiBjYWxsLlxuICovXG5TdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUuZXJyb3JDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnJvcilcbntcbiAgICBjb25zb2xlLmVycm9yKFwiR2V0IHN0YXRzIGVycm9yXCIsIGVycm9yKTtcbiAgICB0aGlzLnN0b3AoKTtcbn07XG5cbi8qKlxuICogU3RhcnRzIHN0YXRzIHVwZGF0ZXMuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uICgpXG57XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkID0gc2V0SW50ZXJ2YWwoXG4gICAgICAgIGZ1bmN0aW9uICgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIC8vIEludGVydmFsIHVwZGF0ZXNcbiAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlcG9ydClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXJlcG9ydCB8fCAhcmVwb3J0LnJlc3VsdCB8fCB0eXBlb2YgcmVwb3J0LnJlc3VsdCAhPSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVwb3J0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlcG9ydC5yZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IoXCJHb3QgaW50ZXJ2YWwgcmVwb3J0XCIsIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRBdWRpb0xldmVsc1JlcG9ydCA9IHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucHJvY2Vzc0F1ZGlvTGV2ZWxSZXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5iYXNlbGluZUF1ZGlvTGV2ZWxzUmVwb3J0ID1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudEF1ZGlvTGV2ZWxzUmVwb3J0O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2VsZi5lcnJvckNhbGxiYWNrXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBzZWxmLmF1ZGlvTGV2ZWxzSW50ZXJ2YWxNaWxpc1xuICAgICk7XG5cbiAgICB0aGlzLnN0YXRzSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBJbnRlcnZhbCB1cGRhdGVzXG4gICAgICAgICAgICBzZWxmLnBlZXJjb25uZWN0aW9uLmdldFN0YXRzKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXBvcnQpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmKCFyZXBvcnQgfHwgIXJlcG9ydC5yZXN1bHQgfHwgdHlwZW9mIHJlcG9ydC5yZXN1bHQgIT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9maXJlZm94XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVwb3J0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9jaHJvbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXBvcnQucmVzdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmVycm9yKFwiR290IGludGVydmFsIHJlcG9ydFwiLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50U3RhdHNSZXBvcnQgPSByZXN1bHRzO1xuICAgICAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5wcm9jZXNzU3RhdHNSZXBvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaChlKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5zdXBwb3J0ZWQga2V5OlwiICsgZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzZWxmLmJhc2VsaW5lU3RhdHNSZXBvcnQgPSBzZWxmLmN1cnJlbnRTdGF0c1JlcG9ydDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlbGYuZXJyb3JDYWxsYmFja1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZi5zdGF0c0ludGVydmFsTWlsaXNcbiAgICApO1xuXG4gICAgaWYgKGNvbmZpZy5sb2dTdGF0cykge1xuICAgICAgICB0aGlzLmdhdGhlclN0YXRzSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKFxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkU3RhdHNUb0JlTG9nZ2VkKHJlcG9ydC5yZXN1bHQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGhpcy5HQVRIRVJfSU5URVJWQUxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmxvZ1N0YXRzSW50ZXJ2YWxJZCA9IHNldEludGVydmFsKFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7IHNlbGYubG9nU3RhdHMoKTsgfSxcbiAgICAgICAgICAgIHRoaXMuTE9HX0lOVEVSVkFMKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBzdGF0cyB0byB0aGUgZm9ybWF0IHVzZWQgZm9yIGxvZ2dpbmcsIGFuZCBzYXZlcyB0aGUgZGF0YSBpblxuICogdGhpcy5zdGF0c1RvQmVMb2dnZWQuXG4gKiBAcGFyYW0gcmVwb3J0cyBSZXBvcnRzIGFzIGdpdmVuIGJ5IHdlYmtpdFJUQ1BlckNvbm5lY3Rpb24uZ2V0U3RhdHMuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5hZGRTdGF0c1RvQmVMb2dnZWQgPSBmdW5jdGlvbiAocmVwb3J0cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbnVtX3JlY29yZHMgPSB0aGlzLnN0YXRzVG9CZUxvZ2dlZC50aW1lc3RhbXBzLmxlbmd0aDtcbiAgICB0aGlzLnN0YXRzVG9CZUxvZ2dlZC50aW1lc3RhbXBzLnB1c2gobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAgIHJlcG9ydHMubWFwKGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgdmFyIHN0YXQgPSBzZWxmLnN0YXRzVG9CZUxvZ2dlZC5zdGF0c1tyZXBvcnQuaWRdO1xuICAgICAgICBpZiAoIXN0YXQpIHtcbiAgICAgICAgICAgIHN0YXQgPSBzZWxmLnN0YXRzVG9CZUxvZ2dlZC5zdGF0c1tyZXBvcnQuaWRdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgc3RhdC50eXBlID0gcmVwb3J0LnR5cGU7XG4gICAgICAgIHJlcG9ydC5uYW1lcygpLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlcyA9IHN0YXRbbmFtZV07XG4gICAgICAgICAgICBpZiAoIXZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IHN0YXRbbmFtZV0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlICh2YWx1ZXMubGVuZ3RoIDwgbnVtX3JlY29yZHMpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHJlcG9ydC5zdGF0KG5hbWUpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5TdGF0c0NvbGxlY3Rvci5wcm90b3R5cGUubG9nU3RhdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFmb2N1c011Y0ppZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlZmxhdGUgPSB0cnVlO1xuXG4gICAgdmFyIGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeSh0aGlzLnN0YXRzVG9CZUxvZ2dlZCk7XG4gICAgaWYgKGRlZmxhdGUpIHtcbiAgICAgICAgY29udGVudCA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgUGFrby5kZWZsYXRlUmF3KGNvbnRlbnQpKTtcbiAgICB9XG4gICAgY29udGVudCA9IEJhc2U2NC5lbmNvZGUoY29udGVudCk7XG5cbiAgICAvLyBYRVAtMDMzNy1pc2hcbiAgICB2YXIgbWVzc2FnZSA9ICRtc2coe3RvOiBmb2N1c011Y0ppZCwgdHlwZTogJ25vcm1hbCd9KTtcbiAgICBtZXNzYWdlLmMoJ2xvZycsIHsgeG1sbnM6ICd1cm46eG1wcDpldmVudGxvZycsXG4gICAgICAgIGlkOiAnUGVlckNvbm5lY3Rpb25TdGF0cyd9KTtcbiAgICBtZXNzYWdlLmMoJ21lc3NhZ2UnKS50KGNvbnRlbnQpLnVwKCk7XG4gICAgaWYgKGRlZmxhdGUpIHtcbiAgICAgICAgbWVzc2FnZS5jKCd0YWcnLCB7bmFtZTogXCJkZWZsYXRlZFwiLCB2YWx1ZTogXCJ0cnVlXCJ9KS51cCgpO1xuICAgIH1cbiAgICBtZXNzYWdlLnVwKCk7XG5cbiAgICBjb25uZWN0aW9uLnNlbmQobWVzc2FnZSk7XG5cbiAgICAvLyBSZXNldCB0aGUgc3RhdHNcbiAgICB0aGlzLnN0YXRzVG9CZUxvZ2dlZC5zdGF0cyA9IHt9O1xuICAgIHRoaXMuc3RhdHNUb0JlTG9nZ2VkLnRpbWVzdGFtcHMgPSBbXTtcbn07XG52YXIga2V5TWFwID0ge307XG5rZXlNYXBbUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfRklSRUZPWF0gPSB7XG4gICAgXCJzc3JjXCI6IFwic3NyY1wiLFxuICAgIFwicGFja2V0c1JlY2VpdmVkXCI6IFwicGFja2V0c1JlY2VpdmVkXCIsXG4gICAgXCJwYWNrZXRzTG9zdFwiOiBcInBhY2tldHNMb3N0XCIsXG4gICAgXCJwYWNrZXRzU2VudFwiOiBcInBhY2tldHNTZW50XCIsXG4gICAgXCJieXRlc1JlY2VpdmVkXCI6IFwiYnl0ZXNSZWNlaXZlZFwiLFxuICAgIFwiYnl0ZXNTZW50XCI6IFwiYnl0ZXNTZW50XCJcbn07XG5rZXlNYXBbUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfQ0hST01FXSA9IHtcbiAgICBcInJlY2VpdmVCYW5kd2lkdGhcIjogXCJnb29nQXZhaWxhYmxlUmVjZWl2ZUJhbmR3aWR0aFwiLFxuICAgIFwic2VuZEJhbmR3aWR0aFwiOiBcImdvb2dBdmFpbGFibGVTZW5kQmFuZHdpZHRoXCIsXG4gICAgXCJyZW1vdGVBZGRyZXNzXCI6IFwiZ29vZ1JlbW90ZUFkZHJlc3NcIixcbiAgICBcInRyYW5zcG9ydFR5cGVcIjogXCJnb29nVHJhbnNwb3J0VHlwZVwiLFxuICAgIFwibG9jYWxBZGRyZXNzXCI6IFwiZ29vZ0xvY2FsQWRkcmVzc1wiLFxuICAgIFwiYWN0aXZlQ29ubmVjdGlvblwiOiBcImdvb2dBY3RpdmVDb25uZWN0aW9uXCIsXG4gICAgXCJzc3JjXCI6IFwic3NyY1wiLFxuICAgIFwicGFja2V0c1JlY2VpdmVkXCI6IFwicGFja2V0c1JlY2VpdmVkXCIsXG4gICAgXCJwYWNrZXRzU2VudFwiOiBcInBhY2tldHNTZW50XCIsXG4gICAgXCJwYWNrZXRzTG9zdFwiOiBcInBhY2tldHNMb3N0XCIsXG4gICAgXCJieXRlc1JlY2VpdmVkXCI6IFwiYnl0ZXNSZWNlaXZlZFwiLFxuICAgIFwiYnl0ZXNTZW50XCI6IFwiYnl0ZXNTZW50XCIsXG4gICAgXCJnb29nRnJhbWVIZWlnaHRSZWNlaXZlZFwiOiBcImdvb2dGcmFtZUhlaWdodFJlY2VpdmVkXCIsXG4gICAgXCJnb29nRnJhbWVXaWR0aFJlY2VpdmVkXCI6IFwiZ29vZ0ZyYW1lV2lkdGhSZWNlaXZlZFwiLFxuICAgIFwiZ29vZ0ZyYW1lSGVpZ2h0U2VudFwiOiBcImdvb2dGcmFtZUhlaWdodFNlbnRcIixcbiAgICBcImdvb2dGcmFtZVdpZHRoU2VudFwiOiBcImdvb2dGcmFtZVdpZHRoU2VudFwiLFxuICAgIFwiYXVkaW9JbnB1dExldmVsXCI6IFwiYXVkaW9JbnB1dExldmVsXCIsXG4gICAgXCJhdWRpb091dHB1dExldmVsXCI6IFwiYXVkaW9PdXRwdXRMZXZlbFwiXG59O1xuXG5cbi8qKlxuICogU3RhdHMgcHJvY2Vzc2luZyBsb2dpYy5cbiAqL1xuU3RhdHNDb2xsZWN0b3IucHJvdG90eXBlLnByb2Nlc3NTdGF0c1JlcG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuYmFzZWxpbmVTdGF0c1JlcG9ydCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaWR4IGluIHRoaXMuY3VycmVudFN0YXRzUmVwb3J0KSB7XG4gICAgICAgIHZhciBub3cgPSB0aGlzLmN1cnJlbnRTdGF0c1JlcG9ydFtpZHhdO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGdldFN0YXRWYWx1ZShub3csICdyZWNlaXZlQmFuZHdpZHRoJykgfHxcbiAgICAgICAgICAgICAgICBnZXRTdGF0VmFsdWUobm93LCAnc2VuZEJhbmR3aWR0aCcpKSB7XG4gICAgICAgICAgICAgICAgUGVlclN0YXRzLmJhbmR3aWR0aCA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJkb3dubG9hZFwiOiBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChnZXRTdGF0VmFsdWUobm93LCAncmVjZWl2ZUJhbmR3aWR0aCcpKSAvIDEwMDApLFxuICAgICAgICAgICAgICAgICAgICBcInVwbG9hZFwiOiBNYXRoLnJvdW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChnZXRTdGF0VmFsdWUobm93LCAnc2VuZEJhbmR3aWR0aCcpKSAvIDEwMDApXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlKXsvKm5vdCBzdXBwb3J0ZWQqL31cblxuICAgICAgICBpZihub3cudHlwZSA9PSAnZ29vZ0NhbmRpZGF0ZVBhaXInKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgaXAsIHR5cGUsIGxvY2FsSVAsIGFjdGl2ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXAgPSBnZXRTdGF0VmFsdWUobm93LCAncmVtb3RlQWRkcmVzcycpO1xuICAgICAgICAgICAgICAgIHR5cGUgPSBnZXRTdGF0VmFsdWUobm93LCBcInRyYW5zcG9ydFR5cGVcIik7XG4gICAgICAgICAgICAgICAgbG9jYWxJUCA9IGdldFN0YXRWYWx1ZShub3csIFwibG9jYWxBZGRyZXNzXCIpO1xuICAgICAgICAgICAgICAgIGFjdGl2ZSA9IGdldFN0YXRWYWx1ZShub3csIFwiYWN0aXZlQ29ubmVjdGlvblwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoKGUpey8qbm90IHN1cHBvcnRlZCovfVxuICAgICAgICAgICAgaWYoIWlwIHx8ICF0eXBlIHx8ICFsb2NhbElQIHx8IGFjdGl2ZSAhPSBcInRydWVcIilcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHZhciBhZGRyZXNzU2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBQZWVyU3RhdHMudHJhbnNwb3J0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmKFBlZXJTdGF0cy50cmFuc3BvcnRbaV0uaXAgPT0gaXAgJiZcbiAgICAgICAgICAgICAgICAgICAgUGVlclN0YXRzLnRyYW5zcG9ydFtpXS50eXBlID09IHR5cGUgJiZcbiAgICAgICAgICAgICAgICAgICAgUGVlclN0YXRzLnRyYW5zcG9ydFtpXS5sb2NhbGlwID09IGxvY2FsSVApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzU2F2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGFkZHJlc3NTYXZlZClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIFBlZXJTdGF0cy50cmFuc3BvcnQucHVzaCh7bG9jYWxpcDogbG9jYWxJUCwgaXA6IGlwLCB0eXBlOiB0eXBlfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5vdy50eXBlID09IFwiY2FuZGlkYXRlcGFpclwiKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZihub3cuc3RhdGUgPT0gXCJzdWNjZWVkZWRcIilcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIGxvY2FsID0gdGhpcy5jdXJyZW50U3RhdHNSZXBvcnRbbm93LmxvY2FsQ2FuZGlkYXRlSWRdO1xuICAgICAgICAgICAgdmFyIHJlbW90ZSA9IHRoaXMuY3VycmVudFN0YXRzUmVwb3J0W25vdy5yZW1vdGVDYW5kaWRhdGVJZF07XG4gICAgICAgICAgICBQZWVyU3RhdHMudHJhbnNwb3J0LnB1c2goe2xvY2FsaXA6IGxvY2FsLmlwQWRkcmVzcyArIFwiOlwiICsgbG9jYWwucG9ydE51bWJlcixcbiAgICAgICAgICAgICAgICBpcDogcmVtb3RlLmlwQWRkcmVzcyArIFwiOlwiICsgcmVtb3RlLnBvcnROdW1iZXIsIHR5cGU6IGxvY2FsLnRyYW5zcG9ydH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm93LnR5cGUgIT0gJ3NzcmMnICYmIG5vdy50eXBlICE9IFwib3V0Ym91bmRydHBcIiAmJlxuICAgICAgICAgICAgbm93LnR5cGUgIT0gXCJpbmJvdW5kcnRwXCIpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJlZm9yZSA9IHRoaXMuYmFzZWxpbmVTdGF0c1JlcG9ydFtpZHhdO1xuICAgICAgICBpZiAoIWJlZm9yZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGdldFN0YXRWYWx1ZShub3csICdzc3JjJykgKyAnIG5vdCBlbm91Z2ggZGF0YScpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3NyYyA9IGdldFN0YXRWYWx1ZShub3csICdzc3JjJyk7XG4gICAgICAgIGlmKCFzc3JjKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBqaWQgPSBzc3JjMmppZFtzc3JjXTtcbiAgICAgICAgaWYgKCFqaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk5vIGppZCBmb3Igc3NyYzogXCIgKyBzc3JjKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGppZFN0YXRzID0gdGhpcy5qaWQyc3RhdHNbamlkXTtcbiAgICAgICAgaWYgKCFqaWRTdGF0cykge1xuICAgICAgICAgICAgamlkU3RhdHMgPSBuZXcgUGVlclN0YXRzKCk7XG4gICAgICAgICAgICB0aGlzLmppZDJzdGF0c1tqaWRdID0gamlkU3RhdHM7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBpc0Rvd25sb2FkU3RyZWFtID0gdHJ1ZTtcbiAgICAgICAgdmFyIGtleSA9ICdwYWNrZXRzUmVjZWl2ZWQnO1xuICAgICAgICBpZiAoIWdldFN0YXRWYWx1ZShub3csIGtleSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlzRG93bmxvYWRTdHJlYW0gPSBmYWxzZTtcbiAgICAgICAgICAgIGtleSA9ICdwYWNrZXRzU2VudCc7XG4gICAgICAgICAgICBpZiAoIWdldFN0YXRWYWx1ZShub3csIGtleSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gcGFja2V0c1JlY2VpdmVkIG5vciBwYWNrZXRTZW50IHN0YXQgZm91bmRcIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhY2tldHNOb3cgPSBnZXRTdGF0VmFsdWUobm93LCBrZXkpO1xuICAgICAgICBpZighcGFja2V0c05vdyB8fCBwYWNrZXRzTm93IDwgMClcbiAgICAgICAgICAgIHBhY2tldHNOb3cgPSAwO1xuXG4gICAgICAgIHZhciBwYWNrZXRzQmVmb3JlID0gZ2V0U3RhdFZhbHVlKGJlZm9yZSwga2V5KTtcbiAgICAgICAgaWYoIXBhY2tldHNCZWZvcmUgfHwgcGFja2V0c0JlZm9yZSA8IDApXG4gICAgICAgICAgICBwYWNrZXRzQmVmb3JlID0gMDtcbiAgICAgICAgdmFyIHBhY2tldFJhdGUgPSBwYWNrZXRzTm93IC0gcGFja2V0c0JlZm9yZTtcbiAgICAgICAgaWYoIXBhY2tldFJhdGUgfHwgcGFja2V0UmF0ZSA8IDApXG4gICAgICAgICAgICBwYWNrZXRSYXRlID0gMDtcbiAgICAgICAgdmFyIGN1cnJlbnRMb3NzID0gZ2V0U3RhdFZhbHVlKG5vdywgJ3BhY2tldHNMb3N0Jyk7XG4gICAgICAgIGlmKCFjdXJyZW50TG9zcyB8fCBjdXJyZW50TG9zcyA8IDApXG4gICAgICAgICAgICBjdXJyZW50TG9zcyA9IDA7XG4gICAgICAgIHZhciBwcmV2aW91c0xvc3MgPSBnZXRTdGF0VmFsdWUoYmVmb3JlLCAncGFja2V0c0xvc3QnKTtcbiAgICAgICAgaWYoIXByZXZpb3VzTG9zcyB8fCBwcmV2aW91c0xvc3MgPCAwKVxuICAgICAgICAgICAgcHJldmlvdXNMb3NzID0gMDtcbiAgICAgICAgdmFyIGxvc3NSYXRlID0gY3VycmVudExvc3MgLSBwcmV2aW91c0xvc3M7XG4gICAgICAgIGlmKCFsb3NzUmF0ZSB8fCBsb3NzUmF0ZSA8IDApXG4gICAgICAgICAgICBsb3NzUmF0ZSA9IDA7XG4gICAgICAgIHZhciBwYWNrZXRzVG90YWwgPSAocGFja2V0UmF0ZSArIGxvc3NSYXRlKTtcblxuICAgICAgICBqaWRTdGF0cy5zZXRTc3JjTG9zcyhzc3JjLFxuICAgICAgICAgICAge1wicGFja2V0c1RvdGFsXCI6IHBhY2tldHNUb3RhbCxcbiAgICAgICAgICAgICAgICBcInBhY2tldHNMb3N0XCI6IGxvc3NSYXRlLFxuICAgICAgICAgICAgICAgIFwiaXNEb3dubG9hZFN0cmVhbVwiOiBpc0Rvd25sb2FkU3RyZWFtfSk7XG5cblxuICAgICAgICB2YXIgYnl0ZXNSZWNlaXZlZCA9IDAsIGJ5dGVzU2VudCA9IDA7XG4gICAgICAgIGlmKGdldFN0YXRWYWx1ZShub3csIFwiYnl0ZXNSZWNlaXZlZFwiKSlcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZXNSZWNlaXZlZCA9IGdldFN0YXRWYWx1ZShub3csIFwiYnl0ZXNSZWNlaXZlZFwiKSAtXG4gICAgICAgICAgICAgICAgZ2V0U3RhdFZhbHVlKGJlZm9yZSwgXCJieXRlc1JlY2VpdmVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZ2V0U3RhdFZhbHVlKG5vdywgXCJieXRlc1NlbnRcIikpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJ5dGVzU2VudCA9IGdldFN0YXRWYWx1ZShub3csIFwiYnl0ZXNTZW50XCIpIC1cbiAgICAgICAgICAgICAgICBnZXRTdGF0VmFsdWUoYmVmb3JlLCBcImJ5dGVzU2VudFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0aW1lID0gTWF0aC5yb3VuZCgobm93LnRpbWVzdGFtcCAtIGJlZm9yZS50aW1lc3RhbXApIC8gMTAwMCk7XG4gICAgICAgIGlmKGJ5dGVzUmVjZWl2ZWQgPD0gMCB8fCB0aW1lIDw9IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGJ5dGVzUmVjZWl2ZWQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZXNSZWNlaXZlZCA9IE1hdGgucm91bmQoKChieXRlc1JlY2VpdmVkICogOCkgLyB0aW1lKSAvIDEwMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoYnl0ZXNTZW50IDw9IDAgfHwgdGltZSA8PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBieXRlc1NlbnQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgYnl0ZXNTZW50ID0gTWF0aC5yb3VuZCgoKGJ5dGVzU2VudCAqIDgpIC8gdGltZSkgLyAxMDAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGppZFN0YXRzLnNldFNzcmNCaXRyYXRlKHNzcmMsIHtcbiAgICAgICAgICAgIFwiZG93bmxvYWRcIjogYnl0ZXNSZWNlaXZlZCxcbiAgICAgICAgICAgIFwidXBsb2FkXCI6IGJ5dGVzU2VudH0pO1xuXG4gICAgICAgIHZhciByZXNvbHV0aW9uID0ge2hlaWdodDogbnVsbCwgd2lkdGg6IG51bGx9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lSGVpZ2h0UmVjZWl2ZWRcIikgJiZcbiAgICAgICAgICAgICAgICBnZXRTdGF0VmFsdWUobm93LCBcImdvb2dGcmFtZVdpZHRoUmVjZWl2ZWRcIikpIHtcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLmhlaWdodCA9IGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lSGVpZ2h0UmVjZWl2ZWRcIik7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbi53aWR0aCA9IGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lV2lkdGhSZWNlaXZlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lSGVpZ2h0U2VudFwiKSAmJlxuICAgICAgICAgICAgICAgIGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lV2lkdGhTZW50XCIpKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbi5oZWlnaHQgPSBnZXRTdGF0VmFsdWUobm93LCBcImdvb2dGcmFtZUhlaWdodFNlbnRcIik7XG4gICAgICAgICAgICAgICAgcmVzb2x1dGlvbi53aWR0aCA9IGdldFN0YXRWYWx1ZShub3csIFwiZ29vZ0ZyYW1lV2lkdGhTZW50XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpey8qbm90IHN1cHBvcnRlZCovfVxuXG4gICAgICAgIGlmKHJlc29sdXRpb24uaGVpZ2h0ICYmIHJlc29sdXRpb24ud2lkdGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGppZFN0YXRzLnNldFNzcmNSZXNvbHV0aW9uKHNzcmMsIHJlc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgamlkU3RhdHMuc2V0U3NyY1Jlc29sdXRpb24oc3NyYywgbnVsbCk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIEppZCBzdGF0c1xuICAgIHZhciB0b3RhbFBhY2tldHMgPSB7ZG93bmxvYWQ6IDAsIHVwbG9hZDogMH07XG4gICAgdmFyIGxvc3RQYWNrZXRzID0ge2Rvd25sb2FkOiAwLCB1cGxvYWQ6IDB9O1xuICAgIHZhciBiaXRyYXRlRG93bmxvYWQgPSAwO1xuICAgIHZhciBiaXRyYXRlVXBsb2FkID0gMDtcbiAgICB2YXIgcmVzb2x1dGlvbnMgPSB7fTtcbiAgICBPYmplY3Qua2V5cyh0aGlzLmppZDJzdGF0cykuZm9yRWFjaChcbiAgICAgICAgZnVuY3Rpb24gKGppZClcbiAgICAgICAge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMkxvc3MpLmZvckVhY2goXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHNzcmMpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IFwidXBsb2FkXCI7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJMb3NzW3NzcmNdLmlzRG93bmxvYWRTdHJlYW0pXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlID0gXCJkb3dubG9hZFwiO1xuICAgICAgICAgICAgICAgICAgICB0b3RhbFBhY2tldHNbdHlwZV0gKz1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJMb3NzW3NzcmNdLnBhY2tldHNUb3RhbDtcbiAgICAgICAgICAgICAgICAgICAgbG9zdFBhY2tldHNbdHlwZV0gKz1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJMb3NzW3NzcmNdLnBhY2tldHNMb3N0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzZWxmLmppZDJzdGF0c1tqaWRdLnNzcmMyYml0cmF0ZSkuZm9yRWFjaChcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgICAgICBiaXRyYXRlRG93bmxvYWQgKz1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJiaXRyYXRlW3NzcmNdLmRvd25sb2FkO1xuICAgICAgICAgICAgICAgICAgICBiaXRyYXRlVXBsb2FkICs9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmppZDJzdGF0c1tqaWRdLnNzcmMyYml0cmF0ZVtzc3JjXS51cGxvYWQ7XG5cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNlbGYuamlkMnN0YXRzW2ppZF0uc3NyYzJiaXRyYXRlW3NzcmNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXNvbHV0aW9uc1tqaWRdID0gc2VsZi5qaWQyc3RhdHNbamlkXS5zc3JjMnJlc29sdXRpb247XG4gICAgICAgIH1cbiAgICApO1xuXG4gICAgUGVlclN0YXRzLmJpdHJhdGUgPSB7XCJ1cGxvYWRcIjogYml0cmF0ZVVwbG9hZCwgXCJkb3dubG9hZFwiOiBiaXRyYXRlRG93bmxvYWR9O1xuXG4gICAgUGVlclN0YXRzLnBhY2tldExvc3MgPSB7XG4gICAgICAgIHRvdGFsOlxuICAgICAgICAgICAgY2FsY3VsYXRlUGFja2V0TG9zcyhsb3N0UGFja2V0cy5kb3dubG9hZCArIGxvc3RQYWNrZXRzLnVwbG9hZCxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxQYWNrZXRzLmRvd25sb2FkICsgdG90YWxQYWNrZXRzLnVwbG9hZCksXG4gICAgICAgIGRvd25sb2FkOlxuICAgICAgICAgICAgY2FsY3VsYXRlUGFja2V0TG9zcyhsb3N0UGFja2V0cy5kb3dubG9hZCwgdG90YWxQYWNrZXRzLmRvd25sb2FkKSxcbiAgICAgICAgdXBsb2FkOlxuICAgICAgICAgICAgY2FsY3VsYXRlUGFja2V0TG9zcyhsb3N0UGFja2V0cy51cGxvYWQsIHRvdGFsUGFja2V0cy51cGxvYWQpXG4gICAgfTtcbiAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KFwic3RhdGlzdGljcy5jb25uZWN0aW9uc3RhdHNcIixcbiAgICAgICAge1xuICAgICAgICAgICAgXCJiaXRyYXRlXCI6IFBlZXJTdGF0cy5iaXRyYXRlLFxuICAgICAgICAgICAgXCJwYWNrZXRMb3NzXCI6IFBlZXJTdGF0cy5wYWNrZXRMb3NzLFxuICAgICAgICAgICAgXCJiYW5kd2lkdGhcIjogUGVlclN0YXRzLmJhbmR3aWR0aCxcbiAgICAgICAgICAgIFwicmVzb2x1dGlvblwiOiByZXNvbHV0aW9ucyxcbiAgICAgICAgICAgIFwidHJhbnNwb3J0XCI6IFBlZXJTdGF0cy50cmFuc3BvcnRcbiAgICAgICAgfSk7XG4gICAgUGVlclN0YXRzLnRyYW5zcG9ydCA9IFtdO1xuXG59O1xuXG4vKipcbiAqIFN0YXRzIHByb2Nlc3NpbmcgbG9naWMuXG4gKi9cblN0YXRzQ29sbGVjdG9yLnByb3RvdHlwZS5wcm9jZXNzQXVkaW9MZXZlbFJlcG9ydCA9IGZ1bmN0aW9uICgpXG57XG4gICAgaWYgKCF0aGlzLmJhc2VsaW5lQXVkaW9MZXZlbHNSZXBvcnQpXG4gICAge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaWR4IGluIHRoaXMuY3VycmVudEF1ZGlvTGV2ZWxzUmVwb3J0KVxuICAgIHtcbiAgICAgICAgdmFyIG5vdyA9IHRoaXMuY3VycmVudEF1ZGlvTGV2ZWxzUmVwb3J0W2lkeF07XG5cbiAgICAgICAgaWYgKG5vdy50eXBlICE9ICdzc3JjJylcbiAgICAgICAge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmVmb3JlID0gdGhpcy5iYXNlbGluZUF1ZGlvTGV2ZWxzUmVwb3J0W2lkeF07XG4gICAgICAgIGlmICghYmVmb3JlKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oZ2V0U3RhdFZhbHVlKG5vdywgJ3NzcmMnKSArICcgbm90IGVub3VnaCBkYXRhJyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzc3JjID0gZ2V0U3RhdFZhbHVlKG5vdywgJ3NzcmMnKTtcbiAgICAgICAgdmFyIGppZCA9IHNzcmMyamlkW3NzcmNdO1xuICAgICAgICBpZiAoIWppZClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gamlkIGZvciBzc3JjOiBcIiArIHNzcmMpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgamlkU3RhdHMgPSB0aGlzLmppZDJzdGF0c1tqaWRdO1xuICAgICAgICBpZiAoIWppZFN0YXRzKVxuICAgICAgICB7XG4gICAgICAgICAgICBqaWRTdGF0cyA9IG5ldyBQZWVyU3RhdHMoKTtcbiAgICAgICAgICAgIHRoaXMuamlkMnN0YXRzW2ppZF0gPSBqaWRTdGF0cztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF1ZGlvIGxldmVsXG4gICAgICAgIHZhciBhdWRpb0xldmVsID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXVkaW9MZXZlbCA9IGdldFN0YXRWYWx1ZShub3csICdhdWRpb0lucHV0TGV2ZWwnKTtcbiAgICAgICAgICAgIGlmICghYXVkaW9MZXZlbClcbiAgICAgICAgICAgICAgICBhdWRpb0xldmVsID0gZ2V0U3RhdFZhbHVlKG5vdywgJ2F1ZGlvT3V0cHV0TGV2ZWwnKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlKSB7Lypub3Qgc3VwcG9ydGVkKi9cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkF1ZGlvIExldmVscyBhcmUgbm90IGF2YWlsYWJsZSBpbiB0aGUgc3RhdGlzdGljcy5cIik7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuYXVkaW9MZXZlbHNJbnRlcnZhbElkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhdWRpb0xldmVsKVxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBUT0RPOiBjYW4ndCBmaW5kIHNwZWNzIGFib3V0IHdoYXQgdGhpcyB2YWx1ZSByZWFsbHkgaXMsXG4gICAgICAgICAgICAvLyBidXQgaXQgc2VlbXMgdG8gdmFyeSBiZXR3ZWVuIDAgYW5kIGFyb3VuZCAzMmsuXG4gICAgICAgICAgICBhdWRpb0xldmVsID0gYXVkaW9MZXZlbCAvIDMyNzY3O1xuICAgICAgICAgICAgamlkU3RhdHMuc2V0U3NyY0F1ZGlvTGV2ZWwoc3NyYywgYXVkaW9MZXZlbCk7XG4gICAgICAgICAgICBpZihqaWQgIT0gY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZClcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KFwic3RhdGlzdGljcy5hdWRpb0xldmVsXCIsIGppZCwgYXVkaW9MZXZlbCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSBocmlzdG8gb24gOC80LzE0LlxuICovXG52YXIgTG9jYWxTdGF0cyA9IHJlcXVpcmUoXCIuL0xvY2FsU3RhdHNDb2xsZWN0b3IuanNcIik7XG52YXIgUlRQU3RhdHMgPSByZXF1aXJlKFwiLi9SVFBTdGF0c0NvbGxlY3Rvci5qc1wiKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xuLy9UaGVzZSBsaW5lcyBzaG91bGQgYmUgdW5jb21tZW50ZWQgd2hlbiByZXF1aXJlIHdvcmtzIGluIGFwcC5qc1xuLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuLy92YXIgUlRDQnJvd3NlclR5cGUgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvUlRDQnJvd3NlclR5cGVcIik7XG4vL3ZhciBYTVBQRXZlbnRzID0gcmVxdWlyZShcIi4uL3NlcnZpY2UveG1wcC9YTVBQRXZlbnRzXCIpO1xuXG52YXIgZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG52YXIgbG9jYWxTdGF0cyA9IG51bGw7XG5cbnZhciBydHBTdGF0cyA9IG51bGw7XG5cbmZ1bmN0aW9uIHN0b3BMb2NhbCgpXG57XG4gICAgaWYobG9jYWxTdGF0cylcbiAgICB7XG4gICAgICAgIGxvY2FsU3RhdHMuc3RvcCgpO1xuICAgICAgICBsb2NhbFN0YXRzID0gbnVsbDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0b3BSZW1vdGUoKVxue1xuICAgIGlmKHJ0cFN0YXRzKVxuICAgIHtcbiAgICAgICAgcnRwU3RhdHMuc3RvcCgpO1xuICAgICAgICBldmVudEVtaXR0ZXIuZW1pdChcInN0YXRpc3RpY3Muc3RvcFwiKTtcbiAgICAgICAgcnRwU3RhdHMgPSBudWxsO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3RhcnRSZW1vdGVTdGF0cyAocGVlcmNvbm5lY3Rpb24pIHtcbiAgICBpZiAoY29uZmlnLmVuYWJsZVJ0cFN0YXRzKVxuICAgIHtcbiAgICAgICAgaWYocnRwU3RhdHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJ0cFN0YXRzLnN0b3AoKTtcbiAgICAgICAgICAgIHJ0cFN0YXRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJ0cFN0YXRzID0gbmV3IFJUUFN0YXRzKHBlZXJjb25uZWN0aW9uLCAyMDAsIDIwMDAsIGV2ZW50RW1pdHRlcik7XG4gICAgICAgIHJ0cFN0YXRzLnN0YXJ0KCk7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIG9uU3RyZWFtQ3JlYXRlZChzdHJlYW0pXG57XG4gICAgaWYoc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkubGVuZ3RoID09PSAwKVxuICAgICAgICByZXR1cm47XG5cbiAgICBsb2NhbFN0YXRzID0gbmV3IExvY2FsU3RhdHMoc3RyZWFtLCAxMDAsIHRoaXMsXG4gICAgICAgIGV2ZW50RW1pdHRlcik7XG4gICAgbG9jYWxTdGF0cy5zdGFydCgpO1xufVxuXG5cbnZhciBzdGF0aXN0aWNzID1cbntcbiAgICAvKipcbiAgICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGlzIGF1ZGlvIGxldmVsIGlzIGZvciBsb2NhbCBqaWQuXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBMT0NBTF9KSUQ6ICdsb2NhbCcsXG5cbiAgICBhZGRBdWRpb0xldmVsTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKFwic3RhdGlzdGljcy5hdWRpb0xldmVsXCIsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlQXVkaW9MZXZlbExpc3RlbmVyOiBmdW5jdGlvbihsaXN0ZW5lcilcbiAgICB7XG4gICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcInN0YXRpc3RpY3MuYXVkaW9MZXZlbFwiLCBsaXN0ZW5lcik7XG4gICAgfSxcblxuICAgIGFkZENvbm5lY3Rpb25TdGF0c0xpc3RlbmVyOiBmdW5jdGlvbihsaXN0ZW5lcilcbiAgICB7XG4gICAgICAgIGV2ZW50RW1pdHRlci5vbihcInN0YXRpc3RpY3MuY29ubmVjdGlvbnN0YXRzXCIsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlQ29ubmVjdGlvblN0YXRzTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKFwic3RhdGlzdGljcy5jb25uZWN0aW9uc3RhdHNcIiwgbGlzdGVuZXIpO1xuICAgIH0sXG5cblxuICAgIGFkZFJlbW90ZVN0YXRzU3RvcExpc3RlbmVyOiBmdW5jdGlvbihsaXN0ZW5lcilcbiAgICB7XG4gICAgICAgIGV2ZW50RW1pdHRlci5vbihcInN0YXRpc3RpY3Muc3RvcFwiLCBsaXN0ZW5lcik7XG4gICAgfSxcblxuICAgIHJlbW92ZVJlbW90ZVN0YXRzU3RvcExpc3RlbmVyOiBmdW5jdGlvbihsaXN0ZW5lcilcbiAgICB7XG4gICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcihcInN0YXRpc3RpY3Muc3RvcFwiLCBsaXN0ZW5lcik7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcExvY2FsKCk7XG4gICAgICAgIHN0b3BSZW1vdGUoKTtcbiAgICAgICAgaWYoZXZlbnRFbWl0dGVyKVxuICAgICAgICB7XG4gICAgICAgICAgICBldmVudEVtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RvcFJlbW90ZVN0YXRpc3RpY3M6IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHN0b3BSZW1vdGUoKTtcbiAgICB9LFxuXG4gICAgb25Db25mZXJlbmNlQ3JlYXRlZDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHN0YXJ0UmVtb3RlU3RhdHMoZXZlbnQucGVlcmNvbm5lY3Rpb24pO1xuICAgIH0sXG5cbiAgICBvbkRpc3Bvc2VDb25mZXJlbmNlOiBmdW5jdGlvbiAob25VbmxvYWQpIHtcbiAgICAgICAgc3RvcFJlbW90ZSgpO1xuICAgICAgICBpZihvblVubG9hZCkge1xuICAgICAgICAgICAgc3RvcExvY2FsKCk7XG4gICAgICAgICAgICBldmVudEVtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUlRDLmFkZFN0cmVhbUxpc3RlbmVyKG9uU3RyZWFtQ3JlYXRlZCxcbiAgICAgICAgICAgIFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9MT0NBTF9DUkVBVEVEKTtcbiAgICB9XG5cbn07XG5cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGlzdGljczsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
