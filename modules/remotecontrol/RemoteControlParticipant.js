/* @flow */

import EventEmitter from 'events';
import { getLogger } from 'jitsi-meet-logger';

import {
    REMOTE_CONTROL_MESSAGE_NAME
} from '../../service/remotecontrol/Constants';

const logger = getLogger(__filename);

declare var APP: Object;

/**
 * Implements common logic for Receiver class and Controller class.
 */
export default class RemoteControlParticipant extends EventEmitter {
    _enabled: boolean;

    /**
     * Creates new instance.
     */
    constructor() {
        super();
        this._enabled = false;
    }

    /**
     * Enables / Disables the remote control.
     *
     * @param {boolean} enabled - The new state.
     * @returns {void}
     */
    enable(enabled: boolean) {
        this._enabled = enabled;
    }

    /**
     * Sends remote control message to other participant trough data channel.
     *
     * @param {string} to - The participant who will receive the event.
     * @param {RemoteControlEvent} event - The remote control event.
     * @param {Function} onDataChannelFail - Handler for data channel failure.
     * @returns {void}
     */
    sendRemoteControlEndpointMessage(
            to: ?string,
            event: Object,
            onDataChannelFail: ?Function) {
        if (!this._enabled || !to) {
            logger.warn(
                'Remote control: Skip sending remote control event. Params:',
                this.enable,
                to);

            return;
        }
        try {
            APP.conference.sendEndpointMessage(to, {
                name: REMOTE_CONTROL_MESSAGE_NAME,
                ...event
            });
        } catch (e) {
            logger.error(
                'Failed to send EndpointMessage via the datachannels',
                e);
            if (typeof onDataChannelFail === 'function') {
                onDataChannelFail(e);
            }
        }
    }
}
