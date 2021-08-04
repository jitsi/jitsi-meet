// @flow
import * as facemesh from '@tensorflow-models/face-landmarks-detection';
// eslint-disable-next-line no-unused-vars
import * as tf from '@tensorflow/tfjs';

import JitsiVideoAvatarEffect from './JitsiVideoAvatarEffect';
import GLTFScene from './utils/GLTFScene';
import Zoprac from './utils/Scenes/Zoprac';

// import Helmet from './utils/Scenes/Helmet';

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

    // const object = new Helmet();
    const object = new Zoprac();

    // const object = new GLTFScene('images/maskTest/mask.gltf');

    return new JitsiVideoAvatarEffect(net, object);
}
