import React from 'react';
import { connect } from 'react-redux';

import AbstractVideoTrack, { IProps } from '../AbstractVideoTrack';

/**
 * Component that renders video element for a specified video track.
 *
 * @augments AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack<IProps> {

    /**
     * Renders the video element for the associated video track.
     *
     * @override
     * @returns {ReactElement}
     */
    render() {
        const { fallbackView, videoTrack } = this.props;

        return (
            <>
                {
                    videoTrack?.muted ? fallbackView : super.render()
                }
            </>
        );
    }
}

export default connect()(VideoTrack);
