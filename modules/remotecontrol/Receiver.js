/* global APP, JitsiMeetJS */
import {DISCO_REMOTE_CONTROL_FEATURE, API_EVENT_TYPE}
    from "../../service/remotecontrol/Constants";

const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * This class represents the receiver party for a remote controller session.
 * It handles "remote-control-event" events and sends them to the
 * API module. From there the events can be received from wrapper application
 * and executed.
 */
export default class Receiver {
    /**
     * Creates new instance.
     * @constructor
     */
    constructor() {
        this.enabled = false;
    }

    /**
     * Enables / Disables the remote control
     * @param {boolean} enabled the new state.
     */
    enable(enabled) {
        if(this.enabled !== enabled && enabled === true) {
            this.enabled = enabled;
            // Announce remote control support.
            APP.connection.addFeature(DISCO_REMOTE_CONTROL_FEATURE, true);
        }
    }

    /**
     * Attaches listener for ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED events.
     */
    start() {
        if(this.enabled) {
            APP.conference.addConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._onRemoteControlEvent);
        }
    }

    /**
     * Removes the listener for ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED
     * events.
     */
    stop() {
        APP.conference.removeConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._onRemoteControlEvent);
    }

    /**
     * Sends "remote-control-event" events to to the API module.
     * @param {JitsiParticipant} participant the controller participant
     * @param {Object} event the remote control event.
     */
    _onRemoteControlEvent(participant, event) {
        if(event.type === API_EVENT_TYPE && this.enabled)
            APP.API.sendRemoteControlEvent(event.event);
    }
}
