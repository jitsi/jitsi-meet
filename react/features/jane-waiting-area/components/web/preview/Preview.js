// @flow

import React from 'react';

import { Avatar } from '../../../../base/avatar';
import { Video, isVideoMutedByUser } from '../../../../base/media';
import { connect } from '../../../../base/redux';
import { getLocalJitsiVideoTrack, getLocalVideoTrack } from '../../../../base/tracks';


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

    /**
     * Flag signaling the visibility of camera preview.
     */
    videoMuted: boolean,
    screensharing: boolean

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
        videoTrack,
        screensharing
    } = props;

    if (showCameraPreview && videoTrack) {
        return (
            <div className = 'jane-waiting-area-preview'>
                <Video
                    className = { `jane-waiting-area-preview-video ${screensharing ? '' : 'flipVideoX'} ` }
                    videoTrack = {{ jitsiTrack: videoTrack }} />
            </div>
        );
    }

    return (
        <div
            className = 'jane-waiting-area-preview jane-waiting-area-preview--no-video'>
            <Avatar
                className = 'jane-waiting-area-preview-avatar'
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
    const videoTrack = getLocalJitsiVideoTrack(state)
        || (getLocalVideoTrack(state['features/base/tracks'])
            || {}).jitsiTrack;
    const showCameraPreview = !isVideoMutedByUser(state);
    const localVideo = getLocalVideoTrack(state['features/base/tracks']);

    return {
        videoMuted: videoTrack ? !showCameraPreview : state['features/base/media'].video.muted,
        videoTrack,
        showCameraPreview,
        screensharing: localVideo && localVideo.videoType === 'desktop'

    };
}

export default connect(mapStateToProps)(Preview);
