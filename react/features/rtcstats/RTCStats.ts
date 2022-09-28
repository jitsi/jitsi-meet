/* eslint-disable import/order */
// @ts-ignore
import rtcstatsInit from '@jitsi/rtcstats/rtcstats';

// @ts-ignore
import traceInit from '@jitsi/rtcstats/trace-ws';

import { createRTCStatsTraceCloseEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';

import logger from './logger';
import {
    DominantSpeakerData,
    E2ERTTData,
    FaceLandmarksData,
    InitOptions,
    VideoTypeData
} from './types';

/**
 * Filter out RTCPeerConnection that are created by callstats.io.
 *
 * @param {*} config - Config object sent to the PC c'tor.
 * @returns {boolean}
 */
function connectionFilter(config: any) {
    if (config?.iceServers[0] && config.iceServers[0].urls) {
        for (const iceUrl of config.iceServers[0].urls) {
            if (iceUrl.indexOf('callstats.io') >= 0) {
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
    trace: any;
    initialized = false;

    /**
     * Initialize the rtcstats components. First off we initialize the trace, which is a wrapped websocket
     * that does the actual communication with the server. Secondly, the rtcstats component is initialized,
     * it overwrites GUM and PeerConnection global functions and adds a proxy over them used to capture stats.
     * Note, lib-jitsi-meet takes references to these methods before initializing so the init method needs to be
     * loaded before it does.
     *
     * @param {Object} options -.
     * @param {string} options.endpoint - The Amplitude app key required.
     * @param {string} options.meetingFqn - The meeting fqn.
     * @param {boolean} options.useLegacy - Switch to legacy chrome webrtc statistics. Parameter will only have
     * an effect on chrome based applications.
     * @param {number} options.pollInterval - The getstats poll interval in ms.
     * @param {boolean} options.sendSdp - Determines if the client sends SDP to the rtcstats server.
     * @returns {void}
     */
    init(options: InitOptions) {

        const { endpoint, meetingFqn, useLegacy, pollInterval, sendSdp } = options;

        const traceOptions = {
            endpoint,
            meetingFqn,
            onCloseCallback: this.handleTraceWSClose.bind(this),
            useLegacy
        };

        const rtcstatsOptions = {
            connectionFilter,
            pollInterval,
            useLegacy,
            sendSdp
        };

        this.trace = traceInit(traceOptions);
        rtcstatsInit(this.trace, rtcstatsOptions);
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
     * @param {any} identityData - Metadata object to send as identity.
     * @returns {void}
     */
    sendIdentityData(identityData: any) {
        this.trace?.identity('identity', null, identityData);
    }

    /**
     * Send console logs to rtcstats server.
     *
     * @param {Array<string|any>} logEntries - The log entries to send to the rtcstats server.
     * @returns {void}
     */
    sendLogs(logEntries: Array<string | any>) {
        this.trace?.statsEntry('logs', null, logEntries);
    }

    /**
     * Send dominant speaker data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} dominantSpeakerData - Dominant speaker data to be saved in the rtcstats dump.
     * @returns {void}
     */
    sendDominantSpeakerData(dominantSpeakerData: DominantSpeakerData) {
        this.trace?.statsEntry('dominantSpeaker', null, dominantSpeakerData);
    }

    /**
     * Send e2e rtt data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} e2eRttData - The object that holds the e2e data.
     * @returns {void}
     */
    sendE2eRttData(e2eRttData: E2ERTTData) {
        this.trace?.statsEntry('e2eRtt', null, e2eRttData);
    }

    /**
     * Send the timestamp of the start of the conference, the data will be processed by the rtcstats-server
     * and saved in the dump file.
     *
     * @param {Object} timestamp - The object which contains the timestamp.
     * @returns {void}
     */
    sendConferenceTimestamp(timestamp: number) {
        this.trace?.statsEntry('conferenceStartTimestamp', null, timestamp);
    }

    /**
     * Send videoType data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} videoTypeData - The object that holds the videoType data.
     * @returns {void}
     */
    sendVideoTypeData(videoTypeData: VideoTypeData) {
        this.trace?.statsEntry('setVideoType', null, videoTypeData);
    }

    /**
     * Send face landmarks data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} faceLandmarksData - Face landmarks data to be saved in the rtcstats dump.
     * @returns {void}
     */
    sendFaceLandmarksData(faceLandmarksData: FaceLandmarksData) {
        this.trace?.statsEntry('faceLandmarks', null, faceLandmarksData);
    }

    /**
     * Connect to the rtcstats server instance. Stats (data obtained from getstats) won't be send until the
     * connect successfully initializes, however calls to GUM are recorded in an internal buffer even if not
     * connected and sent once it is established.
     *
     * @param {boolean} isBreakoutRoom - Flag indicating if the user is in a breakout room.
     * @returns {void}
     */
    connect(isBreakoutRoom: boolean) {
        this.trace?.connect(isBreakoutRoom);
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
        this.trace?.close();
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
    handleTraceWSClose(closeEvent: any) {
        logger.info('RTCStats trace ws closed', closeEvent);

        sendAnalytics(createRTCStatsTraceCloseEvent(closeEvent));
    }
}

export default new RTCStats();
