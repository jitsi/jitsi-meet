// @flow

import { load } from '@tensorflow-models/body-pix';
import * as tfc from '@tensorflow/tfjs-core';
import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';

/**
 * This promise represents the loading of the BodyPix model that is used
 * to extract person segmentation. A multiplier of 0.25 is used to for
 * improved performance on a larger range of CPUs.
 */
const bpModelPromise = load(0.25);

/**
 * Configure the Tensor Flow model to use the webgl backend which is the
 * most powerful backend for the browser.
 */
const webGlBackend = 'webgl';

/**
 * Creates a new instance of JitsiStreamBlurEffect.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamBlurEffect not supported!'));
    }

    const setBackendPromise = new Promise((resolve, reject) => {
        if (tfc.getBackend() === webGlBackend) {
            resolve();

            return;
        }

        return tfc.setBackend(webGlBackend)
            .then(resolve, reject);
    });

    return setBackendPromise
        .then(() => bpModelPromise)
        .then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
}
