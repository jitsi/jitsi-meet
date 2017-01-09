/* global APP, config */
import Controller from "./Controller";
import Receiver from "./Receiver";

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
     * Handles API event for support for executing remote control events into
     * the wrapper application.
     * @param {boolean} isSupported true if the receiver side is supported by
     * the wrapper application.
     */
    onRemoteControlSupported(isSupported) {
        if(isSupported && !config.disableRemoteControl) {
            this.enabled = true;
            if(this.initialized) {
                this.receiver.enable(true);
            }
        }
    }
}

export default new RemoteControl();
