import React from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import LargeVideoWeb from "../../../../../large-video/components/LargeVideo.web";
import { translate } from "../../../../i18n/functions";
import {
    getLocalParticipant,
    getParticipantDisplayName,
    getRemoteParticipants,
    hasRaisedHand,
    isScreenShareParticipant,
} from "../../../../participants/functions";
import {
    getVideoTrackByParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted,
} from "../../../../tracks/functions.any";
import VideoGallery from "../components/VideoGallery";
import { VideoParticipantType } from "../types";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    participants?: VideoParticipantType[];
}

const GalleryVideoWrapper = ({ videoMode, participants, t }: GalleryVideoWrapperProps) => {
    if (videoMode === "gallery") {
        return (
            <div className="h-full w-full overflow-hidden bg-gray-950">
                <VideoGallery participants={participants ?? []} translate={t} />
            </div>
        );
    }
    // For speaker mode - not implemented yer, for now we just show the large video of jitsi
    return <LargeVideoWeb />;
};

function mapStateToProps(state: IReduxState, galleryProps: GalleryVideoWrapperProps) {
    const localParticipant = getLocalParticipant(state);

    const remoteParticipantsMap = getRemoteParticipants(state); // change for getRemoteParticipantsSorted???
    const remoteParticipants = Array.from(remoteParticipantsMap.values());
    const allParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;

    const participantsWithTracks = allParticipants
        .filter((participant) => !isScreenShareParticipant(participant))
        .map((participant) => {
            const videoTrack = getVideoTrackByParticipant(state, participant);
            const isVideoMuted = isParticipantVideoMuted(participant, state);
            const isAudioMuted = isParticipantAudioMuted(participant, state);
            const displayName = getParticipantDisplayName(state, participant.id);
            return {
                id: participant.id,
                name: displayName,
                videoEnabled: !isVideoMuted && videoTrack !== undefined,
                audioMuted: isAudioMuted,
                videoTrack: videoTrack?.jitsiTrack,
                local: participant.local || false,
                hidden: false,
                dominantSpeaker: participant.dominantSpeaker || false,
                raisedHand: hasRaisedHand(participant),
            };
        })
        .filter((participant) => !participant.hidden);

    return {
        videoMode: galleryProps.videoMode || "gallery",
        participants: participantsWithTracks,
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
