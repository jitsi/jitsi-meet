import { create } from 'lodash';
import JitsiMeetJS from '../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../base/media';

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * The AudioMixerEffect, as the name implies, mixes two JitsiLocalTracks containing a audio track. First track is
 * provided at the moment of creation, second is provided through the effect interface.
 */
export class AudioMixerEffect {
    
    /**
     * Creates AudioMixerEffect.
     *
     * @param {JitsiLocalTrack} mixAudio - JitsiLocalTrack which will be mixed with the original track.
     */
    constructor(mixAudio: Object) {
        if (mixAudio.getType() !== MEDIA_TYPE.AUDIO) {
            throw new Error('AudioMixerEffect only supports audio JitsiLocalTracks; effect will not work!');
        }

        this._mixAudio = mixAudio;
    }

    createAudioContext(options) {
        const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
    
        if (!AudioContextImpl) {
            return undefined;
        }
    
        return new AudioContextImpl(options);
    }

    /**
     * Effect interface called by source JitsiLocalTrack, At this point a WebAudio ChannelMergerNode is created
     * and and the two associated MediaStreams are connected to it; the resulting mixed MediaStream is returned.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) {

        this._audioContex = this.createAudioContext({ sampleRate: 44100 });

        this._audioSource = this._audioContext.createMediaStreamSource(audioStream.stream);
        this._audioDestination = this._audioContext.createMediaStreamDestination();
        this._audioProcessingNode = this._audioContext.createScriptProcessor( 4096, 1, 1);


        this._audioProcessingNode.onaudioprocess = this._onAudioProcess;
        this._audioSource.connect(this._audioProcessingNode);
        this._audioProcessingNode.connect(this._audioDestination);


        ///////////////////////
        // this._originalStream = audioStream;
        // this._originalTrack = audioStream.getTracks()[0];

        // this._audioMixer = JitsiMeetJS.createAudioMixer();
        // this._audioMixer.addMediaStream(this._mixAudio.getOriginalStream());
        // this._audioMixer.addMediaStream(this._originalStream);

        // this._mixedMediaStream = this._audioMixer.start();
        // this._mixedMediaTrack = this._mixedMediaStream.getTracks()[0];

        return this._audioDestination.stream;
    }

    _onAudioProcess(audioEvent) {
        
        let output = audioEvent.outputBuffer.getChannelData(0);
        let input =audioEvent.inputBuffer.getChannelData(0);
       
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        // Prepend the residue PCM buffer from the previous process callback.
        // const inData = audioEvent.inputBuffer.getChannelData(0);
        // const completeInData = [ ...this._bufferResidue, ...inData ];
        // const sampleTimestamp = Date.now();

        // let i = 0;

        // for (; i + this._vadSampleSize < completeInData.length; i += this._vadSampleSize) {
        //     const pcmSample = completeInData.slice(i, i + this._vadSampleSize);

        //     // The VAD processor might change the values inside the array so we make a copy.
        //     const vadScore = this._vadProcessor.calculateAudioFrameVAD(pcmSample.slice());

        //     this.emit(VAD_SCORE_PUBLISHED, {
        //         timestamp: sampleTimestamp,
        //         score: vadScore,
        //         pcmData: pcmSample,
        //         deviceId: this._localTrack.getDeviceId()
        //     });
        // }

        // this._bufferResidue = completeInData.slice(i, completeInData.length);
    }


    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @returns {void}
     */
    stopEffect() {
        this._audioProcessingNode.onaudioprocess = () => {};
        this._audioProcessingNode.disconnect();
        this._audioSource.disconnect();
        this._audioContex = undefined;
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
