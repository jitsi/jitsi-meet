import { IJitsiConference } from './reducer';

/**
 * Prepares an explicitly requested native encrypted conference before MUC join.
 * This first integration is limited to JVB with VP8 video and Opus audio.
 *
 * @param {Object} conference - The conference created by the SDK.
 * @returns {Promise<void>|undefined} The native key acknowledgement, if requested.
 */
export function prepareNativeE2EE(conference: IJitsiConference): Promise<void> | undefined {
    const config = conference.options.config;

    if (config?.e2ee?.nativeManaged !== true) {
        return;
    }

    return Promise.resolve().then(async () => {
        const codecs = config.videoQuality?.mobileCodecPreferenceOrder;

        if (!Array.isArray(codecs) || codecs.length !== 1 || typeof codecs[0] !== 'string'
                || codecs[0].toUpperCase() !== 'VP8' || config.p2p?.enabled !== false
                || config.disableSimulcast !== true) {
            throw new Error('Native managed E2EE requires JVB, VP8-only mobile video and simulcast disabled');
        }
        if (!conference.isE2EESupported() || typeof conference.setE2EEEnabled !== 'function') {
            throw new Error('Native managed E2EE is unavailable');
        }

        // lib-jitsi-meet waits for the native sender key acknowledgement here.
        // No application-supplied key or conference interception is involved.
        await conference.setE2EEEnabled(true);
    });
}
