import { IReduxState } from "../../../../app/types";
import {
    getLocalParticipant,
    getLocalScreenShareParticipant,
    getParticipantDisplayName,
    getRemoteParticipants,
    hasRaisedHand,
    isScreenShareParticipant,
} from "../../../participants/functions";
import {
    getVideoTrackByParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted,
} from "../../../tracks/functions.any";

export const getParticipantsWithTracks = (state: IReduxState) => {
    const localParticipant = getLocalParticipant(state);
    const remoteParticipantsMap = getRemoteParticipants(state);
    const remoteParticipants = Array.from(remoteParticipantsMap.values());
    const allParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;

    return allParticipants
        .filter((participant) => !isScreenShareParticipant(participant))
        .map((participant) => {
            const videoTrack = getVideoTrackByParticipant(state, participant);
            const isVideoMuted = isParticipantVideoMuted(participant, state);
            const isAudioMuted = isParticipantAudioMuted(participant, state);
            const displayName = getParticipantDisplayName(state, participant.id);

            const videoEnabled = !isVideoMuted && videoTrack !== undefined;

            return {
                id: participant.id,
                name: displayName,
                videoEnabled: videoEnabled,
                audioMuted: isAudioMuted,
                videoTrack: videoTrack?.jitsiTrack,
                local: participant.local || false,
                hidden: false,
                dominantSpeaker: participant.dominantSpeaker || false,
                raisedHand: hasRaisedHand(participant),
                avatarSource: !!participant.loadableAvatarUrl ? participant.loadableAvatarUrl : participant.avatarURL,
            };
        })
        .filter((participant) => !participant.hidden);
};

export const getScreenShareParticipants = (state: IReduxState) => {
    const localScreenShare = getLocalScreenShareParticipant(state);

    const remoteParticipantsMap = getRemoteParticipants(state);
    const remoteParticipants = Array.from(remoteParticipantsMap.values());
    const allParticipants = localScreenShare ? [localScreenShare, ...remoteParticipants] : remoteParticipants;

    return allParticipants
        .filter((participant) => isScreenShareParticipant(participant))
        .map((participant) => {
            const videoTrack = getVideoTrackByParticipant(state, participant);
            const displayName = getParticipantDisplayName(state, participant.id);

            return {
                id: participant.id,
                name: displayName,
                rawName: participant?.name ?? "",
                videoEnabled: videoTrack !== undefined,
                audioMuted: true,
                videoTrack: videoTrack,
                local: participant.local || false,
                hidden: false,
                dominantSpeaker: false,
                raisedHand: false,
                avatarSource: !!participant.loadableAvatarUrl ? participant.loadableAvatarUrl : participant.avatarURL,
            };
        })
        .filter((participant) => !participant.hidden);
};
