var SimulcastLogger = require("./SimulcastLogger");
var SimulcastUtils = require("./SimulcastUtils");

function SimulcastSender() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastSender', 1);
}

SimulcastSender.prototype.displayedLocalVideoStream = null;

SimulcastSender.prototype._generateGuid = (function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
}());

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() gives a non-uniform distribution!
SimulcastSender.prototype._generateRandomSSRC = function () {
    var min = 0, max = 0xffffffff;
    return Math.floor(Math.random() * (max - min)) + min;
};

SimulcastSender.prototype.getLocalVideoStream = function () {
    return (this.displayedLocalVideoStream != null)
        ? this.displayedLocalVideoStream
        // in case we have no simulcast at all, i.e. we didn't perform the GUM
        : APP.RTC.localVideo.getOriginalStream();
};

function NativeSimulcastSender() {
    SimulcastSender.call(this); // call the super constructor.
}

NativeSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

NativeSimulcastSender.prototype._localExplosionMap = {};
NativeSimulcastSender.prototype._isUsingScreenStream = false;
NativeSimulcastSender.prototype._localVideoSourceCache = '';

NativeSimulcastSender.prototype.reset = function () {
    this._localExplosionMap = {};
    this._isUsingScreenStream = APP.desktopsharing.isUsingScreenStream();
};

NativeSimulcastSender.prototype._cacheLocalVideoSources = function (lines) {
    this._localVideoSourceCache = this.simulcastUtils._getVideoSources(lines);
};

NativeSimulcastSender.prototype._restoreLocalVideoSources = function (lines) {
    this.simulcastUtils._replaceVideoSources(lines, this._localVideoSourceCache);
};

