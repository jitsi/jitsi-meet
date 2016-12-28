/* global APP, JitsiMeetJS */
import {DISCO_REMOTE_CONTROL_FEATURE, REMOTE_CONTROL_EVENT_TYPE, EVENT_TYPES,
    PERMISSIONS_ACTIONS} from "../../service/remotecontrol/Constants";
import RemoteControlParticipant from "./RemoteControlParticipant";

const ConferenceEvents = JitsiMeetJS.events.conference;

/**
 * This class represents the receiver party for a remote controller session.
 * It handles "remote-control-event" events and sends them to the
 * API module. From there the events can be received from wrapper application
 * and executed.
 */
export default class Receiver extends RemoteControlParticipant {
    /**
     * Creates new instance.
     * @constructor
     */
    constructor() {
        super();
        this.controller = null;
        this._remoteControlEventsListener
            = this._onRemoteControlEvent.bind(this);
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
            APP.conference.addConferenceListener(
                ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
                this._remoteControlEventsListener);
        }
    }

    /**
     * Removes the listener for ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED
     * events.
     */
    stop() {
        APP.conference.removeConferenceListener(
            ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            this._remoteControlEventsListener);
        const event = {
            type: EVENT_TYPES.stop
        };
        this._sendRemoteControlEvent(this.controller, event);
        this.controller = null;
        APP.API.sendRemoteControlEvent(event);
    }

    /**
     * Sends "remote-control-event" events to to the API module.
     * @param {JitsiParticipant} participant the controller participant
     * @param {Object} event the remote control event.
     */
    _onRemoteControlEvent(participant, event) {
        if(this.enabled && event.type === REMOTE_CONTROL_EVENT_TYPE) {
            const remoteControlEvent = event.event;
            if(this.controller === null
                && remoteControlEvent.type === EVENT_TYPES.permissions
                && remoteControlEvent.action === PERMISSIONS_ACTIONS.request) {
                remoteControlEvent.userId = participant.getId();
                remoteControlEvent.userJID = participant.getJid();
                remoteControlEvent.displayName = participant.getDisplayName();
            } else if(this.controller !== participant.getId()) {
                return;
            }
            APP.API.sendRemoteControlEvent(remoteControlEvent);
        }
    }

    /**
     * Handles remote control permission events received from the API module.
     * @param {String} userId the user id of the participant related to the
     * event.
     * @param {PERMISSIONS_ACTIONS} action the action related to the event.
     */
    _onRemoteControlPermissionsEvent(userId, action) {
        if(action === PERMISSIONS_ACTIONS.grant) {
            this.controller = userId;
        }
        this._sendRemoteControlEvent(userId, {
            type: EVENT_TYPES.permissions,
            action: action
        });
    }
}
