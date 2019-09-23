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

    if (tfc.getBackend() !== webGlBackend) {
        tfc.setBackend(webGlBackend).then(() => {
            console.info('TensorFlow backend changed to use WebGL');

            return bpModelPromise.then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
        })
        .catch(err => {
            console.error('TensorFlow backend could not be changed to use WebGL: ', err);

            return Promise.reject(new Error('JitsiStreamBlurEffect not supported!'));
        });
    }

    return bpModelPromise.then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
}
