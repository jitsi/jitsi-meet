/* global APP */
const logger = require("jitsi-meet-logger").getLogger(__filename);
import {REMOTE_CONTROL_EVENT_TYPE}
    from "../../service/remotecontrol/Constants";

export default class RemoteControlParticipant {
    /**
     * Creates new instance.
     */
    constructor() {
        this.enabled = false;
    }

    /**
     * Enables / Disables the remote control
     * @param {boolean} enabled the new state.
     */
    enable(enabled) {
        this.enabled = enabled;
    }

    /**
     * Sends remote control event to other participant trough data channel.
     * @param {RemoteControlEvent} event the remote control event.
     * @param {Function} onDataChannelFail handler for data channel failure.
     */
    _sendRemoteControlEvent(to, event, onDataChannelFail = () => {}) {
        if(!this.enabled || !to) {
            logger.warn("Remote control: Skip sending remote control event."
                + " Params:", this.enable, to);
            return;
        }
        try{
            APP.conference.sendEndpointMessage(to,
                {type: REMOTE_CONTROL_EVENT_TYPE, event});
        } catch (e) {
            logger.error("Failed to send EndpointMessage via the datachannels",
                e);
            onDataChannelFail(e);
        }
    }
}
