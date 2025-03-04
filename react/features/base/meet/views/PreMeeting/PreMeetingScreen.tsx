import React, { ReactNode, useMemo, useState } from "react";
import { connect } from "react-redux";
import { makeStyles } from "tss-react/mui";
import { translate } from "../../../i18n/functions";

import { IReduxState } from "../../../../app/types";
import DeviceStatus from "../../../../prejoin/components/web/preview/DeviceStatus";
import { isRoomNameEnabled } from "../../../../prejoin/functions";
import Toolbox from "../../../../toolbox/components/web/Toolbox";
import { isButtonEnabled } from "../../../../toolbox/functions.web";
import { getConferenceName } from "../../../conference/functions";
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from "../../../config/constants";
import { withPixelLineHeight } from "../../../styles/functions.web";

import { Button, TransparentModal } from "@internxt/ui";
import { WithTranslation } from "react-i18next";
import ConnectionStatus from "../../../premeeting/components/web/ConnectionStatus";
import RecordingWarning from "../../../premeeting/components/web/RecordingWarning";
import UnsafeRoomWarning from "../../../premeeting/components/web/UnsafeRoomWarning";
import Header from "./components/Header";

import { useFullName } from "./hooks/useFullName";
import { useUserData } from "./hooks/useUserData";

import MediaControlsWrapper from "../../general/containers/MediaControlsWrapper";
import NameInputSection from "./components/NameInputSection";
import ParticipantsList from "./components/ParticipantsList";
import VideoPreviewSection from "./components/VideoPreviewSection";
import { useParticipants } from "./hooks/useParticipants";

interface IProps extends WithTranslation {
    /**
     * The list of toolbar buttons to render.
     */
    _buttons: Array<string>;

    /**
     * The branding background of the premeeting screen(lobby/prejoin).
     */
    _premeetingBackground: string;

    /**
     * The name of the meeting that is about to be joined.
     */
    _roomName: string;

    /**
     * Children component(s) to be rendered on the screen.
     */
    children?: ReactNode;

    /**
     * Additional CSS class names to set on the icon container.
     */
    className?: string;

    /**
     * The name of the participant.
     */
    name?: string;

    /**
     * Indicates whether the copy url button should be shown.
     */
    showCopyUrlButton?: boolean;

    /**
     * Indicates whether the device status should be shown.
     */
    showDeviceStatus: boolean;

    /**
     * Indicates whether to display the recording warning.
     */
    showRecordingWarning?: boolean;

    /**
     * If should show unsafe room warning when joining.
     */
    showUnsafeRoomWarning?: boolean;

    /**
     * The 'Skip prejoin' button to be rendered (if any).
     */
    skipPrejoinButton?: ReactNode;

    /**
     * Whether it's used in the 3rdParty prejoin screen or not.
     */
    thirdParty?: boolean;

    /**
     * Title of the screen.
     */
    title?: string;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The video track to render as preview (if omitted, the default local track will be rendered).
     */
    videoTrack?: Object;

    /**
     * The audio track.
     */

    audioTrack?: any;

    /**
     * Click handler for the small icon. Opens video options.
     */
    onVideoOptionsClick?: Function;

    /**
     * Click handler for the small icon. Opens audio options.
     */
    onAudioOptionsClick?: Function;

    joinConference?: () => void;
    disableJoinButton?: boolean;
}

