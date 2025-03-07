import { CircleButton } from "@internxt/ui";
import { UserPlus, X } from "@phosphor-icons/react";
import React, { useState } from "react";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import { leaveConference } from "../../../../conference/actions";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";
import InviteUser from "../components/InviteUser";
import {
    getLocalParticipant,
    getRemoteParticipants,
    isScreenShareParticipant,
    getParticipantDisplayName,
    hasRaisedHand,
} from "../../../../participants/functions";
import {
    getVideoTrackByParticipant,
    isParticipantVideoMuted,
    isParticipantAudioMuted,
} from "../../../../tracks/functions.any";
import { VideoParticipantType } from "../types";
import { getInviteURL } from "../../../../connection/functions";
import { translate } from "../../../../i18n/functions";
import { WithTranslation } from "react-i18next";

interface IProps {
    dispatch: any;
    participants?: VideoParticipantType[];
    _inviteUrl: string;
}

interface ConferenceControlsProps extends WithTranslation {
    dispatch: any;
    participants?: VideoParticipantType[];
    _inviteUrl: string;
}

const ConferenceControls = ({ dispatch, participants, _inviteUrl, t }: ConferenceControlsProps) => {
    const [isOpenInviteUser, setIsOpenInviteUser] = useState(false);

    const handleInviteUser = () => {
        if (isOpenInviteUser) {
            setIsOpenInviteUser(false);
        } else {
            setIsOpenInviteUser(true);
        }
    };

    return (
        <>
            <InviteUser
                isOpen={isOpenInviteUser}
                onClose={handleInviteUser}
                translate={t}
                participantsCount={participants?.length}
                inviteUrl={_inviteUrl}
            />
            <div className="flex absolute bottom-5 left-2/4 -translate-x-2/4">
                <div className="flex flex-row space-x-3 p-3 justify-center items-center bg-black/50 border border-white/10 rounded-full">
                    <MediaControlsWrapper />
                    <CircleButton variant="default" onClick={handleInviteUser} active={isOpenInviteUser}>
                        <UserPlus size={22} color={isOpenInviteUser ? "black" : "white"} />
                    </CircleButton>
                    <CircleButton variant="cancel" onClick={() => dispatch(leaveConference())}>
                        <X size={22} color="white" />
                    </CircleButton>
                </div>
            </div>
        </>
    );
};

function mapStateToProps(state: IReduxState) {
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
        participants: participantsWithTracks,
        _inviteUrl: getInviteURL(state),
    };
}

export default translate(connect(mapStateToProps)(ConferenceControls));
