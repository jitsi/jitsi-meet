// @flow
import { createRnnoiseProcessor, RnnoiseProcessor, RNNOISE_SAMPLE_LENGTH } from '../stream-effects/rnnoise';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import logger from './logger';

/**
 * The structure used by TrackVADEmitter to relay a score
 */
export type VADScore = {

    /**
     * Epoch time at which PCM was recorded
     */
    timestamp: number,

    /**
     * The PCM score from 0 - 1 i.e. 0.60
     */
    score: number,

    /**
     * Device ID associated with the VAD score
     */
    deviceId: string
};

/**
 * Connects an audio JitsiLocalTrack to a RnnoiseProcessor using WebAudio ScriptProcessorNode.
 * Once an object is created audio from the local track flows through the ScriptProcessorNode as raw PCM.
 * The PCM is processed by the rnnoise module and a VAD (voice activity detection) score is obtained, the
 * score is published to consumers via a callback.
 * After work is done with this service the destroy method needs to be called for a proper cleanup.
 */
export default class TrackVADEmitter {
    /**
     * Something.
     */
    _micDeviceId: string;

    /**
     * The AudioContext instance.
     */
    _audioContext: AudioContext;

    /**
     * The JitsiLocalTrack instance.
     */
    _jitsiLocalTrack: Object;

    /**
     * The MediaStreamAudioSourceNode instance.
     */
    _audioSource: MediaStreamAudioSourceNode;

    /**
     * The ScriptProcessorNode instance.
     */
    _audioProcessingNode: ScriptProcessorNode;

    /**
     * Function type definition.
     */
    _onAudioProcess: (audioEvent: Object) => void;

    /**
     * Rnnoise adapter that allows us to calculate VAD score for PCM samples
     */
    _rnnoiseProcessor: RnnoiseProcessor;

    /**
     * Sample rate of the ScriptProcessorNode.
     */
    _procNodeSampleRate: number;

    /**
     * Buffer to hold residue PCM resulting after a ScriptProcessorNode callback
     */
    _bufferResidue: Float32Array;

    /**
     * Callback function with which the emitter publishes its periodic VAD scoring
     */
    _publishVAD: (score: VADScore) => void;

    /**
     * State flag, check if the instance was destroyed
     */
    _destroyed: boolean = false;

    /**
     * Constructor.
     *
     * @param {number} procNodeSampleRate - Sample rate of the proc node.
     * @param {Function} publishVAD - VAD score callback function.
     * @param {RnnoiseProcessor} rnnoiseProcessor - Rnnoise adapter that allows us to calculate VAD score
     * for PCM samples.
     * @param {Object} jitsiLocalTrack - JitsiLocalTrack corresponding to micDeviceId.
     */
    constructor(
            procNodeSampleRate: number,
            publishVAD: Function,
            rnnoiseProcessor: RnnoiseProcessor,
            jitsiLocalTrack: Object
    ) {
        this._procNodeSampleRate = procNodeSampleRate;
        this._publishVAD = publishVAD;
        this._rnnoiseProcessor = rnnoiseProcessor;
        this._jitsiLocalTrack = jitsiLocalTrack;
        this._micDeviceId = jitsiLocalTrack.getDeviceId();
        this._bufferResidue = new Float32Array([]);
        this._audioContext = new AudioContext();

        this._onAudioProcess = this._onAudioProcess.bind(this);

        this._initializeAudioContext();
        this._connectAudioGraph();

        logger.log(`Constructed VAD emitter for device: ${this._micDeviceId}`);
    }

    /**
     * Creates a lib-jitsi-meet track associated with a target microphone.
     *
     * @param {string} micDeviceId - Target microphone device id.
     *
     * @returns {Promise<jitsiLocalTrack>}
     */
    static _getAudioStream(micDeviceId: string) {
        return JitsiMeetJS.createLocalTracks({
            devices: [ 'audio' ],
            micDeviceId
        }).then(result => {
            // Because we specify the deviceId there should be a single stream available.
            if (result[0] === undefined) {
                throw new Error('Failed to create jitsi local track.');
            }

            return result[0];
        });
    }

