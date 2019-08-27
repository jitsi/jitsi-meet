// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the blur effect instance.
 *
 * @returns {Promise<JitsiStreamBlurEffect>} - Resolves with the blur effect instance.
 */
export function createRnnoiseProcessorPromise() {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createRnnoiseProcessor) {
        return ns.effects.createRnnoiseProcessor();
    }

    return loadScript('libs/rnnoise-processor.min.js').then(() => ns.effects.createRnnoiseProcessor());
}
