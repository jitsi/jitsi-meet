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
import { openSettingsDialog } from "../../../../settings/actions.web";
import { getConferenceName, getCurrentConference } from "../../../conference/functions";
import { PREMEETING_BUTTONS, THIRD_PARTY_PREJOIN_BUTTONS } from "../../../config/constants";
import { translate } from "../../../i18n/functions";
import RecordingWarning from "../../../premeeting/components/web/RecordingWarning";
import UnsafeRoomWarning from "../../../premeeting/components/web/UnsafeRoomWarning";
import { updateSettings } from "../../../settings/actions";
import { getDisplayName } from "../../../settings/functions.web";
import { withPixelLineHeight } from "../../../styles/functions.web";
import MeetingButton from "../../general/containers/MeetingButton";
import { loginSuccess, logout } from "../../general/store/auth/actions";
import { setCreateRoomError } from "../../general/store/errors/actions";
import { getPlanName as getPlanNameSelector } from "../../general/store/meeting/selectors";
import { useLocalStorage } from "../../LocalStorageManager";
import { ConfigService } from "../../services/config.service";
import MeetingService from "../../services/meeting.service";
import { MeetingUser } from "../../services/types/meeting.types";
import AuthModal from "../Home/containers/AuthModal";
import Header from "./components/Header";
import PreMeetingModal from "./components/PreMeetingModal";
import SecureMeetingMessage from "./components/SecureMeetingMessage";
import VideoEncodingToggle from "./containers/VideoEncodingToggle";
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
     * Function to create Meeting.
     */
    createConference?: Function;

    room: string;

    /**
     * The error messages to display.
     */
    joinRoomErrorMessage?: string;
    createRoomErrorMessage?: string;

    /**
     * Flag to indicate if supports end to end encryption.
     */
    isE2EESupported?: Function;

    /**
     * The user's plan name from Redux
     */
    planName?: string | null;
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
    room,
    joinRoomErrorMessage,
    createRoomErrorMessage,
    planName,
}: IProps) => {
    const { classes } = useStyles();
    const [isNameInputFocused, setIsNameInputFocused] = useState(false);
    const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
    const [meetingUsersData, setMeetingUsersData] = useState<MeetingUser[]>([]);
    const userData = useUserData();
    const [openLogin, setOpenLogin] = useState<boolean>(true);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

    const storageManager = useLocalStorage();
    const dispatch = useDispatch();

    const subscription = storageManager.getSubscription();

    const isInNewMeeting = window.location.href.includes("new-meeting");
    const showNameError = userName.length === 0 && !isNameInputFocused;
    const errorMessage = createRoomError ? createRoomErrorMessage : joinRoomErrorMessage;

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

    const getUsersInMeeting = async () => {
        if (!isInNewMeeting) {
            const meetingUsers = await MeetingService.instance.getCurrentUsersInCall(room);
            setMeetingUsersData(meetingUsers);
        }
    };

    useEffect(() => {
        if (meetingUsersData.length === 0) {
            getUsersInMeeting();
        }

        if (userData?.name) {
            dispatchUpdateSettings({
                displayName: userData.name,
            });
        }
    }, []);

    useEffect(() => {
        if (createRoomError) setIsCreatingMeeting(false);
    }, [createRoomError]);

    const handleNewMeeting = async () => {
        setIsCreatingMeeting(true);
        try {
            const locationURL = window.location;
            const baseUrl = `${locationURL.protocol}//${locationURL.host}`;
            const newUrl = `${baseUrl}/new-meeting`;
            window.history.pushState({}, document.title, newUrl);
            dispatch(appNavigate(newUrl));
        } catch (error: Error | any) {
            dispatch(setCreateRoomError(true, error.message));
        } finally {
            setIsCreatingMeeting(false);
        }
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

    const onLogout = () => {
        dispatch(logout());
        dispatch(redirectToStaticPage("/"));
    };

    const navigateToHomePage = () => {
        dispatch(redirectToStaticPage("/"));
    };

    return (
        <div className="flex flex-col h-full">
            <div className={`flex flex-col px-5 ${classes.container}`}>
                <Header
                    userData={userData}
                    subscription={subscription}
                    translate={t}
                    onLogin={() => {
                        setOpenLogin(true);
                        setIsAuthModalOpen(true);
                    }}
                    onSignUp={() => {
                        setOpenLogin(false);
                        setIsAuthModalOpen(true);
                    }}
                    onLogout={onLogout}
                    meetingButton={
                        isInNewMeeting ? (
                            <MeetingButton
                                onNewMeeting={handleNewMeeting}
                                translate={t}
                                loading={isCreatingMeeting}
                                className="w-full sm:w-auto"
                            />
                        ) : null
                    }
                    navigateToHomePage={navigateToHomePage}
                    onOpenSettings={() => dispatch(openSettingsDialog(undefined, true))}
                    planName={planName}
                />
                <PreMeetingModal
                    videoTrack={videoTrack}
                    videoMuted={!!videoMuted}
                    audioTrack={audioTrack}
                    userName={userName}
                    showNameError={showNameError}
                    setUserName={setName}
                    setIsNameInputFocused={setIsNameInputFocused}
                    participants={meetingUsersData}
                    joinConference={async () => {
                        if (createConference) {
                            setIsCreatingMeeting(true);
                            await createConference();
                        } else if (joinConference) {
                            joinConference();
                        }
                    }}
                    disableJoinButton={disableJoinButton || isCreatingMeeting}
                    flipX={flipX}
                    isCreatingConference={!!createConference}
                    errorMessage={errorMessage}
                />
                <AuthModal
                    isOpen={isAuthModalOpen}
                    openLogin={openLogin}
                    onClose={() => setIsAuthModalOpen(false)}
                    onSignup={(credentials) => dispatch(loginSuccess(credentials))}
                    translate={t}
                />
                <div className="flex absolute bottom-7 right-7">
                    <SecureMeetingMessage />
                </div>
                <div className={classes.videoEncodingToggleContainer}>
                    {ConfigService.instance.isDevelopment() && <VideoEncodingToggle />}
                </div>
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

    const joinRoomErrorMessage = state["features/meet-room"]?.joinRoomErrorMessage;
    const createRoomErrorMessage = state["features/meet-room"]?.createRoomErrorMessage;
    const room = state["features/base/conference"].room ?? "";
    const joinRoomError = state["features/meet-room"]?.joinRoomError ?? false;
    const createRoomError = state["features/meet-room"]?.createRoomError ?? false;
    const { joiningInProgress } = state["features/prejoin"];

    const conference = getCurrentConference(state);
    const isE2EESupported = conference?.isE2EESupported() ?? false;
    const planName = getPlanNameSelector(state);

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
        room,
        joinRoomErrorMessage,
        createRoomErrorMessage,
        isE2EESupported,
        joiningInProgress,
        planName,
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
    videoEncodingToggleContainer: {
        position: "absolute",
        bottom: "20px",
        left: "20px",
        zIndex: 999,
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