NativeSimulcastSender.prototype._appendSimulcastGroup = function (lines) {
    var videoSources, ssrcGroup, simSSRC, numOfSubs = 2, i, sb, msid;

    this.logger.info('Appending simulcast group...');

    // Get the primary SSRC information.
    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    // Start building the SIM SSRC group.
    ssrcGroup = ['a=ssrc-group:SIM'];

    // The video source buffer.
    sb = [];

    // Create the simulcast sub-streams.
    for (i = 0; i < numOfSubs; i++) {
        // TODO(gp) prevent SSRC collision.
        simSSRC = this._generateRandomSSRC();
        ssrcGroup.push(simSSRC);

        if (videoSources.base) {
            sb.splice.apply(sb, [sb.length, 0].concat(
                [["a=ssrc:", simSSRC, " cname:", videoSources.base.cname].join(''),
                    ["a=ssrc:", simSSRC, " msid:", videoSources.base.msid].join('')]
            ));
        }

        this.logger.info(['Generated substream ', i, ' with SSRC ', simSSRC, '.'].join(''));

    }

    // Add the group sim layers.
    sb.splice(0, 0, ssrcGroup.join(' '))

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

// Does the actual patching.
NativeSimulcastSender.prototype._ensureSimulcastGroup = function (lines) {

    this.logger.info('Ensuring simulcast group...');

    if (this.simulcastUtils._indexOfArray('a=ssrc-group:SIM', lines) === this.simulcastUtils._emptyCompoundIndex) {
        this._appendSimulcastGroup(lines);
        this._cacheLocalVideoSources(lines);
    } else {
        // verify that the ssrcs participating in the SIM group are present
        // in the SDP (needed for presence).
        this._restoreLocalVideoSources(lines);
    }
};

/**
 * Produces a single stream with multiple tracks for local video sources.
 *
 * @param lines
 * @private
 */
NativeSimulcastSender.prototype._explodeSimulcastSenderSources = function (lines) {
    var sb, msid, sid, tid, videoSources, self;

    this.logger.info('Exploding local video sources...');

    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    self = this;
    if (videoSources.groups && videoSources.groups.length !== 0) {
        videoSources.groups.forEach(function (group) {
            if (group.semantics === 'SIM') {
                group.ssrcs.forEach(function (ssrc) {

                    // Get the msid for this ssrc..
                    if (self._localExplosionMap[ssrc]) {
                        // .. either from the explosion map..
                        msid = self._localExplosionMap[ssrc];
                    } else {
                        // .. or generate a new one (msid).
                        sid = videoSources.sources[ssrc].msid
                            .substring(0, videoSources.sources[ssrc].msid.indexOf(' '));

                        tid = self._generateGuid();
                        msid = [sid, tid].join(' ');
                        self._localExplosionMap[ssrc] = msid;
                    }

                    // Assign it to the source object.
                    videoSources.sources[ssrc].msid = msid;

                    // TODO(gp) Change the msid of associated sources.
                });
            }
        });
    }

    sb = this.simulcastUtils._compileVideoSources(videoSources);

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NativeSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {

    // There's nothing special to do for native simulcast, so just do a normal GUM.
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        success(hqStream);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
NativeSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc) || this._isUsingScreenStream) {
        return desc;
    }


    sb = desc.sdp.split('\r\n');

    this._explodeSimulcastSenderSources(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine(['Exploded local video sources', desc.sdp].join(' '));

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcastSender.prototype.transformAnswer = function (desc) {

    if (!this.simulcastUtils.isValidDescription(desc) || this._isUsingScreenStream) {
        return desc;
    }

    var sb = desc.sdp.split('\r\n');

    // Even if we have enabled native simulcasting previously
    // (with a call to SLD with an appropriate SDP, for example),
    // createAnswer seems to consistently generate incomplete SDP
    // with missing SSRCS.
    //
    // So, subsequent calls to SLD will have missing SSRCS and presence
    // won't have the complete list of SRCs.
    this._ensureSimulcastGroup(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine(['Transformed answer', desc.sdp].join(' '));

    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcastSender.prototype.transformLocalDescription = function (desc) {
    return desc;
};

NativeSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    // Nothing to do here, native simulcast does that auto-magically.
};

NativeSimulcastSender.prototype.constructor = NativeSimulcastSender;

function SimpleSimulcastSender() {
    SimulcastSender.call(this);
}

SimpleSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

SimpleSimulcastSender.prototype.localStream = null;
SimpleSimulcastSender.prototype._localMaps = {
    msids: [],
    msid2ssrc: {}
};

/**
 * Groups local video sources together in the ssrc-group:SIM group.
 *
 * @param lines
 * @private
 */
SimpleSimulcastSender.prototype._groupLocalVideoSources = function (lines) {
    var sb, videoSources, ssrcs = [], ssrc;

    this.logger.info('Grouping local video sources...');

    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    for (ssrc in videoSources.sources) {
        // jitsi-meet destroys/creates streams at various places causing
        // the original local stream ids to change. The only thing that
        // remains unchanged is the trackid.
        this._localMaps.msid2ssrc[videoSources.sources[ssrc].msid.split(' ')[1]] = ssrc;
    }

    var self = this;
    // TODO(gp) add only "free" sources.
    this._localMaps.msids.forEach(function (msid) {
        ssrcs.push(self._localMaps.msid2ssrc[msid]);
    });

    if (!videoSources.groups) {
        videoSources.groups = [];
    }

    videoSources.groups.push({
        'semantics': 'SIM',
        'ssrcs': ssrcs
    });

    sb = this.simulcastUtils._compileVideoSources(videoSources);

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
SimpleSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {

    // TODO(gp) what if we request a resolution not supported by the hardware?
    // TODO(gp) make the lq stream configurable; although this wouldn't work with native simulcast
    var lqConstraints = {
        audio: false,
        video: {
            mandatory: {
                maxWidth: 320,
                maxHeight: 180,
                maxFrameRate: 15
            }
        }
    };

    this.logger.info('HQ constraints: ', constraints);
    this.logger.info('LQ constraints: ', lqConstraints);


    // NOTE(gp) if we request the lq stream first webkitGetUserMedia
    // fails randomly. Tested with Chrome 37. As fippo suggested, the
    // reason appears to be that Chrome only acquires the cam once and
    // then downscales the picture (https://code.google.com/p/chromium/issues/detail?id=346616#c11)

    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {

        self.localStream = hqStream;

        // reset local maps.
        self._localMaps.msids = [];
        self._localMaps.msid2ssrc = {};

        // add hq trackid to local map
        self._localMaps.msids.push(hqStream.getVideoTracks()[0].id);

        navigator.webkitGetUserMedia(lqConstraints, function (lqStream) {

            self.displayedLocalVideoStream = lqStream;

            // NOTE(gp) The specification says Array.forEach() will visit
            // the array elements in numeric order, and that it doesn't
            // visit elements that don't exist.

            // add lq trackid to local map
            self._localMaps.msids.splice(0, 0, lqStream.getVideoTracks()[0].id);

            self.localStream.addTrack(lqStream.getVideoTracks()[0]);
            success(self.localStream);
        }, err);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
SimpleSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc)) {
        return desc;
    }

    sb = desc.sdp.split('\r\n');

    this._groupLocalVideoSources(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine('Grouped local video sources');
    this.logger.fine(desc.sdp);

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
SimpleSimulcastSender.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
SimpleSimulcastSender.prototype.transformLocalDescription = function (desc) {

    var sb = desc.sdp.split('\r\n');

    this.simulcastUtils._removeSimulcastGroup(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine('Transformed local description');
    this.logger.fine(desc.sdp);

    return desc;
};

SimpleSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    var trackid;

    var self = this;
    this.logger.log(['Requested to', enabled ? 'enable' : 'disable', ssrc].join(' '));
    if (Object.keys(this._localMaps.msid2ssrc).some(function (tid) {
        // Search for the track id that corresponds to the ssrc
        if (self._localMaps.msid2ssrc[tid] == ssrc) {
            trackid = tid;
            return true;
        }
    }) && self.localStream.getVideoTracks().some(function (track) {
        // Start/stop the track that corresponds to the track id
        if (track.id === trackid) {
            track.enabled = enabled;
            return true;
        }
    })) {
        this.logger.log([trackid, enabled ? 'enabled' : 'disabled'].join(' '));
        $(document).trigger(enabled
            ? 'simulcastlayerstarted'
            : 'simulcastlayerstopped');
    } else {
        this.logger.error("I don't have a local stream with SSRC " + ssrc);
    }
};

SimpleSimulcastSender.prototype.constructor = SimpleSimulcastSender;

function NoSimulcastSender() {
    SimulcastSender.call(this);
}

NoSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NoSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        success(hqStream);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
NoSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NoSimulcastSender.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NoSimulcastSender.prototype.transformLocalDescription = function (desc) {
    return desc;
};

NoSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {

};

NoSimulcastSender.prototype.constructor = NoSimulcastSender;

module.exports = {
    "native": NativeSimulcastSender,
    "no": NoSimulcastSender
}
