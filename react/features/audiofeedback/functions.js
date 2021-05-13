// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';
import { getLogger } from 'jitsi-meet-logger';

let loadAudiofeedback;
const logger = getLogger(__filename);
/**
 * Returns promise that resolves with a AudiofeedbackDetector instance.
 *
 * @returns {Promise<AudioFeedbackDetector>} - Resolves with the blur effect instance.
 */
export function createAudiofeedback() {
    // Subsequent calls should not attempt to load the script multiple times.
    if (!loadAudiofeedback) {
        loadAudiofeedback = loadScript('libs/audiofeedback.min.js');
    }

    return loadAudiofeedback.then(() => {
        const ns = getJitsiMeetGlobalNS();

        logger.info("loaded audiofeedback.min")

        if (ns?.effects?.audiofeedback?.createAudioFeedbackDetector) {

            logger.info("createAudioFeedbackDetector exists...");

            return ns.effects.audiofeedback.createAudioFeedbackDetector();
        }

        throw new Error('audiofeedback module binding createAudioFeedbackDetector not found!');
    });
}