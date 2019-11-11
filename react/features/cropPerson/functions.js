// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the crop person effect instance.
 *
 * @param {MediaStream} stream - The video stream on which crop effect is applied.
 * @returns {Promise<JitsiStreamCropPersonEffect>} - Resolves with the crop
 * person effect instance.
 */
export function getCropPersonEffect(stream: MediaStream) {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createCropPersonEffect) {
        return ns.effects.createCropPersonEffect(stream);
    }

    return loadScript('libs/tensorflow-effects.min.js')
        .then(() => ns.effects.createCropPersonEffect(stream));
}
