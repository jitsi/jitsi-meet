// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the presenter effect instance.
 *
 * @returns {Promise<JitsiStreamPresenterEffect>} - Resolves with the presenter effect instance.
 */
export function getPresenterEffect(stream) {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createPresenterEffect) {
        return ns.effects.createPresenterEffect(stream);
    }

    return loadScript('libs/video-blur-effect.min.js').then(() => ns.effects.createPresenterEffect(stream));
}
