!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.simulcast=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *
 * @constructor
 */
function SimulcastLogger(name, lvl) {
    this.name = name;
    this.lvl = lvl;
}

SimulcastLogger.prototype.log = function (text) {
    if (this.lvl) {
        console.log(text);
    }
};

SimulcastLogger.prototype.info = function (text) {
    if (this.lvl > 1) {
        console.info(text);
    }
};

SimulcastLogger.prototype.fine = function (text) {
    if (this.lvl > 2) {
        console.log(text);
    }
};

SimulcastLogger.prototype.error = function (text) {
    console.error(text);
};

module.exports = SimulcastLogger;
},{}],2:[function(require,module,exports){
var SimulcastLogger = require("./SimulcastLogger");
var SimulcastUtils = require("./SimulcastUtils");

function SimulcastReceiver() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastReceiver', 1);
}

SimulcastReceiver.prototype._remoteVideoSourceCache = '';
SimulcastReceiver.prototype._remoteMaps = {
    msid2Quality: {},
    ssrc2Msid: {},
    msid2ssrc: {},
    receivingVideoStreams: {}
};

SimulcastReceiver.prototype._cacheRemoteVideoSources = function (lines) {
    this._remoteVideoSourceCache = this.simulcastUtils._getVideoSources(lines);
};

SimulcastReceiver.prototype._restoreRemoteVideoSources = function (lines) {
    this.simulcastUtils._replaceVideoSources(lines, this._remoteVideoSourceCache);
};

SimulcastReceiver.prototype._ensureGoogConference = function (lines) {
    var sb;

    this.logger.info('Ensuring x-google-conference flag...')

    if (this.simulcastUtils._indexOfArray('a=x-google-flag:conference', lines) === this.simulcastUtils._emptyCompoundIndex) {
        // TODO(gp) do that for the audio as well as suggested by fippo.
        // Add the google conference flag
        sb = this.simulcastUtils._getVideoSources(lines);
        sb = ['a=x-google-flag:conference'].concat(sb);
        this.simulcastUtils._replaceVideoSources(lines, sb);
    }
};

SimulcastReceiver.prototype._restoreSimulcastGroups = function (sb) {
    this._restoreRemoteVideoSources(sb);
};

/**
 * Restores the simulcast groups of the remote description. In
 * transformRemoteDescription we remove those in order for the set remote
 * description to succeed. The focus needs the signal the groups to new
 * participants.
 *
 * @param desc
 * @returns {*}
 */
SimulcastReceiver.prototype.reverseTransformRemoteDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc)) {
        return desc;
    }

    if (config.enableSimulcast) {
        sb = desc.sdp.split('\r\n');

        this._restoreSimulcastGroups(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });
    }

    return desc;
};

SimulcastUtils.prototype._ensureOrder = function (lines) {
    var videoSources, sb;

    videoSources = this.parseMedia(lines, ['video'])[0];
    sb = this._compileVideoSources(videoSources);

    this._replaceVideoSources(lines, sb);
};

SimulcastReceiver.prototype._updateRemoteMaps = function (lines) {
    var remoteVideoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0],
        videoSource, quality;

    // (re) initialize the remote maps.
    this._remoteMaps.msid2Quality = {};
    this._remoteMaps.ssrc2Msid = {};
    this._remoteMaps.msid2ssrc = {};

    var self = this;
    if (remoteVideoSources.groups && remoteVideoSources.groups.length !== 0) {
        remoteVideoSources.groups.forEach(function (group) {
            if (group.semantics === 'SIM' && group.ssrcs && group.ssrcs.length !== 0) {
                quality = 0;
                group.ssrcs.forEach(function (ssrc) {
                    videoSource = remoteVideoSources.sources[ssrc];
                    self._remoteMaps.msid2Quality[videoSource.msid] = quality++;
                    self._remoteMaps.ssrc2Msid[videoSource.ssrc] = videoSource.msid;
                    self._remoteMaps.msid2ssrc[videoSource.msid] = videoSource.ssrc;
                });
            }
        });
    }
};

SimulcastReceiver.prototype._setReceivingVideoStream = function (resource, ssrc) {
    this._remoteMaps.receivingVideoStreams[resource] = ssrc;
};

/**
 * Returns a stream with single video track, the one currently being
 * received by this endpoint.
 *
 * @param stream the remote simulcast stream.
 * @returns {webkitMediaStream}
 */
SimulcastReceiver.prototype.getReceivingVideoStream = function (stream) {
    var tracks, i, electedTrack, msid, quality = 0, receivingTrackId;

    var self = this;
    if (config.enableSimulcast) {

        stream.getVideoTracks().some(function (track) {
            return Object.keys(self._remoteMaps.receivingVideoStreams).some(function (resource) {
                var ssrc = self._remoteMaps.receivingVideoStreams[resource];
                var msid = self._remoteMaps.ssrc2Msid[ssrc];
                if (msid == [stream.id, track.id].join(' ')) {
                    electedTrack = track;
                    return true;
                }
            });
        });

        if (!electedTrack) {
            // we don't have an elected track, choose by initial quality.
            tracks = stream.getVideoTracks();
            for (i = 0; i < tracks.length; i++) {
                msid = [stream.id, tracks[i].id].join(' ');
                if (this._remoteMaps.msid2Quality[msid] === quality) {
                    electedTrack = tracks[i];
                    break;
                }
            }

            // TODO(gp) if the initialQuality could not be satisfied, lower
            // the requirement and try again.
        }
    }

    return (electedTrack)
        ? new webkitMediaStream([electedTrack])
        : stream;
};

SimulcastReceiver.prototype.getReceivingSSRC = function (jid) {
    var resource = Strophe.getResourceFromJid(jid);
    var ssrc = this._remoteMaps.receivingVideoStreams[resource];

    // If we haven't receiving a "changed" event yet, then we must be receiving
    // low quality (that the sender always streams).
    if(!ssrc)
    {
        var remoteStreamObject = RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        var remoteStream = remoteStreamObject.getOriginalStream();
        var tracks = remoteStream.getVideoTracks();
        if (tracks) {
            for (var k = 0; k < tracks.length; k++) {
                var track = tracks[k];
                var msid = [remoteStream.id, track.id].join(' ');
                var _ssrc = this._remoteMaps.msid2ssrc[msid];
                var quality = this._remoteMaps.msid2Quality[msid];
                if (quality == 0) {
                    ssrc = _ssrc;
                }
            }
        }
    }

    return ssrc;
};

SimulcastReceiver.prototype.getReceivingVideoStreamBySSRC = function (ssrc)
{
    var sid, electedStream;
    var i, j, k;
    var jid = ssrc2jid[ssrc];
    if(jid)
    {
        var remoteStreamObject = RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        var remoteStream = remoteStreamObject.getOriginalStream();
        var tracks = remoteStream.getVideoTracks();
        if (tracks) {
            for (k = 0; k < tracks.length; k++) {
                var track = tracks[k];
                var msid = [remoteStream.id, track.id].join(' ');
                var tmp = this._remoteMaps.msid2ssrc[msid];
                if (tmp == ssrc) {
                    electedStream = new webkitMediaStream([track]);
                    sid = remoteStreamObject.sid;
                    // stream found, stop.
                    break;
                }
            }
        }

    }

    return {
        sid: sid,
        stream: electedStream
    };
};

/**
 * Gets the fully qualified msid (stream.id + track.id) associated to the
 * SSRC.
 *
 * @param ssrc
 * @returns {*}
 */
SimulcastReceiver.prototype.getRemoteVideoStreamIdBySSRC = function (ssrc) {
    return this._remoteMaps.ssrc2Msid[ssrc];
};

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastReceiver.prototype.transformRemoteDescription = function (desc) {

    if (desc && desc.sdp) {
        var sb = desc.sdp.split('\r\n');

        this._updateRemoteMaps(sb);
        this._cacheRemoteVideoSources(sb);

        // NOTE(gp) this needs to be called after updateRemoteMaps because we
        // need the simulcast group in the _updateRemoteMaps() method.
        this.simulcastUtils._removeSimulcastGroup(sb);

        if (desc.sdp.indexOf('a=ssrc-group:SIM') !== -1) {
            // We don't need the goog conference flag if we're not doing
            // simulcast.
            this._ensureGoogConference(sb);
        }

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        this.logger.fine(['Transformed remote description', desc.sdp].join(' '));
    }

    return desc;
};

