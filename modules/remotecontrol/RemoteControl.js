/* global APP, config */
import { DISCO_REMOTE_CONTROL_FEATURE }
    from '../../service/remotecontrol/Constants';

import Controller from './Controller';
import Receiver from './Receiver';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Implements the remote control functionality.
 */
class RemoteControl {
    /**
     * Constructs new instance. Creates controller and receiver properties.
     * @constructor
     */
    constructor() {
        this.controller = new Controller();
        this.initialized = false;
    }

    /**
     * Initializes the remote control - checks if the remote control should be
     * enabled or not.
     */
    init() {
        if(config.disableRemoteControl || this.initialized
            || !APP.conference.isDesktopSharingEnabled) {
            return;
        }
        logger.log("Initializing remote control.");
        this.initialized = true;
        this.controller.enable(true);
        this.receiver = new Receiver();
    }

    /**
     * Checks whether the passed user supports remote control or not
     * @param {JitsiParticipant} user the user to be tested
     * @returns {Promise<boolean>} the promise will be resolved with true if
     * the user supports remote control and with false if not.
     */
    checkUserRemoteControlSupport(user) {
        return user.getFeatures().then(features =>
            features.has(DISCO_REMOTE_CONTROL_FEATURE), () => false
        );
    }
}

export default new RemoteControl();
