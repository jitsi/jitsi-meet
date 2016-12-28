/* global APP, config */
import Controller from "./Controller";
import Receiver from "./Receiver";
import {EVENT_TYPES}
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
        if(config.disableRemoteControl || this.initialized) {
            return;
        }
        this.initialized = true;
        APP.API.init({
            forceEnable: true,
        });
        this.controller.enable(true);
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
}

export default new RemoteControl();