const PreMeetingScreen = ({
    _buttons,
    _premeetingBackground,
    children,
    showDeviceStatus,
    showRecordingWarning,
    showUnsafeRoomWarning,
    skipPrejoinButton,
    title,
    videoMuted,
    videoTrack,
    audioTrack,
    t,
    joinConference,
    disableJoinButton,
}: IProps) => {
    const { classes } = useStyles();
    const [isNameInputFocused, setIsNameInputFocused] = useState(false);
    const userData = useUserData();
    const [userName, setUserName] = useFullName(userData);
    const { allParticipants } = useParticipants();

    const showNameError = userName.length === 0 && !isNameInputFocused;

    const toolbarSection = useMemo(
        () => (
            <>
                {_buttons.length > 0 && <Toolbox toolbarButtons={_buttons} />}
                {skipPrejoinButton}
            </>
        ),
        [_buttons, skipPrejoinButton]
    );

    const warningsSection = useMemo(
        () => (
            <>
                {showUnsafeRoomWarning && <UnsafeRoomWarning />}
                {showDeviceStatus && <DeviceStatus />}
                {showRecordingWarning && <RecordingWarning />}
            </>
        ),
        [showUnsafeRoomWarning, showDeviceStatus, showRecordingWarning]
    );

    return (
        <div className="flex flex-col h-full">
            <div className={`flex flex-col px-5 ${classes.container}`}>
                <Header userData={userData} translate={t} />
                {/* Extract when finish the modal */}
                <TransparentModal
                    className={"flex p-7 bg-black/50 border border-white/15  rounded-[20px]"}
                    isOpen={true}
                    onClose={() => {}}
                    disableBackdrop
                >
                    <div className="flex flex-col h-full text-white space-y-4">
                        <VideoPreviewSection
                            videoMuted={!!videoMuted}
                            videoTrack={videoTrack}
                            isAudioMuted={audioTrack?.isMuted()}
                        />
                        <NameInputSection
                            userName={userName}
                            showNameError={showNameError}
                            setUserName={setUserName}
                            setIsNameInputFocused={setIsNameInputFocused}
                            translate={t}
                        />
                        <MediaControlsWrapper />
                        <ParticipantsList participants={allParticipants} translate={t} />
                        <Button
                            onClick={joinConference}
                            disabled={!userName || disableJoinButton}
                            variant="primary"
                            className="mt-5"
                        >
                            {t("meet.preMeeting.joinMeeting")}
                        </Button>
                    </div>
                </TransparentModal>
                <div className="flex flex-row">
                    <div>
                        <div className={classes.content}>
                            <ConnectionStatus />
                            <div className={classes.contentControls}>
                                {title && <h1 className={classes.title}>{title}</h1>}
                                {children}
                                {toolbarSection}
                                {warningsSection}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState, ownProps: Partial<IProps>) {
    const { hiddenPremeetingButtons } = state["features/base/config"];
    const { toolbarButtons } = state["features/toolbox"];
    const premeetingButtons = (ownProps.thirdParty ? THIRD_PARTY_PREJOIN_BUTTONS : PREMEETING_BUTTONS).filter(
        (b: any) => !(hiddenPremeetingButtons || []).includes(b)
    );

    const { premeetingBackground } = state["features/dynamic-branding"];

    return {
        // For keeping backwards compat.: if we pass an empty hiddenPremeetingButtons
        // array through external api, we have all prejoin buttons present on premeeting
        // screen regardless of passed values into toolbarButtons config overwrite.
        // If hiddenPremeetingButtons is missing, we hide the buttons according to
        // toolbarButtons config overwrite.
        _buttons: hiddenPremeetingButtons
            ? premeetingButtons
            : premeetingButtons.filter((b) => isButtonEnabled(b, toolbarButtons)),
        _premeetingBackground: premeetingBackground,
        _roomName: isRoomNameEnabled(state) ? getConferenceName(state) : "",
    };
}

export default translate(connect(mapStateToProps)(PreMeetingScreen));

const useStyles = makeStyles()((theme) => ({
    container: {
        height: "100%",
        position: "absolute",
        inset: "0 0 0 0",
        display: "flex",
        zIndex: 252,
        backgroundImage: 'url("../images/welcome-background.png")',
        "@media (max-width: 720px)": {
            flexDirection: "column-reverse",
        },
    },
    content: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
        boxSizing: "border-box",
        margin: "0 48px",
        width: "300px",
        height: "100%",
        zIndex: 252,

        "@media (max-width: 720px)": {
            height: "auto",
            margin: "0 auto",
        },
        "@media (max-width: 420px)": {
            padding: "16px 16px 0 16px",
            width: "100%",
        },
        "@media (max-width: 400px)": {
            padding: "16px",
        },
    },
    contentControls: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "auto",
        width: "100%",
    },
    title: {
        ...withPixelLineHeight(theme.typography.heading4),
        color: `${theme.palette.text01}!important`,
        marginBottom: theme.spacing(3),
        textAlign: "center",
        "@media (max-width: 400px)": {
            display: "none",
        },
    },
    roomName: {
        ...withPixelLineHeight(theme.typography.heading5),
        color: theme.palette.text01,
        marginBottom: theme.spacing(4),
        overflow: "hidden",
        textAlign: "center",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
    },
}));