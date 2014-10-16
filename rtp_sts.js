/* global ssrc2jid */
/**
 * Calculates packet lost percent using the number of lost packets and the number of all packet.
 * @param lostPackets the number of lost packets
 * @param totalPackets the number of all packets.
 * @returns {number} packet loss percent
 */
function calculatePacketLoss(lostPackets, totalPackets) {
    return Math.round((lostPackets/totalPackets)*100);
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
    this.resolution = null;
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
 * Sets the bit rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param bitrate new bitrate value to be set.
 */
PeerStats.prototype.setSsrcBitrate = function (ssrc, bitrate)
{
    this.ssrc2bitrate[ssrc] = bitrate;
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
 * is done <tt>audioLevelsUpdateCallback</tt> is called with <tt>this</tt> instance as
 * an event source.
 *
 * @param peerconnection webRTC peer connection object.
 * @param interval stats refresh interval given in ms.
 * @param {function(StatsCollector)} audioLevelsUpdateCallback the callback called on stats
 *                                   update.
 * @constructor
 */
function StatsCollector(peerconnection, audioLevelsInterval, audioLevelsUpdateCallback, statsInterval, statsUpdateCallback)
{
    this.peerconnection = peerconnection;
    this.baselineAudioLevelsReport = null;
    this.currentAudioLevelsReport = null;
    this.currentStatsReport = null;
    this.baselineStatsReport = null;
    this.audioLevelsIntervalId = null;
    // Updates stats interval
    this.audioLevelsIntervalMilis = audioLevelsInterval;

    this.statsIntervalId = null;
    this.statsIntervalMilis = statsInterval;
    // Map of jids to PeerStats
    this.jid2stats = {};

    this.audioLevelsUpdateCallback = audioLevelsUpdateCallback;
    this.statsUpdateCallback = statsUpdateCallback;
}

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
                    var results = report.result();
                    //console.error("Got interval report", results);
                    self.currentAudioLevelsReport = results;
                    self.processAudioLevelReport();
                    self.baselineAudioLevelsReport = self.currentAudioLevelsReport;
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
                    var results = report.result();
                    //console.error("Got interval report", results);
                    self.currentStatsReport = results;
                    self.processStatsReport();
                    self.baselineStatsReport = self.currentStatsReport;
                },
                self.errorCallback
            );
        },
        self.statsIntervalMilis
    );
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
        if (now.stat('googAvailableReceiveBandwidth') || now.stat('googAvailableSendBandwidth')) {
            PeerStats.bandwidth = {
                "download": Math.round((now.stat('googAvailableReceiveBandwidth') * 8) / 1000),
                "upload": Math.round((now.stat('googAvailableSendBandwidth') * 8) / 1000)
            };
        }

        if(now.type == 'googCandidatePair')
        {
            var ip = now.stat('googRemoteAddress');
            var type = now.stat("googTransportType");
            if(!ip || !type)
                continue;
            var addressSaved = false;
            for(var i = 0; i < PeerStats.transport.length; i++)
            {
                if(PeerStats.transport[i].ip == ip && PeerStats.transport[i].type == type)
                {
                    addressSaved = true;
                }
            }
            if(addressSaved)
                continue;
            PeerStats.transport.push({ip: ip, type: type});
            continue;
        }

