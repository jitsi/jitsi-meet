import { IReduxState } from "../../../../app/types";
import {
    getLocalParticipant,
    getParticipantDisplayName,
    getRemoteParticipants,
    hasRaisedHand,
    isScreenShareParticipant,
} from "../../../participants/functions";
import { IParticipant } from "../../../participants/types";
import {
    getVideoTrackByParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted,
} from "../../../tracks/functions.any";

export const getParticipantsWithTracks = (state: IReduxState) => {
    const localParticipant = getLocalParticipant(state);
    const remoteParticipantsMap = getRemoteParticipants(state); // change for getRemoteParticipantsSorted???
    const remoteParticipants = Array.from(remoteParticipantsMap.values());
    const allParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;

    return allParticipants
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
};
