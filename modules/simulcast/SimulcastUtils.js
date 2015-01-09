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