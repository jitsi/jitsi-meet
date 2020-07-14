import rtcstatsInit from 'rtcstats/rtcstats';
import traceInit from 'rtcstats/trace-ws';

import {
    createRTCStatsTraceCloseEvent,
    sendAnalytics
} from '../analytics';

import logger from './logger';

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
        this.handleTraceWSClose = this.handleTraceWSClose.bind(this);
        this.trace = traceInit(options.rtcstatsEndpoint, this.handleTraceWSClose);
        rtcstatsInit(this.trace, options.rtcstatsPollInterval, [ '' ], connectionFilter);
        this.initialized = true;
    }

    /**
     * Check whether or not the RTCStats is initialized.
     *
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
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

    /**
     * The way rtcstats is currently designed the ws wouldn't normally be closed by the application logic but rather
     * by the page being closed/reloaded. Using this assumption any onclose event is most likely something abnormal
     * that happened on the ws. We then track this in order to determine how many rtcstats connection were closed
     * prematurely.
     *
     * @param {Object} closeEvent - Event sent by ws onclose.
     * @returns {void}
     */
    handleTraceWSClose(closeEvent) {
        logger.info('RTCStats trace ws closed', closeEvent);

        sendAnalytics(createRTCStatsTraceCloseEvent(closeEvent));
    }
}

export default new RTCStats();
