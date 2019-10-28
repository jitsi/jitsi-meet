// @flow

import { load } from '@tensorflow-models/body-pix';
import * as tfc from '@tensorflow/tfjs-core';
import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import JitsiStreamCropPersonEffect from './JitsiStreamCropPersonEffect';
import JitsiStreamPresenterEffect from './JitsiStreamPresenterEffect';

/**
 * This promise represents the loading of the BodyPix model that is used
 * to extract person segmentation. A multiplier of 0.25 is used to for
 * improved performance on a larger range of CPUs.
 */
const bpModelPromise = load(0.75);

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
    return new Promise((resolve, reject) => {
        if (tfc.getBackend() === webGlBackend) {
            resolve();
        } else {
            tfc.setBackend(webGlBackend)
            .then(resolve, reject);
        }
    });
}

/**
 * Creates a new instance of JitsiStreamBlurEffect.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export function createBlurEffect() {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamBlurEffect not supported!'));
    }

    return setBackend()
        .then(() => bpModelPromise)
        .then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
}

/**
 * Creates a new instance of JitsiStreamCropPersonEffect.
 *
 * @returns {Promise<JitsiStreamCropPersonEffect>}
 */
export function createCropPersonEffect(stream) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamCropEffect not supported!'));
    }

    return setBackend()
        .then(() => bpModelPromise)
        .then(bpmodel => new JitsiStreamCropPersonEffect(bpmodel, stream));
}

/**
 * 
 */
export function createPresenterEffect(stream) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('JitsiStreamPresenterEffect not supported!'));
    }

    return new JitsiStreamPresenterEffect(stream);
}

