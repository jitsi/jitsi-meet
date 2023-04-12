import React, { Component } from 'react';

import { IStore } from '../../../app/types';
import { trackVideoStarted } from '../../tracks/actions';
import { shouldRenderVideoTrack } from '../functions';

import { Video } from './index';

/**
 * The type of the React {@code Component} props of {@link AbstractVideoTrack}.
 */
export interface IProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Callback to invoke when the {@link Video} of {@code AbstractVideoTrack}
     * is clicked/pressed.
     */
    onPress?: Function;

    /**
     * The Redux representation of the participant's video track.
     */
    videoTrack?: any;

    /**
     * Whether or not video should be rendered after knowing video playback has
     * started.
     */
    waitForVideoStarted?: boolean;

    /**
     * The z-order of the Video of AbstractVideoTrack in the stacking space of
     * all Videos. For more details, refer to the zOrder property of the Video
     * class for React Native.
     */
    zOrder?: number;

    /**
     * Indicates whether zooming (pinch to zoom and/or drag) is enabled.
     */
    zoomEnabled?: boolean;
}

/**
 * Implements a React {@link Component} that renders video element for a
 * specific video track.
 *
 * @abstract
 */
export default class AbstractVideoTrack<P extends IProps> extends Component<P> {
    /**
     * Initializes a new AbstractVideoTrack instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onVideoPlaying = this._onVideoPlaying.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const videoTrack = _falsy2null(this.props.videoTrack);
        let render;

        if (this.props.waitForVideoStarted && videoTrack) {
            // That's the complex case: we have to wait for onPlaying before we
            // render videoTrack. The complexity comes from the fact that
            // onPlaying will come after we render videoTrack.
            if (shouldRenderVideoTrack(videoTrack, true)) {
                // It appears that onPlaying has come for videoTrack already.
                // Most probably, another render has already passed through the
                // else clause below already.
                render = true;
            } else if (shouldRenderVideoTrack(videoTrack, false)
                    && !videoTrack.videoStarted) {
                // XXX Unfortunately, onPlaying has not come for videoTrack yet.
                // We have to render in order to give onPlaying a chance to
                // come.
                render = true;
            }
        } else {
            // That's the simple case: we don't have to wait for onPlaying
            // before we render videoTrack
            render = shouldRenderVideoTrack(videoTrack, false);
        }

        const stream = render && videoTrack
            ? videoTrack.jitsiTrack.getOriginalStream() : null;

        // Actual zoom is currently only enabled if the stream is a desktop
        // stream.
        const zoomEnabled
            = this.props.zoomEnabled
                && stream
                && videoTrack
                && videoTrack.videoType === 'desktop';

        return (
            <Video
                mirror = { videoTrack?.mirror }
                onPlaying = { this._onVideoPlaying }

                // @ts-ignore
                onPress = { this.props.onPress }
                stream = { stream }
                zOrder = { this.props.zOrder }
                zoomEnabled = { zoomEnabled } />
        );
    }

    /**
     * Handler for case when video starts to play.
     *
     * @private
     * @returns {void}
     */
    _onVideoPlaying() {
        const { videoTrack } = this.props;

        if (videoTrack && !videoTrack.videoStarted) {
            this.props.dispatch(trackVideoStarted(videoTrack.jitsiTrack));
        }
    }
}

/**
 * Returns null if a specific value is falsy; otherwise, returns the specified
 * value.
 *
 * @param {*} value - The value to return if it is not falsy.
 * @returns {*} If the specified value is falsy, null; otherwise, the specified
 * value.
 */
function _falsy2null(value: any) {
    return value || null;
}
