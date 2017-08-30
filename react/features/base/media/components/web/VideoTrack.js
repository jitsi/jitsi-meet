import React from 'react';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';

import Video from './Video';

/**
 * Component that renders a video element for a passed in video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
    /**
     * Default values for {@code VideoTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        ...AbstractVideoTrack.defaultProps,

        className: '',

        id: ''
    };

    /**
     * {@code VideoTrack} component's property types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractVideoTrack.propTypes,

        /**
         * CSS classes to add to the video element.
         */
        className: React.PropTypes.string,

        /**
         * The value of the id attribute of the video. Used by the torture tests
         * to locate video elements.
         */
        id: React.PropTypes.string
    };

    /**
     * Renders the video element.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        return (
            <Video
                autoPlay = { true }
                className = { this.props.className }
                id = { this.props.id }
                onVideoPlaying = { this._onVideoPlaying }
                videoTrack = { this.props.videoTrack } />
        );
    }
}

export default connect()(VideoTrack);
