/* global APP, JitsiMeetJS */
const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * This class represents the receiver party for a remote controller session.
 * It handles "remote-control-event" events and sends them to the
 * API module. From there the events can be received from wrapper application
 * and executed.
 */
class Receiver {
    /**
     * Creates new instance.
     * @constructor
     */
    constructor() {}

    /**
     * Attaches listener for ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED events.
     */
    start() {
        APP.conference.addConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._onRemoteControlEvent);
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
        if(event.type === "remote-control-event")
            APP.API.sendRemoteControlEvent(event.event);
    }
}

export default new Receiver();
