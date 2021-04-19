/* @flow */

import React from 'react';

import { connect } from '../../../redux';
import AbstractVideoTrack from '../AbstractVideoTrack';
import type { Props as AbstractVideoTrackProps } from '../AbstractVideoTrack';

import Video from './Video';

/**
 * The type of the React {@code Component} props of {@link VideoTrack}.
 */
type Props = AbstractVideoTrackProps & {

    /**
     * CSS classes to add to the video element.
     */
    className: string,

    /**
     * The value of the id attribute of the video. Used by the torture tests
     * to locate video elements.
     */
    id: string,

    /**
     *
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    _noAutoPlayVideo: boolean,

    /**
     * A map of the event handlers for the video HTML element.
     */
    eventHandlers?: {|

        /**
         * onAbort event handler.
         */
        onAbort?: ?Function,

        /**
         * onCanPlay event handler.
         */
        onCanPlay?: ?Function,

        /**
         * onCanPlayThrough event handler.
         */
        onCanPlayThrough?: ?Function,

        /**
         * onEmptied event handler.
         */
        onEmptied?: ?Function,

        /**
         * onEnded event handler.
         */
        onEnded?: ?Function,

        /**
         * onError event handler.
         */
        onError?: ?Function,

        /**
         * onLoadedData event handler.
         */
        onLoadedData?: ?Function,

        /**
         * onLoadedMetadata event handler.
         */
        onLoadedMetadata?: ?Function,

        /**
         * onLoadStart event handler.
         */
        onLoadStart?: ?Function,

        /**
         * onPause event handler.
         */
        onPause?: ?Function,

        /**
         * onPlay event handler.
         */
        onPlay?: ?Function,

        /**
         * onPlaying event handler.
         */
        onPlaying?: ?Function,

        /**
         * onRateChange event handler.
         */
        onRateChange?: ?Function,

        /**
         * onStalled event handler.
         */
        onStalled?: ?Function,

        /**
         * onSuspend event handler.
         */
        onSuspend?: ?Function,

        /**
         * onWaiting event handler.
         */
        onWaiting?: ?Function,
    |},

    /**
     * A styles that will be applied on the video element.
     */
    style: Object,

    /**
     * The value of the muted attribute for the underlying element.
     */
    muted?: boolean
};

/**
 * Component that renders a video element for a passed in video track and
 * notifies the store when the video has started playing.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack<Props> {
    /**
     * Default values for {@code VideoTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',

        id: ''
    };

    /**
     * Renders the video element.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        const {
            _noAutoPlayVideo,
            className,
            id,
            muted,
            videoTrack,
            style,
            eventHandlers
        } = this.props;

        return (

            <Video
                autoPlay = { !_noAutoPlayVideo }
                className = { className }
                eventHandlers = { eventHandlers }
                id = { id }
                muted = { muted }
                onVideoPlaying = { this._onVideoPlaying }
                style = { style }
                videoTrack = { videoTrack } />
        );
    }

    _onVideoPlaying: () => void;
}


/**
 * Maps (parts of) the Redux state to the associated VideoTracks props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _noAutoPlayVideo: boolean
 * }}
 */
function _mapStateToProps(state) {
    const testingConfig = state['features/base/config'].testing;

    return {
        _noAutoPlayVideo: testingConfig?.noAutoPlayVideo
    };
}

export default connect(_mapStateToProps)(VideoTrack);
