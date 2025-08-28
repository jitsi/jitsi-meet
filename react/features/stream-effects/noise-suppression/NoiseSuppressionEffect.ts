import { INoiseSuppressionConfig } from '../../base/config/configType';
import { getBaseUrl } from '../../base/util/helpers';

import logger from './logger';

interface IKrispState {
    filterNode?: AudioWorkletNode;
    filterNodeReady: boolean;
    sdk: any;
    sdkInitialized: boolean;
}

const krispState: IKrispState = {
    filterNode: undefined,
    filterNodeReady: false,
    sdk: undefined,
    sdkInitialized: false
};

let audioContext: AudioContext;

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * Effect applies rnnoise denoising on a audio JitsiLocalTrack.
 */
export class NoiseSuppressionEffect {

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
    private _noiseSuppressorNode?: AudioWorkletNode;

    /**
     * Audio track extracted from the original MediaStream to which the effect is applied.
     */
    private _originalMediaTrack: MediaStreamTrack;

    /**
     * Noise suppressed audio track extracted from the media destination node.
     */
    private _outputMediaTrack: MediaStreamTrack;

    /**
     * Configured options for noise suppression.
     */
    private _options?: INoiseSuppressionConfig;

    /**
     * Instantiates a noise suppressor audio effect which will use either rnnoise or krisp.
     *
     * @param {INoiseSuppressionConfig} options - Configured options.
     */
    constructor(options?: INoiseSuppressionConfig) {
        this._options = options;

        const useKrisp = options?.krisp?.enabled;

        logger.info(`NoiseSuppressionEffect created with ${useKrisp ? 'Krisp' : 'RNNoise'}`);
    }

