/* global APP, config */
import Controller from "./Controller";
import Receiver from "./Receiver";
import {EVENT_TYPES, DISCO_REMOTE_CONTROL_FEATURE}
    from "../../service/remotecontrol/Constants";

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
        this.receiver = new Receiver();
        this.enabled = false;
        this.initialized = false;
    }

    /**
     * Initializes the remote control - checks if the remote control should be
     * enabled or not, initializes the API module.
     */
    init() {
        if(config.disableRemoteControl || this.initialized
            || !APP.conference.isDesktopSharingEnabled) {
            return;
        }
        this.initialized = true;
        APP.API.init({
            forceEnable: true,
        });
        this.controller.enable(true);
        if(this.enabled) { // supported message came before init.
            this._onRemoteControlSupported();
        }
    }

    /**
     * Handles remote control events from the API module.
     * @param {object} event the remote control event
     */
    onRemoteControlAPIEvent(event) {
        switch(event.type) {
            case EVENT_TYPES.supported:
                this._onRemoteControlSupported();
                break;
            case EVENT_TYPES.permissions:
                this.receiver._onRemoteControlPermissionsEvent(
                    event.userId, event.action);
                break;
        }
    }

    /**
     * Handles API event for support for executing remote control events into
     * the wrapper application.
     */
    _onRemoteControlSupported() {
        if(!config.disableRemoteControl) {
            this.enabled = true;
            if(this.initialized) {
                this.receiver.enable(true);
            }
        }
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
