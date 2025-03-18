import { Button } from "@internxt/ui";
import React, { useCallback, useEffect, useState } from "react";
import { useUserData } from "../PreMeeting/hooks/useUserData";
import AuthModal from "./containers/AuthModal";
import HeaderWrapper from "./containers/HeaderWrapper";

interface SimpleTooltipProps {
    text: string;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ text }) => {
    return (
        <div className="absolute -top-14 left-0 right-0 w-full text-center">
            <div className="inline-block bg-white dark:bg-gray-90 text-gray-90 dark:text-white px-3 py-2 rounded shadow-md text-xs">
                {text}
                <div className="absolute bottom-[-6px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white dark:border-t-gray-90"></div>
            </div>
        </div>
    );
};

interface HomePageProps {
    onLogin: (token: string) => void;
    translate: (key: string) => string;
    startNewMeeting: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLogin, translate, startNewMeeting }) => {
    const [isStartingMeeting, setIsStartingMeeting] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState<number>(0);
    const [windowHeight, setWindowHeight] = useState<number>(0);

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [showNewMeetingTooltip, setShowNewMeetingTooltip] = useState<boolean>(false);
    const [showScheduleTooltip, setShowScheduleTooltip] = useState<boolean>(false);

    const userData = useUserData();
    const isLogged = !!userData;

    useEffect(() => {
        const handleResize = (): void => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        let newMeetingTimer: NodeJS.Timeout | undefined;
        let scheduleTimer: NodeJS.Timeout | undefined;

        if (showNewMeetingTooltip) {
            newMeetingTimer = setTimeout(() => {
                setShowNewMeetingTooltip(false);
            }, 2000);
        }

        if (showScheduleTooltip) {
            scheduleTimer = setTimeout(() => {
                setShowScheduleTooltip(false);
            }, 2000);
        }

        return () => {
            if (newMeetingTimer) clearTimeout(newMeetingTimer);
            if (scheduleTimer) clearTimeout(scheduleTimer);
        };
    }, [showNewMeetingTooltip, showScheduleTooltip]);

    useEffect(() => {
        const handleGlobalClick = (): void => {
            setShowNewMeetingTooltip(false);
            setShowScheduleTooltip(false);
        };

        document.addEventListener("click", handleGlobalClick);

        return () => {
            document.removeEventListener("click", handleGlobalClick);
        };
    }, []);

    const isLargeScreen = windowWidth >= 1024;
    const imageWidth = isLargeScreen ? (windowWidth * 0.4) / 0.6 : "100%";
    const imageHeight = windowHeight * 0.7;

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

    const handleStartMeeting = useCallback(
        async (e: unknown): Promise<void> => {
            (e as React.MouseEvent<HTMLButtonElement>).stopPropagation();

            if (!isLogged) {
                setShowNewMeetingTooltip(true);
                setShowScheduleTooltip(false);
                return;
            }

            startMeeting();
        },
        [isLogged, setIsStartingMeeting, startMeeting]
    );

    const handleScheduleMeeting = useCallback(
        (e: unknown): void => {
            (e as React.MouseEvent<HTMLButtonElement>).stopPropagation();

            if (!isLogged) {
                setShowScheduleTooltip(true);
                setShowNewMeetingTooltip(false);

                return;
            }
        },
        [isLogged, setShowScheduleTooltip, setShowNewMeetingTooltip]
    );

    return (
        <div
            className="relative min-h-screen bg-gray-900 text-white overflow-hidden"
            style={{
                backgroundImage:
                    'linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url("../images/welcome-background.png")',
            }}
        >
            <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} onLogin={onLogin} translate={translate} />
            <HeaderWrapper onLogin={() => setIsOpen(true)} translate={translate} onNewMeeting={startMeeting} />
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
                            <div className="relative inline-block">
                                <Button
                                    onClick={handleStartMeeting}
                                    loading={isStartingMeeting}
                                    className="w-full sm:w-auto"
                                >
                                    {translate("meet.preMeeting.newMeeting")}
                                </Button>

                                {showNewMeetingTooltip && (
                                    <SimpleTooltip text={translate("meet.landing.loginRequired")} />
                                )}
                            </div>

                            <div className="relative inline-block">
                                <Button onClick={handleScheduleMeeting} variant="tertiary" className="w-full sm:w-auto">
                                    {translate("meet.landing.scheduleMeeting")}
                                </Button>

                                {showScheduleTooltip && (
                                    <SimpleTooltip text={translate("meet.landing.loginRequired")} />
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
                        }}
                    >
                        <img
                            src="./images/internxt_Meet_Gallery.webp"
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
