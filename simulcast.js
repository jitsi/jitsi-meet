/*jslint plusplus: true */
/*jslint nomen: true*/

/**
 * Created by gp on 11/08/14.
 */
function Simulcast() {
    "use strict";

    // TODO(gp) we need a logging framework for javascript à la log4j or the
    // java logging framework that allows for selective log display
    this.debugLvl = 0;
}

Simulcast.prototype = {

    // global state for all transformers.
    localExplosionMap: {},
    localVideoSourceCache: '',
    remoteVideoSourceCache: '',
    remoteMaps: {
        msid2Quality: {},
        ssrc2Msid: {},
        receivingVideoStreams: {}
    },
    localMaps: {
        msids: [],
        msid2ssrc: {}
    },
    emptyCompoundIndex: {},

    _generateGuid: (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    }()),

    _cacheLocalVideoSources: function (lines) {
        this.localVideoSourceCache = this._getVideoSources(lines);
    },

    _restoreLocalVideoSources: function (lines) {
        this._replaceVideoSources(lines, this.localVideoSourceCache);
    },

    _cacheRemoteVideoSources: function (lines) {
        this.remoteVideoSourceCache = this._getVideoSources(lines);
    },

    _restoreRemoteVideoSources: function (lines) {
        this._replaceVideoSources(lines, this.remoteVideoSourceCache);
    },

    _replaceVideoSources: function (lines, videoSources) {

        var i, inVideo = false, index = -1, howMany = 0;

        if (this.debugLvl) {
            console.info('Replacing video sources...');
        }

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

    },

    _getVideoSources: function (lines) {
        var i, inVideo = false, sb = [];

        if (this.debugLvl) {
            console.info('Getting video sources...');
        }

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
    },

    _parseMedia: function (lines, mediatypes) {
        var i, res = [], type, cur_media, idx, ssrcs, cur_ssrc, ssrc,
            ssrc_attribute, group, semantics, skip;

        if (this.debugLvl) {
            console.info('Parsing media sources...');
        }

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
    },

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() gives a non-uniform distribution!
    _generateRandomSSRC: function () {
        var min = 0, max = 0xffffffff;
        return Math.floor(Math.random() * (max - min)) + min;
    },


    /**
     * The _indexOfArray() method returns the first a CompoundIndex at which a
     * given element can be found in the array, or emptyCompoundIndex if it is
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
    _indexOfArray: function (needle, haystack, start) {
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
        return this.emptyCompoundIndex;
    },

    _removeSimulcastGroup: function (lines) {
        var i;

        for (i = lines.length - 1; i >= 0; i--) {
            if (lines[i].indexOf('a=ssrc-group:SIM') !== -1) {
                lines.splice(i, 1);
            }
        }
    },

    /**
     * Produces a single stream with multiple tracks for local video sources.
     *
     * @param lines
     * @private
     */
    _explodeLocalSimulcastSources: function (lines) {
        var sb, msid, sid, tid, videoSources, self;

        if (this.debugLvl) {
            console.info('Exploding local video sources...');
        }

        videoSources = this._parseMedia(lines, ['video'])[0];

        self = this;
        if (videoSources.groups && videoSources.groups.length !== 0) {
            videoSources.groups.forEach(function (group) {
                if (group.semantics === 'SIM') {
                    group.ssrcs.forEach(function (ssrc) {

                        // Get the msid for this ssrc..
                        if (self.localExplosionMap[ssrc]) {
                            // .. either from the explosion map..
                            msid = self.localExplosionMap[ssrc];
                        } else {
                            // .. or generate a new one (msid).
                            sid = videoSources.sources[ssrc].msid
                                .substring(0, videoSources.sources[ssrc].msid.indexOf(' '));

                            tid = self._generateGuid();
                            msid = [sid, tid].join(' ');
                            self.localExplosionMap[ssrc] = msid;
                        }

                        // Assign it to the source object.
                        videoSources.sources[ssrc].msid = msid;

                        // TODO(gp) Change the msid of associated sources.
                    });
                }
            });
        }

        sb = this._compileVideoSources(videoSources);

        this._replaceVideoSources(lines, sb);
    },

    /**
     * Groups local video sources together in the ssrc-group:SIM group.
     *
     * @param lines
     * @private
     */
    _groupLocalVideoSources: function (lines) {
        var sb, videoSources, ssrcs = [], ssrc;

        if (this.debugLvl) {
            console.info('Grouping local video sources...');
        }

        videoSources = this._parseMedia(lines, ['video'])[0];

        for (ssrc in videoSources.sources) {
            // jitsi-meet destroys/creates streams at various places causing
            // the original local stream ids to change. The only thing that
            // remains unchanged is the trackid.
            this.localMaps.msid2ssrc[videoSources.sources[ssrc].msid.split(' ')[1]] = ssrc;
        }

        var self = this;
        // TODO(gp) add only "free" sources.
        this.localMaps.msids.forEach(function (msid) {
            ssrcs.push(self.localMaps.msid2ssrc[msid]);
        });

        if (!videoSources.groups) {
            videoSources.groups = [];
        }

        videoSources.groups.push({
            'semantics': 'SIM',
            'ssrcs': ssrcs
        });

        sb = this._compileVideoSources(videoSources);

        this._replaceVideoSources(lines, sb);
    },

    _appendSimulcastGroup: function (lines) {
        var videoSources, ssrcGroup, simSSRC, numOfSubs = 2, i, sb, msid;

        if (this.debugLvl) {
            console.info('Appending simulcast group...');
        }

        // Get the primary SSRC information.
        videoSources = this._parseMedia(lines, ['video'])[0];

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

            if (this.debugLvl) {
                console.info(['Generated substream ', i, ' with SSRC ', simSSRC, '.'].join(''));
            }
        }

        // Add the group sim layers.
        sb.splice(0, 0, ssrcGroup.join(' '))

        this._replaceVideoSources(lines, sb);
    },

