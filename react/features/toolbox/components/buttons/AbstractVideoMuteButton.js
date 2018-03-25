// @flow

import PropTypes from 'prop-types';
import { Component } from 'react';

import {
    VIDEO_MUTE,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import {
    VIDEO_MUTISM_AUTHORITY,
    setVideoMuted
} from '../../../base/media';

/**
 * An abstract implementation of a button for toggling video mute.
 */
export default class AbstractVideoMuteButton extends Component<*> {
    /**
     * {@code AbstractVideoMuteButton} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the local camera is muted.
         */
        _videoMuted: PropTypes.bool,

        /**
         * Invoked to toggle video mute.
         */
        dispatch: PropTypes.func
    };

    /**
     * Initializes a new {@code AbstractVideoMuteButton} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handler so it is only bound once per instance.
        this._onToolbarToggleVideo = this._onToolbarToggleVideo.bind(this);
    }

    /**
     * Dispatches an action to toggle the mute state of the video/camera.
     *
     * @private
     * @returns {void}
     */
    _doToggleVideo() {
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


    _onToolbarToggleVideo: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for toggling
     * video mute.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleVideo() {
        sendAnalytics(createToolbarEvent(
            VIDEO_MUTE,
            {
                enable: !this.props._videoMuted
            }));

        this._doToggleVideo();
    }
}
