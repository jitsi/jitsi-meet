import React, { Component } from 'react';

import { trackVideoStarted } from '../../tracks';

import { shouldRenderVideoTrack } from '../functions';
import { Video } from './_';

/**
 * Component that renders video element for a specified video track.
 *
 * @abstract
 */
export class AbstractVideoTrack extends Component {
    /**
     * AbstractVideoTrack component's property types.
     *
     * @static
     */
    static propTypes = {
        dispatch: React.PropTypes.func,
        videoTrack: React.PropTypes.object,
        waitForVideoStarted: React.PropTypes.bool,

        /**
         * The z-order of the Video of AbstractVideoTrack in the stacking space
         * of all Videos. For more details, refer to the zOrder property of the
         * Video class for React Native.
         */
        zOrder: React.PropTypes.number
    }

    /**
     * Initializes a new AbstractVideoTrack instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            videoTrack: _falsy2null(props.videoTrack)
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onVideoPlaying = this._onVideoPlaying.bind(this);
    }

    /**
     * Implements React's {@link Component#componentWillReceiveProps()}.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        const oldValue = this.state.videoTrack;
        const newValue = _falsy2null(nextProps.videoTrack);

        if (oldValue !== newValue) {
            this._setVideoTrack(newValue);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const videoTrack = this.state.videoTrack;
        let render;

        if (this.props.waitForVideoStarted) {
            // That's the complex case: we have to wait for onPlaying before we
            // render videoTrack. The complexity comes from the fact that
            // onPlaying will come after we render videoTrack.
            if (shouldRenderVideoTrack(videoTrack, true)) {
                // It appears that onPlaying has come for videoTrack already.
                // Most probably, another render has already passed through the
                // else clause bellow already.
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

        const stream
            = render ? videoTrack.jitsiTrack.getOriginalStream() : null;

        return (
            <Video
                mirror = { videoTrack && videoTrack.mirrorVideo }
                onPlaying = { this._onVideoPlaying }
                stream = { stream }
                zOrder = { this.props.zOrder } />
        );
    }

    /**
     * Handler for case when video starts to play.
     *
     * @private
     * @returns {void}
     */
    _onVideoPlaying() {
        const videoTrack = this.props.videoTrack;

        if (videoTrack && !videoTrack.videoStarted) {
            this.props.dispatch(trackVideoStarted(videoTrack.jitsiTrack));
        }
    }

    /**
     * Sets a specific video track to be rendered by this instance.
     *
     * @param {Track} videoTrack - The video track to be rendered by this
     * instance.
     * @protected
     * @returns {void}
     */
    _setVideoTrack(videoTrack) {
        this.setState({ videoTrack });
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
function _falsy2null(value) {
    return value || null;
}
