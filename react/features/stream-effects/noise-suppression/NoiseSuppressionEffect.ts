// @ts-ignore
import { getBaseUrl } from '../../base/util';

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
     * Destination that will contain
     */
    private _audioDestination: MediaStreamAudioDestinationNode;

    private _noiseSuppressorNode: AudioWorkletNode;

    /**
     * Effect interface called by source JitsiLocalTrack.
     * Applies effect that uses a {@code NoiseSuppressor} service initialized with {@code RnnoiseProcessor}
     * for denoising.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) : MediaStream{
        this._audioContext = new AudioContext();

        this._audioSource = this._audioContext.createMediaStreamSource(audioStream);
        this._audioDestination = this._audioContext.createMediaStreamDestination();

        const baseUrl = `${getBaseUrl()}libs/`;
        const workletUrl = `${baseUrl}noise-suppressor-worklet.min.js`;

        this._audioContext.audioWorklet.addModule(workletUrl).then(() => {
            // After the resolution of module loading, an AudioWorkletNode can be
            // constructed.
            this._noiseSuppressorNode = new AudioWorkletNode(this._audioContext, 'NoiseSuppressorWorklet');
            this._audioSource.connect(this._noiseSuppressorNode).connect(this._audioDestination);
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
        this._noiseSuppressorNode.port.close();
        this._audioDestination.disconnect();
        this._noiseSuppressorNode.disconnect();
        this._audioSource.disconnect();
        this._audioContext.close();
    }
}