// Does the actual patching.
    _ensureSimulcastGroup: function (lines) {
        if (this.debugLvl) {
            console.info('Ensuring simulcast group...');
        }

        if (this._indexOfArray('a=ssrc-group:SIM', lines) === this.emptyCompoundIndex) {
            this._appendSimulcastGroup(lines);
            this._cacheLocalVideoSources(lines);
        } else {
            // verify that the ssrcs participating in the SIM group are present
            // in the SDP (needed for presence).
            this._restoreLocalVideoSources(lines);
        }
    },

    _ensureGoogConference: function (lines) {
        var sb;
        if (this.debugLvl) {
            console.info('Ensuring x-google-conference flag...')
        }

        if (this._indexOfArray('a=x-google-flag:conference', lines) === this.emptyCompoundIndex) {
            // Add the google conference flag
            sb = this._getVideoSources(lines);
            sb = ['a=x-google-flag:conference'].concat(sb);
            this._replaceVideoSources(lines, sb);
        }
    },

    _compileVideoSources: function (videoSources) {
        var sb = [], ssrc, addedSSRCs = [];

        if (this.debugLvl) {
            console.info('Compiling video sources...');
        }

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
    },


    _restoreSimulcastGroups: function (sb) {
        this._restoreRemoteVideoSources(sb);
    },

    /**
     * Restores the simulcast groups of the remote description. In
     * transformRemoteDescription we remove those in order for the set remote
     * description to succeed. The focus needs the signal the groups to new
     * participants.
     *
     * @param desc
     * @returns {*}
     */
    reverseTransformRemoteDescription: function (desc) {
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
    },


    _ensureOrder: function (lines) {
        var videoSources, sb;

        videoSources = this._parseMedia(lines, ['video'])[0];
        sb = this._compileVideoSources(videoSources);

        this._replaceVideoSources(lines, sb);
    },

    _updateRemoteMaps: function (lines) {
        var remoteVideoSources = this._parseMedia(lines, ['video'])[0],
            videoSource, quality;

        // (re) initialize the remote maps.
        this.remoteMaps.msid2Quality = {};
        this.remoteMaps.ssrc2Msid = {};

        var self = this;
        if (remoteVideoSources.groups && remoteVideoSources.groups.length !== 0) {
            remoteVideoSources.groups.forEach(function (group) {
                if (group.semantics === 'SIM' && group.ssrcs && group.ssrcs.length !== 0) {
                    quality = 0;
                    group.ssrcs.forEach(function (ssrc) {
                        videoSource = remoteVideoSources.sources[ssrc];
                        self.remoteMaps.msid2Quality[videoSource.msid] = quality++;
                        self.remoteMaps.ssrc2Msid[videoSource.ssrc] = videoSource.msid;
                    });
                }
            });
        }
    },

    _setReceivingVideoStream: function (endpoint, ssrc) {
        this.remoteMaps.receivingVideoStreams[endpoint] = ssrc;
    },

    /**
     * Returns a stream with single video track, the one currently being
     * received by this endpoint.
     *
     * @param stream the remote simulcast stream.
     * @returns {webkitMediaStream}
     */
    getReceivingVideoStream: function (stream) {
        var tracks, i, electedTrack, msid, quality = 0, receivingTrackId;

        var self = this;
        if (config.enableSimulcast) {

            stream.getVideoTracks().some(function (track) {
                return Object.keys(self.remoteMaps.receivingVideoStreams).some(function (endpoint) {
                    var ssrc = self.remoteMaps.receivingVideoStreams[endpoint];
                    var msid = self.remoteMaps.ssrc2Msid[ssrc];
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
                    if (this.remoteMaps.msid2Quality[msid] === quality) {
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
    },

    localStream: null, displayedLocalVideoStream: null,

    /**
     * Gets the fully qualified msid (stream.id + track.id) associated to the
     * SSRC.
     *
     * @param ssrc
     * @returns {*}
     */
    getRemoteVideoStreamIdBySSRC: function (ssrc) {
        return this.remoteMaps.ssrc2Msid[ssrc];
    },

    parseMedia: function (desc, mediatypes) {
        var lines = desc.sdp.split('\r\n');
        return this._parseMedia(lines, mediatypes);
    },

    getLocalVideoStream: function () {
        return (this.displayedLocalVideoStream != null)
            ? this.displayedLocalVideoStream
            // in case we have no simulcast at all, i.e. we didn't perform the GUM
            : connection.jingle.localVideo;
    }
};


function NativeSimulcast() {
    Simulcast.call(this); // call the super constructor.
}

NativeSimulcast.prototype = Object.create(Simulcast.prototype);

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NativeSimulcast.prototype.getUserMedia = function (constraints, success, err) {

    // There's nothing special to do for native simulcast, so just do a normal GUM.

    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {

        // reset local maps.
        self.localMaps.msids = [];
        self.localMaps.msid2ssrc = {};

        // add hq stream to local map
        self.localMaps.msids.push(hqStream.getVideoTracks()[0].id);
        self.displayedLocalVideoStream = self.localStream = hqStream;
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
NativeSimulcast.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!desc || desc == null) {
        return desc;
    }

    if (config.enableSimulcast) {
        sb = desc.sdp.split('\r\n');

        this._explodeLocalSimulcastSources(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Exploded local video sources');
            console.info(desc.sdp);
        }
    }

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcast.prototype.transformAnswer = function (desc) {
    if (config.enableSimulcast) {

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

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Transformed answer');
            console.info(desc.sdp);
        }
    }

    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcast.prototype.transformLocalDescription = function (desc) {
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
NativeSimulcast.prototype.transformRemoteDescription = function (desc) {
    if (config.enableSimulcast) {

        var sb = desc.sdp.split('\r\n');

        this._updateRemoteMaps(sb);
        this._cacheRemoteVideoSources(sb);
        this._removeSimulcastGroup(sb); // NOTE(gp) this needs to be called after updateRemoteMaps because we need the simulcast group in the _updateRemoteMaps() method.
        // We don't need the goog conference flag if we're not doing
        // native simulcast.
        this._ensureGoogConference(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Transformed remote description');
            console.info(desc.sdp);
        }
    }

    return desc;
};

NativeSimulcast.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    // Nothing to do here, native simulcast does that auto-magically.
};

NativeSimulcast.prototype.constructor = NativeSimulcast;

function GrumpySimulcast() {
    Simulcast.call(this);
}

GrumpySimulcast.prototype = Object.create(Simulcast.prototype);

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
GrumpySimulcast.prototype.getUserMedia = function (constraints, success, err) {

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

    console.log('HQ constraints: ', constraints);
    console.log('LQ constraints: ', lqConstraints);

    if (config.enableSimulcast) {

        // NOTE(gp) if we request the lq stream first webkitGetUserMedia
        // fails randomly. Tested with Chrome 37. As fippo suggested, the
        // reason appears to be that Chrome only acquires the cam once and
        // then downscales the picture (https://code.google.com/p/chromium/issues/detail?id=346616#c11)

        var self = this;
        navigator.webkitGetUserMedia(constraints, function (hqStream) {

            self.localStream = hqStream;

            // reset local maps.
            self.localMaps.msids = [];
            self.localMaps.msid2ssrc = {};

            // add hq trackid to local map
            self.localMaps.msids.push(hqStream.getVideoTracks()[0].id);

            navigator.webkitGetUserMedia(lqConstraints, function (lqStream) {

                self.displayedLocalVideoStream = lqStream;

                // NOTE(gp) The specification says Array.forEach() will visit
                // the array elements in numeric order, and that it doesn't
                // visit elements that don't exist.

                // add lq trackid to local map
                self.localMaps.msids.splice(0, 0, lqStream.getVideoTracks()[0].id);

                self.localStream.addTrack(lqStream.getVideoTracks()[0]);
                success(self.localStream);
            }, err);
        }, err);
    }
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
GrumpySimulcast.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!desc || desc == null) {
        return desc;
    }

    if (config.enableSimulcast) {


        sb = desc.sdp.split('\r\n');

        this._groupLocalVideoSources(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Grouped local video sources');
            console.info(desc.sdp);
        }
    }

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
GrumpySimulcast.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
GrumpySimulcast.prototype.transformLocalDescription = function (desc) {
    if (config.enableSimulcast) {

        var sb = desc.sdp.split('\r\n');

        this._removeSimulcastGroup(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Transformed local description');
            console.info(desc.sdp);
        }
    }

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
GrumpySimulcast.prototype.transformRemoteDescription = function (desc) {
    if (config.enableSimulcast) {

        var sb = desc.sdp.split('\r\n');

        this._updateRemoteMaps(sb);
        this._cacheRemoteVideoSources(sb);
        this._removeSimulcastGroup(sb); // NOTE(gp) this needs to be called after updateRemoteMaps because we need the simulcast group in the _updateRemoteMaps() method.

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        if (this.debugLvl && this.debugLvl > 1) {
            console.info('Transformed remote description');
            console.info(desc.sdp);
        }
    }

    return desc;
};

GrumpySimulcast.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    var trackid;

    var self = this;
    console.log(['Requested to', enabled ? 'enable' : 'disable', ssrc].join(' '));
    if (Object.keys(this.localMaps.msid2ssrc).some(function (tid) {
        // Search for the track id that corresponds to the ssrc
        if (self.localMaps.msid2ssrc[tid] == ssrc) {
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
        console.log([trackid, enabled ? 'enabled' : 'disabled'].join(' '));
        $(document).trigger(enabled
            ? 'simulcastlayerstarted'
            : 'simulcastlayerstopped');
    } else {
        console.error("I don't have a local stream with SSRC " + ssrc);
    }
};

GrumpySimulcast.prototype.constructor = GrumpySimulcast;

function NoSimulcast() {
    Simulcast.call(this);
}

NoSimulcast.prototype = Object.create(Simulcast.prototype);

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NoSimulcast.prototype.getUserMedia = function (constraints, success, err) {
    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {

        // reset local maps.
        self.localMaps.msids = [];
        self.localMaps.msid2ssrc = {};

        // add hq stream to local map
        self.localMaps.msids.push(hqStream.getVideoTracks()[0].id);
        self.displayedLocalVideoStream = self.localStream = hqStream;
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
NoSimulcast.prototype.reverseTransformLocalDescription = function (desc) {
    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NoSimulcast.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NoSimulcast.prototype.transformLocalDescription = function (desc) {
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
NoSimulcast.prototype.transformRemoteDescription = function (desc) {
    return desc;
};

NoSimulcast.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {

};

NoSimulcast.prototype.constructor = NoSimulcast;

// Initialize simulcast.
var simulcast;
if (!config.enableSimulcast) {
    simulcast = new NoSimulcast();
} else {

    var isChromium = window.chrome,
        vendorName = window.navigator.vendor;
    if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc.") {
        var ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
        if (ver > 37) {
            simulcast = new NativeSimulcast();
        } else {
            simulcast = new NoSimulcast();
        }
    } else {
        simulcast = new NoSimulcast();
    }

}

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