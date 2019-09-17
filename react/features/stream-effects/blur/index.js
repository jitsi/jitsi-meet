// @flow

import { load } from '@tensorflow-models/body-pix';
import * as TF from '@tensorflow/tfjs';
import JitsiStreamBlurEffect from './JitsiStreamBlurEffect';
import { getLogger } from 'jitsi-meet-logger';
const logger = getLogger(__filename);

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

    // change the TF backend to use WebGL
    TF.setBackend('webgl').then(() => {
        logger.info('TensorFlow backend changed to use the WebGL');
    })
    .catch(error => {
        logger.info('TensorFlow backend could not be changed to use WebGL, performance may suffer: ',
            error);
    });

    return bpModelPromise.then(bpmodel => new JitsiStreamBlurEffect(bpmodel));
}
