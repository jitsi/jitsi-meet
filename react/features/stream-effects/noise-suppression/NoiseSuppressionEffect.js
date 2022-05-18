/* global JitsiMeetJS */

import { createRnnoiseProcessor } from '../rnnoise';

/**
 * The sample rate at which the noise suppressor will operate. Lower value means less latency but higher CPU.
 * Possible values  256, 512, 1024, 4096, 8192, 16384.
 */
const AUDIO_SAMPLE_RATE: number = 1024;


/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * Effect applies rnnoise denoising on a audio JitsiLocalTrack.
 */
export class NoiseSuppressionEffect {
    /**
     * The {@code startEffect} function is not async so we have to initialize the rnnoise processor
     * before the effect is started.
     *
     * @returns {void}
     */
    async initializeRnnoiseProcessor() {
        this._rnnoiseProcessor = await createRnnoiseProcessor();
    }

    /**
     * Effect interface called by source JitsiLocalTrack.
     * Applies effect that uses a {@code NoiseSuppressor} service initialized with {@code RnnoiseProcessor}
     * for denoising.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) {
        this._noiseSuppressor = JitsiMeetJS.createNoiseSuppressor(
            AUDIO_SAMPLE_RATE,
            this._rnnoiseProcessor,
            audioStream
        );

        this._noiseSuppressor.start();

        return this._noiseSuppressor.getDenoisedStream();
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: Object) {
        // JitsiLocalTracks needs to be an audio track.
        return sourceLocalTrack.isAudioTrack();
    }

    /**
     * Clean up resources acquired by noise suppressor and rnnoise processor.
     *
     * @returns {void}
     */
    stopEffect() {
        this._noiseSuppressor && this._noiseSuppressor.destroy();
        this._rnnoiseProcessor && this._rnnoiseProcessor.destroy();
    }
}
