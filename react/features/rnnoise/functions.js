// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

let loadRnnoisePromise;

/**
 * Returns promise that resolves with a RnnoiseProcessor instance.
 *
 * @returns {Promise<RnnoiseProcessor>} - Resolves with the blur effect instance.
 */
export function createRnnoiseProcessorPromise() {
    // Subsequent calls should not attempt to load the script multiple times.
    if (!loadRnnoisePromise) {
        loadRnnoisePromise = loadScript('libs/rnnoise-processor.min.js');
    }

    return loadRnnoisePromise.then(() => {
        const ns = getJitsiMeetGlobalNS();

        if (ns?.effects?.rnnoise?.createRnnoiseProcessor) {
            return ns.effects.rnnoise.createRnnoiseProcessor();
        }

        throw new Error('Rnnoise module binding createRnnoiseProcessor not found!');
    });
}

/**
 * Get the accepted sample length for the rnnoise library. We might want to expose it with flow libdefs.
 *
 * @returns {number}
 */
export function getSampleLength() {
    const ns = getJitsiMeetGlobalNS();

    const rnnoiseSample = ns?.effects?.rnnoise?.RNNOISE_SAMPLE_LENGTH;

    if (!rnnoiseSample) {
        throw new Error('Please call createRnnoiseProcessorPromise first or wait for promise to resolve!');
    }

    return rnnoiseSample;
}
