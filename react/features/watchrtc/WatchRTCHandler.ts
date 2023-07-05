
/* eslint-disable lines-around-comment */
// @ts-expect-error
import watchRTC from '@testrtc/watchrtc-sdk';
/* eslint-enable lines-around-comment */

import { IWatchRTCConfiguration } from '../base/config/configType';

import logger from './logger';

/**
 * Class that controls the watchRTC flow, because it overwrites and proxies global function it should only be
 * initialized once.
 */
class WatchRTCHandler {

    /**
     * Initialize watchRTC, it overwrites GUM and PeerConnection global functions and adds a proxy over them
     * used to capture stats. Note, lib-jitsi-meet takes references to these methods before initializing so
     * the init method needs to be loaded before it does.
     *
     * @param {Object} options - WatchRTC configuration options.
     * @returns {void}
     */
    init(options: IWatchRTCConfiguration) {
        watchRTC.init(options);
        logger.info('WatchRTC initialized');
    }
}

export default new WatchRTCHandler();
