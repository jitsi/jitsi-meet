/* @flow */

import AbstractAudio from '../AbstractAudio';

/**
 * The React Native/mobile {@link Component} which is similar to Web's
 * {@code HTMLAudioElement} and wraps around react-native-webrtc's
 * {@link RTCView}.
 */
export default class Audio extends AbstractAudio {
    /**
     * {@code Audio} component's property types.
     *
     * @static
     */
    static propTypes = AbstractAudio.propTypes;

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {null}
     */
    render() {
        // TODO react-native-webrtc's RTCView doesn't do anything with the audio
        // MediaStream specified to it so it's easier at the time of this
        // writing to not render anything.
        return null;
    }
}
