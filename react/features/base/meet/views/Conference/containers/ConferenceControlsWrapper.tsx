import { CircleButton } from "@internxt/ui";
import { Shield, UserPlus, X } from "@phosphor-icons/react";
import React from "react";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import {
    close as closeParticipantsPane,
    open as openParticipantsPane,
} from "../../../../../participants-pane/actions.web";
import { toggleSecurityDialog } from "../../../../../security/actions";
import { leaveConference } from "../../../../conference/actions";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";

interface IProps {
    isParticipantsPaneOpened: boolean;
    dispatch: any;
}

const ConferenceControls: React.FC<IProps> = ({ isParticipantsPaneOpened, dispatch }) => {
    const toggleParticipantsPane = () => {
        if (isParticipantsPaneOpened) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
    };

    return (
        <div className="flex absolute bottom-5 left-2/4 -translate-x-2/4">
            <div className="flex flex-row space-x-3 p-3 justify-center items-center bg-black/50 border border-white/10 rounded-full">
                <MediaControlsWrapper />
                <CircleButton variant="default" onClick={toggleParticipantsPane} active={isParticipantsPaneOpened}>
                    <UserPlus size={22} color={isParticipantsPaneOpened ? "black" : "white"} />
                </CircleButton>
                <CircleButton variant="cancel" onClick={() => dispatch(leaveConference())}>
                    <X size={22} color="white" />
                </CircleButton>
                <CircleButton variant="default" onClick={() => dispatch(toggleSecurityDialog())}>
                    <Shield size={22} color={"white"} weight="fill" />
                </CircleButton>
            </div>
        </div>
    );
};

const mapStateToProps = (state: IReduxState) => {
    const { isOpen: isParticipantsPaneOpened } = state["features/participants-pane"];

    return {
        isParticipantsPaneOpened,
    };
};

export default connect(mapStateToProps)(ConferenceControls);
