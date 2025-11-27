import React, { useState } from "react";
import { CircleButton } from "@internxt/ui";
import { ChatCircleText, ChatIcon, MonitorArrowUpIcon, ShieldIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import { toggleChat } from "../../../../../chat/actions.web";
import { startScreenShareFlow } from "../../../../../screen-share/actions.web";
import { isScreenVideoShared } from "../../../../../screen-share/functions";
import { toggleSecurityDialog } from "../../../../../security/actions";
import { leaveConference } from "../../../../conference/actions";
import { getInviteURL } from "../../../../connection/functions";
import { translate } from "../../../../i18n/functions";
import JitsiMeetJS from "../../../../lib-jitsi-meet";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";

import { ConfigService } from "../../../services/config.service";
import InviteUserModal from "../components/InviteUserModal";
import { VideoParticipantType } from "../types";
import { getParticipantsWithTracks, getScreenShareParticipants } from "../utils";

interface ConferenceControlsProps extends WithTranslation {
    dispatch: any;
    participants?: VideoParticipantType[];
    _inviteUrl: string;
    roomID: string;
    _desktopSharingEnabled: boolean;
    _screensharing: boolean;
    _screenShareActive: boolean;
    _chatOpen: boolean;
    _chatKeysArrived: boolean;
}

const ConferenceControls = ({
    dispatch,
    participants,
    _inviteUrl,
    t,
    roomID,
    _desktopSharingEnabled,
    _screensharing,
    _screenShareActive,
    _chatOpen,
    _chatKeysArrived
}: ConferenceControlsProps) => {
    const [isOpenInviteUser, setIsOpenInviteUser] = useState(false);

    const handleInviteUser = () => {
        if (isOpenInviteUser) {
            setIsOpenInviteUser(false);
        } else {
            setIsOpenInviteUser(true);
        }
    };

    const handleScreenShare = () => {
        if (!_desktopSharingEnabled || (_screenShareActive && !_screensharing)) {
            return;
        }
        dispatch(startScreenShareFlow(!_screensharing));
    };

    const handleToggleChat = () => {
        if(_chatKeysArrived) {
            console.log("Toggling chat.");
            dispatch(toggleChat());
        }
        else {
            console.log("Chat keys have not arrived yet.");
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
            <div className="flex absolute bottom-5 left-2/4 -translate-x-2/4 z-[100]">
                <div className="flex flex-row space-x-3 p-3 justify-center items-center bg-black/50 border border-white/10 rounded-full">
                    <MediaControlsWrapper />
                    <CircleButton variant="default" onClick={handleToggleChat} active={_chatOpen}>
                        <ChatIcon
                            size={22}
                            weight={_chatOpen ? "fill" : "regular"}
                            color={_chatOpen ? "black" : "white"}
                        />
                    </CircleButton>
                    <div className={_screenShareActive && !_screensharing ? "opacity-50 pointer-events-none" : ""}>
                        <CircleButton variant="default" onClick={handleScreenShare} active={_screensharing}>
                            <MonitorArrowUpIcon
                                size={22}
                                weight={_screensharing ? "fill" : "regular"}
                                color={_screensharing ? "black" : "white"}
                            />
                        </CircleButton>
                    </div>
                    <CircleButton variant="default" onClick={handleInviteUser} active={isOpenInviteUser}>
                        <UserPlusIcon size={22} color={isOpenInviteUser ? "black" : "white"} />
                    </CircleButton>
                    <CircleButton variant="cancel" onClick={() => dispatch(leaveConference(roomID))}>
                        <XIcon size={22} color="white" />
                    </CircleButton>
                    {ConfigService.instance.isDevelopment() && (
                        <CircleButton variant="default" onClick={() => dispatch(toggleSecurityDialog())}>
                            <ShieldIcon size={22} color={"white"} weight="fill" />
                        </CircleButton>
                    )}
                </div>
            </div>
        </>
    );
};

function mapStateToProps(state: IReduxState) {
    const participantsWithTracks = getParticipantsWithTracks(state);
    const screenShareParticipants = getScreenShareParticipants(state);
    const desktopSharingEnabled = JitsiMeetJS.isDesktopSharingEnabled();

    return {
        participants: participantsWithTracks,
        _inviteUrl: getInviteURL(state),
        roomID: state["features/base/conference"].room ?? "",
        _desktopSharingEnabled: desktopSharingEnabled,
        _screensharing: isScreenVideoShared(state),
        _screenShareActive: screenShareParticipants.length > 0,
        _chatOpen: state["features/chat"].isOpen,
        _chatKeysArrived: state["features/chat"].isKeysArrived,
    };
}

export default translate(connect(mapStateToProps)(ConferenceControls));
