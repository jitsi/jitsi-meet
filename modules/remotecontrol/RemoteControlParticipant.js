/* global APP */
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
     * @param {Object} event the remote control event.
     * @param {Function} onDataChannelFail handler for data channel failure.
     */
    _sendRemoteControlEvent(to, event, onDataChannelFail = () => {}) {
        if(!this.enabled || !to)
            return;
        try{
            APP.conference.sendEndpointMessage(to,
                {type: REMOTE_CONTROL_EVENT_TYPE, event});
        } catch (e) {
            onDataChannelFail(e);
        }
    }
}
