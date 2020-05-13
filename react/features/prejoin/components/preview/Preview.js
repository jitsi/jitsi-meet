// @flow

import React from 'react';
import { Avatar } from '../../../base/avatar';
import { Video } from '../../../base/media';
import { connect } from '../../../base/redux';
import { getActiveVideoTrack, isPrejoinVideoMuted } from '../../functions';

export type Props = {

    /**
     * The name of the user that is about to join.
     */
    name: string,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object,
};

/**
 * Component showing the video preview and device status.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function Preview(props: Props) {
    const {
        name,
        showCameraPreview,
        videoTrack
    } = props;

    if (showCameraPreview && videoTrack) {
        return (
            <div className = 'prejoin-preview'>
                <div className = 'prejoin-preview-overlay' />
                <div className = 'prejoin-preview-bottom-overlay' />
                <Video
                    className = 'flipVideoX prejoin-preview-video'
                    videoTrack = {{ jitsiTrack: videoTrack }} />
            </div>
        );
    }

    return (
        <div className = 'prejoin-preview prejoin-preview--no-video'>
            <Avatar
                className = 'prejoin-preview-avatar'
                displayName = { name }
                size = { 200 } />
        </div>
    );
}

/**
 * Maps the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        videoTrack: getActiveVideoTrack(state),
        showCameraPreview: !isPrejoinVideoMuted(state)
    };
}

export default connect(mapStateToProps)(Preview);