//            console.log("bandwidth: " + now.stat('googAvailableReceiveBandwidth') + " - " + now.stat('googAvailableSendBandwidth'));
        if (now.type != 'ssrc') {
            continue;
        }

        var before = this.baselineStatsReport[idx];
        if (!before) {
            console.warn(now.stat('ssrc') + ' not enough data');
            continue;
        }

        var ssrc = now.stat('ssrc');
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
        if (!now.stat(key))
        {
            isDownloadStream = false;
            key = 'packetsSent';
            if (!now.stat(key))
            {
                console.error("No packetsReceived nor packetSent stat found");
                this.stop();
                return;
            }
        }
        var packetsNow = now.stat(key);
        var packetsBefore = before.stat(key);
        var packetRate = packetsNow - packetsBefore;

        var currentLoss = now.stat('packetsLost');
        var previousLoss = before.stat('packetsLost');
        var lossRate = currentLoss - previousLoss;

        var packetsTotal = (packetRate + lossRate);

        jidStats.setSsrcLoss(ssrc, {"packetsTotal": packetsTotal, "packetsLost": lossRate,
            "isDownloadStream": isDownloadStream});

        var bytesReceived = 0, bytesSent = 0;
        if(now.stat("bytesReceived"))
        {
            bytesReceived = now.stat("bytesReceived") - before.stat("bytesReceived");
        }

        if(now.stat("bytesSent"))
        {
            bytesSent = now.stat("bytesSent") - before.stat("bytesSent");
        }

        if(bytesReceived < 0)
            bytesReceived = 0;
        if(bytesSent < 0)
            bytesSent = 0;

        var time = Math.round((now.timestamp - before.timestamp) / 1000);
        jidStats.setSsrcBitrate(ssrc, {
            "download": Math.round(((bytesReceived * 8) / time) / 1000),
            "upload": Math.round(((bytesSent * 8) / time) / 1000)});
        var resolution = {height: null, width: null};
        if(now.stat("googFrameHeightReceived") && now.stat("googFrameWidthReceived"))
        {
            resolution.height = now.stat("googFrameHeightReceived");
            resolution.width = now.stat("googFrameWidthReceived");
        }
        else if(now.stat("googFrameHeightSent") && now.stat("googFrameWidthSent"))
        {
            resolution.height = now.stat("googFrameHeightSent");
            resolution.width = now.stat("googFrameWidthSent");
        }

        if(!jidStats.resolution)
            jidStats.resolution = null;

        console.log(jid + " - resolution: " + resolution.height + "x" + resolution.width);
        if(resolution.height && resolution.width)
        {
            if(!jidStats.resolution)
                jidStats.resolution = { hq: resolution, lq: resolution};
            else if(jidStats.resolution.hq.width > resolution.width &&
                jidStats.resolution.hq.height > resolution.height)
            {
                jidStats.resolution.lq = resolution;
            }
            else
            {
                jidStats.resolution.hq = resolution;
            }
        }


    }

    var self = this;
    // Jid stats
    var totalPackets = {download: 0, upload: 0};
    var lostPackets = {download: 0, upload: 0};
    var bitrateDownload = 0;
    var bitrateUpload = 0;
    var resolution = {};
    Object.keys(this.jid2stats).forEach(
        function (jid)
        {
            Object.keys(self.jid2stats[jid].ssrc2Loss).forEach(
                function (ssrc)
                {
                    var type = "upload";
                    if(self.jid2stats[jid].ssrc2Loss[ssrc].isDownloadStream)
                        type = "download";
                    totalPackets[type] += self.jid2stats[jid].ssrc2Loss[ssrc].packetsTotal;
                    lostPackets[type] += self.jid2stats[jid].ssrc2Loss[ssrc].packetsLost;
                }
            );
            Object.keys(self.jid2stats[jid].ssrc2bitrate).forEach(
                function (ssrc) {
                    bitrateDownload += self.jid2stats[jid].ssrc2bitrate[ssrc].download;
                    bitrateUpload += self.jid2stats[jid].ssrc2bitrate[ssrc].upload;
                }
            );
            resolution[jid] = self.jid2stats[jid].resolution;
            delete self.jid2stats[jid].resolution;
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
    this.statsUpdateCallback(
        {
            "bitrate": PeerStats.bitrate,
            "packetLoss": PeerStats.packetLoss,
            "bandwidth": PeerStats.bandwidth,
            "resolution": resolution,
            "transport": PeerStats.transport
        });
    PeerStats.transport = [];

}

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
            console.warn(now.stat('ssrc') + ' not enough data');
            continue;
        }

        var ssrc = now.stat('ssrc');
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
        var audioLevel = now.stat('audioInputLevel');
        if (!audioLevel)
            audioLevel = now.stat('audioOutputLevel');
        if (audioLevel)
        {
            // TODO: can't find specs about what this value really is,
            // but it seems to vary between 0 and around 32k.
            audioLevel = audioLevel / 32767;
            jidStats.setSsrcAudioLevel(ssrc, audioLevel);
            if(jid != connection.emuc.myroomjid)
                this.audioLevelsUpdateCallback(jid, audioLevel);
        }

    }


};
