// @flow

import type { Dispatch } from 'redux';

import JitsiStreamGreenScreenEffect from './JitsiStreamGreenScreenEffect';

/**
 * Creates a new instance of JitsiStreamGreenScreenEffect. This loads the bodyPix model that is used to
 * extract person segmentation.
 *
 * @param {Function} getState - GetState function.
 * @param {Function} dispatch - Dispatch function.
 * @returns {Promise<JitsiStreamGreenScreenEffect>}
 */
export async function createGreenScreenEffect(getState: Function, dispatch: Dispatch<any>) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        throw new Error('JitsiStreamGreenScreenEffect not supported!');
    }

    const effect = new JitsiStreamGreenScreenEffect(getState, dispatch);

    await effect.init();

    return effect;
}