    /**
     * Factory method that sets up all the necessary components for the creation of the TrackVADEmitter.
     *
     * @param {string} micDeviceId - Target microphone device id.
     * @param {number} procNodeSampleRate - Sample rate of the proc node.
     * @param {Function} publishVAD - VAD score callback function.
     * @returns {Promise<TrackVADEmitter>} - Promise resolving in a new instance of TrackVADEmitter.
     */
    static create(micDeviceId: string, procNodeSampleRate: number, publishVAD: Function) {
        // Maintain closure variables so we can clean everything up in case the promise chain breaks at any point.
        let closureRnnoiseProc = null;
        let closureLocalTrack = null;

        logger.log(`Initializing TrackVADEmitter for device: ${micDeviceId}`);

        return createRnnoiseProcessor()
            .then(rnnoiseProcessor => {
                closureRnnoiseProc = rnnoiseProcessor;
            })
            .then(() =>
                TrackVADEmitter._getAudioStream(micDeviceId)
                    .then(jitsiLocalTrack => {
                        closureLocalTrack = jitsiLocalTrack;
                    })
                    .then(
                        () => new TrackVADEmitter(procNodeSampleRate, publishVAD, closureRnnoiseProc, closureLocalTrack)
                    )
            )
            .catch(error => {
                logger.error(`Failed to create TrackVADEmitter for ${micDeviceId} with error: ${error}`);

                if (closureRnnoiseProc) {
                    closureRnnoiseProc.destroy();
                }

                if (closureLocalTrack) {
                    closureLocalTrack.stopStream();
                }

                throw error;
            });
    }

    /**
     * Sets up the audio graph in the AudioContext.
     *
     * @returns {Promise<void>}
     */
    _initializeAudioContext() {
        this._audioSource = this._audioContext.createMediaStreamSource(this._jitsiLocalTrack.stream);

        // TODO AudioProcessingNode is deprecated check and replace with alternative.
        // We don't need stereo for determining the VAD score so we create a single chanel processing node.
        this._audioProcessingNode = this._audioContext.createScriptProcessor(this._procNodeSampleRate, 1, 1);
        this._audioProcessingNode.onaudioprocess = this._onAudioProcess;
    }

    /**
     * ScriptProcessorNode callback, the input parameters contains the PCM audio that is then sent to rnnoise.
     * Rnnoise only accepts PCM samples of 480 bytes whereas the webaudio processor node can't sample at a multiple
     * of 480 thus after each _onAudioProcess callback there will remain and PCM buffer residue equal
     * to _procNodeSampleRate / 480 which will be added to the next sample buffer and so on.
     *
     * @param {AudioProcessingEvent} audioEvent - Audio event.
     * @returns {void}
     */
    _onAudioProcess(audioEvent: Object) {
        // Prepend the residue PCM buffer from the previous process callback.
        const inData = audioEvent.inputBuffer.getChannelData(0);
        const completeInData = [ ...this._bufferResidue, ...inData ];
        const sampleTimestamp = Date.now();

        let i = 0;

        for (; i + RNNOISE_SAMPLE_LENGTH < completeInData.length; i += RNNOISE_SAMPLE_LENGTH) {
            const pcmSample = completeInData.slice(i, i + RNNOISE_SAMPLE_LENGTH);
            const vadScore = this._rnnoiseProcessor.calculateAudioFrameVAD(pcmSample);

            this._publishVAD({ timestamp: sampleTimestamp,
                score: vadScore,
                deviceId: this._micDeviceId });
        }

        this._bufferResidue = completeInData.slice(i, completeInData.length);
    }

    /**
     * Connects the nodes in the AudioContext to start the flow of audio data.
     *
     * @returns {void}
     */
    _connectAudioGraph() {
        this._audioSource.connect(this._audioProcessingNode);
        this._audioProcessingNode.connect(this._audioContext.destination);
    }

    /**
     * Disconnects the nodes in the AudioContext.
     *
     * @returns {void}
     */
    _disconnectAudioGraph() {
        // Even thought we disconnect the processing node some it seems that some callbacks remain queued,
        // resulting in calls with and uninitialized context.
        // eslint-disable-next-line no-empty-function
        this._audioProcessingNode.onaudioprocess = () => {};
        this._audioProcessingNode.disconnect();
        this._audioSource.disconnect();
    }

    /**
     * Cleanup potentially acquired resources.
     *
     * @returns {void}
     */
    _cleanupResources() {
        logger.debug(`Cleaning up resources for device ${this._micDeviceId}!`);

        this._disconnectAudioGraph();
        this._jitsiLocalTrack.stopStream();
        this._rnnoiseProcessor.destroy();
    }

    /**
     * Destroy TrackVADEmitter instance (release resources and stop callbacks).
     *
     * @returns {void}
     */
    destroy() {
        if (this._destroyed) {
            logger.warn(
                `TrackVADEmitter instance for device ${this._micDeviceId} is destroyed please create another one!`
            );
        }

        logger.log(`Destroying TrackVADEmitter for mic: ${this._micDeviceId}`);
        this._cleanupResources();
        this._destroyed = true;
    }
}
