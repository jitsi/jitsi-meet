import rtcstatsInit from 'rtcstats/rtcstats';
import traceInit from 'rtcstats/trace-ws';

/**
 * Filter out RTCPeerConnection that are created by callstats.io.
 *
 * @param {*} config - Config object sent to the PC c'tor.
 * @returns {boolean}
 */
function connectionFilter(config) {
    if (config && config.iceServers[0] && config.iceServers[0].urls) {
        for (const iceUrl of config.iceServers[0].urls) {
            if (iceUrl.indexOf('taas.callstats.io') >= 0) {
                return true;
            }
        }
    }
}

/**
 * Class that controls the rtcstats flow, because it overwrites and proxies global function it should only be
 * initialized once.
 */
class RTCStats {
    /**
     * Initialize the rtcstats components. First off we initialize the trace, which is a wrapped websocket
     * that does the actual communication with the server. Secondly, the rtcstats component is initialized,
     * it overwrites GUM and PeerConnection global functions and adds a proxy over them used to capture stats.
     * Note, lib-jitsi-meet takes references to these methods before initializing so the init method needs to be
     * loaded before it does.
     *
     * @param {Object} options -.
     * @param {string} options.rtcstatsEndpoint - The Amplitude app key required.
     * @param {number} options.rtcstatsPollInterval - The getstats poll interval in ms.
     * @returns {void}
     */
    init(options) {
        this.trace = traceInit(options.rtcstatsEndpoint);
        rtcstatsInit(this.trace, options.rtcstatsPollInterval, [ '', 'webkit', 'moz' ], connectionFilter);
    }

    /**
     * Send identity data to rtcstats server, this will be reflected in the identity section of the stats dump.
     * It can be generally used to send additional metadata that might be relevant such as amplitude user data
     * or deployment specific information.
     *
     * @param {Object} identityData - Metadata object to send as identity.
     * @returns {void}
     */
    sendIdentityData(identityData) {
        this.trace && this.trace('identity', null, identityData);
    }

    /**
     * Connect to the rtcstats server instance. Stats (data obtained from getstats) won't be send until the
     * connect successfully initializes, however calls to GUM are recorded in an internal buffer even if not
     * connected and sent once it is established.
     *
     * @returns {void}
     */
    connect() {
        this.trace && this.trace.connect();
    }

    /**
     * Self explanatory; closes the web socked connection.
     * Note, at the point of writing this documentation there was no method to reset the function overwrites,
     * thus even if the websocket is closed the global function proxies are still active but send no data,
     * this shouldn't influence the normal flow of the application.
     *
     * @returns {void}
     */
    close() {
        this.trace && this.trace.close();
    }
}

export default new RTCStats();
