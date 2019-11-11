// @flow

import { load } from '@tensorflow-models/body-pix';
import * as tfc from '@tensorflow/tfjs-core';
import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import JitsiStreamCropPersonEffect from './JitsiStreamCropPersonEffect';

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
 * Configure the TF backend to use webGL.
 *
 * @returns {Promise<boolean>}
 */
function setBackend() {

    return tfc.getBackend() === webGlBackend
        ? Promise.resolve(true)
        : tfc.setBackend(webGlBackend);
}

/**
 * Creates a new instance of JitsiStreamBlurEffect.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export async function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings
        && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamBlurEffect not '
            + 'supported!'));
    }
    const backend = await setBackend();

    if (backend) {
        return bpModelPromise.then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
    }

    return Promise.reject(new Error('Failed to set WebGL backend for Tensor'
        + ' flow'));
}

/**
 * Creates a new instance of JitsiStreamCropPersonEffect.
 *
 * @param {MediaStream} stream - The video stream on which the crop effect is
 * to be applied.
 * @returns {Promise<JitsiStreamCropPersonEffect>}
 */
export async function createCropPersonEffect(stream: MediaStream) {
    if (!MediaStreamTrack.prototype.getSettings
        && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamCropEffect not '
            + 'supported!'));
    }
    const backend = await setBackend();

    if (backend) {
        return bpModelPromise.then(bpmodel => new JitsiStreamCropPersonEffect(bpmodel, stream));
    }

    return Promise.reject(new Error('Failed to set WebGL backend for Tensor'
        + ' flow'));
}


