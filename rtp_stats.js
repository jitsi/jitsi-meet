/* global ssrc2jid */

/**
 * Function object which once created can be used to calculate moving average of
 * given period. Example for SMA3:</br>
 * var sma3 = new SimpleMovingAverager(3);
 * while(true) // some update loop
 * {
 *   var currentSma3Value = sma3(nextInputValue);
 * }
 *
 * @param period moving average period that will be used by created instance.
 * @returns {Function} SMA calculator function of given <tt>period</tt>.
 * @constructor
 */
function SimpleMovingAverager(period)
{
    var nums = [];
    return function (num)
    {
        nums.push(num);
        if (nums.length > period)
            nums.splice(0, 1);
        var sum = 0;
        for (var i in nums)
            sum += nums[i];
        var n = period;
        if (nums.length < period)
            n = nums.length;
        return (sum / n);
    };
}

/**
 * Peer statistics data holder.
 * @constructor
 */
function PeerStats()
{
    this.ssrc2Loss = {};
    this.ssrc2AudioLevel = {};
}

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
 * Calculates average packet loss for all streams that belong to the peer
 * represented by this instance.
 * @returns {number} average packet loss for all streams that belong to the peer
 *                   represented by this instance.
 */
PeerStats.prototype.getAvgLoss = function ()
{
    var self = this;
    var avg = 0;
    var count = Object.keys(this.ssrc2Loss).length;
    Object.keys(this.ssrc2Loss).forEach(
        function (ssrc)
        {
            avg += self.ssrc2Loss[ssrc];
        }
    );
    return count > 0 ? avg / count : 0;
};

/**
 * <tt>StatsCollector</tt> registers for stats updates of given
 * <tt>peerconnection</tt> in given <tt>interval</tt>. On each update particular
 * stats are extracted and put in {@link PeerStats} objects. Once the processing
 * is done <tt>updateCallback</tt> is called with <tt>this</tt> instance as
 * an event source.
 *
 * @param peerconnection webRTC peer connection object.
 * @param interval stats refresh interval given in ms.
 * @param {function(StatsCollector)} updateCallback the callback called on stats
 *                                   update.
 * @constructor
 */
function StatsCollector(peerconnection, interval, updateCallback)
{
    this.peerconnection = peerconnection;
    this.baselineReport = null;
    this.currentReport = null;
    this.intervalId = null;
    // Updates stats interval
    this.intervalMilis = interval;
    // Use SMA 3 to average packet loss changes over time
    this.sma3 = new SimpleMovingAverager(3);
    // Map of jids to PeerStats
    this.jid2stats = {};

    this.updateCallback = updateCallback;
}

/**
 * Stops stats updates.
 */
StatsCollector.prototype.stop = function ()
{
    if (this.intervalId)
    {
        clearInterval(this.intervalId);
        this.intervalId = null;
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
    this.intervalId = setInterval(
        function ()
        {
            // Interval updates
            self.peerconnection.getStats(
                function (report)
                {
                    var results = report.result();
                    //console.error("Got interval report", results);
                    self.currentReport = results;
                    self.processReport();
                    self.baselineReport = self.currentReport;
                },
                self.errorCallback
            );
        },
        self.intervalMilis
    );
};

/**
 * Stats processing logic.
 */
StatsCollector.prototype.processReport = function ()
{
    if (!this.baselineReport)
    {
        return;
    }

    for (var idx in this.currentReport)
    {
        var now = this.currentReport[idx];
        if (now.type != 'ssrc')
        {
            continue;
        }

        var before = this.baselineReport[idx];
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
        }

        var key = 'packetsReceived';
        if (!now.stat(key))
        {
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
        var lossPercent;

        if (packetsTotal > 0)
            lossPercent = lossRate / packetsTotal;
        else
            lossPercent = 0;

        //console.info(jid + " ssrc: " + ssrc + " " + key + ": " + packetsNow);

        jidStats.setSsrcLoss(ssrc, lossPercent);
    }

    var self = this;
    // Jid stats
    var allPeersAvg = 0;
    var jids = Object.keys(this.jid2stats);
    jids.forEach(
        function (jid)
        {
            var peerAvg = self.jid2stats[jid].getAvgLoss(
                function (avg)
                {
                    //console.info(jid + " stats: " + (avg * 100) + " %");
                    allPeersAvg += avg;
                }
            );
        }
    );

    if (jids.length > 1)
    {
        // Our streams loss is reported as 0 always, so -1 to length
        allPeersAvg = allPeersAvg / (jids.length - 1);

        /**
         * Calculates number of connection quality bars from 4(hi) to 0(lo).
         */
        var outputAvg = self.sma3(allPeersAvg);
        // Linear from 4(0%) to 0(25%).
        var quality = Math.round(4 - outputAvg * 16);
        quality = Math.max(quality, 0); // lower limit 0
        quality = Math.min(quality, 4); // upper limit 4
        // TODO: quality can be used to indicate connection quality using 4 step
        // bar indicator
        //console.info("Loss SMA3: " + outputAvg + " Q: " + quality);
    }

    self.updateCallback(self);
};

