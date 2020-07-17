// @flow

import type { Dispatch } from 'redux';

import { getJitsiMeetGlobalNS, loadScript } from '../base/util';

/**
 * Returns promise that resolves with the green screen effect instance.
 *
 * @param {Function} getState - GetState function.
 * @param {Function} dispatch - Dispatch function.
 * @returns {Promise<JitsiStreamGreenScreenEffect>} - Resolves with the green screen effect instance.
 */
export function getGreenScreenEffect(getState: Function, dispatch: Dispatch<any>) {
    const ns = getJitsiMeetGlobalNS();

    if (ns.effects && ns.effects.createGreenScreenEffect) {
        return ns.effects.createGreenScreenEffect(getState, dispatch);
    }

    return loadScript('libs/video-green-screen-effect.min.js').then(() => {
        ns.effects.createGreenScreenEffect(getState, dispatch);
    });
}
