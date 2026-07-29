import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { getLocalParticipant, getParticipantDisplayName } from '../../../base/participants/functions';
import { isTrackStreamingStatusActive } from '../../../connection-indicator/functions';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isPrejoinPageVisible } from '../../../prejoin/functions.any';
import { getPiPVideoTrack } from '../../functions';
import logger from '../../logger';

const CompactLayout: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const isOnPrejoin = useSelector(isPrejoinPageVisible);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const participant = isOnPrejoin ? localParticipant : largeVideoParticipant;
    const videoTrack = useSelector((state: IReduxState) => getPiPVideoTrack(state, participant));
    const participantName = useSelector((state: IReduxState) =>
        participant?.id ? getParticipantDisplayName(state, participant.id) : '');
    const shouldShowAvatar = !videoTrack
        || videoTrack.muted
        || (!videoTrack.local && !isTrackStreamingStatusActive(videoTrack));

    /**
     * Attach the active track and detach it whenever the track changes or the layout unmounts.
     */
    useEffect(() => {
        const video = videoRef.current;

        if (!video || shouldShowAvatar || !videoTrack?.jitsiTrack) {
            return;
        }

        videoTrack.jitsiTrack.attach(video).catch((error: Error) => {
            logger.error('Failed to attach video track in CompactLayout:', error);
        });

        return () => {
            try {
                videoTrack.jitsiTrack.detach(video);
            } catch (error) {
                logger.error('Failed to detach video track in CompactLayout:', error);
            }
        };
    }, [ videoTrack, shouldShowAvatar ]);

    return (
        <div className = 'doc-pip-compact-layout'>
            {shouldShowAvatar ? (
                <div className = 'doc-pip-avatar-placeholder'>
                    <Avatar
                        participantId = { participant?.id }
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
