// @flow
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
    return new JitsiVideoAvatarEffect();
}
