// @flow

import { createRnnoiseProcessorPromise, getSampleLength } from '../rnnoise/';
import EventEmitter from 'events';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import logger from './logger';
import { VAD_SCORE_PUBLISHED } from './VADEvents';

/**
 * The structure used by TrackVADEmitter to relay a score
 */
export type VADScore = {

    /**
     * Device ID associated with the VAD score
     */
    deviceId: string,

    /**
     * The PCM score from 0 - 1 i.e. 0.60
     */
    score: number,

    /**
     * Epoch time at which PCM was recorded
     */
    timestamp: number

};

/**
 * Connects an audio JitsiLocalTrack to a RnnoiseProcessor using WebAudio ScriptProcessorNode.
 * Once an object is created audio from the local track flows through the ScriptProcessorNode as raw PCM.
 * The PCM is processed by the rnnoise module and a VAD (voice activity detection) score is obtained, the
 * score is published to consumers via an EventEmitter.
 * After work is done with this service the destroy method needs to be called for a proper cleanup.
 */
export default class TrackVADEmitter extends EventEmitter {
    /**
     * The AudioContext instance.
     */
    _audioContext: AudioContext;

    /**
     * The MediaStreamAudioSourceNode instance.
     */
    _audioSource: MediaStreamAudioSourceNode;

    /**
     * The ScriptProcessorNode instance.
     */
    _audioProcessingNode: ScriptProcessorNode;

    /**
     * Buffer to hold residue PCM resulting after a ScriptProcessorNode callback
     */
    _bufferResidue: Float32Array;

    /**
     * State flag, check if the instance was destroyed
     */
    _destroyed: boolean = false;

    /**
     * The JitsiLocalTrack instance.
     */
    _localTrack: Object;

    /**
     * Device ID of the target microphone.
     */
    _micDeviceId: string;

    /**
     * Callback function that will be called by the ScriptProcessNode with raw PCM data, depending on the set sample
     * rate.
     */
    _onAudioProcess: (audioEvent: Object) => void;

    /**
     * Sample rate of the ScriptProcessorNode.
     */
    _procNodeSampleRate: number;

    /**
     * Rnnoise adapter that allows us to calculate VAD score for PCM samples
     */
    _rnnoiseProcessor: Object;

    /**
     * PCM Sample size expected by the RnnoiseProcessor instance.
     */
    _rnnoiseSampleSize: number;

    /**
     * Constructor.
     *
     * @param {number} procNodeSampleRate - Sample rate of the ScriptProcessorNode. Possible values  256, 512, 1024,
     *  2048, 4096, 8192, 16384. Passing other values will default to closes neighbor.
     * @param {Object} rnnoiseProcessor - Rnnoise adapter that allows us to calculate VAD score
     * for PCM samples.
     * @param {Object} jitsiLocalTrack - JitsiLocalTrack corresponding to micDeviceId.
     */
    constructor(procNodeSampleRate: number, rnnoiseProcessor: Object, jitsiLocalTrack: Object) {
        super();
        this._procNodeSampleRate = procNodeSampleRate;
        this._rnnoiseProcessor = rnnoiseProcessor;
        this._localTrack = jitsiLocalTrack;
        this._micDeviceId = jitsiLocalTrack.getDeviceId();
        this._bufferResidue = new Float32Array([]);
        this._audioContext = new AudioContext();
        this._rnnoiseSampleSize = getSampleLength();
        this._onAudioProcess = this._onAudioProcess.bind(this);

        this._initializeAudioContext();
        this._connectAudioGraph();

        logger.log(`Constructed VAD emitter for device: ${this._micDeviceId}`);
    }

    /**
     * Factory method that sets up all the necessary components for the creation of the TrackVADEmitter.
     *
     * @param {string} micDeviceId - Target microphone device id.
     * @param {number} procNodeSampleRate - Sample rate of the proc node.
     * @returns {Promise<TrackVADEmitter>} - Promise resolving in a new instance of TrackVADEmitter.
     */
    static async create(micDeviceId: string, procNodeSampleRate: number) {
        let rnnoiseProcessor = null;
        let localTrack = null;

        try {
            logger.log(`Initializing TrackVADEmitter for device: ${micDeviceId}`);

            rnnoiseProcessor = await createRnnoiseProcessorPromise();
            localTrack = await JitsiMeetJS.createLocalTracks({
                devices: [ 'audio' ],
                micDeviceId
            });

            // We only expect one audio track when specifying a device id.
            if (!localTrack[0]) {
                throw new Error(`Failed to create jitsi local track for device id: ${micDeviceId}`);
            }

            return new TrackVADEmitter(procNodeSampleRate, rnnoiseProcessor, localTrack[0]);
        } catch (error) {
            logger.error(`Failed to create TrackVADEmitter for ${micDeviceId} with error: ${error}`);

            if (rnnoiseProcessor) {
                rnnoiseProcessor.destroy();
            }

            if (localTrack) {
                localTrack.stopStream();
            }

            throw error;
        }
    }

    /**
     * Sets up the audio graph in the AudioContext.
     *
     * @returns {Promise<void>}
     */
    _initializeAudioContext() {
        this._audioSource = this._audioContext.createMediaStreamSource(this._localTrack.stream);

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

        for (; i + this._rnnoiseSampleSize < completeInData.length; i += this._rnnoiseSampleSize) {
            const pcmSample = completeInData.slice(i, i + this._rnnoiseSampleSize);
            const vadScore = this._rnnoiseProcessor.calculateAudioFrameVAD(pcmSample);

            this.emit(VAD_SCORE_PUBLISHED, {
                timestamp: sampleTimestamp,
                score: vadScore,
                deviceId: this._micDeviceId
            });
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
        // Even thought we disconnect the processing node it seems that some callbacks remain queued,
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
        this._localTrack.stopStream();
        this._rnnoiseProcessor.destroy();
    }

    /**
     * Destroy TrackVADEmitter instance (release resources and stop callbacks).
     *
     * @returns {void}
     */
    destroy() {
        if (this._destroyed) {
            return;
        }

        logger.log(`Destroying TrackVADEmitter for mic: ${this._micDeviceId}`);
        this._cleanupResources();
        this._destroyed = true;
    }
}
