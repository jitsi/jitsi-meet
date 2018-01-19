import bowser from 'bowser';

import capabilitiesDB from './capabilities.json';

/**
 * API for checking the capabilities for Jitsi Meet for the current browser.
 */
export default class BrowserCapabilities {
    /**
     * Creates new BrowserCapabilities instance.
     *
     * @param {boolean} [isUsingIFrame] - True if Jitsi Meet is loaded in iframe
     * and false otherwise.
     * @param {Object} [browserInfo] - Information about the browser.
     * @param {string} browserInfo.name - The name of the browser.
     * @param {string} browserInfo.version - The version of the browser.
     */
    constructor(isUsingIFrame = false, browserInfo = {
        name: bowser.name,
        version: bowser.version
    }) {
        this.browserInfo = browserInfo;
        const browserCapabilities = capabilitiesDB[this.browserInfo.name] || [];

        const capabilitiesByVersion = browserCapabilities.find(entry =>
            !entry.version || bowser.compareVersions([
                this.browserInfo.version,
                entry.version
            ]) !== 1
        );

        if (!capabilitiesByVersion || !capabilitiesByVersion.capabilities) {
            this.capabilities = { isSupported: false };
        } else if (isUsingIFrame) {
            this.capabilities = {
                ...capabilitiesByVersion.capabilities,
                ...capabilitiesByVersion.iframeCapabilities
            };
        } else {
            this.capabilities = capabilitiesByVersion.capabilities;
        }

        if (typeof this.capabilities.isSupported === 'undefined') {
            // we have some capabilities but isSupported property is not filled.
            this.capabilities.isSupported = true;
        }
    }

    /**
     * Checks whether the browser is supported by Jitsi Meet.
     *
     * @returns {boolean}
     */
    isSupported() {
        return this.capabilities.isSupported;
    }

    /**
     * Checks whether the browser supports incoming audio.
     *
     * @returns {boolean}
     */
    supportsAudioIn() {
        return this.capabilities.audioIn || false;
    }

    /**
     * Checks whether the browser supports outgoing audio.
     *
     * @returns {boolean}
     */
    supportsAudioOut() {
        return this.capabilities.audioOut || false;
    }

    /**
     * Checks whether the browser supports video.
     *
     * @returns {boolean}
     */
    supportsVideo() {
        return this.capabilities.video || false;
    }

    /**
     * Checks whether the browser supports screen sharing.
     *
     * @returns {boolean}
     */
    supportsScreenSharing() {
        return this.capabilities.screenSharing || false;
    }
}
