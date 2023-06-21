
/* eslint-disable lines-around-comment */
// @ts-expect-error
import watchRTC from '@testrtc/watchrtc-sdk';
/* eslint-enable lines-around-comment */

import logger from './logger';
import { IWatchRTCConfiguration } from '../base/config/configType';

/**
 * Class that controls the watchRTC flow, because it overwrites and proxies global function it should only be
 * initialized once.
 */
class watchRTCHandler {
    options?: IWatchRTCConfiguration;
    isPeerConnectionWrapped = false;

    /**
     * Initialize watchRTC, it overwrites GUM and PeerConnection global functions and adds a proxy over them used to capture stats.
     * Note, lib-jitsi-meet takes references to these methods before initializing so the init method needs to be
     * loaded before it does.
     *
     * @param {Object} options - watchRTC configuration options
     * @returns {void}
     */
    init(options: IWatchRTCConfiguration) {
        if (!this.isPeerConnectionWrapped) {
            watchRTC.init(options);
            logger.info("WatchRTC initialized");
            this.isPeerConnectionWrapped = true;
        } else {
            logger.warn("WatchRTC peerconnection was already wrapped");
        }
        this.options = options;
    }

    /**
     * Check whether or not the watchRTC is initialized.
     *
     * @returns {boolean}
     */
    isInitialized() {
        return this.options !== undefined;
    }
}

export default new watchRTCHandler();
