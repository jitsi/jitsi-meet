import React, { useRef } from 'react';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../app/types';
import Avatar from '../../base/avatar/components/Avatar';
import { getParticipantDisplayName } from '../../base/participants/functions';
import { getVideoTrackByParticipant } from '../../base/tracks/functions.any';
import { getLargeVideoParticipant } from '../../large-video/functions';

import { useAttachTrack } from './useAttachTrack';

/**
 * Active Speaker (stage) layout for the secondary window.
 *
 * Mirrors the main window's large video: it shows whichever participant the
 * shared large-video state currently elects — the dominant speaker, a pinned
 * participant, or an auto-pinned screenshare — so the stage stays in sync with
 * the regular stage view (and follows screenshares) with zero extra logic. The
 * large-video participant is maintained globally by the large-video middleware.
 *
 * Mounted only while the Active Speaker layout is selected, so its {@code <video>}
 * is recreated on a layout switch and re-attaches the track on its own.
 *
 * @returns {React.ReactElement}
 */
const ActiveSpeakerView: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const participant = useSelector(getLargeVideoParticipant);

    // getVideoTrackByParticipant resolves a screenshare track for virtual
    // screenshare participants and the camera track otherwise.
    const videoTrack = useSelector(
        (state: IReduxState) => getVideoTrackByParticipant(state, participant)
    );
    const hasVideo = Boolean(videoTrack?.jitsiTrack && !videoTrack.muted);

    // The deployment's localized fallback name is used when the participant has
    // no display name yet.
    const participantName = useSelector((state: IReduxState) =>
        (participant ? getParticipantDisplayName(state, participant.id) : ''));

    // Attach only a live, unmuted track; the avatar is shown otherwise.
    useAttachTrack(videoRef, hasVideo ? videoTrack : undefined);

    return (
        <div className = 'multi-screen-active-speaker'>
            <div className = 'multi-screen-video-wrapper'>
                <video
                    autoPlay = { true }
                    className = { `multi-screen-video ${hasVideo ? '' : 'hidden'}` }
                    id = 'multiScreenActiveSpeakerVideo'
                    playsInline = { true }
                    ref = { videoRef } />
                { !hasVideo && (
                    <div className = 'multi-screen-avatar'>
                        <Avatar
                            participantId = { participant?.id }
                            size = { 160 } />
                    </div>
                ) }
            </div>
            <div className = 'multi-screen-name-overlay'>
                { participantName }
            </div>
        </div>
    );
};

export default ActiveSpeakerView;
