import { Button } from "@internxt/ui";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { appNavigate } from "../../../../app/actions.web";
import { useLocalStorage } from "../../LocalStorageManager";
import MeetingButton from "../../general/containers/MeetingButton";
import { loginSuccess } from "../../general/store/auth/actions";
import { setRoomID } from "../../general/store/errors/actions";
import { isMeetingEnabled } from "../../general/store/meeting/selectors";
import MeetingService from "../../services/meeting.service";
import { useUserData } from "../PreMeeting/hooks/useUserData";
import { useAppNavigation } from "../PreMeeting/useAppNavigation";
import AuthModal from "./containers/AuthModal";
import HeaderWrapper from "./containers/HeaderWrapper";
import ScheduleMeetingModal from "./containers/ScheduleModal";

const MEETING_BASE_URL = `${window.location.protocol}//${window.location.host}/`;

interface HomePageProps {
    onLogin: (token: string) => void;
    translate: (key: string) => string;
    startNewMeeting: () => void;
    roomID?: string | null;
}

const HomePage: React.FC<HomePageProps> = ({ onLogin, translate, startNewMeeting, roomID }) => {
    const [isStartingMeeting, setIsStartingMeeting] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState<number>(0);
    const [windowHeight, setWindowHeight] = useState<number>(0);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
    const [fromNewMeetingFlow, setFromNewMeetingFlow] = useState<boolean>(false);
    const [meetingLink, setMeetingLink] = useState<string | null>(null);
    const [meetingLinkErrorMessage, setMeetingLinkErrorMessage] = useState<string | null>(null);
    const [openLogin, setOpenLogin] = useState<boolean>(true);
    const meetingService = MeetingService.instance;
    const storageManager = useLocalStorage();
    const isMeetEnabled = useSelector(isMeetingEnabled);

    useAppNavigation();
    const dispatch = useDispatch();
    const userData = useUserData();
    const isLogged = !!userData;

    const isLargeScreen = windowWidth >= 1024;
    const imageWidth = isLargeScreen ? (windowWidth * 0.4) / 0.6 : "100%";
    const imageHeight = windowHeight * 0.7;
    useEffect(() => {
        if (roomID) {
            setMeetingLink(`${MEETING_BASE_URL}${roomID}`);
        }
    }, [roomID]);

    useEffect(() => {
        const handleResize = (): void => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const startMeeting = useCallback((): void => {
        try {
            setIsStartingMeeting(true);
            startNewMeeting();
        } catch (error) {
            console.log("Error starting new meeting", error);
        } finally {
            setIsStartingMeeting(false);
        }
    }, [setIsStartingMeeting, startNewMeeting]);

    const handleJoinNow = useCallback((): void => {
        if (roomID) {
            dispatch(appNavigate(roomID));
            setIsScheduleModalOpen(false);
        }
    }, [dispatch, roomID]);

    const handleSuccessfulLogin = useCallback(
        (token: string): void => {
            onLogin(token);
            if (fromNewMeetingFlow) {
                setIsScheduleModalOpen(true);
                setFromNewMeetingFlow(false);
            }
        },
        [onLogin, fromNewMeetingFlow, meetingLink]
    );

    const handleStartMeeting = useCallback(
        async (e: unknown): Promise<void> => {
            (e as React.MouseEvent<HTMLButtonElement>).stopPropagation();

            if (!isLogged) {
                setFromNewMeetingFlow(true);
                setIsAuthModalOpen(true);
                return;
            }

            const token = storageManager.getNewToken();

            if (token) {
                try {
                    const meetingData = await meetingService.createCall();
                    dispatch(setRoomID(meetingData.room));

                    setIsScheduleModalOpen(true);
                } catch (error) {
                    setIsScheduleModalOpen(true);
                    setMeetingLinkErrorMessage((error as Error).message);
                }
            }
        },
        [isLogged, meetingLink]
    );

    return (
        <div
            className="relative min-h-screen bg-gray-900 text-white overflow-hidden"
            style={{
                backgroundImage:
                    'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("../images/welcome-background.png")',
            }}
        >
            <HeaderWrapper
                onLogin={() => {
                    setFromNewMeetingFlow(false);
                    setOpenLogin(true);
                    setIsAuthModalOpen(true);
                }}
                onSignUp={() => {
                    setFromNewMeetingFlow(false);
                    setOpenLogin(false);
                    setIsAuthModalOpen(true);
                }}
                translate={translate}
            />
            <AuthModal
                isOpen={isAuthModalOpen}
                openLogin={openLogin}
                onClose={() => setIsAuthModalOpen(false)}
                onLogin={handleSuccessfulLogin}
                onSignup={(credentials) => dispatch(loginSuccess(credentials))}
                translate={translate}
            />
            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen && (!!meetingLink || !!meetingLinkErrorMessage)}
                onClose={() => setIsScheduleModalOpen(false)}
                meetingLink={meetingLink as string}
                translate={translate}
                onJoinNow={handleJoinNow}
                errorMessage={meetingLinkErrorMessage}
            />
            <div className="flex flex-col lg:flex-row mt-10">
                <div className="flex w-full lg:w-1/2 px-4 md:px-10 lg:px-20 justify-center lg:justify-end">
                    <div className="w-full lg:w-120 px-2 md:px-4 lg:px-6 flex flex-col justify-start">
                        <p className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="block text-white text-5xl font-semibold">
                                {translate("meet.landing.title.line1")}
                            </span>
                            <span className="block text-white text-5xl font-semibold">
                                {translate("meet.landing.title.line2")}
                            </span>
                            <span className="text-primary text-5xl block">{translate("meet.landing.title.line3")}</span>
                        </p>
                        <p className="text-lg text-gray-300 mb-8 ">{translate("meet.landing.subtitle")}</p>
                        <div className="flex flex-col sm:flex-row pt-9 gap-4 border-t border-white/25 items-end">
                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <MeetingButton
                                    onNewMeeting={
                                        isLogged
                                            ? startMeeting
                                            : () => {
                                                  setOpenLogin(true);
                                                  setIsAuthModalOpen(true);
                                              }
                                    }
                                    translate={translate}
                                    loading={isStartingMeeting}
                                    className="w-full sm:w-auto"
                                    displayUpgradeButton
                                    displayNewMeetingButtonAlways
                                />
                                {(!isLogged || (isLogged && isMeetEnabled)) && (
                                    <Button
                                        variant={"tertiary"}
                                        onClick={handleStartMeeting}
                                        disabled={isStartingMeeting}
                                        loading={isStartingMeeting}
                                        className="w-full sm:w-auto"
                                    >
                                        {translate("meet.landing.scheduleMeeting")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="w-full lg:w-1/2 relative flex items-center justify-center lg:justify-end lg:items-start mt-8 lg:mt-0 overflow-hidden"
                    style={{ height: isLargeScreen ? `${imageHeight}px` : "auto" }}
                >
                    <div
                        className={`${isLargeScreen ? "absolute top-0" : "relative"}`}
                        style={{
                            width: isLargeScreen ? imageWidth : "90%",
                            right: isLargeScreen ? "-40%" : "auto",
                            filter: "drop-shadow(0px 25px 50px rgba(0, 0, 0, 0.15)) drop-shadow(0px 8px 10px rgba(0, 0, 0, 0.1))",
                        }}
                    >
                        <img
                            src={"./images/gallery.png"}
                            alt="Video call preview"
                            className="w-full h-auto"
                            style={{
                                maxHeight: isLargeScreen ? `${imageHeight}px` : "auto",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
