// @flow

import PropTypes from 'prop-types';
import { Component } from 'react';

import {
    AUDIO_MUTE,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import {
    VIDEO_MUTISM_AUTHORITY,
    setAudioMuted
} from '../../../base/media';

/**
 * An abstract implementation of a button for toggling audio mute.
 */
export default class AbstractAudioMuteButton extends Component<*> {
    /**
     * {@code AbstractAudioMuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the local microphone is muted.
         */
        _audioMuted: PropTypes.bool,

        /**
         * Invoked to toggle audio mute.
         */
        dispatch: PropTypes.func
    };

    /**
     * Initializes a new {@code AbstractAudioMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handler so it is only bound once per instance.
        this._onToolbarToggleAudio = this._onToolbarToggleAudio.bind(this);
    }

    /**
     * Dispatches an action to toggle audio mute.
     *
     * @private
     * @returns {void}
     */
    _doToggleAudio() {
        // The user sees the reality i.e. the state of base/tracks and intends
        // to change reality by tapping on the respective button i.e. the user
        // sets the state of base/media. Whether the user's intention will turn
        // into reality is a whole different story which is of no concern to the
        // tapping.
        this.props.dispatch(
            setAudioMuted(
                !this.props._audioMuted,
                VIDEO_MUTISM_AUTHORITY.USER,
                /* ensureTrack */ true));
    }

    _onToolbarToggleAudio: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * audio mute.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleAudio() {
        sendAnalytics(createToolbarEvent(
            AUDIO_MUTE,
            {
                enable: !this.props._audioMuted
            }));

        this._doToggleAudio();
    }
}
