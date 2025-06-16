/* eslint-disable lines-around-comment */
import {
    PC_CON_STATE_CHANGE,
    PC_STATE_CONNECTED,
    PC_STATE_FAILED
    // @ts-expect-error
} from '@jitsi/rtcstats/events';

import JitsiMeetJS, { RTCStatsEvents } from '../base/lib-jitsi-meet';

import logger from './logger';
import {
    DominantSpeakerData,
    E2ERTTData,
    FaceLandmarksData,
    VideoTypeData
} from './types';

/**
 * Handle lib-jitsi-meet rtcstats events and send jitsi-meet specific statistics.
 */
class RTCStats {
    private _connStateEvents: Array<any> = [];
    private _initialized = false;

    /**
     * Handles rtcstats events.
     *
     * @returns {void}
     */
    init() {
        this._connStateEvents = [];

        if (!this._initialized) {
            JitsiMeetJS.rtcstats.on(
                RTCStatsEvents.RTC_STATS_PC_EVENT,
                (pcEvent: any) => this.handleRTCStatsEvent(pcEvent));
            this._initialized = true;
        }
    }

    /**
     * Send console logs to rtcstats server.
     *
     * @param {Array<string|any>} logEntries - The log entries to send to the rtcstats server.
     * @returns {void}
     */
    sendLogs(logEntries: Array<string | any>) {
        JitsiMeetJS.rtcstats.sendStatsEntry('logs', logEntries);
    }

    /**
     * Send dominant speaker data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} dominantSpeakerData - Dominant speaker data to be saved in the rtcstats dump.
     * @returns {void}
     */
    sendDominantSpeakerData(dominantSpeakerData: DominantSpeakerData) {
        JitsiMeetJS.rtcstats.sendStatsEntry('dominantSpeaker', dominantSpeakerData);
    }

    /**
     * Send e2e rtt data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} e2eRttData - The object that holds the e2e data.
     * @returns {void}
     */
    sendE2ERTTData(e2eRttData: E2ERTTData) {
        JitsiMeetJS.rtcstats.sendStatsEntry('e2eRtt', e2eRttData);
    }

    /**
     * Send identity data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} identityData - The object that holds the identity data.
     * @returns {void}
     */
    sendIdentityData(identityData: Object) {
        JitsiMeetJS.rtcstats.sendIdentityEntry(identityData);
    }

    /**
     * Send the timestamp of the start of the conference, the data will be processed by the rtcstats-server
     * and saved in the dump file.
     *
     * @param {Object} timestamp - The object which contains the timestamp.
     * @returns {void}
     */
    sendConferenceTimestamp(timestamp: number) {
        JitsiMeetJS.rtcstats.sendStatsEntry('conferenceStartTimestamp', timestamp);
    }

    /**
     * Send videoType data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} videoTypeData - The object that holds the videoType data.
     * @returns {void}
     */
    sendVideoTypeData(videoTypeData: VideoTypeData) {
        JitsiMeetJS.rtcstats.sendStatsEntry('setVideoType', videoTypeData);
    }

    /**
     * Send face landmarks data, the data will be processed by rtcstats-server and saved in the dump file.
     *
     * @param {Object} faceLandmarksData - Face landmarks data to be saved in the rtcstats dump.
     * @returns {void}
     */
    sendFaceLandmarksData(faceLandmarksData: FaceLandmarksData) {
        JitsiMeetJS.rtcstats.sendStatsEntry('faceLandmarks', faceLandmarksData);
    }

    /**
     * RTCStats client can notify the APP of any PeerConnection related event that occurs.
     *
     * @param {Object} event - The PeerConnection event.
     * @param {string} event.type - The event type.
     * @param {Object} event.body - Event body.
     * @param {string} event.body.isP2P - PeerConnection type.
     * @param {string} event.body.state - PeerConnection state change which triggered the event.
     * @returns {void}
     */
    handleRTCStatsEvent(event: any) {
        switch (event.type) {
        case PC_CON_STATE_CHANGE: {
            const { body: { isP2P = null, state = null } } = event;

            this._connStateEvents.push(event.body);

            // We only report PC related connection issues. If the rtcstats websocket is not connected at this point
            // it usually means that none of our services can be reached i.e. there's problem with the internet
            // connection and not necessarily with reaching the JVB (due to a firewall or other reasons).
            if (state === PC_STATE_FAILED) {
                const connectionType = isP2P ? 'P2P' : 'JVB';
                const wasConnected = this._connStateEvents.some((connectionEvent: { isP2P: any; state: string; }) =>
                    (connectionEvent.isP2P === isP2P) && (connectionEvent.state === PC_STATE_CONNECTED));

                logger.info(`${connectionType} PeerConnection failed, previously connected: ${wasConnected}`);

                if (typeof APP !== 'undefined') {
                    APP.API.notifyPeerConnectionFailure(isP2P, wasConnected);
                }
            }

            break;
        }
        }
    }
}

export default new RTCStats();
