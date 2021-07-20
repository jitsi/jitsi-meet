// @flow
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs';

import JitsiVideoAvatarEffect from './JitsiVideoAvatarEffect';

/**
 * Creates a new instance of JitsiVideoAvatarEffect.
 *
 * @returns {Promise<JitsiVideoAvatarEffect>}
 */
export async function createVideoAvatarEffect() {
    /**
     * The return function.
     */
    const net = await facemesh.load(facemesh.SupportedPackages.mediapipeFacemesh);

    return new JitsiVideoAvatarEffect(net);
}
