// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the crop person effect instance.
 *
 * @returns {Promise<JitsiStreamCropPersonEffect>} - Resolves with the crop person effect instance.
 */
export function getCropPersonEffect(stream) {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createCropPersonEffect) {
        return ns.effects.createCropPersonEffect(stream);
    }

    return loadScript('libs/video-blur-effect.min.js').then(() => ns.effects.createCropPersonEffect(stream));
}
