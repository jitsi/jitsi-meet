import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getParticipantByIdOrUndefined } from '../base/participants';
import { getSourceNameSignalingFeatureFlag } from '../base/config';
import { getVideoTrackByParticipant, trackStreamingStatusChanged } from '../base/tracks';
import { VideoTrack } from '../base/media';
import { JitsiTrackEvents } from '../base/lib-jitsi-meet';
import { Avatar } from '../base/avatar';
import { DISPLAY_AVATAR, DISPLAY_VIDEO } from '../filmstrip/constants';

export function PopoutContent({ participantId }) {    
    const track = useSelector(state => {
        const participant = getParticipantByIdOrUndefined(state, participantId);
        return getVideoTrackByParticipant(state['features/base/tracks'], participant);
    });
    const displayMode = useSelector(state => state['features/popout'][participantId]?.displayMode);

    // TODO: replace this with a custom hook to be reused where track streaming status is needed.
    // TODO: In the hood the listener should updates a local track streaming status instead of that in redux store.
    const dispatch = useDispatch();
    const handleTrackStreamingStatusChanged = (jitsiTrack, streamingStatus) => {
        dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    };
    const sourceNameSignalingEnabled = useSelector(state => getSourceNameSignalingFeatureFlag(state));
    const sourceName = track?.jitsiTrack?.getSourceName();
    useEffect(() => {
        if (track && !track.local && sourceNameSignalingEnabled) {
            track.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED, handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
        }

        return () => {
            if (track && !track.local && sourceNameSignalingEnabled) {
                track.jitsiTrack.off(
                    JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    handleTrackStreamingStatusChanged
                );
                dispatch(trackStreamingStatusChanged(track.jitsiTrack, track.jitsiTrack.getTrackStreamingStatus?.()));
            }
        };
    }, [ sourceName ]);

    return <div style={{ width: '100%', height: '100%', background: 'black' }}>
        {displayMode === DISPLAY_VIDEO && <VideoTrack
            muted = { true }
            style = {{ width: '100%', height: '100%' }}
            videoTrack = { track } />}
        {displayMode === DISPLAY_AVATAR && <div
            className = 'avatar-container'
            style = {{ height: 'min(50vh, 50vw)', width: 'min(50vh, 50vw)', maxHeight: 'min(50vh, 50vw)', maxWidth: 'min(50vh, 50vw)' }}>
            <Avatar
                className = 'userAvatar'
                participantId = { participantId } />
        </div>}
    </div>
}
