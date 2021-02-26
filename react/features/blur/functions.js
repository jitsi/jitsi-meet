// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

let filterSupport;

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

/**
 * Checks context filter support.
 *
 * @returns {boolean} True if the filter is supported and false if the filter is not supported by the browser.
 */
export function checkBlurSupport() {
    if (typeof filterSupport === 'undefined') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        filterSupport = typeof ctx.filter !== 'undefined';

        canvas.remove();
    }

    return filterSupport;
}
