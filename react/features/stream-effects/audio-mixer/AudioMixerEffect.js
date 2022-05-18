// @flow

import JitsiMeetJS from '../../base/lib-jitsi-meet';
import { MEDIA_TYPE } from '../../base/media';

/**
 * Class Implementing the effect interface expected by a JitsiLocalTrack.
 * The AudioMixerEffect, as the name implies, mixes two JitsiLocalTracks containing a audio track. First track is
 * provided at the moment of creation, second is provided through the effect interface.
 */
export class AudioMixerEffect {
    /**
     * JitsiLocalTrack that is going to be mixed into the track that uses this effect.
     */
    _mixAudio: Object;

    /**
     * MediaStream resulted from mixing.
     */
    _mixedMediaStream: Object;

    /**
     * MediaStreamTrack obtained from mixed stream.
     */
    _mixedMediaTrack: Object;

    /**
     * Original MediaStream from the JitsiLocalTrack that uses this effect.
     */
    _originalStream: Object;

    /**
     * MediaStreamTrack obtained from the original MediaStream.
     */
    _originalTrack: Object;

    /**
     * Lib-jitsi-meet AudioMixer.
     */
    _audioMixer: Object;

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

    /**
     * Checks if the JitsiLocalTrack supports this effect.
     *
     * @param {JitsiLocalTrack} sourceLocalTrack - Track to which the effect will be applied.
     * @returns {boolean} - Returns true if this effect can run on the specified track, false otherwise.
     */
    isEnabled(sourceLocalTrack: Object) {
        // Both JitsiLocalTracks need to be audio i.e. contain an audio MediaStreamTrack
        return sourceLocalTrack.isAudioTrack() && this._mixAudio.isAudioTrack();
    }

    /**
     * Effect interface called by source JitsiLocalTrack, At this point a WebAudio ChannelMergerNode is created
     * and and the two associated MediaStreams are connected to it; the resulting mixed MediaStream is returned.
     *
     * @param {MediaStream} audioStream - Audio stream which will be mixed with _mixAudio.
     * @returns {MediaStream} - MediaStream containing both audio tracks mixed together.
     */
    startEffect(audioStream: MediaStream) {
        this._originalStream = audioStream;
        this._originalTrack = audioStream.getTracks()[0];

        this._audioMixer = JitsiMeetJS.createAudioMixer();
        this._audioMixer.addMediaStream(this._mixAudio.getOriginalStream());
        this._audioMixer.addMediaStream(this._originalStream);

        this._mixedMediaStream = this._audioMixer.start();
        this._mixedMediaTrack = this._mixedMediaStream.getTracks()[0];

        return this._mixedMediaStream;
    }

    /**
     * Reset the AudioMixer stopping it in the process.
     *
     * @returns {void}
     */
    stopEffect() {
        this._audioMixer.reset();
    }

    /**
     * Change the muted state of the effect.
     *
     * @param {boolean} muted - Should effect be muted or not.
     * @returns {void}
     */
    setMuted(muted: boolean) {
        this._originalTrack.enabled = !muted;
    }

    /**
     * Check whether or not this effect is muted.
     *
     * @returns {boolean}
     */
    isMuted() {
        return !this._originalTrack.enabled;
    }
}
