import React from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
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
import VideoSpeaker from "../components/VideoSpeaker";
import { VideoParticipantType } from "../types";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    participants?: VideoParticipantType[];
}

const GalleryVideoWrapper = ({ videoMode, participants, t }: GalleryVideoWrapperProps) => {
    return (
        <div className="h-full w-full overflow-hidden bg-gray-950">
            <div className={videoMode === "gallery" ? "block" : "hidden"}>
                <VideoGallery participants={participants ?? []} translate={t} />
            </div>
            <div className={videoMode === "speaker" ? "block" : "hidden"}>
                <VideoSpeaker participants={participants ?? []} translate={t} />
            </div>
        </div>
    );
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
