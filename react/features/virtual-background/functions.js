// @flow

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

let filterSupport;

/**
 * Returns promise that resolves with the blur effect instance.
 *
 * @param {Object} virtualBackground - The virtual object that contains the background image source and
 * the isVirtualBackground flag that indicates if virtual image is activated .
 * @returns {Promise<JitsiStreamBackgroundEffect>} - Resolves with the background effect instance.
 */
export function getBackgroundEffect(virtualBackground: Object) {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createVirtualBackgroundEffect) {
        return ns.effects.createVirtualBackgroundEffect(virtualBackground);
    }

    return loadScript('libs/virtual-background-effect.min.js').then(() =>
        ns.effects.createVirtualBackgroundEffect(virtualBackground));
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
