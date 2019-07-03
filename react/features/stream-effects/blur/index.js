// @flow

import { load } from '@tensorflow-models/body-pix';

import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';

/**
 * This promise represents the loading of the BodyPix model that is used
 * to extract person segmentation. A multiplier of 0.25 is used to for
 * improved performance on a larger range of CPUs.
 */
const bpModelPromise = load(0.25);

/**
 * Creates a new instance of JitsiStreamBlurEffect.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamBlurEffect not supported!'));
    }

    return bpModelPromise.then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
}
