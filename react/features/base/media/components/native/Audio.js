/* @flow */

import Sound from 'react-native-sound';

import logger from '../../logger';

import AbstractAudio from '../AbstractAudio';

/**
 * The React Native/mobile {@link Component} which is similar to Web's
 * {@code HTMLAudioElement} and wraps around react-native-webrtc's
 * {@link RTCView}.
 */
export default class Audio extends AbstractAudio {
    /**
     * Reference to 'react-native-sound} {@link Sound} instance.
     */
    _sound: ?Sound;

    /**
     * A callback passed to the 'react-native-sound''s {@link Sound} instance,
     * called when loading sound is finished.
     *
     * @param {Object} error - The error object passed by
     * the 'react-native-sound' library.
     * @returns {void}
     * @private
     */
    _soundLoadedCallback(error) {
        if (error) {
            logger.error('Failed to load sound', error);
        } else {
            this.setAudioElementImpl(this._sound);
        }
    }

    /**
     * Will load the sound, after the component did mount.
     *
     * @returns {void}
     */
    componentDidMount() {
        this._sound
            = this.props.src
                ? new Sound(
                    this.props.src, null,
                    this._soundLoadedCallback.bind(this))
                : null;
    }

    /**
     * Will dispose sound resources (if any) when component is about to unmount.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._sound) {
            this._sound.release();
            this._sound = null;
            this.setAudioElementImpl(null);
        }
    }

    /**
     * Attempts to begin the playback of the media.
     *
     * @inheritdoc
     * @override
     */
    play() {
        if (this._sound) {
            this._sound.setNumberOfLoops(this.props.loop ? -1 : 0);
            super.play();
        }
    }

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

    /**
     * Stops the sound if it's currently playing.
     *
     * @returns {void}
     */
    stop() {
        if (this._sound) {
            this._sound.stop();
        }
    }
}
