/* @flow */

import { getLogger } from 'jitsi-meet-logger';

import { DISCO_REMOTE_CONTROL_FEATURE }
    from '../../service/remotecontrol/Constants';

import Controller from './Controller';
import Receiver from './Receiver';

const logger = getLogger(__filename);

declare var APP: Object;
declare var config: Object;

/**
 * Implements the remote control functionality.
 */
class RemoteControl {
    _initialized: boolean;
    controller: Controller;
    receiver: Receiver;

    /**
     * Constructs new instance. Creates controller and receiver properties.
     */
    constructor() {
        this.controller = new Controller();
        this._initialized = false;
    }

    /**
     * Initializes the remote control - checks if the remote control should be
     * enabled or not.
     *
     * @returns {void}
     */
    init() {
        if (config.disableRemoteControl
                || this._initialized
                || !APP.conference.isDesktopSharingEnabled) {
            return;
        }
        logger.log('Initializing remote control.');
        this._initialized = true;
        this.controller.enable(true);
        this.receiver = new Receiver();
    }

    /**
     * Checks whether the passed user supports remote control or not.
     *
     * @param {JitsiParticipant} user - The user to be tested.
     * @returns {Promise<boolean>} The promise will be resolved with true if
     * the user supports remote control and with false if not.
     */
    checkUserRemoteControlSupport(user: Object) {
        return user.getFeatures().then(
            features => features.has(DISCO_REMOTE_CONTROL_FEATURE),
            () => false);
    }
}

export default new RemoteControl();
