// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

let loadRnnoisePromise;

/**
 * Returns promise that resolves with a RnnoiseProcessor instance.
 *
 * @returns {Promise<RnnoiseProcessor>} - Resolves with the blur effect instance.
 */
export function createRnnoiseProcessorPromise() {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createRnnoiseProcessor) {
        return ns.effects.createRnnoiseProcessor();
    }

    // Subsequent calls should not attempt to load the script multiple times.
    if (!loadRnnoisePromise) {
        loadRnnoisePromise = loadScript('libs/rnnoise-processor.min.js');
    }

    return loadRnnoisePromise.then(() => ns.effects.createRnnoiseProcessor());
}

/**
 * Get the accepted sample length for the rnnoise library. We might want to expose it with flow libdefs.
 *
 * @returns {number}
 */
export function getSampleLength() {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.RNNOISE_SAMPLE_LENGTH) {
        return ns.effects.RNNOISE_SAMPLE_LENGTH;
    }

    throw new Error('Please call createRnnoiseProcessorPromise first or wait for promise to resolve!');

}