    /**
     * Effect interface called by source JitsiLocalTrack.
     * Applies effect that uses a {@code NoiseSuppressor} service initialized with {@code RnnoiseProcessor}
     * for denoising.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream): MediaStream {
        this._originalMediaTrack = audioStream.getAudioTracks()[0];

        if (!audioContext) {
            audioContext = new AudioContext();
        }

        this._audioSource = audioContext.createMediaStreamSource(audioStream);
        this._audioDestination = audioContext.createMediaStreamDestination();
        this._outputMediaTrack = this._audioDestination.stream.getAudioTracks()[0];

        let init;

        if (this._options?.krisp?.enabled) {
            init = _initializeKrisp(this._options, audioStream).then(filterNode => {
                this._noiseSuppressorNode = filterNode;

                if (krispState.filterNodeReady) {
                    // @ts-ignore
                    krispState.filterNode?.enable();
                }
            });
        } else {
            init = _initializeKRnnoise().then(filterNode => {
                this._noiseSuppressorNode = filterNode;
            });
        }

        // Connect the audio processing graph MediaStream -> AudioWorkletNode -> MediaStreamAudioDestinationNode

        init.then(() => {
            if (this._noiseSuppressorNode) {
                this._audioSource.connect(this._noiseSuppressorNode);
                this._noiseSuppressorNode.connect(this._audioDestination);
            }
        });

        // Sync the effect track muted state with the original track state.
        this._outputMediaTrack.enabled = this._originalMediaTrack.enabled;

        // We enable the audio on the original track because mute/unmute action will only affect the audio destination
        // output track from this point on.
        this._originalMediaTrack.enabled = true;

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
        // Sync original track muted state with effect state before removing the effect.
        this._originalMediaTrack.enabled = this._outputMediaTrack.enabled;

        if (this._options?.krisp?.enabled) {
            // When using Krisp we'll just disable the filter which we'll keep reusing.

            // @ts-ignore
            this._noiseSuppressorNode?.disable();
        } else {
            // Technically after this process the Audio Worklet along with it's resources should be garbage collected,
            // however on chrome there seems to be a problem as described here:
            // https://bugs.chromium.org/p/chromium/issues/detail?id=1298955
            this._noiseSuppressorNode?.port?.close();
        }

        this._audioDestination?.disconnect();
        this._noiseSuppressorNode?.disconnect();
        this._audioSource?.disconnect();

        audioContext.suspend();
    }
}

/**
 * Initializes the Krisp SDK and creates the filter node.
 *
 * @param {INoiseSuppressionConfig} options - Krisp options.
 * @param {MediaStream} stream - Audio stream which will be mixed with _mixAudio.
 *
 * @returns {Promise<AudioWorkletNode | undefined>}
 */
async function _initializeKrisp(
        options: INoiseSuppressionConfig,
        stream: MediaStream
): Promise<AudioWorkletNode | undefined> {
    await audioContext.resume();

    if (!krispState.sdk) {
        const baseUrl = `${getBaseUrl()}libs/krisp`;
        const { default: KrispSDK } = await import(/* webpackIgnore: true */ `${baseUrl}/krispsdk.mjs`);

        const ncParams = {
            krisp: {
                models: {
                    modelBVC: `${baseUrl}/models/${options?.krisp?.models?.modelBVC}`,
                    model8: `${baseUrl}/models/${options?.krisp?.models?.model8}`,
                    modelNC: `${baseUrl}/models/${options?.krisp?.models?.modelNC}`
                },
                logProcessStats: !options?.krisp?.logProcessStats,
                debugLogs: !options?.krisp?.debugLogs,
                useBVC: !options?.krisp?.useBVC,
                bvc: {
                    allowedDevices: `${baseUrl}/assets/${options?.krisp?.bvc?.allowedDevices}`,
                    allowedDevicesExt: `${baseUrl}/assets/${options?.krisp?.bvc?.allowedDevicesExt}`
                },
                inboundModels: {
                    modelInbound8: `${baseUrl}/models/${options?.krisp?.inboundModels?.modelInbound8}`,
                    modelInbound16: `${baseUrl}/models/${options?.krisp?.inboundModels?.modelInbound16}`
                },
                preloadModels: {
                    modelBVC: `${baseUrl}/models/${options?.krisp?.preloadModels?.modelBVC}`,
                    model8: `${baseUrl}/models/${options?.krisp?.preloadModels?.model8}`,
                    modelNC: `${baseUrl}/models/${options?.krisp?.preloadModels?.modelNC}`
                },
                preloadInboundModels: {
                    modelInbound8: `${baseUrl}/models/${options?.krisp?.preloadInboundModels?.modelInbound8}`,
                    modelInbound16: `${baseUrl}/models/${options?.krisp?.preloadInboundModels?.modelInbound16}`
                }
            }
        };

        krispState.sdk = new KrispSDK({
            params: ncParams.krisp,
            callbacks: {}
        });
    }

    if (!krispState.sdkInitialized) {
        // @ts-ignore
        await krispState.sdk?.init();

        krispState.sdkInitialized = true;
    }

    if (!krispState.filterNode) {
        try {
            // @ts-ignore
            krispState.filterNode = await krispState.sdk?.createNoiseFilter(
                {
                    audioContext,
                    stream
                },
                () => {
                    logger.info('Krisp audio filter ready');

                    // Enable audio filtering.
                    // @ts-ignore
                    krispState.filterNode?.enable();
                    krispState.filterNodeReady = true;
                }
            );
        } catch (e) {
            logger.error('Failed to create Krisp noise filter', e);

            krispState.filterNode = undefined;
            krispState.filterNodeReady = false;
        }
    }

    return krispState.filterNode;
}

/**
 * Initializes the RNNoise audio worklet and creates the filter node.
 *
 * @returns {Promise<AudioWorkletNode | undefined>}
 */
async function _initializeKRnnoise(): Promise<AudioWorkletNode | undefined> {
    await audioContext.resume();

    const baseUrl = `${getBaseUrl()}libs/`;
    const workletUrl = `${baseUrl}noise-suppressor-worklet.min.js`;

    try {
        await audioContext.audioWorklet.addModule(workletUrl);
    } catch (e) {
        logger.error('Error while adding audio worklet module: ', e);

        return;
    }

    // After the resolution of module loading, an AudioWorkletNode can be constructed.

    return new AudioWorkletNode(audioContext, 'NoiseSuppressorWorklet');
}
