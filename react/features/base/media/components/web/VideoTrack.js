/* @flow */

import React from 'react';
import { connect } from 'react-redux';

import AbstractVideoTrack from '../AbstractVideoTrack';
import type { Props as AbstractVideoTrackProps } from '../AbstractVideoTrack';

import Video from './Video';

/**
 * The type of the React {@code Component} props of {@link VideoTrack}.
 */
type Props = {
    ...AbstractVideoTrackProps,

    /**
     * CSS classes to add to the video element.
     */
    className: string,

    /**
     * The value of the id attribute of the video. Used by the torture tests
     * to locate video elements.
     */
    id: string
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
        return (
            <Video
                autoPlay = { true }
                className = { this.props.className }
                id = { this.props.id }
                onVideoPlaying = { this._onVideoPlaying }
                videoTrack = { this.props.videoTrack } />
        );
    }

    _onVideoPlaying: () => void;
}

export default connect()(VideoTrack);
