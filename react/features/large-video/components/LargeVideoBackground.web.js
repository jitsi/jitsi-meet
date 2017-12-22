import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Video } from '../../base/media';

/**
 * Constants to describe the dimensions of the video. Landscape videos
 * are wider than they are taller and portrait videos are taller than they
 * are wider. The dimensions will determine how {@code LargeVideoBackground}
 * will strech to fill its container.
 *
 * @type {Object}
 */
export const ORIENTATION = {
    LANDSCAPE: 'landscape',
    PORTRAIT: 'portrait'
};

/**
 * A mapping of orientations to a class that should fit the
 * {@code LargeVideoBackground} into its container.
 *
 * @private
 * @type {Object}
 */
const ORIENTATION_TO_CLASS = {
    [ORIENTATION.LANDSCAPE]: 'fit-full-width',
    [ORIENTATION.PORTRAIT]: 'fit-full-height'
};

/**
 * Implements a React Component which shows a video element intended to be used
 * as a background to fill the empty space of container with another video.
 *
 * @extends Component
 */
export class LargeVideoBackground extends Component {
    /**
     * {@code LargeVideoBackground} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Additional CSS class names to add to the root of the component.
         */
        className: PropTypes.string,

        /**
         * Whether or not the background should have its visibility hidden.
         */
        hidden: PropTypes.bool,

        /**
         * Whether or not the video should display flipped horizontally, so
         * left becomes right and right becomes left.
         */
        mirror: PropTypes.bool,

        /**
         * Whether the component should ensure full width of the video is
         * displayed (landscape) or full height (portrait).
         */
        orientationFit: PropTypes.oneOf([
            ORIENTATION.LANDSCAPE,
            ORIENTATION.PORTRAIT
        ]),

        /**
         * The video stream to display.
         */
        videoTrack: PropTypes.object
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { className, hidden, mirror, orientationFit } = this.props;
        const orientationClass = orientationFit
            ? ORIENTATION_TO_CLASS[orientationFit] : '';
        const classNames = `large-video-background ${mirror ? 'flip-x' : ''} ${
            hidden ? 'invisible' : ''} ${orientationClass} ${className}`;

        return (
            <div className = { classNames }>
                <Video
                    autoPlay = { true }
                    id = 'largeVideoBackground'
                    videoTrack = {{ jitsiTrack: this.props.videoTrack }} />
            </div>
        );
    }
}