module.exports = SimulcastReceiver;
},{"./SimulcastLogger":1,"./SimulcastUtils":4}],3:[function(require,module,exports){
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
        : RTC.localVideo.getOriginalStream();
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
    this._isUsingScreenStream = desktopsharing.isUsingScreenStream();
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

        sb.splice.apply(sb, [sb.length, 0].concat(
            [["a=ssrc:", simSSRC, " cname:", videoSources.base.cname].join(''),
                ["a=ssrc:", simSSRC, " msid:", videoSources.base.msid].join('')]
        ));

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

},{"./SimulcastLogger":1,"./SimulcastUtils":4}],4:[function(require,module,exports){
var SimulcastLogger = require("./SimulcastLogger");

/**
 *
 * @constructor
 */
function SimulcastUtils() {
    this.logger = new SimulcastLogger("SimulcastUtils", 1);
}

/**
 *
 * @type {{}}
 * @private
 */
SimulcastUtils.prototype._emptyCompoundIndex = {};

/**
 *
 * @param lines
 * @param videoSources
 * @private
 */
SimulcastUtils.prototype._replaceVideoSources = function (lines, videoSources) {
    var i, inVideo = false, index = -1, howMany = 0;

    this.logger.info('Replacing video sources...');

    for (i = 0; i < lines.length; i++) {
        if (inVideo && lines[i].substring(0, 'm='.length) === 'm=') {
            // Out of video.
            break;
        }

        if (!inVideo && lines[i].substring(0, 'm=video '.length) === 'm=video ') {
            // In video.
            inVideo = true;
        }

        if (inVideo && (lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:'
            || lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:')) {

            if (index === -1) {
                index = i;
            }

            howMany++;
        }
    }

    //  efficiency baby ;)
    lines.splice.apply(lines,
        [index, howMany].concat(videoSources));

};

SimulcastUtils.prototype.isValidDescription = function (desc)
{
    return desc && desc != null
        && desc.type && desc.type != ''
        && desc.sdp && desc.sdp != '';
};

SimulcastUtils.prototype._getVideoSources = function (lines) {
    var i, inVideo = false, sb = [];

    this.logger.info('Getting video sources...');

    for (i = 0; i < lines.length; i++) {
        if (inVideo && lines[i].substring(0, 'm='.length) === 'm=') {
            // Out of video.
            break;
        }

        if (!inVideo && lines[i].substring(0, 'm=video '.length) === 'm=video ') {
            // In video.
            inVideo = true;
        }

        if (inVideo && lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:') {
            // In SSRC.
            sb.push(lines[i]);
        }

        if (inVideo && lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:') {
            sb.push(lines[i]);
        }
    }

    return sb;
};

SimulcastUtils.prototype.parseMedia = function (lines, mediatypes) {
    var i, res = [], type, cur_media, idx, ssrcs, cur_ssrc, ssrc,
        ssrc_attribute, group, semantics, skip = true;

    this.logger.info('Parsing media sources...');

    for (i = 0; i < lines.length; i++) {
        if (lines[i].substring(0, 'm='.length) === 'm=') {

            type = lines[i]
                .substr('m='.length, lines[i].indexOf(' ') - 'm='.length);
            skip = mediatypes !== undefined && mediatypes.indexOf(type) === -1;

            if (!skip) {
                cur_media = {
                    'type': type,
                    'sources': {},
                    'groups': []
                };

                res.push(cur_media);
            }

        } else if (!skip && lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:') {

            idx = lines[i].indexOf(' ');
            ssrc = lines[i].substring('a=ssrc:'.length, idx);
            if (cur_media.sources[ssrc] === undefined) {
                cur_ssrc = {'ssrc': ssrc};
                cur_media.sources[ssrc] = cur_ssrc;
            }

            ssrc_attribute = lines[i].substr(idx + 1).split(':', 2)[0];
            cur_ssrc[ssrc_attribute] = lines[i].substr(idx + 1).split(':', 2)[1];

            if (cur_media.base === undefined) {
                cur_media.base = cur_ssrc;
            }

        } else if (!skip && lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:') {
            idx = lines[i].indexOf(' ');
            semantics = lines[i].substr(0, idx).substr('a=ssrc-group:'.length);
            ssrcs = lines[i].substr(idx).trim().split(' ');
            group = {
                'semantics': semantics,
                'ssrcs': ssrcs
            };
            cur_media.groups.push(group);
        } else if (!skip && (lines[i].substring(0, 'a=sendrecv'.length) === 'a=sendrecv' ||
            lines[i].substring(0, 'a=recvonly'.length) === 'a=recvonly' ||
            lines[i].substring(0, 'a=sendonly'.length) === 'a=sendonly' ||
            lines[i].substring(0, 'a=inactive'.length) === 'a=inactive')) {

            cur_media.direction = lines[i].substring('a='.length);
        }
    }

    return res;
};

/**
 * The _indexOfArray() method returns the first a CompoundIndex at which a
 * given element can be found in the array, or _emptyCompoundIndex if it is
 * not present.
 *
 * Example:
 *
 * _indexOfArray('3', [ 'this is line 1', 'this is line 2', 'this is line 3' ])
 *
 * returns {row: 2, column: 14}
 *
 * @param needle
 * @param haystack
 * @param start
 * @returns {}
 * @private
 */
SimulcastUtils.prototype._indexOfArray = function (needle, haystack, start) {
    var length = haystack.length, idx, i;

    if (!start) {
        start = 0;
    }

    for (i = start; i < length; i++) {
        idx = haystack[i].indexOf(needle);
        if (idx !== -1) {
            return {row: i, column: idx};
        }
    }
    return this._emptyCompoundIndex;
};

SimulcastUtils.prototype._removeSimulcastGroup = function (lines) {
    var i;

    for (i = lines.length - 1; i >= 0; i--) {
        if (lines[i].indexOf('a=ssrc-group:SIM') !== -1) {
            lines.splice(i, 1);
        }
    }
};

SimulcastUtils.prototype._compileVideoSources = function (videoSources) {
    var sb = [], ssrc, addedSSRCs = [];

    this.logger.info('Compiling video sources...');

    // Add the groups
    if (videoSources.groups && videoSources.groups.length !== 0) {
        videoSources.groups.forEach(function (group) {
            if (group.ssrcs && group.ssrcs.length !== 0) {
                sb.push([['a=ssrc-group:', group.semantics].join(''), group.ssrcs.join(' ')].join(' '));

                // if (group.semantics !== 'SIM') {
                group.ssrcs.forEach(function (ssrc) {
                    addedSSRCs.push(ssrc);
                    sb.splice.apply(sb, [sb.length, 0].concat([
                        ["a=ssrc:", ssrc, " cname:", videoSources.sources[ssrc].cname].join(''),
                        ["a=ssrc:", ssrc, " msid:", videoSources.sources[ssrc].msid].join('')]));
                });
                //}
            }
        });
    }

    // Then add any free sources.
    if (videoSources.sources) {
        for (ssrc in videoSources.sources) {
            if (addedSSRCs.indexOf(ssrc) === -1) {
                sb.splice.apply(sb, [sb.length, 0].concat([
                    ["a=ssrc:", ssrc, " cname:", videoSources.sources[ssrc].cname].join(''),
                    ["a=ssrc:", ssrc, " msid:", videoSources.sources[ssrc].msid].join('')]));
            }
        }
    }

    return sb;
};

module.exports = SimulcastUtils;
},{"./SimulcastLogger":1}],5:[function(require,module,exports){
/*jslint plusplus: true */
/*jslint nomen: true*/

var SimulcastSender = require("./SimulcastSender");
var NoSimulcastSender = SimulcastSender["no"];
var NativeSimulcastSender = SimulcastSender["native"];
var SimulcastReceiver = require("./SimulcastReceiver");
var SimulcastUtils = require("./SimulcastUtils");


/**
 *
 * @constructor
 */
function SimulcastManager() {

    // Create the simulcast utilities.
    this.simulcastUtils = new SimulcastUtils();

    // Create remote simulcast.
    this.simulcastReceiver = new SimulcastReceiver();

    // Initialize local simulcast.

    // TODO(gp) move into SimulcastManager.prototype.getUserMedia and take into
    // account constraints.
    if (!config.enableSimulcast) {
        this.simulcastSender = new NoSimulcastSender();
    } else {

        var isChromium = window.chrome,
            vendorName = window.navigator.vendor;
        if(isChromium !== null && isChromium !== undefined
            /* skip opera */
            && vendorName === "Google Inc."
            /* skip Chromium as suggested by fippo */
            && !window.navigator.appVersion.match(/Chromium\//) ) {
            var ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
            if (ver > 37) {
                this.simulcastSender = new NativeSimulcastSender();
            } else {
                this.simulcastSender = new NoSimulcastSender();
            }
        } else {
            this.simulcastSender = new NoSimulcastSender();
        }

    }
}

/**
 * Restores the simulcast groups of the remote description. In
 * transformRemoteDescription we remove those in order for the set remote
 * description to succeed. The focus needs the signal the groups to new
 * participants.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.reverseTransformRemoteDescription = function (desc) {
    return this.simulcastReceiver.reverseTransformRemoteDescription(desc);
};

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformRemoteDescription = function (desc) {
    return this.simulcastReceiver.transformRemoteDescription(desc);
};

/**
 * Gets the fully qualified msid (stream.id + track.id) associated to the
 * SSRC.
 *
 * @param ssrc
 * @returns {*}
 */
SimulcastManager.prototype.getRemoteVideoStreamIdBySSRC = function (ssrc) {
    return this.simulcastReceiver.getRemoteVideoStreamIdBySSRC(ssrc);
};

/**
 * Returns a stream with single video track, the one currently being
 * received by this endpoint.
 *
 * @param stream the remote simulcast stream.
 * @returns {webkitMediaStream}
 */
SimulcastManager.prototype.getReceivingVideoStream = function (stream) {
    return this.simulcastReceiver.getReceivingVideoStream(stream);
};

/**
 *
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformLocalDescription = function (desc) {
    return this.simulcastSender.transformLocalDescription(desc);
};

/**
 *
 * @returns {*}
 */
SimulcastManager.prototype.getLocalVideoStream = function() {
    return this.simulcastSender.getLocalVideoStream();
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
SimulcastManager.prototype.getUserMedia = function (constraints, success, err) {

    this.simulcastSender.getUserMedia(constraints, success, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
SimulcastManager.prototype.reverseTransformLocalDescription = function (desc) {
    return this.simulcastSender.reverseTransformLocalDescription(desc);
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformAnswer = function (desc) {
    return this.simulcastSender.transformAnswer(desc);
};

SimulcastManager.prototype.getReceivingSSRC = function (jid) {
    return this.simulcastReceiver.getReceivingSSRC(jid);
};

SimulcastManager.prototype.getReceivingVideoStreamBySSRC = function (msid) {
    return this.simulcastReceiver.getReceivingVideoStreamBySSRC(msid);
};

/**
 *
 * @param lines
 * @param mediatypes
 * @returns {*}
 */
SimulcastManager.prototype.parseMedia = function(lines, mediatypes) {
    var sb = lines.sdp.split('\r\n');
    return this.simulcastUtils.parseMedia(sb, mediatypes);
};

SimulcastManager.prototype._setReceivingVideoStream = function(resource, ssrc) {
    this.simulcastReceiver._setReceivingVideoStream(resource, ssrc);
};

SimulcastManager.prototype._setLocalVideoStreamEnabled = function(ssrc, enabled) {
    this.simulcastSender._setLocalVideoStreamEnabled(ssrc, enabled);
};

SimulcastManager.prototype.resetSender = function() {
    if (typeof this.simulcastSender.reset === 'function'){
        this.simulcastSender.reset();
    }
};

$(document).bind('simulcastlayerschanged', function (event, endpointSimulcastLayers) {
    endpointSimulcastLayers.forEach(function (esl) {
        var ssrc = esl.simulcastLayer.primarySSRC;
        simulcast._setReceivingVideoStream(esl.endpoint, ssrc);
    });
});

$(document).bind('startsimulcastlayer', function (event, simulcastLayer) {
    var ssrc = simulcastLayer.primarySSRC;
    simulcast._setLocalVideoStreamEnabled(ssrc, true);
});

$(document).bind('stopsimulcastlayer', function (event, simulcastLayer) {
    var ssrc = simulcastLayer.primarySSRC;
    simulcast._setLocalVideoStreamEnabled(ssrc, false);
});


var simulcast = new SimulcastManager();

module.exports = simulcast;
},{"./SimulcastReceiver":2,"./SimulcastSender":3,"./SimulcastUtils":4}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3NpbXVsY2FzdC9TaW11bGNhc3RMb2dnZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3NpbXVsY2FzdC9TaW11bGNhc3RSZWNlaXZlci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc2ltdWxjYXN0L1NpbXVsY2FzdFNlbmRlci5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvc2ltdWxjYXN0L1NpbXVsY2FzdFV0aWxzLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9zaW11bGNhc3Qvc2ltdWxjYXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTaW11bGNhc3RMb2dnZXIobmFtZSwgbHZsKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmx2bCA9IGx2bDtcbn1cblxuU2ltdWxjYXN0TG9nZ2VyLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIGlmICh0aGlzLmx2bCkge1xuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0KTtcbiAgICB9XG59O1xuXG5TaW11bGNhc3RMb2dnZXIucHJvdG90eXBlLmluZm8gPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIGlmICh0aGlzLmx2bCA+IDEpIHtcbiAgICAgICAgY29uc29sZS5pbmZvKHRleHQpO1xuICAgIH1cbn07XG5cblNpbXVsY2FzdExvZ2dlci5wcm90b3R5cGUuZmluZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgaWYgKHRoaXMubHZsID4gMikge1xuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0KTtcbiAgICB9XG59O1xuXG5TaW11bGNhc3RMb2dnZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICBjb25zb2xlLmVycm9yKHRleHQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaW11bGNhc3RMb2dnZXI7IiwidmFyIFNpbXVsY2FzdExvZ2dlciA9IHJlcXVpcmUoXCIuL1NpbXVsY2FzdExvZ2dlclwiKTtcbnZhciBTaW11bGNhc3RVdGlscyA9IHJlcXVpcmUoXCIuL1NpbXVsY2FzdFV0aWxzXCIpO1xuXG5mdW5jdGlvbiBTaW11bGNhc3RSZWNlaXZlcigpIHtcbiAgICB0aGlzLnNpbXVsY2FzdFV0aWxzID0gbmV3IFNpbXVsY2FzdFV0aWxzKCk7XG4gICAgdGhpcy5sb2dnZXIgPSBuZXcgU2ltdWxjYXN0TG9nZ2VyKCdTaW11bGNhc3RSZWNlaXZlcicsIDEpO1xufVxuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuX3JlbW90ZVZpZGVvU291cmNlQ2FjaGUgPSAnJztcblNpbXVsY2FzdFJlY2VpdmVyLnByb3RvdHlwZS5fcmVtb3RlTWFwcyA9IHtcbiAgICBtc2lkMlF1YWxpdHk6IHt9LFxuICAgIHNzcmMyTXNpZDoge30sXG4gICAgbXNpZDJzc3JjOiB7fSxcbiAgICByZWNlaXZpbmdWaWRlb1N0cmVhbXM6IHt9XG59O1xuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuX2NhY2hlUmVtb3RlVmlkZW9Tb3VyY2VzID0gZnVuY3Rpb24gKGxpbmVzKSB7XG4gICAgdGhpcy5fcmVtb3RlVmlkZW9Tb3VyY2VDYWNoZSA9IHRoaXMuc2ltdWxjYXN0VXRpbHMuX2dldFZpZGVvU291cmNlcyhsaW5lcyk7XG59O1xuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuX3Jlc3RvcmVSZW1vdGVWaWRlb1NvdXJjZXMgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB0aGlzLnNpbXVsY2FzdFV0aWxzLl9yZXBsYWNlVmlkZW9Tb3VyY2VzKGxpbmVzLCB0aGlzLl9yZW1vdGVWaWRlb1NvdXJjZUNhY2hlKTtcbn07XG5cblNpbXVsY2FzdFJlY2VpdmVyLnByb3RvdHlwZS5fZW5zdXJlR29vZ0NvbmZlcmVuY2UgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB2YXIgc2I7XG5cbiAgICB0aGlzLmxvZ2dlci5pbmZvKCdFbnN1cmluZyB4LWdvb2dsZS1jb25mZXJlbmNlIGZsYWcuLi4nKVxuXG4gICAgaWYgKHRoaXMuc2ltdWxjYXN0VXRpbHMuX2luZGV4T2ZBcnJheSgnYT14LWdvb2dsZS1mbGFnOmNvbmZlcmVuY2UnLCBsaW5lcykgPT09IHRoaXMuc2ltdWxjYXN0VXRpbHMuX2VtcHR5Q29tcG91bmRJbmRleCkge1xuICAgICAgICAvLyBUT0RPKGdwKSBkbyB0aGF0IGZvciB0aGUgYXVkaW8gYXMgd2VsbCBhcyBzdWdnZXN0ZWQgYnkgZmlwcG8uXG4gICAgICAgIC8vIEFkZCB0aGUgZ29vZ2xlIGNvbmZlcmVuY2UgZmxhZ1xuICAgICAgICBzYiA9IHRoaXMuc2ltdWxjYXN0VXRpbHMuX2dldFZpZGVvU291cmNlcyhsaW5lcyk7XG4gICAgICAgIHNiID0gWydhPXgtZ29vZ2xlLWZsYWc6Y29uZmVyZW5jZSddLmNvbmNhdChzYik7XG4gICAgICAgIHRoaXMuc2ltdWxjYXN0VXRpbHMuX3JlcGxhY2VWaWRlb1NvdXJjZXMobGluZXMsIHNiKTtcbiAgICB9XG59O1xuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuX3Jlc3RvcmVTaW11bGNhc3RHcm91cHMgPSBmdW5jdGlvbiAoc2IpIHtcbiAgICB0aGlzLl9yZXN0b3JlUmVtb3RlVmlkZW9Tb3VyY2VzKHNiKTtcbn07XG5cbi8qKlxuICogUmVzdG9yZXMgdGhlIHNpbXVsY2FzdCBncm91cHMgb2YgdGhlIHJlbW90ZSBkZXNjcmlwdGlvbi4gSW5cbiAqIHRyYW5zZm9ybVJlbW90ZURlc2NyaXB0aW9uIHdlIHJlbW92ZSB0aG9zZSBpbiBvcmRlciBmb3IgdGhlIHNldCByZW1vdGVcbiAqIGRlc2NyaXB0aW9uIHRvIHN1Y2NlZWQuIFRoZSBmb2N1cyBuZWVkcyB0aGUgc2lnbmFsIHRoZSBncm91cHMgdG8gbmV3XG4gKiBwYXJ0aWNpcGFudHMuXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHsqfVxuICovXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUucmV2ZXJzZVRyYW5zZm9ybVJlbW90ZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICB2YXIgc2I7XG5cbiAgICBpZiAoIXRoaXMuc2ltdWxjYXN0VXRpbHMuaXNWYWxpZERlc2NyaXB0aW9uKGRlc2MpKSB7XG4gICAgICAgIHJldHVybiBkZXNjO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuZW5hYmxlU2ltdWxjYXN0KSB7XG4gICAgICAgIHNiID0gZGVzYy5zZHAuc3BsaXQoJ1xcclxcbicpO1xuXG4gICAgICAgIHRoaXMuX3Jlc3RvcmVTaW11bGNhc3RHcm91cHMoc2IpO1xuXG4gICAgICAgIGRlc2MgPSBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IGRlc2MudHlwZSxcbiAgICAgICAgICAgIHNkcDogc2Iuam9pbignXFxyXFxuJylcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2M7XG59O1xuXG5TaW11bGNhc3RVdGlscy5wcm90b3R5cGUuX2Vuc3VyZU9yZGVyID0gZnVuY3Rpb24gKGxpbmVzKSB7XG4gICAgdmFyIHZpZGVvU291cmNlcywgc2I7XG5cbiAgICB2aWRlb1NvdXJjZXMgPSB0aGlzLnBhcnNlTWVkaWEobGluZXMsIFsndmlkZW8nXSlbMF07XG4gICAgc2IgPSB0aGlzLl9jb21waWxlVmlkZW9Tb3VyY2VzKHZpZGVvU291cmNlcyk7XG5cbiAgICB0aGlzLl9yZXBsYWNlVmlkZW9Tb3VyY2VzKGxpbmVzLCBzYik7XG59O1xuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuX3VwZGF0ZVJlbW90ZU1hcHMgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB2YXIgcmVtb3RlVmlkZW9Tb3VyY2VzID0gdGhpcy5zaW11bGNhc3RVdGlscy5wYXJzZU1lZGlhKGxpbmVzLCBbJ3ZpZGVvJ10pWzBdLFxuICAgICAgICB2aWRlb1NvdXJjZSwgcXVhbGl0eTtcblxuICAgIC8vIChyZSkgaW5pdGlhbGl6ZSB0aGUgcmVtb3RlIG1hcHMuXG4gICAgdGhpcy5fcmVtb3RlTWFwcy5tc2lkMlF1YWxpdHkgPSB7fTtcbiAgICB0aGlzLl9yZW1vdGVNYXBzLnNzcmMyTXNpZCA9IHt9O1xuICAgIHRoaXMuX3JlbW90ZU1hcHMubXNpZDJzc3JjID0ge307XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHJlbW90ZVZpZGVvU291cmNlcy5ncm91cHMgJiYgcmVtb3RlVmlkZW9Tb3VyY2VzLmdyb3Vwcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgcmVtb3RlVmlkZW9Tb3VyY2VzLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgaWYgKGdyb3VwLnNlbWFudGljcyA9PT0gJ1NJTScgJiYgZ3JvdXAuc3NyY3MgJiYgZ3JvdXAuc3NyY3MubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcXVhbGl0eSA9IDA7XG4gICAgICAgICAgICAgICAgZ3JvdXAuc3NyY3MuZm9yRWFjaChmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgICAgICB2aWRlb1NvdXJjZSA9IHJlbW90ZVZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdGVNYXBzLm1zaWQyUXVhbGl0eVt2aWRlb1NvdXJjZS5tc2lkXSA9IHF1YWxpdHkrKztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVtb3RlTWFwcy5zc3JjMk1zaWRbdmlkZW9Tb3VyY2Uuc3NyY10gPSB2aWRlb1NvdXJjZS5tc2lkO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdGVNYXBzLm1zaWQyc3NyY1t2aWRlb1NvdXJjZS5tc2lkXSA9IHZpZGVvU291cmNlLnNzcmM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblNpbXVsY2FzdFJlY2VpdmVyLnByb3RvdHlwZS5fc2V0UmVjZWl2aW5nVmlkZW9TdHJlYW0gPSBmdW5jdGlvbiAocmVzb3VyY2UsIHNzcmMpIHtcbiAgICB0aGlzLl9yZW1vdGVNYXBzLnJlY2VpdmluZ1ZpZGVvU3RyZWFtc1tyZXNvdXJjZV0gPSBzc3JjO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyZWFtIHdpdGggc2luZ2xlIHZpZGVvIHRyYWNrLCB0aGUgb25lIGN1cnJlbnRseSBiZWluZ1xuICogcmVjZWl2ZWQgYnkgdGhpcyBlbmRwb2ludC5cbiAqXG4gKiBAcGFyYW0gc3RyZWFtIHRoZSByZW1vdGUgc2ltdWxjYXN0IHN0cmVhbS5cbiAqIEByZXR1cm5zIHt3ZWJraXRNZWRpYVN0cmVhbX1cbiAqL1xuU2ltdWxjYXN0UmVjZWl2ZXIucHJvdG90eXBlLmdldFJlY2VpdmluZ1ZpZGVvU3RyZWFtID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgIHZhciB0cmFja3MsIGksIGVsZWN0ZWRUcmFjaywgbXNpZCwgcXVhbGl0eSA9IDAsIHJlY2VpdmluZ1RyYWNrSWQ7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKGNvbmZpZy5lbmFibGVTaW11bGNhc3QpIHtcblxuICAgICAgICBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5zb21lKGZ1bmN0aW9uICh0cmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHNlbGYuX3JlbW90ZU1hcHMucmVjZWl2aW5nVmlkZW9TdHJlYW1zKS5zb21lKGZ1bmN0aW9uIChyZXNvdXJjZSkge1xuICAgICAgICAgICAgICAgIHZhciBzc3JjID0gc2VsZi5fcmVtb3RlTWFwcy5yZWNlaXZpbmdWaWRlb1N0cmVhbXNbcmVzb3VyY2VdO1xuICAgICAgICAgICAgICAgIHZhciBtc2lkID0gc2VsZi5fcmVtb3RlTWFwcy5zc3JjMk1zaWRbc3NyY107XG4gICAgICAgICAgICAgICAgaWYgKG1zaWQgPT0gW3N0cmVhbS5pZCwgdHJhY2suaWRdLmpvaW4oJyAnKSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVjdGVkVHJhY2sgPSB0cmFjaztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghZWxlY3RlZFRyYWNrKSB7XG4gICAgICAgICAgICAvLyB3ZSBkb24ndCBoYXZlIGFuIGVsZWN0ZWQgdHJhY2ssIGNob29zZSBieSBpbml0aWFsIHF1YWxpdHkuXG4gICAgICAgICAgICB0cmFja3MgPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBtc2lkID0gW3N0cmVhbS5pZCwgdHJhY2tzW2ldLmlkXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3JlbW90ZU1hcHMubXNpZDJRdWFsaXR5W21zaWRdID09PSBxdWFsaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZWN0ZWRUcmFjayA9IHRyYWNrc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUT0RPKGdwKSBpZiB0aGUgaW5pdGlhbFF1YWxpdHkgY291bGQgbm90IGJlIHNhdGlzZmllZCwgbG93ZXJcbiAgICAgICAgICAgIC8vIHRoZSByZXF1aXJlbWVudCBhbmQgdHJ5IGFnYWluLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIChlbGVjdGVkVHJhY2spXG4gICAgICAgID8gbmV3IHdlYmtpdE1lZGlhU3RyZWFtKFtlbGVjdGVkVHJhY2tdKVxuICAgICAgICA6IHN0cmVhbTtcbn07XG5cblNpbXVsY2FzdFJlY2VpdmVyLnByb3RvdHlwZS5nZXRSZWNlaXZpbmdTU1JDID0gZnVuY3Rpb24gKGppZCkge1xuICAgIHZhciByZXNvdXJjZSA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgdmFyIHNzcmMgPSB0aGlzLl9yZW1vdGVNYXBzLnJlY2VpdmluZ1ZpZGVvU3RyZWFtc1tyZXNvdXJjZV07XG5cbiAgICAvLyBJZiB3ZSBoYXZlbid0IHJlY2VpdmluZyBhIFwiY2hhbmdlZFwiIGV2ZW50IHlldCwgdGhlbiB3ZSBtdXN0IGJlIHJlY2VpdmluZ1xuICAgIC8vIGxvdyBxdWFsaXR5ICh0aGF0IHRoZSBzZW5kZXIgYWx3YXlzIHN0cmVhbXMpLlxuICAgIGlmKCFzc3JjKVxuICAgIHtcbiAgICAgICAgdmFyIHJlbW90ZVN0cmVhbU9iamVjdCA9IFJUQy5yZW1vdGVTdHJlYW1zW2ppZF1bTWVkaWFTdHJlYW1UeXBlLlZJREVPX1RZUEVdO1xuICAgICAgICB2YXIgcmVtb3RlU3RyZWFtID0gcmVtb3RlU3RyZWFtT2JqZWN0LmdldE9yaWdpbmFsU3RyZWFtKCk7XG4gICAgICAgIHZhciB0cmFja3MgPSByZW1vdGVTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICAgICAgaWYgKHRyYWNrcykge1xuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0cmFja3MubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhY2sgPSB0cmFja3Nba107XG4gICAgICAgICAgICAgICAgdmFyIG1zaWQgPSBbcmVtb3RlU3RyZWFtLmlkLCB0cmFjay5pZF0uam9pbignICcpO1xuICAgICAgICAgICAgICAgIHZhciBfc3NyYyA9IHRoaXMuX3JlbW90ZU1hcHMubXNpZDJzc3JjW21zaWRdO1xuICAgICAgICAgICAgICAgIHZhciBxdWFsaXR5ID0gdGhpcy5fcmVtb3RlTWFwcy5tc2lkMlF1YWxpdHlbbXNpZF07XG4gICAgICAgICAgICAgICAgaWYgKHF1YWxpdHkgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzc3JjID0gX3NzcmM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNzcmM7XG59O1xuXG5TaW11bGNhc3RSZWNlaXZlci5wcm90b3R5cGUuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW1CeVNTUkMgPSBmdW5jdGlvbiAoc3NyYylcbntcbiAgICB2YXIgc2lkLCBlbGVjdGVkU3RyZWFtO1xuICAgIHZhciBpLCBqLCBrO1xuICAgIHZhciBqaWQgPSBzc3JjMmppZFtzc3JjXTtcbiAgICBpZihqaWQpXG4gICAge1xuICAgICAgICB2YXIgcmVtb3RlU3RyZWFtT2JqZWN0ID0gUlRDLnJlbW90ZVN0cmVhbXNbamlkXVtNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRV07XG4gICAgICAgIHZhciByZW1vdGVTdHJlYW0gPSByZW1vdGVTdHJlYW1PYmplY3QuZ2V0T3JpZ2luYWxTdHJlYW0oKTtcbiAgICAgICAgdmFyIHRyYWNrcyA9IHJlbW90ZVN0cmVhbS5nZXRWaWRlb1RyYWNrcygpO1xuICAgICAgICBpZiAodHJhY2tzKSB7XG4gICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgdHJhY2tzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyYWNrID0gdHJhY2tzW2tdO1xuICAgICAgICAgICAgICAgIHZhciBtc2lkID0gW3JlbW90ZVN0cmVhbS5pZCwgdHJhY2suaWRdLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5fcmVtb3RlTWFwcy5tc2lkMnNzcmNbbXNpZF07XG4gICAgICAgICAgICAgICAgaWYgKHRtcCA9PSBzc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZWN0ZWRTdHJlYW0gPSBuZXcgd2Via2l0TWVkaWFTdHJlYW0oW3RyYWNrXSk7XG4gICAgICAgICAgICAgICAgICAgIHNpZCA9IHJlbW90ZVN0cmVhbU9iamVjdC5zaWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN0cmVhbSBmb3VuZCwgc3RvcC5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgc3RyZWFtOiBlbGVjdGVkU3RyZWFtXG4gICAgfTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgZnVsbHkgcXVhbGlmaWVkIG1zaWQgKHN0cmVhbS5pZCArIHRyYWNrLmlkKSBhc3NvY2lhdGVkIHRvIHRoZVxuICogU1NSQy5cbiAqXG4gKiBAcGFyYW0gc3NyY1xuICogQHJldHVybnMgeyp9XG4gKi9cblNpbXVsY2FzdFJlY2VpdmVyLnByb3RvdHlwZS5nZXRSZW1vdGVWaWRlb1N0cmVhbUlkQnlTU1JDID0gZnVuY3Rpb24gKHNzcmMpIHtcbiAgICByZXR1cm4gdGhpcy5fcmVtb3RlTWFwcy5zc3JjMk1zaWRbc3NyY107XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIHNzcmMtZ3JvdXA6U0lNIGZyb20gdGhlIHJlbW90ZSBkZXNjcmlwdGlvbiBiYWNhdXNlIENocm9tZVxuICogZWl0aGVyIGdldHMgY29uZnVzZWQgYW5kIHRoaW5rcyB0aGlzIGlzIGFuIEZJRCBncm91cCBvciwgaWYgYW4gRklEIGdyb3VwXG4gKiBpcyBhbHJlYWR5IHByZXNlbnQsIGl0IGZhaWxzIHRvIHNldCB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uLlxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuU2ltdWxjYXN0UmVjZWl2ZXIucHJvdG90eXBlLnRyYW5zZm9ybVJlbW90ZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcblxuICAgIGlmIChkZXNjICYmIGRlc2Muc2RwKSB7XG4gICAgICAgIHZhciBzYiA9IGRlc2Muc2RwLnNwbGl0KCdcXHJcXG4nKTtcblxuICAgICAgICB0aGlzLl91cGRhdGVSZW1vdGVNYXBzKHNiKTtcbiAgICAgICAgdGhpcy5fY2FjaGVSZW1vdGVWaWRlb1NvdXJjZXMoc2IpO1xuXG4gICAgICAgIC8vIE5PVEUoZ3ApIHRoaXMgbmVlZHMgdG8gYmUgY2FsbGVkIGFmdGVyIHVwZGF0ZVJlbW90ZU1hcHMgYmVjYXVzZSB3ZVxuICAgICAgICAvLyBuZWVkIHRoZSBzaW11bGNhc3QgZ3JvdXAgaW4gdGhlIF91cGRhdGVSZW1vdGVNYXBzKCkgbWV0aG9kLlxuICAgICAgICB0aGlzLnNpbXVsY2FzdFV0aWxzLl9yZW1vdmVTaW11bGNhc3RHcm91cChzYik7XG5cbiAgICAgICAgaWYgKGRlc2Muc2RwLmluZGV4T2YoJ2E9c3NyYy1ncm91cDpTSU0nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgdGhlIGdvb2cgY29uZmVyZW5jZSBmbGFnIGlmIHdlJ3JlIG5vdCBkb2luZ1xuICAgICAgICAgICAgLy8gc2ltdWxjYXN0LlxuICAgICAgICAgICAgdGhpcy5fZW5zdXJlR29vZ0NvbmZlcmVuY2Uoc2IpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVzYyA9IG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oe1xuICAgICAgICAgICAgdHlwZTogZGVzYy50eXBlLFxuICAgICAgICAgICAgc2RwOiBzYi5qb2luKCdcXHJcXG4nKVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmxvZ2dlci5maW5lKFsnVHJhbnNmb3JtZWQgcmVtb3RlIGRlc2NyaXB0aW9uJywgZGVzYy5zZHBdLmpvaW4oJyAnKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2M7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXVsY2FzdFJlY2VpdmVyOyIsInZhciBTaW11bGNhc3RMb2dnZXIgPSByZXF1aXJlKFwiLi9TaW11bGNhc3RMb2dnZXJcIik7XG52YXIgU2ltdWxjYXN0VXRpbHMgPSByZXF1aXJlKFwiLi9TaW11bGNhc3RVdGlsc1wiKTtcblxuZnVuY3Rpb24gU2ltdWxjYXN0U2VuZGVyKCkge1xuICAgIHRoaXMuc2ltdWxjYXN0VXRpbHMgPSBuZXcgU2ltdWxjYXN0VXRpbHMoKTtcbiAgICB0aGlzLmxvZ2dlciA9IG5ldyBTaW11bGNhc3RMb2dnZXIoJ1NpbXVsY2FzdFNlbmRlcicsIDEpO1xufVxuXG5TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLmRpc3BsYXllZExvY2FsVmlkZW9TdHJlYW0gPSBudWxsO1xuXG5TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9nZW5lcmF0ZUd1aWQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIHM0KCkge1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgICAgICAgIC50b1N0cmluZygxNilcbiAgICAgICAgICAgIC5zdWJzdHJpbmcoMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHM0KCkgKyBzNCgpICsgJy0nICsgczQoKSArICctJyArIHM0KCkgKyAnLScgK1xuICAgICAgICAgICAgczQoKSArICctJyArIHM0KCkgKyBzNCgpICsgczQoKTtcbiAgICB9O1xufSgpKTtcblxuLy8gUmV0dXJucyBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIChpbmNsdWRlZCkgYW5kIG1heCAoZXhjbHVkZWQpXG4vLyBVc2luZyBNYXRoLnJvdW5kKCkgZ2l2ZXMgYSBub24tdW5pZm9ybSBkaXN0cmlidXRpb24hXG5TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9nZW5lcmF0ZVJhbmRvbVNTUkMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1pbiA9IDAsIG1heCA9IDB4ZmZmZmZmZmY7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pKSArIG1pbjtcbn07XG5cblNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUuZ2V0TG9jYWxWaWRlb1N0cmVhbSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuZGlzcGxheWVkTG9jYWxWaWRlb1N0cmVhbSAhPSBudWxsKVxuICAgICAgICA/IHRoaXMuZGlzcGxheWVkTG9jYWxWaWRlb1N0cmVhbVxuICAgICAgICAvLyBpbiBjYXNlIHdlIGhhdmUgbm8gc2ltdWxjYXN0IGF0IGFsbCwgaS5lLiB3ZSBkaWRuJ3QgcGVyZm9ybSB0aGUgR1VNXG4gICAgICAgIDogUlRDLmxvY2FsVmlkZW8uZ2V0T3JpZ2luYWxTdHJlYW0oKTtcbn07XG5cbmZ1bmN0aW9uIE5hdGl2ZVNpbXVsY2FzdFNlbmRlcigpIHtcbiAgICBTaW11bGNhc3RTZW5kZXIuY2FsbCh0aGlzKTsgLy8gY2FsbCB0aGUgc3VwZXIgY29uc3RydWN0b3IuXG59XG5cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUpO1xuXG5OYXRpdmVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9sb2NhbEV4cGxvc2lvbk1hcCA9IHt9O1xuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5faXNVc2luZ1NjcmVlblN0cmVhbSA9IGZhbHNlO1xuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5fbG9jYWxWaWRlb1NvdXJjZUNhY2hlID0gJyc7XG5cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fbG9jYWxFeHBsb3Npb25NYXAgPSB7fTtcbiAgICB0aGlzLl9pc1VzaW5nU2NyZWVuU3RyZWFtID0gZGVza3RvcHNoYXJpbmcuaXNVc2luZ1NjcmVlblN0cmVhbSgpO1xufTtcblxuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5fY2FjaGVMb2NhbFZpZGVvU291cmNlcyA9IGZ1bmN0aW9uIChsaW5lcykge1xuICAgIHRoaXMuX2xvY2FsVmlkZW9Tb3VyY2VDYWNoZSA9IHRoaXMuc2ltdWxjYXN0VXRpbHMuX2dldFZpZGVvU291cmNlcyhsaW5lcyk7XG59O1xuXG5OYXRpdmVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9yZXN0b3JlTG9jYWxWaWRlb1NvdXJjZXMgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB0aGlzLnNpbXVsY2FzdFV0aWxzLl9yZXBsYWNlVmlkZW9Tb3VyY2VzKGxpbmVzLCB0aGlzLl9sb2NhbFZpZGVvU291cmNlQ2FjaGUpO1xufTtcblxuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5fYXBwZW5kU2ltdWxjYXN0R3JvdXAgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB2YXIgdmlkZW9Tb3VyY2VzLCBzc3JjR3JvdXAsIHNpbVNTUkMsIG51bU9mU3VicyA9IDIsIGksIHNiLCBtc2lkO1xuXG4gICAgdGhpcy5sb2dnZXIuaW5mbygnQXBwZW5kaW5nIHNpbXVsY2FzdCBncm91cC4uLicpO1xuXG4gICAgLy8gR2V0IHRoZSBwcmltYXJ5IFNTUkMgaW5mb3JtYXRpb24uXG4gICAgdmlkZW9Tb3VyY2VzID0gdGhpcy5zaW11bGNhc3RVdGlscy5wYXJzZU1lZGlhKGxpbmVzLCBbJ3ZpZGVvJ10pWzBdO1xuXG4gICAgLy8gU3RhcnQgYnVpbGRpbmcgdGhlIFNJTSBTU1JDIGdyb3VwLlxuICAgIHNzcmNHcm91cCA9IFsnYT1zc3JjLWdyb3VwOlNJTSddO1xuXG4gICAgLy8gVGhlIHZpZGVvIHNvdXJjZSBidWZmZXIuXG4gICAgc2IgPSBbXTtcblxuICAgIC8vIENyZWF0ZSB0aGUgc2ltdWxjYXN0IHN1Yi1zdHJlYW1zLlxuICAgIGZvciAoaSA9IDA7IGkgPCBudW1PZlN1YnM7IGkrKykge1xuICAgICAgICAvLyBUT0RPKGdwKSBwcmV2ZW50IFNTUkMgY29sbGlzaW9uLlxuICAgICAgICBzaW1TU1JDID0gdGhpcy5fZ2VuZXJhdGVSYW5kb21TU1JDKCk7XG4gICAgICAgIHNzcmNHcm91cC5wdXNoKHNpbVNTUkMpO1xuXG4gICAgICAgIHNiLnNwbGljZS5hcHBseShzYiwgW3NiLmxlbmd0aCwgMF0uY29uY2F0KFxuICAgICAgICAgICAgW1tcImE9c3NyYzpcIiwgc2ltU1NSQywgXCIgY25hbWU6XCIsIHZpZGVvU291cmNlcy5iYXNlLmNuYW1lXS5qb2luKCcnKSxcbiAgICAgICAgICAgICAgICBbXCJhPXNzcmM6XCIsIHNpbVNTUkMsIFwiIG1zaWQ6XCIsIHZpZGVvU291cmNlcy5iYXNlLm1zaWRdLmpvaW4oJycpXVxuICAgICAgICApKTtcblxuICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFsnR2VuZXJhdGVkIHN1YnN0cmVhbSAnLCBpLCAnIHdpdGggU1NSQyAnLCBzaW1TU1JDLCAnLiddLmpvaW4oJycpKTtcblxuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgZ3JvdXAgc2ltIGxheWVycy5cbiAgICBzYi5zcGxpY2UoMCwgMCwgc3NyY0dyb3VwLmpvaW4oJyAnKSlcblxuICAgIHRoaXMuc2ltdWxjYXN0VXRpbHMuX3JlcGxhY2VWaWRlb1NvdXJjZXMobGluZXMsIHNiKTtcbn07XG5cbi8vIERvZXMgdGhlIGFjdHVhbCBwYXRjaGluZy5cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUuX2Vuc3VyZVNpbXVsY2FzdEdyb3VwID0gZnVuY3Rpb24gKGxpbmVzKSB7XG5cbiAgICB0aGlzLmxvZ2dlci5pbmZvKCdFbnN1cmluZyBzaW11bGNhc3QgZ3JvdXAuLi4nKTtcblxuICAgIGlmICh0aGlzLnNpbXVsY2FzdFV0aWxzLl9pbmRleE9mQXJyYXkoJ2E9c3NyYy1ncm91cDpTSU0nLCBsaW5lcykgPT09IHRoaXMuc2ltdWxjYXN0VXRpbHMuX2VtcHR5Q29tcG91bmRJbmRleCkge1xuICAgICAgICB0aGlzLl9hcHBlbmRTaW11bGNhc3RHcm91cChsaW5lcyk7XG4gICAgICAgIHRoaXMuX2NhY2hlTG9jYWxWaWRlb1NvdXJjZXMobGluZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHZlcmlmeSB0aGF0IHRoZSBzc3JjcyBwYXJ0aWNpcGF0aW5nIGluIHRoZSBTSU0gZ3JvdXAgYXJlIHByZXNlbnRcbiAgICAgICAgLy8gaW4gdGhlIFNEUCAobmVlZGVkIGZvciBwcmVzZW5jZSkuXG4gICAgICAgIHRoaXMuX3Jlc3RvcmVMb2NhbFZpZGVvU291cmNlcyhsaW5lcyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBQcm9kdWNlcyBhIHNpbmdsZSBzdHJlYW0gd2l0aCBtdWx0aXBsZSB0cmFja3MgZm9yIGxvY2FsIHZpZGVvIHNvdXJjZXMuXG4gKlxuICogQHBhcmFtIGxpbmVzXG4gKiBAcHJpdmF0ZVxuICovXG5OYXRpdmVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9leHBsb2RlU2ltdWxjYXN0U2VuZGVyU291cmNlcyA9IGZ1bmN0aW9uIChsaW5lcykge1xuICAgIHZhciBzYiwgbXNpZCwgc2lkLCB0aWQsIHZpZGVvU291cmNlcywgc2VsZjtcblxuICAgIHRoaXMubG9nZ2VyLmluZm8oJ0V4cGxvZGluZyBsb2NhbCB2aWRlbyBzb3VyY2VzLi4uJyk7XG5cbiAgICB2aWRlb1NvdXJjZXMgPSB0aGlzLnNpbXVsY2FzdFV0aWxzLnBhcnNlTWVkaWEobGluZXMsIFsndmlkZW8nXSlbMF07XG5cbiAgICBzZWxmID0gdGhpcztcbiAgICBpZiAodmlkZW9Tb3VyY2VzLmdyb3VwcyAmJiB2aWRlb1NvdXJjZXMuZ3JvdXBzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICB2aWRlb1NvdXJjZXMuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICBpZiAoZ3JvdXAuc2VtYW50aWNzID09PSAnU0lNJykge1xuICAgICAgICAgICAgICAgIGdyb3VwLnNzcmNzLmZvckVhY2goZnVuY3Rpb24gKHNzcmMpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIG1zaWQgZm9yIHRoaXMgc3NyYy4uXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLl9sb2NhbEV4cGxvc2lvbk1hcFtzc3JjXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLi4gZWl0aGVyIGZyb20gdGhlIGV4cGxvc2lvbiBtYXAuLlxuICAgICAgICAgICAgICAgICAgICAgICAgbXNpZCA9IHNlbGYuX2xvY2FsRXhwbG9zaW9uTWFwW3NzcmNdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gLi4gb3IgZ2VuZXJhdGUgYSBuZXcgb25lIChtc2lkKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZCA9IHZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLm1zaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic3RyaW5nKDAsIHZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLm1zaWQuaW5kZXhPZignICcpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGlkID0gc2VsZi5fZ2VuZXJhdGVHdWlkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2lkID0gW3NpZCwgdGlkXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2NhbEV4cGxvc2lvbk1hcFtzc3JjXSA9IG1zaWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBBc3NpZ24gaXQgdG8gdGhlIHNvdXJjZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLm1zaWQgPSBtc2lkO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE8oZ3ApIENoYW5nZSB0aGUgbXNpZCBvZiBhc3NvY2lhdGVkIHNvdXJjZXMuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNiID0gdGhpcy5zaW11bGNhc3RVdGlscy5fY29tcGlsZVZpZGVvU291cmNlcyh2aWRlb1NvdXJjZXMpO1xuXG4gICAgdGhpcy5zaW11bGNhc3RVdGlscy5fcmVwbGFjZVZpZGVvU291cmNlcyhsaW5lcywgc2IpO1xufTtcblxuLyoqXG4gKiBHVU0gZm9yIHNpbXVsY2FzdC5cbiAqXG4gKiBAcGFyYW0gY29uc3RyYWludHNcbiAqIEBwYXJhbSBzdWNjZXNzXG4gKiBAcGFyYW0gZXJyXG4gKi9cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUuZ2V0VXNlck1lZGlhID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzLCBzdWNjZXNzLCBlcnIpIHtcblxuICAgIC8vIFRoZXJlJ3Mgbm90aGluZyBzcGVjaWFsIHRvIGRvIGZvciBuYXRpdmUgc2ltdWxjYXN0LCBzbyBqdXN0IGRvIGEgbm9ybWFsIEdVTS5cbiAgICBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhKGNvbnN0cmFpbnRzLCBmdW5jdGlvbiAoaHFTdHJlYW0pIHtcbiAgICAgICAgc3VjY2VzcyhocVN0cmVhbSk7XG4gICAgfSwgZXJyKTtcbn07XG5cbi8qKlxuICogUHJlcGFyZXMgdGhlIGxvY2FsIGRlc2NyaXB0aW9uIGZvciBwdWJsaWMgdXNhZ2UgKGkuZS4gdG8gYmUgc2lnbmFsZWRcbiAqIHRocm91Z2ggSmluZ2xlIHRvIHRoZSBmb2N1cykuXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHtSVENTZXNzaW9uRGVzY3JpcHRpb259XG4gKi9cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUucmV2ZXJzZVRyYW5zZm9ybUxvY2FsRGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoZGVzYykge1xuICAgIHZhciBzYjtcblxuICAgIGlmICghdGhpcy5zaW11bGNhc3RVdGlscy5pc1ZhbGlkRGVzY3JpcHRpb24oZGVzYykgfHwgdGhpcy5faXNVc2luZ1NjcmVlblN0cmVhbSkge1xuICAgICAgICByZXR1cm4gZGVzYztcbiAgICB9XG5cblxuICAgIHNiID0gZGVzYy5zZHAuc3BsaXQoJ1xcclxcbicpO1xuXG4gICAgdGhpcy5fZXhwbG9kZVNpbXVsY2FzdFNlbmRlclNvdXJjZXMoc2IpO1xuXG4gICAgZGVzYyA9IG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oe1xuICAgICAgICB0eXBlOiBkZXNjLnR5cGUsXG4gICAgICAgIHNkcDogc2Iuam9pbignXFxyXFxuJylcbiAgICB9KTtcblxuICAgIHRoaXMubG9nZ2VyLmZpbmUoWydFeHBsb2RlZCBsb2NhbCB2aWRlbyBzb3VyY2VzJywgZGVzYy5zZHBdLmpvaW4oJyAnKSk7XG5cbiAgICByZXR1cm4gZGVzYztcbn07XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBzaW11bGNhc3QgZ3JvdXAgaXMgcHJlc2VudCBpbiB0aGUgYW5zd2VyLCBfaWZfIG5hdGl2ZVxuICogc2ltdWxjYXN0IGlzIGVuYWJsZWQsXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHsqfVxuICovXG5OYXRpdmVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLnRyYW5zZm9ybUFuc3dlciA9IGZ1bmN0aW9uIChkZXNjKSB7XG5cbiAgICBpZiAoIXRoaXMuc2ltdWxjYXN0VXRpbHMuaXNWYWxpZERlc2NyaXB0aW9uKGRlc2MpIHx8IHRoaXMuX2lzVXNpbmdTY3JlZW5TdHJlYW0pIHtcbiAgICAgICAgcmV0dXJuIGRlc2M7XG4gICAgfVxuXG4gICAgdmFyIHNiID0gZGVzYy5zZHAuc3BsaXQoJ1xcclxcbicpO1xuXG4gICAgLy8gRXZlbiBpZiB3ZSBoYXZlIGVuYWJsZWQgbmF0aXZlIHNpbXVsY2FzdGluZyBwcmV2aW91c2x5XG4gICAgLy8gKHdpdGggYSBjYWxsIHRvIFNMRCB3aXRoIGFuIGFwcHJvcHJpYXRlIFNEUCwgZm9yIGV4YW1wbGUpLFxuICAgIC8vIGNyZWF0ZUFuc3dlciBzZWVtcyB0byBjb25zaXN0ZW50bHkgZ2VuZXJhdGUgaW5jb21wbGV0ZSBTRFBcbiAgICAvLyB3aXRoIG1pc3NpbmcgU1NSQ1MuXG4gICAgLy9cbiAgICAvLyBTbywgc3Vic2VxdWVudCBjYWxscyB0byBTTEQgd2lsbCBoYXZlIG1pc3NpbmcgU1NSQ1MgYW5kIHByZXNlbmNlXG4gICAgLy8gd29uJ3QgaGF2ZSB0aGUgY29tcGxldGUgbGlzdCBvZiBTUkNzLlxuICAgIHRoaXMuX2Vuc3VyZVNpbXVsY2FzdEdyb3VwKHNiKTtcblxuICAgIGRlc2MgPSBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHtcbiAgICAgICAgdHlwZTogZGVzYy50eXBlLFxuICAgICAgICBzZHA6IHNiLmpvaW4oJ1xcclxcbicpXG4gICAgfSk7XG5cbiAgICB0aGlzLmxvZ2dlci5maW5lKFsnVHJhbnNmb3JtZWQgYW5zd2VyJywgZGVzYy5zZHBdLmpvaW4oJyAnKSk7XG5cbiAgICByZXR1cm4gZGVzYztcbn07XG5cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS50cmFuc2Zvcm1Mb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gZGVzYztcbn07XG5cbk5hdGl2ZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUuX3NldExvY2FsVmlkZW9TdHJlYW1FbmFibGVkID0gZnVuY3Rpb24gKHNzcmMsIGVuYWJsZWQpIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmUsIG5hdGl2ZSBzaW11bGNhc3QgZG9lcyB0aGF0IGF1dG8tbWFnaWNhbGx5LlxufTtcblxuTmF0aXZlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5hdGl2ZVNpbXVsY2FzdFNlbmRlcjtcblxuZnVuY3Rpb24gU2ltcGxlU2ltdWxjYXN0U2VuZGVyKCkge1xuICAgIFNpbXVsY2FzdFNlbmRlci5jYWxsKHRoaXMpO1xufVxuXG5TaW1wbGVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlKTtcblxuU2ltcGxlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5sb2NhbFN0cmVhbSA9IG51bGw7XG5TaW1wbGVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9sb2NhbE1hcHMgPSB7XG4gICAgbXNpZHM6IFtdLFxuICAgIG1zaWQyc3NyYzoge31cbn07XG5cbi8qKlxuICogR3JvdXBzIGxvY2FsIHZpZGVvIHNvdXJjZXMgdG9nZXRoZXIgaW4gdGhlIHNzcmMtZ3JvdXA6U0lNIGdyb3VwLlxuICpcbiAqIEBwYXJhbSBsaW5lc1xuICogQHByaXZhdGVcbiAqL1xuU2ltcGxlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5fZ3JvdXBMb2NhbFZpZGVvU291cmNlcyA9IGZ1bmN0aW9uIChsaW5lcykge1xuICAgIHZhciBzYiwgdmlkZW9Tb3VyY2VzLCBzc3JjcyA9IFtdLCBzc3JjO1xuXG4gICAgdGhpcy5sb2dnZXIuaW5mbygnR3JvdXBpbmcgbG9jYWwgdmlkZW8gc291cmNlcy4uLicpO1xuXG4gICAgdmlkZW9Tb3VyY2VzID0gdGhpcy5zaW11bGNhc3RVdGlscy5wYXJzZU1lZGlhKGxpbmVzLCBbJ3ZpZGVvJ10pWzBdO1xuXG4gICAgZm9yIChzc3JjIGluIHZpZGVvU291cmNlcy5zb3VyY2VzKSB7XG4gICAgICAgIC8vIGppdHNpLW1lZXQgZGVzdHJveXMvY3JlYXRlcyBzdHJlYW1zIGF0IHZhcmlvdXMgcGxhY2VzIGNhdXNpbmdcbiAgICAgICAgLy8gdGhlIG9yaWdpbmFsIGxvY2FsIHN0cmVhbSBpZHMgdG8gY2hhbmdlLiBUaGUgb25seSB0aGluZyB0aGF0XG4gICAgICAgIC8vIHJlbWFpbnMgdW5jaGFuZ2VkIGlzIHRoZSB0cmFja2lkLlxuICAgICAgICB0aGlzLl9sb2NhbE1hcHMubXNpZDJzc3JjW3ZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLm1zaWQuc3BsaXQoJyAnKVsxXV0gPSBzc3JjO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBUT0RPKGdwKSBhZGQgb25seSBcImZyZWVcIiBzb3VyY2VzLlxuICAgIHRoaXMuX2xvY2FsTWFwcy5tc2lkcy5mb3JFYWNoKGZ1bmN0aW9uIChtc2lkKSB7XG4gICAgICAgIHNzcmNzLnB1c2goc2VsZi5fbG9jYWxNYXBzLm1zaWQyc3NyY1ttc2lkXSk7XG4gICAgfSk7XG5cbiAgICBpZiAoIXZpZGVvU291cmNlcy5ncm91cHMpIHtcbiAgICAgICAgdmlkZW9Tb3VyY2VzLmdyb3VwcyA9IFtdO1xuICAgIH1cblxuICAgIHZpZGVvU291cmNlcy5ncm91cHMucHVzaCh7XG4gICAgICAgICdzZW1hbnRpY3MnOiAnU0lNJyxcbiAgICAgICAgJ3NzcmNzJzogc3NyY3NcbiAgICB9KTtcblxuICAgIHNiID0gdGhpcy5zaW11bGNhc3RVdGlscy5fY29tcGlsZVZpZGVvU291cmNlcyh2aWRlb1NvdXJjZXMpO1xuXG4gICAgdGhpcy5zaW11bGNhc3RVdGlscy5fcmVwbGFjZVZpZGVvU291cmNlcyhsaW5lcywgc2IpO1xufTtcblxuLyoqXG4gKiBHVU0gZm9yIHNpbXVsY2FzdC5cbiAqXG4gKiBAcGFyYW0gY29uc3RyYWludHNcbiAqIEBwYXJhbSBzdWNjZXNzXG4gKiBAcGFyYW0gZXJyXG4gKi9cblNpbXBsZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUuZ2V0VXNlck1lZGlhID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzLCBzdWNjZXNzLCBlcnIpIHtcblxuICAgIC8vIFRPRE8oZ3ApIHdoYXQgaWYgd2UgcmVxdWVzdCBhIHJlc29sdXRpb24gbm90IHN1cHBvcnRlZCBieSB0aGUgaGFyZHdhcmU/XG4gICAgLy8gVE9ETyhncCkgbWFrZSB0aGUgbHEgc3RyZWFtIGNvbmZpZ3VyYWJsZTsgYWx0aG91Z2ggdGhpcyB3b3VsZG4ndCB3b3JrIHdpdGggbmF0aXZlIHNpbXVsY2FzdFxuICAgIHZhciBscUNvbnN0cmFpbnRzID0ge1xuICAgICAgICBhdWRpbzogZmFsc2UsXG4gICAgICAgIHZpZGVvOiB7XG4gICAgICAgICAgICBtYW5kYXRvcnk6IHtcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogMzIwLFxuICAgICAgICAgICAgICAgIG1heEhlaWdodDogMTgwLFxuICAgICAgICAgICAgICAgIG1heEZyYW1lUmF0ZTogMTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmxvZ2dlci5pbmZvKCdIUSBjb25zdHJhaW50czogJywgY29uc3RyYWludHMpO1xuICAgIHRoaXMubG9nZ2VyLmluZm8oJ0xRIGNvbnN0cmFpbnRzOiAnLCBscUNvbnN0cmFpbnRzKTtcblxuXG4gICAgLy8gTk9URShncCkgaWYgd2UgcmVxdWVzdCB0aGUgbHEgc3RyZWFtIGZpcnN0IHdlYmtpdEdldFVzZXJNZWRpYVxuICAgIC8vIGZhaWxzIHJhbmRvbWx5LiBUZXN0ZWQgd2l0aCBDaHJvbWUgMzcuIEFzIGZpcHBvIHN1Z2dlc3RlZCwgdGhlXG4gICAgLy8gcmVhc29uIGFwcGVhcnMgdG8gYmUgdGhhdCBDaHJvbWUgb25seSBhY3F1aXJlcyB0aGUgY2FtIG9uY2UgYW5kXG4gICAgLy8gdGhlbiBkb3duc2NhbGVzIHRoZSBwaWN0dXJlIChodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzQ2NjE2I2MxMSlcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhKGNvbnN0cmFpbnRzLCBmdW5jdGlvbiAoaHFTdHJlYW0pIHtcblxuICAgICAgICBzZWxmLmxvY2FsU3RyZWFtID0gaHFTdHJlYW07XG5cbiAgICAgICAgLy8gcmVzZXQgbG9jYWwgbWFwcy5cbiAgICAgICAgc2VsZi5fbG9jYWxNYXBzLm1zaWRzID0gW107XG4gICAgICAgIHNlbGYuX2xvY2FsTWFwcy5tc2lkMnNzcmMgPSB7fTtcblxuICAgICAgICAvLyBhZGQgaHEgdHJhY2tpZCB0byBsb2NhbCBtYXBcbiAgICAgICAgc2VsZi5fbG9jYWxNYXBzLm1zaWRzLnB1c2goaHFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKVswXS5pZCk7XG5cbiAgICAgICAgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYShscUNvbnN0cmFpbnRzLCBmdW5jdGlvbiAobHFTdHJlYW0pIHtcblxuICAgICAgICAgICAgc2VsZi5kaXNwbGF5ZWRMb2NhbFZpZGVvU3RyZWFtID0gbHFTdHJlYW07XG5cbiAgICAgICAgICAgIC8vIE5PVEUoZ3ApIFRoZSBzcGVjaWZpY2F0aW9uIHNheXMgQXJyYXkuZm9yRWFjaCgpIHdpbGwgdmlzaXRcbiAgICAgICAgICAgIC8vIHRoZSBhcnJheSBlbGVtZW50cyBpbiBudW1lcmljIG9yZGVyLCBhbmQgdGhhdCBpdCBkb2Vzbid0XG4gICAgICAgICAgICAvLyB2aXNpdCBlbGVtZW50cyB0aGF0IGRvbid0IGV4aXN0LlxuXG4gICAgICAgICAgICAvLyBhZGQgbHEgdHJhY2tpZCB0byBsb2NhbCBtYXBcbiAgICAgICAgICAgIHNlbGYuX2xvY2FsTWFwcy5tc2lkcy5zcGxpY2UoMCwgMCwgbHFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKVswXS5pZCk7XG5cbiAgICAgICAgICAgIHNlbGYubG9jYWxTdHJlYW0uYWRkVHJhY2sobHFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKVswXSk7XG4gICAgICAgICAgICBzdWNjZXNzKHNlbGYubG9jYWxTdHJlYW0pO1xuICAgICAgICB9LCBlcnIpO1xuICAgIH0sIGVycik7XG59O1xuXG4vKipcbiAqIFByZXBhcmVzIHRoZSBsb2NhbCBkZXNjcmlwdGlvbiBmb3IgcHVibGljIHVzYWdlIChpLmUuIHRvIGJlIHNpZ25hbGVkXG4gKiB0aHJvdWdoIEppbmdsZSB0byB0aGUgZm9jdXMpLlxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7UlRDU2Vzc2lvbkRlc2NyaXB0aW9ufVxuICovXG5TaW1wbGVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLnJldmVyc2VUcmFuc2Zvcm1Mb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICB2YXIgc2I7XG5cbiAgICBpZiAoIXRoaXMuc2ltdWxjYXN0VXRpbHMuaXNWYWxpZERlc2NyaXB0aW9uKGRlc2MpKSB7XG4gICAgICAgIHJldHVybiBkZXNjO1xuICAgIH1cblxuICAgIHNiID0gZGVzYy5zZHAuc3BsaXQoJ1xcclxcbicpO1xuXG4gICAgdGhpcy5fZ3JvdXBMb2NhbFZpZGVvU291cmNlcyhzYik7XG5cbiAgICBkZXNjID0gbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbih7XG4gICAgICAgIHR5cGU6IGRlc2MudHlwZSxcbiAgICAgICAgc2RwOiBzYi5qb2luKCdcXHJcXG4nKVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2dnZXIuZmluZSgnR3JvdXBlZCBsb2NhbCB2aWRlbyBzb3VyY2VzJyk7XG4gICAgdGhpcy5sb2dnZXIuZmluZShkZXNjLnNkcCk7XG5cbiAgICByZXR1cm4gZGVzYztcbn07XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBzaW11bGNhc3QgZ3JvdXAgaXMgcHJlc2VudCBpbiB0aGUgYW5zd2VyLCBfaWZfIG5hdGl2ZVxuICogc2ltdWxjYXN0IGlzIGVuYWJsZWQsXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHsqfVxuICovXG5TaW1wbGVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLnRyYW5zZm9ybUFuc3dlciA9IGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgcmV0dXJuIGRlc2M7XG59O1xuXG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0gZGVzY1xuICogQHJldHVybnMgeyp9XG4gKi9cblNpbXBsZVNpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUudHJhbnNmb3JtTG9jYWxEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjKSB7XG5cbiAgICB2YXIgc2IgPSBkZXNjLnNkcC5zcGxpdCgnXFxyXFxuJyk7XG5cbiAgICB0aGlzLnNpbXVsY2FzdFV0aWxzLl9yZW1vdmVTaW11bGNhc3RHcm91cChzYik7XG5cbiAgICBkZXNjID0gbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbih7XG4gICAgICAgIHR5cGU6IGRlc2MudHlwZSxcbiAgICAgICAgc2RwOiBzYi5qb2luKCdcXHJcXG4nKVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2dnZXIuZmluZSgnVHJhbnNmb3JtZWQgbG9jYWwgZGVzY3JpcHRpb24nKTtcbiAgICB0aGlzLmxvZ2dlci5maW5lKGRlc2Muc2RwKTtcblxuICAgIHJldHVybiBkZXNjO1xufTtcblxuU2ltcGxlU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5fc2V0TG9jYWxWaWRlb1N0cmVhbUVuYWJsZWQgPSBmdW5jdGlvbiAoc3NyYywgZW5hYmxlZCkge1xuICAgIHZhciB0cmFja2lkO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubG9nZ2VyLmxvZyhbJ1JlcXVlc3RlZCB0bycsIGVuYWJsZWQgPyAnZW5hYmxlJyA6ICdkaXNhYmxlJywgc3NyY10uam9pbignICcpKTtcbiAgICBpZiAoT2JqZWN0LmtleXModGhpcy5fbG9jYWxNYXBzLm1zaWQyc3NyYykuc29tZShmdW5jdGlvbiAodGlkKSB7XG4gICAgICAgIC8vIFNlYXJjaCBmb3IgdGhlIHRyYWNrIGlkIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIHNzcmNcbiAgICAgICAgaWYgKHNlbGYuX2xvY2FsTWFwcy5tc2lkMnNzcmNbdGlkXSA9PSBzc3JjKSB7XG4gICAgICAgICAgICB0cmFja2lkID0gdGlkO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9KSAmJiBzZWxmLmxvY2FsU3RyZWFtLmdldFZpZGVvVHJhY2tzKCkuc29tZShmdW5jdGlvbiAodHJhY2spIHtcbiAgICAgICAgLy8gU3RhcnQvc3RvcCB0aGUgdHJhY2sgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgdHJhY2sgaWRcbiAgICAgICAgaWYgKHRyYWNrLmlkID09PSB0cmFja2lkKSB7XG4gICAgICAgICAgICB0cmFjay5lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfSkpIHtcbiAgICAgICAgdGhpcy5sb2dnZXIubG9nKFt0cmFja2lkLCBlbmFibGVkID8gJ2VuYWJsZWQnIDogJ2Rpc2FibGVkJ10uam9pbignICcpKTtcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihlbmFibGVkXG4gICAgICAgICAgICA/ICdzaW11bGNhc3RsYXllcnN0YXJ0ZWQnXG4gICAgICAgICAgICA6ICdzaW11bGNhc3RsYXllcnN0b3BwZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIkkgZG9uJ3QgaGF2ZSBhIGxvY2FsIHN0cmVhbSB3aXRoIFNTUkMgXCIgKyBzc3JjKTtcbiAgICB9XG59O1xuXG5TaW1wbGVTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU2ltcGxlU2ltdWxjYXN0U2VuZGVyO1xuXG5mdW5jdGlvbiBOb1NpbXVsY2FzdFNlbmRlcigpIHtcbiAgICBTaW11bGNhc3RTZW5kZXIuY2FsbCh0aGlzKTtcbn1cblxuTm9TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTaW11bGNhc3RTZW5kZXIucHJvdG90eXBlKTtcblxuLyoqXG4gKiBHVU0gZm9yIHNpbXVsY2FzdC5cbiAqXG4gKiBAcGFyYW0gY29uc3RyYWludHNcbiAqIEBwYXJhbSBzdWNjZXNzXG4gKiBAcGFyYW0gZXJyXG4gKi9cbk5vU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5nZXRVc2VyTWVkaWEgPSBmdW5jdGlvbiAoY29uc3RyYWludHMsIHN1Y2Nlc3MsIGVycikge1xuICAgIG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEoY29uc3RyYWludHMsIGZ1bmN0aW9uIChocVN0cmVhbSkge1xuICAgICAgICBzdWNjZXNzKGhxU3RyZWFtKTtcbiAgICB9LCBlcnIpO1xufTtcblxuLyoqXG4gKiBQcmVwYXJlcyB0aGUgbG9jYWwgZGVzY3JpcHRpb24gZm9yIHB1YmxpYyB1c2FnZSAoaS5lLiB0byBiZSBzaWduYWxlZFxuICogdGhyb3VnaCBKaW5nbGUgdG8gdGhlIGZvY3VzKS5cbiAqXG4gKiBAcGFyYW0gZGVzY1xuICogQHJldHVybnMge1JUQ1Nlc3Npb25EZXNjcmlwdGlvbn1cbiAqL1xuTm9TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLnJldmVyc2VUcmFuc2Zvcm1Mb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gZGVzYztcbn07XG5cbi8qKlxuICogRW5zdXJlcyB0aGF0IHRoZSBzaW11bGNhc3QgZ3JvdXAgaXMgcHJlc2VudCBpbiB0aGUgYW5zd2VyLCBfaWZfIG5hdGl2ZVxuICogc2ltdWxjYXN0IGlzIGVuYWJsZWQsXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHsqfVxuICovXG5Ob1NpbXVsY2FzdFNlbmRlci5wcm90b3R5cGUudHJhbnNmb3JtQW5zd2VyID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gZGVzYztcbn07XG5cblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuTm9TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLnRyYW5zZm9ybUxvY2FsRGVzY3JpcHRpb24gPSBmdW5jdGlvbiAoZGVzYykge1xuICAgIHJldHVybiBkZXNjO1xufTtcblxuTm9TaW11bGNhc3RTZW5kZXIucHJvdG90eXBlLl9zZXRMb2NhbFZpZGVvU3RyZWFtRW5hYmxlZCA9IGZ1bmN0aW9uIChzc3JjLCBlbmFibGVkKSB7XG5cbn07XG5cbk5vU2ltdWxjYXN0U2VuZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5vU2ltdWxjYXN0U2VuZGVyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBcIm5hdGl2ZVwiOiBOYXRpdmVTaW11bGNhc3RTZW5kZXIsXG4gICAgXCJub1wiOiBOb1NpbXVsY2FzdFNlbmRlclxufVxuIiwidmFyIFNpbXVsY2FzdExvZ2dlciA9IHJlcXVpcmUoXCIuL1NpbXVsY2FzdExvZ2dlclwiKTtcblxuLyoqXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNpbXVsY2FzdFV0aWxzKCkge1xuICAgIHRoaXMubG9nZ2VyID0gbmV3IFNpbXVsY2FzdExvZ2dlcihcIlNpbXVsY2FzdFV0aWxzXCIsIDEpO1xufVxuXG4vKipcbiAqXG4gKiBAdHlwZSB7e319XG4gKiBAcHJpdmF0ZVxuICovXG5TaW11bGNhc3RVdGlscy5wcm90b3R5cGUuX2VtcHR5Q29tcG91bmRJbmRleCA9IHt9O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gbGluZXNcbiAqIEBwYXJhbSB2aWRlb1NvdXJjZXNcbiAqIEBwcml2YXRlXG4gKi9cblNpbXVsY2FzdFV0aWxzLnByb3RvdHlwZS5fcmVwbGFjZVZpZGVvU291cmNlcyA9IGZ1bmN0aW9uIChsaW5lcywgdmlkZW9Tb3VyY2VzKSB7XG4gICAgdmFyIGksIGluVmlkZW8gPSBmYWxzZSwgaW5kZXggPSAtMSwgaG93TWFueSA9IDA7XG5cbiAgICB0aGlzLmxvZ2dlci5pbmZvKCdSZXBsYWNpbmcgdmlkZW8gc291cmNlcy4uLicpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpblZpZGVvICYmIGxpbmVzW2ldLnN1YnN0cmluZygwLCAnbT0nLmxlbmd0aCkgPT09ICdtPScpIHtcbiAgICAgICAgICAgIC8vIE91dCBvZiB2aWRlby5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpblZpZGVvICYmIGxpbmVzW2ldLnN1YnN0cmluZygwLCAnbT12aWRlbyAnLmxlbmd0aCkgPT09ICdtPXZpZGVvICcpIHtcbiAgICAgICAgICAgIC8vIEluIHZpZGVvLlxuICAgICAgICAgICAgaW5WaWRlbyA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5WaWRlbyAmJiAobGluZXNbaV0uc3Vic3RyaW5nKDAsICdhPXNzcmM6Jy5sZW5ndGgpID09PSAnYT1zc3JjOidcbiAgICAgICAgICAgIHx8IGxpbmVzW2ldLnN1YnN0cmluZygwLCAnYT1zc3JjLWdyb3VwOicubGVuZ3RoKSA9PT0gJ2E9c3NyYy1ncm91cDonKSkge1xuXG4gICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBob3dNYW55Kys7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAgZWZmaWNpZW5jeSBiYWJ5IDspXG4gICAgbGluZXMuc3BsaWNlLmFwcGx5KGxpbmVzLFxuICAgICAgICBbaW5kZXgsIGhvd01hbnldLmNvbmNhdCh2aWRlb1NvdXJjZXMpKTtcblxufTtcblxuU2ltdWxjYXN0VXRpbHMucHJvdG90eXBlLmlzVmFsaWREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjKVxue1xuICAgIHJldHVybiBkZXNjICYmIGRlc2MgIT0gbnVsbFxuICAgICAgICAmJiBkZXNjLnR5cGUgJiYgZGVzYy50eXBlICE9ICcnXG4gICAgICAgICYmIGRlc2Muc2RwICYmIGRlc2Muc2RwICE9ICcnO1xufTtcblxuU2ltdWxjYXN0VXRpbHMucHJvdG90eXBlLl9nZXRWaWRlb1NvdXJjZXMgPSBmdW5jdGlvbiAobGluZXMpIHtcbiAgICB2YXIgaSwgaW5WaWRlbyA9IGZhbHNlLCBzYiA9IFtdO1xuXG4gICAgdGhpcy5sb2dnZXIuaW5mbygnR2V0dGluZyB2aWRlbyBzb3VyY2VzLi4uJyk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluVmlkZW8gJiYgbGluZXNbaV0uc3Vic3RyaW5nKDAsICdtPScubGVuZ3RoKSA9PT0gJ209Jykge1xuICAgICAgICAgICAgLy8gT3V0IG9mIHZpZGVvLlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWluVmlkZW8gJiYgbGluZXNbaV0uc3Vic3RyaW5nKDAsICdtPXZpZGVvICcubGVuZ3RoKSA9PT0gJ209dmlkZW8gJykge1xuICAgICAgICAgICAgLy8gSW4gdmlkZW8uXG4gICAgICAgICAgICBpblZpZGVvID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpblZpZGVvICYmIGxpbmVzW2ldLnN1YnN0cmluZygwLCAnYT1zc3JjOicubGVuZ3RoKSA9PT0gJ2E9c3NyYzonKSB7XG4gICAgICAgICAgICAvLyBJbiBTU1JDLlxuICAgICAgICAgICAgc2IucHVzaChsaW5lc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5WaWRlbyAmJiBsaW5lc1tpXS5zdWJzdHJpbmcoMCwgJ2E9c3NyYy1ncm91cDonLmxlbmd0aCkgPT09ICdhPXNzcmMtZ3JvdXA6Jykge1xuICAgICAgICAgICAgc2IucHVzaChsaW5lc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2I7XG59O1xuXG5TaW11bGNhc3RVdGlscy5wcm90b3R5cGUucGFyc2VNZWRpYSA9IGZ1bmN0aW9uIChsaW5lcywgbWVkaWF0eXBlcykge1xuICAgIHZhciBpLCByZXMgPSBbXSwgdHlwZSwgY3VyX21lZGlhLCBpZHgsIHNzcmNzLCBjdXJfc3NyYywgc3NyYyxcbiAgICAgICAgc3NyY19hdHRyaWJ1dGUsIGdyb3VwLCBzZW1hbnRpY3MsIHNraXAgPSB0cnVlO1xuXG4gICAgdGhpcy5sb2dnZXIuaW5mbygnUGFyc2luZyBtZWRpYSBzb3VyY2VzLi4uJyk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGxpbmVzW2ldLnN1YnN0cmluZygwLCAnbT0nLmxlbmd0aCkgPT09ICdtPScpIHtcblxuICAgICAgICAgICAgdHlwZSA9IGxpbmVzW2ldXG4gICAgICAgICAgICAgICAgLnN1YnN0cignbT0nLmxlbmd0aCwgbGluZXNbaV0uaW5kZXhPZignICcpIC0gJ209Jy5sZW5ndGgpO1xuICAgICAgICAgICAgc2tpcCA9IG1lZGlhdHlwZXMgIT09IHVuZGVmaW5lZCAmJiBtZWRpYXR5cGVzLmluZGV4T2YodHlwZSkgPT09IC0xO1xuXG4gICAgICAgICAgICBpZiAoIXNraXApIHtcbiAgICAgICAgICAgICAgICBjdXJfbWVkaWEgPSB7XG4gICAgICAgICAgICAgICAgICAgICd0eXBlJzogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NvdXJjZXMnOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgJ2dyb3Vwcyc6IFtdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJlcy5wdXNoKGN1cl9tZWRpYSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmICghc2tpcCAmJiBsaW5lc1tpXS5zdWJzdHJpbmcoMCwgJ2E9c3NyYzonLmxlbmd0aCkgPT09ICdhPXNzcmM6Jykge1xuXG4gICAgICAgICAgICBpZHggPSBsaW5lc1tpXS5pbmRleE9mKCcgJyk7XG4gICAgICAgICAgICBzc3JjID0gbGluZXNbaV0uc3Vic3RyaW5nKCdhPXNzcmM6Jy5sZW5ndGgsIGlkeCk7XG4gICAgICAgICAgICBpZiAoY3VyX21lZGlhLnNvdXJjZXNbc3NyY10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGN1cl9zc3JjID0geydzc3JjJzogc3NyY307XG4gICAgICAgICAgICAgICAgY3VyX21lZGlhLnNvdXJjZXNbc3NyY10gPSBjdXJfc3NyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3NyY19hdHRyaWJ1dGUgPSBsaW5lc1tpXS5zdWJzdHIoaWR4ICsgMSkuc3BsaXQoJzonLCAyKVswXTtcbiAgICAgICAgICAgIGN1cl9zc3JjW3NzcmNfYXR0cmlidXRlXSA9IGxpbmVzW2ldLnN1YnN0cihpZHggKyAxKS5zcGxpdCgnOicsIDIpWzFdO1xuXG4gICAgICAgICAgICBpZiAoY3VyX21lZGlhLmJhc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGN1cl9tZWRpYS5iYXNlID0gY3VyX3NzcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIGlmICghc2tpcCAmJiBsaW5lc1tpXS5zdWJzdHJpbmcoMCwgJ2E9c3NyYy1ncm91cDonLmxlbmd0aCkgPT09ICdhPXNzcmMtZ3JvdXA6Jykge1xuICAgICAgICAgICAgaWR4ID0gbGluZXNbaV0uaW5kZXhPZignICcpO1xuICAgICAgICAgICAgc2VtYW50aWNzID0gbGluZXNbaV0uc3Vic3RyKDAsIGlkeCkuc3Vic3RyKCdhPXNzcmMtZ3JvdXA6Jy5sZW5ndGgpO1xuICAgICAgICAgICAgc3NyY3MgPSBsaW5lc1tpXS5zdWJzdHIoaWR4KS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIGdyb3VwID0ge1xuICAgICAgICAgICAgICAgICdzZW1hbnRpY3MnOiBzZW1hbnRpY3MsXG4gICAgICAgICAgICAgICAgJ3NzcmNzJzogc3NyY3NcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjdXJfbWVkaWEuZ3JvdXBzLnB1c2goZ3JvdXApO1xuICAgICAgICB9IGVsc2UgaWYgKCFza2lwICYmIChsaW5lc1tpXS5zdWJzdHJpbmcoMCwgJ2E9c2VuZHJlY3YnLmxlbmd0aCkgPT09ICdhPXNlbmRyZWN2JyB8fFxuICAgICAgICAgICAgbGluZXNbaV0uc3Vic3RyaW5nKDAsICdhPXJlY3Zvbmx5Jy5sZW5ndGgpID09PSAnYT1yZWN2b25seScgfHxcbiAgICAgICAgICAgIGxpbmVzW2ldLnN1YnN0cmluZygwLCAnYT1zZW5kb25seScubGVuZ3RoKSA9PT0gJ2E9c2VuZG9ubHknIHx8XG4gICAgICAgICAgICBsaW5lc1tpXS5zdWJzdHJpbmcoMCwgJ2E9aW5hY3RpdmUnLmxlbmd0aCkgPT09ICdhPWluYWN0aXZlJykpIHtcblxuICAgICAgICAgICAgY3VyX21lZGlhLmRpcmVjdGlvbiA9IGxpbmVzW2ldLnN1YnN0cmluZygnYT0nLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xufTtcblxuLyoqXG4gKiBUaGUgX2luZGV4T2ZBcnJheSgpIG1ldGhvZCByZXR1cm5zIHRoZSBmaXJzdCBhIENvbXBvdW5kSW5kZXggYXQgd2hpY2ggYVxuICogZ2l2ZW4gZWxlbWVudCBjYW4gYmUgZm91bmQgaW4gdGhlIGFycmF5LCBvciBfZW1wdHlDb21wb3VuZEluZGV4IGlmIGl0IGlzXG4gKiBub3QgcHJlc2VudC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIF9pbmRleE9mQXJyYXkoJzMnLCBbICd0aGlzIGlzIGxpbmUgMScsICd0aGlzIGlzIGxpbmUgMicsICd0aGlzIGlzIGxpbmUgMycgXSlcbiAqXG4gKiByZXR1cm5zIHtyb3c6IDIsIGNvbHVtbjogMTR9XG4gKlxuICogQHBhcmFtIG5lZWRsZVxuICogQHBhcmFtIGhheXN0YWNrXG4gKiBAcGFyYW0gc3RhcnRcbiAqIEByZXR1cm5zIHt9XG4gKiBAcHJpdmF0ZVxuICovXG5TaW11bGNhc3RVdGlscy5wcm90b3R5cGUuX2luZGV4T2ZBcnJheSA9IGZ1bmN0aW9uIChuZWVkbGUsIGhheXN0YWNrLCBzdGFydCkge1xuICAgIHZhciBsZW5ndGggPSBoYXlzdGFjay5sZW5ndGgsIGlkeCwgaTtcblxuICAgIGlmICghc3RhcnQpIHtcbiAgICAgICAgc3RhcnQgPSAwO1xuICAgIH1cblxuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWR4ID0gaGF5c3RhY2tbaV0uaW5kZXhPZihuZWVkbGUpO1xuICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyb3c6IGksIGNvbHVtbjogaWR4fTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fZW1wdHlDb21wb3VuZEluZGV4O1xufTtcblxuU2ltdWxjYXN0VXRpbHMucHJvdG90eXBlLl9yZW1vdmVTaW11bGNhc3RHcm91cCA9IGZ1bmN0aW9uIChsaW5lcykge1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gbGluZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKGxpbmVzW2ldLmluZGV4T2YoJ2E9c3NyYy1ncm91cDpTSU0nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGxpbmVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblNpbXVsY2FzdFV0aWxzLnByb3RvdHlwZS5fY29tcGlsZVZpZGVvU291cmNlcyA9IGZ1bmN0aW9uICh2aWRlb1NvdXJjZXMpIHtcbiAgICB2YXIgc2IgPSBbXSwgc3NyYywgYWRkZWRTU1JDcyA9IFtdO1xuXG4gICAgdGhpcy5sb2dnZXIuaW5mbygnQ29tcGlsaW5nIHZpZGVvIHNvdXJjZXMuLi4nKTtcblxuICAgIC8vIEFkZCB0aGUgZ3JvdXBzXG4gICAgaWYgKHZpZGVvU291cmNlcy5ncm91cHMgJiYgdmlkZW9Tb3VyY2VzLmdyb3Vwcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgdmlkZW9Tb3VyY2VzLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgaWYgKGdyb3VwLnNzcmNzICYmIGdyb3VwLnNzcmNzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHNiLnB1c2goW1snYT1zc3JjLWdyb3VwOicsIGdyb3VwLnNlbWFudGljc10uam9pbignJyksIGdyb3VwLnNzcmNzLmpvaW4oJyAnKV0uam9pbignICcpKTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIChncm91cC5zZW1hbnRpY3MgIT09ICdTSU0nKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXAuc3NyY3MuZm9yRWFjaChmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgICAgICBhZGRlZFNTUkNzLnB1c2goc3NyYyk7XG4gICAgICAgICAgICAgICAgICAgIHNiLnNwbGljZS5hcHBseShzYiwgW3NiLmxlbmd0aCwgMF0uY29uY2F0KFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcImE9c3NyYzpcIiwgc3NyYywgXCIgY25hbWU6XCIsIHZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLmNuYW1lXS5qb2luKCcnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtcImE9c3NyYzpcIiwgc3NyYywgXCIgbXNpZDpcIiwgdmlkZW9Tb3VyY2VzLnNvdXJjZXNbc3NyY10ubXNpZF0uam9pbignJyldKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRoZW4gYWRkIGFueSBmcmVlIHNvdXJjZXMuXG4gICAgaWYgKHZpZGVvU291cmNlcy5zb3VyY2VzKSB7XG4gICAgICAgIGZvciAoc3NyYyBpbiB2aWRlb1NvdXJjZXMuc291cmNlcykge1xuICAgICAgICAgICAgaWYgKGFkZGVkU1NSQ3MuaW5kZXhPZihzc3JjKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBzYi5zcGxpY2UuYXBwbHkoc2IsIFtzYi5sZW5ndGgsIDBdLmNvbmNhdChbXG4gICAgICAgICAgICAgICAgICAgIFtcImE9c3NyYzpcIiwgc3NyYywgXCIgY25hbWU6XCIsIHZpZGVvU291cmNlcy5zb3VyY2VzW3NzcmNdLmNuYW1lXS5qb2luKCcnKSxcbiAgICAgICAgICAgICAgICAgICAgW1wiYT1zc3JjOlwiLCBzc3JjLCBcIiBtc2lkOlwiLCB2aWRlb1NvdXJjZXMuc291cmNlc1tzc3JjXS5tc2lkXS5qb2luKCcnKV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzYjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2ltdWxjYXN0VXRpbHM7IiwiLypqc2xpbnQgcGx1c3BsdXM6IHRydWUgKi9cbi8qanNsaW50IG5vbWVuOiB0cnVlKi9cblxudmFyIFNpbXVsY2FzdFNlbmRlciA9IHJlcXVpcmUoXCIuL1NpbXVsY2FzdFNlbmRlclwiKTtcbnZhciBOb1NpbXVsY2FzdFNlbmRlciA9IFNpbXVsY2FzdFNlbmRlcltcIm5vXCJdO1xudmFyIE5hdGl2ZVNpbXVsY2FzdFNlbmRlciA9IFNpbXVsY2FzdFNlbmRlcltcIm5hdGl2ZVwiXTtcbnZhciBTaW11bGNhc3RSZWNlaXZlciA9IHJlcXVpcmUoXCIuL1NpbXVsY2FzdFJlY2VpdmVyXCIpO1xudmFyIFNpbXVsY2FzdFV0aWxzID0gcmVxdWlyZShcIi4vU2ltdWxjYXN0VXRpbHNcIik7XG5cblxuLyoqXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFNpbXVsY2FzdE1hbmFnZXIoKSB7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHNpbXVsY2FzdCB1dGlsaXRpZXMuXG4gICAgdGhpcy5zaW11bGNhc3RVdGlscyA9IG5ldyBTaW11bGNhc3RVdGlscygpO1xuXG4gICAgLy8gQ3JlYXRlIHJlbW90ZSBzaW11bGNhc3QuXG4gICAgdGhpcy5zaW11bGNhc3RSZWNlaXZlciA9IG5ldyBTaW11bGNhc3RSZWNlaXZlcigpO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBsb2NhbCBzaW11bGNhc3QuXG5cbiAgICAvLyBUT0RPKGdwKSBtb3ZlIGludG8gU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUuZ2V0VXNlck1lZGlhIGFuZCB0YWtlIGludG9cbiAgICAvLyBhY2NvdW50IGNvbnN0cmFpbnRzLlxuICAgIGlmICghY29uZmlnLmVuYWJsZVNpbXVsY2FzdCkge1xuICAgICAgICB0aGlzLnNpbXVsY2FzdFNlbmRlciA9IG5ldyBOb1NpbXVsY2FzdFNlbmRlcigpO1xuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgdmVuZG9yTmFtZSA9IHdpbmRvdy5uYXZpZ2F0b3IudmVuZG9yO1xuICAgICAgICBpZihpc0Nocm9taXVtICE9PSBudWxsICYmIGlzQ2hyb21pdW0gIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgLyogc2tpcCBvcGVyYSAqL1xuICAgICAgICAgICAgJiYgdmVuZG9yTmFtZSA9PT0gXCJHb29nbGUgSW5jLlwiXG4gICAgICAgICAgICAvKiBza2lwIENocm9taXVtIGFzIHN1Z2dlc3RlZCBieSBmaXBwbyAqL1xuICAgICAgICAgICAgJiYgIXdpbmRvdy5uYXZpZ2F0b3IuYXBwVmVyc2lvbi5tYXRjaCgvQ2hyb21pdW1cXC8vKSApIHtcbiAgICAgICAgICAgIHZhciB2ZXIgPSBwYXJzZUludCh3aW5kb3cubmF2aWdhdG9yLmFwcFZlcnNpb24ubWF0Y2goL0Nocm9tZVxcLyhcXGQrKVxcLi8pWzFdLCAxMCk7XG4gICAgICAgICAgICBpZiAodmVyID4gMzcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNpbXVsY2FzdFNlbmRlciA9IG5ldyBOYXRpdmVTaW11bGNhc3RTZW5kZXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaW11bGNhc3RTZW5kZXIgPSBuZXcgTm9TaW11bGNhc3RTZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2ltdWxjYXN0U2VuZGVyID0gbmV3IE5vU2ltdWxjYXN0U2VuZGVyKCk7XG4gICAgICAgIH1cblxuICAgIH1cbn1cblxuLyoqXG4gKiBSZXN0b3JlcyB0aGUgc2ltdWxjYXN0IGdyb3VwcyBvZiB0aGUgcmVtb3RlIGRlc2NyaXB0aW9uLiBJblxuICogdHJhbnNmb3JtUmVtb3RlRGVzY3JpcHRpb24gd2UgcmVtb3ZlIHRob3NlIGluIG9yZGVyIGZvciB0aGUgc2V0IHJlbW90ZVxuICogZGVzY3JpcHRpb24gdG8gc3VjY2VlZC4gVGhlIGZvY3VzIG5lZWRzIHRoZSBzaWduYWwgdGhlIGdyb3VwcyB0byBuZXdcbiAqIHBhcnRpY2lwYW50cy5cbiAqXG4gKiBAcGFyYW0gZGVzY1xuICogQHJldHVybnMgeyp9XG4gKi9cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLnJldmVyc2VUcmFuc2Zvcm1SZW1vdGVEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgcmV0dXJuIHRoaXMuc2ltdWxjYXN0UmVjZWl2ZXIucmV2ZXJzZVRyYW5zZm9ybVJlbW90ZURlc2NyaXB0aW9uKGRlc2MpO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBzc3JjLWdyb3VwOlNJTSBmcm9tIHRoZSByZW1vdGUgZGVzY3JpcHRpb24gYmFjYXVzZSBDaHJvbWVcbiAqIGVpdGhlciBnZXRzIGNvbmZ1c2VkIGFuZCB0aGlua3MgdGhpcyBpcyBhbiBGSUQgZ3JvdXAgb3IsIGlmIGFuIEZJRCBncm91cFxuICogaXMgYWxyZWFkeSBwcmVzZW50LCBpdCBmYWlscyB0byBzZXQgdGhlIHJlbW90ZSBkZXNjcmlwdGlvbi5cbiAqXG4gKiBAcGFyYW0gZGVzY1xuICogQHJldHVybnMgeyp9XG4gKi9cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLnRyYW5zZm9ybVJlbW90ZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RSZWNlaXZlci50cmFuc2Zvcm1SZW1vdGVEZXNjcmlwdGlvbihkZXNjKTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgZnVsbHkgcXVhbGlmaWVkIG1zaWQgKHN0cmVhbS5pZCArIHRyYWNrLmlkKSBhc3NvY2lhdGVkIHRvIHRoZVxuICogU1NSQy5cbiAqXG4gKiBAcGFyYW0gc3NyY1xuICogQHJldHVybnMgeyp9XG4gKi9cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLmdldFJlbW90ZVZpZGVvU3RyZWFtSWRCeVNTUkMgPSBmdW5jdGlvbiAoc3NyYykge1xuICAgIHJldHVybiB0aGlzLnNpbXVsY2FzdFJlY2VpdmVyLmdldFJlbW90ZVZpZGVvU3RyZWFtSWRCeVNTUkMoc3NyYyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBzdHJlYW0gd2l0aCBzaW5nbGUgdmlkZW8gdHJhY2ssIHRoZSBvbmUgY3VycmVudGx5IGJlaW5nXG4gKiByZWNlaXZlZCBieSB0aGlzIGVuZHBvaW50LlxuICpcbiAqIEBwYXJhbSBzdHJlYW0gdGhlIHJlbW90ZSBzaW11bGNhc3Qgc3RyZWFtLlxuICogQHJldHVybnMge3dlYmtpdE1lZGlhU3RyZWFtfVxuICovXG5TaW11bGNhc3RNYW5hZ2VyLnByb3RvdHlwZS5nZXRSZWNlaXZpbmdWaWRlb1N0cmVhbSA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RSZWNlaXZlci5nZXRSZWNlaXZpbmdWaWRlb1N0cmVhbShzdHJlYW0pO1xufTtcblxuLyoqXG4gKlxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUudHJhbnNmb3JtTG9jYWxEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgcmV0dXJuIHRoaXMuc2ltdWxjYXN0U2VuZGVyLnRyYW5zZm9ybUxvY2FsRGVzY3JpcHRpb24oZGVzYyk7XG59O1xuXG4vKipcbiAqXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUuZ2V0TG9jYWxWaWRlb1N0cmVhbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNpbXVsY2FzdFNlbmRlci5nZXRMb2NhbFZpZGVvU3RyZWFtKCk7XG59O1xuXG4vKipcbiAqIEdVTSBmb3Igc2ltdWxjYXN0LlxuICpcbiAqIEBwYXJhbSBjb25zdHJhaW50c1xuICogQHBhcmFtIHN1Y2Nlc3NcbiAqIEBwYXJhbSBlcnJcbiAqL1xuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUuZ2V0VXNlck1lZGlhID0gZnVuY3Rpb24gKGNvbnN0cmFpbnRzLCBzdWNjZXNzLCBlcnIpIHtcblxuICAgIHRoaXMuc2ltdWxjYXN0U2VuZGVyLmdldFVzZXJNZWRpYShjb25zdHJhaW50cywgc3VjY2VzcywgZXJyKTtcbn07XG5cbi8qKlxuICogUHJlcGFyZXMgdGhlIGxvY2FsIGRlc2NyaXB0aW9uIGZvciBwdWJsaWMgdXNhZ2UgKGkuZS4gdG8gYmUgc2lnbmFsZWRcbiAqIHRocm91Z2ggSmluZ2xlIHRvIHRoZSBmb2N1cykuXG4gKlxuICogQHBhcmFtIGRlc2NcbiAqIEByZXR1cm5zIHtSVENTZXNzaW9uRGVzY3JpcHRpb259XG4gKi9cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLnJldmVyc2VUcmFuc2Zvcm1Mb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RTZW5kZXIucmV2ZXJzZVRyYW5zZm9ybUxvY2FsRGVzY3JpcHRpb24oZGVzYyk7XG59O1xuXG4vKipcbiAqIEVuc3VyZXMgdGhhdCB0aGUgc2ltdWxjYXN0IGdyb3VwIGlzIHByZXNlbnQgaW4gdGhlIGFuc3dlciwgX2lmXyBuYXRpdmVcbiAqIHNpbXVsY2FzdCBpcyBlbmFibGVkLFxuICpcbiAqIEBwYXJhbSBkZXNjXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUudHJhbnNmb3JtQW5zd2VyID0gZnVuY3Rpb24gKGRlc2MpIHtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RTZW5kZXIudHJhbnNmb3JtQW5zd2VyKGRlc2MpO1xufTtcblxuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUuZ2V0UmVjZWl2aW5nU1NSQyA9IGZ1bmN0aW9uIChqaWQpIHtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RSZWNlaXZlci5nZXRSZWNlaXZpbmdTU1JDKGppZCk7XG59O1xuXG5TaW11bGNhc3RNYW5hZ2VyLnByb3RvdHlwZS5nZXRSZWNlaXZpbmdWaWRlb1N0cmVhbUJ5U1NSQyA9IGZ1bmN0aW9uIChtc2lkKSB7XG4gICAgcmV0dXJuIHRoaXMuc2ltdWxjYXN0UmVjZWl2ZXIuZ2V0UmVjZWl2aW5nVmlkZW9TdHJlYW1CeVNTUkMobXNpZCk7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gbGluZXNcbiAqIEBwYXJhbSBtZWRpYXR5cGVzXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUucGFyc2VNZWRpYSA9IGZ1bmN0aW9uKGxpbmVzLCBtZWRpYXR5cGVzKSB7XG4gICAgdmFyIHNiID0gbGluZXMuc2RwLnNwbGl0KCdcXHJcXG4nKTtcbiAgICByZXR1cm4gdGhpcy5zaW11bGNhc3RVdGlscy5wYXJzZU1lZGlhKHNiLCBtZWRpYXR5cGVzKTtcbn07XG5cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLl9zZXRSZWNlaXZpbmdWaWRlb1N0cmVhbSA9IGZ1bmN0aW9uKHJlc291cmNlLCBzc3JjKSB7XG4gICAgdGhpcy5zaW11bGNhc3RSZWNlaXZlci5fc2V0UmVjZWl2aW5nVmlkZW9TdHJlYW0ocmVzb3VyY2UsIHNzcmMpO1xufTtcblxuU2ltdWxjYXN0TWFuYWdlci5wcm90b3R5cGUuX3NldExvY2FsVmlkZW9TdHJlYW1FbmFibGVkID0gZnVuY3Rpb24oc3NyYywgZW5hYmxlZCkge1xuICAgIHRoaXMuc2ltdWxjYXN0U2VuZGVyLl9zZXRMb2NhbFZpZGVvU3RyZWFtRW5hYmxlZChzc3JjLCBlbmFibGVkKTtcbn07XG5cblNpbXVsY2FzdE1hbmFnZXIucHJvdG90eXBlLnJlc2V0U2VuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnNpbXVsY2FzdFNlbmRlci5yZXNldCA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgIHRoaXMuc2ltdWxjYXN0U2VuZGVyLnJlc2V0KCk7XG4gICAgfVxufTtcblxuJChkb2N1bWVudCkuYmluZCgnc2ltdWxjYXN0bGF5ZXJzY2hhbmdlZCcsIGZ1bmN0aW9uIChldmVudCwgZW5kcG9pbnRTaW11bGNhc3RMYXllcnMpIHtcbiAgICBlbmRwb2ludFNpbXVsY2FzdExheWVycy5mb3JFYWNoKGZ1bmN0aW9uIChlc2wpIHtcbiAgICAgICAgdmFyIHNzcmMgPSBlc2wuc2ltdWxjYXN0TGF5ZXIucHJpbWFyeVNTUkM7XG4gICAgICAgIHNpbXVsY2FzdC5fc2V0UmVjZWl2aW5nVmlkZW9TdHJlYW0oZXNsLmVuZHBvaW50LCBzc3JjKTtcbiAgICB9KTtcbn0pO1xuXG4kKGRvY3VtZW50KS5iaW5kKCdzdGFydHNpbXVsY2FzdGxheWVyJywgZnVuY3Rpb24gKGV2ZW50LCBzaW11bGNhc3RMYXllcikge1xuICAgIHZhciBzc3JjID0gc2ltdWxjYXN0TGF5ZXIucHJpbWFyeVNTUkM7XG4gICAgc2ltdWxjYXN0Ll9zZXRMb2NhbFZpZGVvU3RyZWFtRW5hYmxlZChzc3JjLCB0cnVlKTtcbn0pO1xuXG4kKGRvY3VtZW50KS5iaW5kKCdzdG9wc2ltdWxjYXN0bGF5ZXInLCBmdW5jdGlvbiAoZXZlbnQsIHNpbXVsY2FzdExheWVyKSB7XG4gICAgdmFyIHNzcmMgPSBzaW11bGNhc3RMYXllci5wcmltYXJ5U1NSQztcbiAgICBzaW11bGNhc3QuX3NldExvY2FsVmlkZW9TdHJlYW1FbmFibGVkKHNzcmMsIGZhbHNlKTtcbn0pO1xuXG5cbnZhciBzaW11bGNhc3QgPSBuZXcgU2ltdWxjYXN0TWFuYWdlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXVsY2FzdDsiXX0=
