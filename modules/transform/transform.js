var transform = require('sdp-transform');

exports.write = function(session, opts) {

    if (typeof session !== 'undefined' &&
        typeof session.media !== 'undefined' &&
        Array.isArray(session.media)) {

        session.media.forEach(function (mLine) {
            // expand sources to ssrcs
            if (typeof mLine.sources !== 'undefined' &&
                Object.keys(mLine.sources).length !== 0) {
                mLine.ssrcs = [];
                Object.keys(mLine.sources).forEach(function (ssrc) {
                    var source = mLine.sources[ssrc];
                    Object.keys(source).forEach(function (attribute) {
                        mLine.ssrcs.push({
                            id: ssrc,
                            attribute: attribute,
                            value: source[attribute]
                        });
                    });
                });
                delete mLine.sources;
            }

            // join ssrcs in ssrc groups
            if (typeof mLine.ssrcGroups !== 'undefined' &&
                Array.isArray(mLine.ssrcGroups)) {
                mLine.ssrcGroups.forEach(function (ssrcGroup) {
                    if (typeof ssrcGroup.ssrcs !== 'undefined' &&
                        Array.isArray(ssrcGroup.ssrcs)) {
                        ssrcGroup.ssrcs = ssrcGroup.ssrcs.join(' ');
                    }
                });
            }
        });
    }

    // join group mids
    if (typeof session !== 'undefined' &&
        typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

        session.groups.forEach(function (g) {
            if (typeof g.mids !== 'undefined' && Array.isArray(g.mids)) {
                g.mids = g.mids.join(' ');
            }
        });
    }

    return transform.write(session, opts);
};

exports.parse = function(sdp) {
    var session = transform.parse(sdp);

    if (typeof session !== 'undefined' && typeof session.media !== 'undefined' &&
        Array.isArray(session.media)) {

        session.media.forEach(function (mLine) {
            // group sources attributes by ssrc
            if (typeof mLine.ssrcs !== 'undefined' && Array.isArray(mLine.ssrcs)) {
                mLine.sources = {};
                mLine.ssrcs.forEach(function (ssrc) {
                    if (!mLine.sources[ssrc.id])
                        mLine.sources[ssrc.id] = {};
                    mLine.sources[ssrc.id][ssrc.attribute] = ssrc.value;
                });

                delete mLine.ssrcs;
            }

            // split ssrcs in ssrc groups
            if (typeof mLine.ssrcGroups !== 'undefined' &&
                Array.isArray(mLine.ssrcGroups)) {
                mLine.ssrcGroups.forEach(function (ssrcGroup) {
                    if (typeof ssrcGroup.ssrcs === 'string') {
                        ssrcGroup.ssrcs = ssrcGroup.ssrcs.split(' ');
                    }
                });
            }
        });
    }
    // split group mids
    if (typeof session !== 'undefined' &&
        typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

        session.groups.forEach(function (g) {
            if (typeof g.mids === 'string') {
                g.mids = g.mids.split(' ');
            }
        });
    }

    return session;
};

