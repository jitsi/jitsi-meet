import traceInit from 'rtcstats/trace-ws';
import rtcstatsInit from 'rtcstats/rtcstats';

/**
 * TODO - Comment.
 */
class RTCStats {
    /**
     * TODO - Comment.
     *
     * @param {*} options - TODO Comment.
     * @returns {void}
     */
    init(options) {
        this.trace = traceInit(options.rtcServerAddress);

        // TODO What happens if rtcstats is initialized multiple times but the window object isn't refreshed
        // Could happen in the case of apps which use the iframe api.
        rtcstatsInit(this.trace, options.pollInterval, [ '', 'webkit', 'moz' ]);
    }

    /**
     * TODO - Comment.
     *
     * @param {Object} identityData - TODO Comment.
     * @returns {void}
     */
    sendIdentityData(identityData) {
        this.trace('identity', null, identityData);
    }

    /**
     * TODO - Comment.
     *
     * @returns {void}
     */
    connect() {
        this.trace.connect();
    }

    /**
     * TODO - Comment.
     *
     * @returns {void}
     */
    close() {
        this.trace.close();
    }
}

export default new RTCStats();
