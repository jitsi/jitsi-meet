import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { WithTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { makeStyles } from "tss-react/mui";
import { IReduxState } from "../../../../app/types";
import DeviceStatus from "../../../../prejoin/components/web/preview/DeviceStatus";
import { isRoomNameEnabled } from "../../../../prejoin/functions";
import Toolbox from "../../../../toolbox/components/web/Toolbox";
import { isButtonEnabled } from "../../../../toolbox/functions.web";

import { redirectToStaticPage } from "../../../../app/actions.any";
import { appNavigate } from "../../../../app/actions.web";
import { getConferenceName } from "../../../conference/functions";
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from "../../../config/constants";
import { translate } from "../../../i18n/functions";
import RecordingWarning from "../../../premeeting/components/web/RecordingWarning";
import UnsafeRoomWarning from "../../../premeeting/components/web/UnsafeRoomWarning";
import { updateSettings } from "../../../settings/actions";
import { getDisplayName } from "../../../settings/functions.web";
import { withPixelLineHeight } from "../../../styles/functions.web";
import { setCreateRoomError } from "../../general/store/errors/actions";
import { useLocalStorage } from "../../LocalStorageManager";
import { ErrorModals, ErrorType } from "./components/ErrorModals";
import Header from "./components/Header";
import PreMeetingModal from "./components/PreMeetingModal";
import { useParticipants } from "./hooks/useParticipants";
import { useUserData } from "./hooks/useUserData";

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

    /**
     * Function to handle the join conference action.
     */
    joinConference?: () => void;

    /**
     * Flag to disable the join button.
     */
    disableJoinButton?: boolean;

    /**
     * Updates settings.
     */
    updateSettings: Function;

    /**
     * The display name of the user.
     */
    userName: string;

    /**
     * Flag to indicate if there was an error joining the room.
     */
    joinRoomError?: boolean;

    /**
     * Flag to indicate if there was an error creating the room.
     */
    createRoomError?: boolean;

    /**
     * Flag to indicate if the video is mirrored.
     */
    flipX?: boolean;

    /**
     * Flag to indicate if conference is creating.
     */
    createConference?: Function;
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
    updateSettings: dispatchUpdateSettings,
    userName,
    joinRoomError,
    createRoomError,
    flipX,
    createConference,
}: IProps) => {
    const { classes } = useStyles();
    const [isNameInputFocused, setIsNameInputFocused] = useState(false);
    const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
    const userData = useUserData();
    const { allParticipants } = useParticipants();
    const storageManager = useLocalStorage();
    const dispatch = useDispatch();

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

    useEffect(() => {
        if (userData?.name) {
            dispatchUpdateSettings({
                displayName: userData.name,
            });
        }
    }, []);

    const handleRedirectToLogin = () => {
        dispatch(redirectToStaticPage("/"));
    };

    const handleNewMeeting = async () => {
        setIsCreatingMeeting(true);
        try {
            const locationURL = window.location;
            const baseUrl = `${locationURL.protocol}//${locationURL.host}`;
            const newUrl = `${baseUrl}/new-meeting`;
            window.history.replaceState({}, document.title, newUrl);
            dispatch(appNavigate(newUrl));
        } catch (error) {
            console.error("Error creating new meeting:", error);
            dispatch(setCreateRoomError(true));
        } finally {
            setIsCreatingMeeting(false);
        }
    };

    const handleRedirectToSignUp = () => {
        // HARDCODED, MODIFY WHEN SIGN UP PAGE IS READY
        window.location.href = "https://drive.internxt.com/new";
    };

    const updateNameInStorage = (name: string) => {
        try {
            const user = storageManager.getUser();

            if (user) {
                const updatedUser = {
                    ...user,
                    name: name,
                };

                storageManager.setUser(updatedUser);
            }
        } catch (error) {
            console.error("Error updating user name in localStorage:", error);
        }
    };
    const setName = (displayName: string) => {
        dispatchUpdateSettings({
            displayName,
        });

        updateNameInStorage(displayName);
    };

    const handleGoHome = () => {
        window.location.href = "/";
    };

    const getErrorType = (): ErrorType | undefined => {
        if (createRoomError) return "createRoom";
        if (joinRoomError) return "joinRoom";
        return undefined;
    };

    return (
        <div className="flex flex-col h-full">
            <div className={`flex flex-col px-5 ${classes.container}`}>
                <Header
                    userData={userData}
                    translate={t}
                    onLogin={handleRedirectToLogin}
                    onSignUp={handleRedirectToSignUp}
                    onNewMeeting={handleNewMeeting}
                    isCreatingMeeting={isCreatingMeeting}
                />
                <ErrorModals
                    errorType={getErrorType()}
                    translate={t}
                    onGoHome={handleGoHome}
                    onRetry={() => {
                        dispatch(setCreateRoomError(false));
                        handleNewMeeting();
                    }}
                />

                {!getErrorType() && (
                    <PreMeetingModal
                        videoTrack={videoTrack}
                        videoMuted={!!videoMuted}
                        audioTrack={audioTrack}
                        userName={userName}
                        showNameError={showNameError}
                        setUserName={setName}
                        setIsNameInputFocused={setIsNameInputFocused}
                        participants={allParticipants}
                        joinConference={async () => {
                            createConference && (await createConference());
                            joinConference && joinConference();
                        }}
                        disableJoinButton={disableJoinButton}
                        flipX={flipX}
                        isCreatingConference={!!createConference}
                    />
                )}
                {/* UNCOMMENT IN DEV MODE TO SEE OLD IMPLEMENTATION  */}
                {/* <div className="flex flex-row">
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
                </div> */}
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
    const userName = getDisplayName(state);
    const { localFlipX } = state["features/base/settings"];

    const joinRoomError = state["features/join-room-error"]?.joinRoomError || false;
    const createRoomError = state["features/join-room-error"]?.createRoomError || false;
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
        userName,
        joinRoomError,
        createRoomError,
        flipX: localFlipX,
    };
}

const mapDispatchToProps = { updateSettings };

export default translate(connect(mapStateToProps, mapDispatchToProps)(PreMeetingScreen));

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
