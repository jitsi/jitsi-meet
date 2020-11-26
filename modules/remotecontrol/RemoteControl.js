/* @flow */

import EventEmitter from 'events';
import { getLogger } from 'jitsi-meet-logger';

import JitsiMeetJS from '../../react/features/base/lib-jitsi-meet';
import { DISCO_REMOTE_CONTROL_FEATURE }
    from '../../service/remotecontrol/Constants';
import * as RemoteControlEvents
    from '../../service/remotecontrol/RemoteControlEvents';

import Controller from './Controller';
import Receiver from './Receiver';

const logger = getLogger(__filename);

declare var APP: Object;
declare var config: Object;

/**
 * Implements the remote control functionality.
 */
class RemoteControl extends EventEmitter {
    _active: boolean;
    _initialized: boolean;
    controller: Controller;
    receiver: Receiver;

    /**
     * Constructs new instance. Creates controller and receiver properties.
     */
    constructor() {
        super();
        this.controller = new Controller();
        this._active = false;
        this._initialized = false;

        this.controller.on(RemoteControlEvents.ACTIVE_CHANGED, active => {
            this.active = active;
        });
    }

    /**
     * Sets the remote control session active status.
     *
     * @param {boolean} isActive - True - if the controller or the receiver is
     * currently in remote control session and false otherwise.
     * @returns {void}
     */
    set active(isActive: boolean) {
        this._active = isActive;
        this.emit(RemoteControlEvents.ACTIVE_CHANGED, isActive);
    }

    /**
     * Returns the remote control session active status.
     *
     * @returns {boolean} - True - if the controller or the receiver is
     * currently in remote control session and false otherwise.
     */
    get active(): boolean {
        return this._active;
    }

    /**
     * Initializes the remote control - checks if the remote control should be
     * enabled or not.
     *
     * @returns {void}
     */
    init() {
        if (config.disableRemoteControl || this._initialized || !JitsiMeetJS.isDesktopSharingEnabled()) {
            return;
        }
        logger.log('Initializing remote control.');
        this._initialized = true;
        this.controller.enable(true);
        this.receiver = new Receiver();

        this.receiver.on(RemoteControlEvents.ACTIVE_CHANGED, active => {
            this.active = active;
        });
    }

    /**
     * Checks whether the passed user supports remote control or not.
     *
     * @param {JitsiParticipant} user - The user to be tested.
     * @returns {Promise<boolean>} The promise will be resolved with true if
     * the user supports remote control and with false if not.
     */
    checkUserRemoteControlSupport(user: Object) {
        return user.getFeatures()
            .then(features => features.has(DISCO_REMOTE_CONTROL_FEATURE));
    }
}

export default new RemoteControl();
