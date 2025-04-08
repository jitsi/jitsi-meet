import { CircleButton } from "@internxt/ui";
import { UserPlus, X } from "@phosphor-icons/react";
import React, { useState } from "react";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import { leaveConference } from "../../../../conference/actions";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";

import { VideoParticipantType } from "../types";
import { getInviteURL } from "../../../../connection/functions";
import { translate } from "../../../../i18n/functions";
import { WithTranslation } from "react-i18next";
import { getParticipantsWithTracks } from "../utils";
import InviteUserModal from "../components/InviteUserModal";

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
            <InviteUserModal
                isOpen={isOpenInviteUser}
                onClose={handleInviteUser}
                translate={t}
                participantsCount={participants?.length ?? 0}
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
    const participantsWithTracks = getParticipantsWithTracks(state);

    return {
        participants: participantsWithTracks,
        _inviteUrl: getInviteURL(state),
    };
}

export default translate(connect(mapStateToProps)(ConferenceControls));
