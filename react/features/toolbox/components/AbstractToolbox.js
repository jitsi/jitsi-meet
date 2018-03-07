// @flow

import { Component } from 'react';

import {
    AUDIO_MUTE,
    VIDEO_MUTE,
    createToolbarEvent,
    sendAnalytics
} from '../../analytics';
import {
    VIDEO_MUTISM_AUTHORITY,
    setAudioMuted,
    setVideoMuted
} from '../../base/media';

export type Props = {

    /**
     * Flag showing that audio is muted.
     */
    _audioMuted: boolean,

    /**
     * Flag showing whether video is muted.
     */
    _videoMuted: boolean,

    dispatch: Function
};

/**
 * Some doc here.
 */
export default class AbstractToolbox extends Component<*, *> {
    _onToggleAudio: () => void;

    /**
     * Dispatches an action to toggle the mute state of the audio/microphone.
     *
     * @private
     * @returns {void}
     */
    _onToggleAudio() {
        const mute = !this.props._audioMuted;

        sendAnalytics(createToolbarEvent(
            AUDIO_MUTE,
            {
                enable: mute
            }));

        // The user sees the reality i.e. the state of base/tracks and intends
        // to change reality by tapping on the respective button i.e. the user
        // sets the state of base/media. Whether the user's intention will turn
        // into reality is a whole different story which is of no concern to the
        // tapping.
        this.props.dispatch(
            setAudioMuted(
                mute,
                VIDEO_MUTISM_AUTHORITY.USER,
                /* ensureTrack */ true));
    }

    _onToggleVideo: () => void;

    /**
     * Dispatches an action to toggle the mute state of the video/camera.
     *
     * @private
     * @returns {void}
     */
    _onToggleVideo() {
        const mute = !this.props._videoMuted;

        sendAnalytics(createToolbarEvent(
            VIDEO_MUTE,
            {
                enable: mute
            }));

        // The user sees the reality i.e. the state of base/tracks and intends
        // to change reality by tapping on the respective button i.e. the user
        // sets the state of base/media. Whether the user's intention will turn
        // into reality is a whole different story which is of no concern to the
        // tapping.
        this.props.dispatch(
            setVideoMuted(
                !this.props._videoMuted,
                VIDEO_MUTISM_AUTHORITY.USER,
                /* ensureTrack */ true));
    }
}
