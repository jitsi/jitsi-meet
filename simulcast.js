/*jslint plusplus: true */
/*jslint nomen: true*/

/**
 *
 * @constructor
 */
function SimulcastUtils() {
    this.logger = new SimulcastLogger("SimulcastUtils");
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
        ssrc_attribute, group, semantics, skip;

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

            cur_media.direction = lines[i].substring('a='.length, 8);
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

function SimulcastReceiver() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastReceiver');
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

    if (!desc || desc == null) {
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
    if (!ssrc && connection.jingle) {
        var session;
        var i, j, k;

        var keys = Object.keys(connection.jingle.sessions);
        for (i = 0; i < keys.length; i++) {
            var sid = keys[i];

            if (ssrc) {
                // stream found, stop.
                break;
            }

            session = connection.jingle.sessions[sid];
            if (session.remoteStreams) {
                for (j = 0; j < session.remoteStreams.length; j++) {
                    var remoteStream = session.remoteStreams[j];

                    if (ssrc) {
                        // stream found, stop.
                        break;
                    }
                    var tracks = remoteStream.getVideoTracks();
                    if (tracks) {
                        for (k = 0; k < tracks.length; k++) {
                            var track = tracks[k];
                            var msid = [remoteStream.id, track.id].join(' ');
                            var _ssrc = this._remoteMaps.msid2ssrc[msid];
                            var _jid = ssrc2jid[_ssrc];
                            var quality = this._remoteMaps.msid2Quality[msid];
                            if (jid == _jid && quality == 0) {
                                ssrc = _ssrc;
                                // stream found, stop.
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    return ssrc;
};

SimulcastReceiver.prototype.getReceivingVideoStreamBySSRC = function (ssrc)
{
    var session, electedStream;
    var i, j, k;
    if (connection.jingle) {
        var keys = Object.keys(connection.jingle.sessions);
        for (i = 0; i < keys.length; i++) {
            var sid = keys[i];

            if (electedStream) {
                // stream found, stop.
                break;
            }

            session = connection.jingle.sessions[sid];
            if (session.remoteStreams) {
                for (j = 0; j < session.remoteStreams.length; j++) {
                    var remoteStream = session.remoteStreams[j];

                    if (electedStream) {
                        // stream found, stop.
                        break;
                    }
                    var tracks = remoteStream.getVideoTracks();
                    if (tracks) {
                        for (k = 0; k < tracks.length; k++) {
                            var track = tracks[k];
                            var msid = [remoteStream.id, track.id].join(' ');
                            var tmp = this._remoteMaps.msid2ssrc[msid];
                            if (tmp == ssrc) {
                                electedStream = new webkitMediaStream([track]);
                                // stream found, stop.
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    return {
        session: session,
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

function SimulcastSender() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastSender');
}

SimulcastSender.prototype._localVideoSourceCache = '';
SimulcastSender.prototype.localStream = null;
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

SimulcastSender.prototype._cacheLocalVideoSources = function (lines) {
    this._localVideoSourceCache = this.simulcastUtils._getVideoSources(lines);
};

SimulcastSender.prototype._restoreLocalVideoSources = function (lines) {
    this.simulcastUtils._replaceVideoSources(lines, this._localVideoSourceCache);
};

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() gives a non-uniform distribution!
SimulcastSender.prototype._generateRandomSSRC = function () {
    var min = 0, max = 0xffffffff;
    return Math.floor(Math.random() * (max - min)) + min;
};

SimulcastSender.prototype._appendSimulcastGroup = function (lines) {
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
SimulcastSender.prototype._ensureSimulcastGroup = function (lines) {

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

SimulcastSender.prototype.getLocalVideoStream = function () {
    return (this.displayedLocalVideoStream != null)
        ? this.displayedLocalVideoStream
        // in case we have no simulcast at all, i.e. we didn't perform the GUM
        : connection.jingle.localVideo;
};

function NativeSimulcastSender() {
    SimulcastSender.call(this); // call the super constructor.
}

NativeSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

NativeSimulcastSender.prototype._localExplosionMap = {};

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

    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        self.localStream = hqStream;
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

    if (!desc || desc == null) {
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

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastReceiver.prototype.transformRemoteDescription = function (desc) {

    var sb = desc.sdp.split('\r\n');

    this._updateRemoteMaps(sb);
    this._cacheRemoteVideoSources(sb);

    // NOTE(gp) this needs to be called after updateRemoteMaps because we need the simulcast group in the _updateRemoteMaps() method.
    this.simulcastUtils._removeSimulcastGroup(sb);

    // We don't need the goog conference flag if we're not doing native
    // simulcast, but at the receiver, we have no idea if the sender is
    // doing native or not-native simulcast.
    this._ensureGoogConference(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine(['Transformed remote description', desc.sdp].join(' '));

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

    if (!desc || desc == null) {
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
    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        self.localStream = hqStream;
        success(self.localStream);
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

/**
 *
 * @constructor
 */
function SimulcastLogger(name) {
    this.name = name;
}

SimulcastLogger.prototype.log = function (text) {
    console.log(text);
};

SimulcastLogger.prototype.info = function (text) {
    console.info(text);
};

SimulcastLogger.prototype.fine = function (text) {
    console.log(text);
};

SimulcastLogger.prototype.error = function (text) {
    console.error(text);
};

var simulcast = new SimulcastManager();

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