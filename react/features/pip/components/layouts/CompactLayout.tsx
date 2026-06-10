import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant, getPinnedParticipant, getDominantSpeakerParticipant } from '../../../base/participants/functions';
import { isParticipantVideoMuted } from '../../../base/tracks/functions.any';
import { getVideoTrackByParticipant } from '../../../base/tracks/functions.web';

const CompactLayout: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const pinnedParticipant = useSelector((state: IReduxState) => getPinnedParticipant(state));
    const dominantSpeaker = useSelector((state: IReduxState) => getDominantSpeakerParticipant(state));

    // Determine active participant: pinned > dominant > local
    const activeParticipant = pinnedParticipant || dominantSpeaker || localParticipant;

    // video track for the active participant
    const videoTrack = useSelector((state: IReduxState) => {
        if (!activeParticipant) return null;
        return getVideoTrackByParticipant(state, activeParticipant);
    });

    const isVideoMuted = useSelector((state: IReduxState) => {
        if (!activeParticipant) return true;
        return isParticipantVideoMuted(activeParticipant, state);
    });

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoTrack?.jitsiTrack) return;

        if (isVideoMuted) {
            return;
        }

        videoTrack.jitsiTrack.attach(video).catch((error: Error) => {
            console.error('Failed to attach video track in CompactLayout:', error);
        });
    }, [videoTrack, isVideoMuted]);

    const participantName = activeParticipant?.name || 'You';

    return (
        <div className = 'doc-pip-compact-layout'>
            {isVideoMuted ? (
                <div className = 'doc-pip-avatar-placeholder'>
                    <Avatar
                        participantId = { activeParticipant?.id }
                        size = { 120 } />
                </div>
            ) : (
                <video
                    autoPlay = { true }
                    className = 'doc-pip-video-element'
                    muted = { true }
                    playsInline = { true }
                    ref = { videoRef } />
            )}
            <div className = 'doc-pip-participant-name'>{participantName}</div>
        </div>
    );
};

export default CompactLayout;
