// @flow

import React from 'react';

import { getDisplayName } from '../../../../base/settings';
import { Avatar } from '../../../avatar';
import { Video } from '../../../media';
import { getLocalParticipant } from '../../../participants';
import { connect } from '../../../redux';
import { getLocalVideoTrack } from '../../../tracks';

export type Props = {

    /**
     * Local participant id.
     */
    _participantId: string,

    /**
     * Flag controlling whether the video should be flipped or not.
     */
    flipVideo: boolean,

    /**
     * The name of the user that is about to join.
     */
     name: string,

    /**
     * Flag signaling the visibility of camera preview.
     */
    videoMuted: boolean,

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
    const { _participantId, flipVideo, name, videoMuted, videoTrack } = props;
    const className = flipVideo ? 'flipVideoX' : '';

    return (
        <div id = 'preview'>
            {!videoMuted && videoTrack
                ? (
                    <Video
                        className = { className }
                        videoTrack = {{ jitsiTrack: videoTrack }} />
                )
                : (
                    <Avatar
                        className = 'premeeting-screen-avatar'
                        displayName = { name }
                        participantId = { _participantId }
                        size = { 200 } />
                )}
        </div>
    );
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
function _mapStateToProps(state, ownProps) {
    const name = getDisplayName(state);
    const { id: _participantId } = getLocalParticipant(state);

    return {
        _participantId,
        flipVideo: state['features/base/settings'].localFlipX,
        name,
        videoMuted: ownProps.videoTrack ? ownProps.videoMuted : state['features/base/media'].video.muted,
        videoTrack: ownProps.videoTrack || (getLocalVideoTrack(state['features/base/tracks']) || {}).jitsiTrack
    };
}

export default connect(_mapStateToProps)(Preview);
