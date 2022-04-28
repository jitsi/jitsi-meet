import { createRnnoiseProcessor } from './../..//stream-effects/rnnoise';


/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * The AudioMixerEffect, as the name implies, mixes two JitsiLocalTracks containing a audio track. First track is
 * provided at the moment of creation, second is provided through the effect interface.
 */
export class DenoiseEffect {

    /**
     * C'tor default.
     */
    constructor() {
        this._bufferSize = 1024;
        this._inputBuffer = [];
        this._frameBuffer = [];
        this._outputBuffer = [];
        this._onAudioProcess = this._onAudioProcess.bind(this);
    }

    /** .....................
     * Value.
     *
     * @param {*} options -  Todo.
     * @returns {Void}
     */
    createAudioContext(options) {
        const AudioContextImpl = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextImpl) {
            return undefined;
        }

        return new AudioContextImpl(options);
    }

    /**
     * Default.
     *
     * @returns {Void}
     */
    async createRnnoiseProcessor() {
        this._vadProcessor = await createRnnoiseProcessor();
    }

    /**
     * Effect interface called by source JitsiLocalTrack, At this point a WebAudio ChannelMergerNode is created
     * and and the two associated MediaStreams are connected to it; the resulting mixed MediaStream is returned.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) {

        this._audioContext = this.createAudioContext({ sampleRate: 44100 });

        this._audioSource = this._audioContext.createMediaStreamSource(audioStream);
        this._audioDestination = this._audioContext.createMediaStreamDestination();
        this._audioProcessingNode = this._audioContext.createScriptProcessor(this._bufferSize, 1, 1);


        this._audioProcessingNode.onaudioprocess = this._onAudioProcess;
        this._audioSource.connect(this._audioProcessingNode);
        this._audioProcessingNode.connect(this._audioDestination);


        // /////////////////////
        // this._originalStream = audioStream;
        // this._originalTrack = audioStream.getTracks()[0];

        // this._audioMixer = JitsiMeetJS.createAudioMixer();
        // this._audioMixer.addMediaStream(this._mixAudio.getOriginalStream());
        // this._audioMixer.addMediaStream(this._originalStream);

        // this._mixedMediaStream = this._audioMixer.start();
        // this._mixedMediaTrack = this._mixedMediaStream.getTracks()[0];

        return this._audioDestination.stream;
    }

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: Object) {
        // Both JitsiLocalTracks need to be audio i.e. contain an audio MediaStreamTrack
        return true;
    }

    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @param {MediaStream} e - Audio stream which will be mixed with _mixAudio.
     *
     * @returns {void}
     */
    _onAudioProcess(e) {

        // const output = audioEvent.outputBuffer.getChannelData(0);
        // const input = audioEvent.inputBuffer.getChannelData(0);

        // for (let i = 0; i < 4096; i++) {
        //     output[i] = input[i];// Math.random() * 2 - 1;
        // }

        // // Prepend the residue PCM buffer from the previous process callback.
        // const inData = audioEvent.inputBuffer.getChannelData(0);
        // const completeInData = [ ...this._bufferResidue, ...inData ];

        // let i = 0;

        // for (; i + this._vadSampleSize < completeInData.length; i += this._vadSampleSize) {
        //     const pcmSample = completeInData.slice(i, i + this._vadSampleSize);

        //     // The VAD processor might change the values inside the array so we make a copy.
        //     const vadScore = this._vadProcessor.calculateAudioFrameVAD(pcmSample.slice());

        // }

        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);

        // Drain input buffer.
        for (let i = 0; i < this._bufferSize; i++) {
            this._inputBuffer.push(input[i]);
        }

        // if (uploadMicrophoneData) {
        //   while (inputBuffer.length >= sampleRate) {
        //     let buffer = [];
        //     for (let i = 0; i < sampleRate; i++) {
        //       buffer.push(inputBuffer.shift())
        //     }
        //     postData(convertFloat32ToInt16(buffer).buffer);
        //     console.log("Posting ...");
        //   }
        //   for (let i = 0; i < bufferSize; i++) {
        //     output[i] = 0;
        //   }
        //   return;
        // }

        while (this._inputBuffer.length >= 480) {
            for (let i = 0; i < 480; i++) {
                this._frameBuffer[i] = this._inputBuffer.shift();
            }

            const vadScore = this._vadProcessor.calculateAudioFrameVAD(this._frameBuffer);


            // Process Frame
            // if (suppressNoise) {
            //     removeNoise(this._frameBuffer);
            // }
            for (let i = 0; i < 480; i++) {
                this._outputBuffer.push(this._frameBuffer[i]);
            }
        }

        // Not enough data, exit early, etherwise the AnalyserNode returns NaNs.
        if (this._outputBuffer.length < this._bufferSize) {
            return;
        }

        // Flush output buffer.
        for (let i = 0; i < this._bufferSize; i++) {
            output[i] = this._outputBuffer.shift();
        }

        // this._bufferResidue = completeInData.slice(i, completeInData.length);
    }


    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @returns {void}
     */
    stopEffect() {
        if (this._audioProcessingNode) {
            this._audioProcessingNode.onaudioprocess = () => {};
            this._audioProcessingNode.disconnect();
            this._audioSource.disconnect();
            this._audioContex = undefined;
        }

        // this._audioMixer.reset();
    }

    // /**
    //  * Change the muted state of the effect.
    //  *
    //  * @param {boolean} muted - Should effect be muted or not.
    //  * @returns {void}
    //  */
    // setMuted(muted: boolean) {
    //     // this._originalTrack.enabled = !muted;
    // }

    // /**
    //  * Check whether or not this effect is muted.
    //  *
    //  * @returns {boolean}
    //  */
    // isMuted() {
    //     return !this._originalTrack.enabled;
    // }
}
