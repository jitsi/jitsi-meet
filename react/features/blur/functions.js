// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the blur effect instance.
 *
 * @returns {Promise<JitsiStreamBlurEffect>} - Resolves with the blur effect instance.
 */
export function getBlurEffect() {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createBlurEffect) {
        return ns.effects.createBlurEffect();
    }

    return loadScript('libs/video-blur-effect.min.js').then(() => ns.effects.createBlurEffect());
}
