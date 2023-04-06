import React, { ReactEventHandler } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import AbstractVideoTrack, { IProps as AbstractVideoTrackProps } from '../AbstractVideoTrack';

import Video from './Video';

/**
 * The type of the React {@code Component} props of {@link VideoTrack}.
 */
interface IProps extends AbstractVideoTrackProps {

    /**
     *
     * Used to determine the value of the autoplay attribute of the underlying
     * video element.
     */
    _noAutoPlayVideo: boolean;

    /**
     * CSS classes to add to the video element.
     */
    className: string;

    /**
     * A map of the event handlers for the video HTML element.
     */
    eventHandlers?: {

        /**
         * OnAbort event handler.
         */
        onAbort?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnCanPlay event handler.
         */
        onCanPlay?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnCanPlayThrough event handler.
         */
        onCanPlayThrough?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnEmptied event handler.
         */
        onEmptied?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnEnded event handler.
         */
        onEnded?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnError event handler.
         */
        onError?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadStart event handler.
         */
        onLoadStart?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadedData event handler.
         */
        onLoadedData?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnLoadedMetadata event handler.
         */
        onLoadedMetadata?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPause event handler.
         */
        onPause?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPlay event handler.
         */
        onPlay?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnPlaying event handler.
         */
        onPlaying?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnRateChange event handler.
         */
        onRateChange?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnStalled event handler.
         */
        onStalled?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnSuspend event handler.
         */
        onSuspend?: ReactEventHandler<HTMLVideoElement>;

        /**
         * OnWaiting event handler.
         */
        onWaiting?: ReactEventHandler<HTMLVideoElement>;
    };

    /**
     * The value of the id attribute of the video. Used by the torture tests
     * to locate video elements.
     */
    id: string;

    /**
     * The value of the muted attribute for the underlying element.
     */
    muted?: boolean;

    /**
     * A styles that will be applied on the video element.
     */
    style: Object;
}

/**
 * Component that renders a video element for a passed in video track and
 * notifies the store when the video has started playing.
 *
 * @augments AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack<IProps> {
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
function _mapStateToProps(state: IReduxState) {
    const testingConfig = state['features/base/config'].testing;

    return {
        _noAutoPlayVideo: Boolean(testingConfig?.noAutoPlayVideo)
    };
}

export default connect(_mapStateToProps)(VideoTrack);
