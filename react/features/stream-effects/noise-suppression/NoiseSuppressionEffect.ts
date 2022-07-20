// @ts-ignore
import { getBaseUrl } from '../../base/util';

import logger from './logger';

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * Effect applies rnnoise denoising on a audio JitsiLocalTrack.
 */
export class NoiseSuppressionEffect {

    /**
     * Web audio context.
     */
    private _audioContext: AudioContext;

    /**
     * Source that will be attached to the track affected by the effect.
     */
    private _audioSource: MediaStreamAudioSourceNode;

    /**
     * Destination that will contain denoised audio from the audio worklet.
     */
    private _audioDestination: MediaStreamAudioDestinationNode;

    /**
     * `AudioWorkletProcessor` associated node.
     */
    private _noiseSuppressorNode: AudioWorkletNode;

    /**
     * Effect interface called by source JitsiLocalTrack.
     * Applies effect that uses a {@code NoiseSuppressor} service initialized with {@code RnnoiseProcessor}
     * for denoising.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) : MediaStream {
        this._audioContext = new AudioContext();

        this._audioSource = this._audioContext.createMediaStreamSource(audioStream);
        this._audioDestination = this._audioContext.createMediaStreamDestination();

        const baseUrl = `${getBaseUrl()}libs/`;
        const workletUrl = `${baseUrl}noise-suppressor-worklet.min.js`;

        // Connect the audio processing graph MediaStream -> AudioWorkletNode -> MediaStreamAudioDestinationNode
        this._audioContext.audioWorklet.addModule(workletUrl)
        .then(() => {
            // After the resolution of module loading, an AudioWorkletNode can be constructed.
            this._noiseSuppressorNode = new AudioWorkletNode(this._audioContext, 'NoiseSuppressorWorklet');
            this._audioSource.connect(this._noiseSuppressorNode).connect(this._audioDestination);
        })
        .catch(error => {
            logger.error('Error while adding audio worklet module: ', error);
        });

        return this._audioDestination.stream;
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: any): boolean {
        // JitsiLocalTracks needs to be an audio track.
        return sourceLocalTrack.isAudioTrack();
    }

    /**
     * Clean up resources acquired by noise suppressor and rnnoise processor.
     *
     * @returns {void}
     */
    stopEffect(): void {
        // Technically after this process the Audio Worklet along with it's resources should be garbage collected,
        // however on chrome there seems to be a problem as described here:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1298955
        this._noiseSuppressorNode?.port?.close();
        this._audioDestination?.disconnect();
        this._noiseSuppressorNode?.disconnect();
        this._audioSource?.disconnect();
        this._audioContext?.close();
    }
}
