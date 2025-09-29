import { UserSubscription } from "@internxt/sdk/dist/drive/payments/types/types";
import { Avatar, Button, Header as IntxHeader } from "@internxt/ui";
import { ArrowSquareOut } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import PlanBadge from "../../../general/components/PlanBadge";
import TextButton from "../../../general/components/TextButton";
import { isMeetingEnabled } from "../../../general/store/meeting/selectors";
import { getPlanName } from "../../../services/utils/payments.utils";

const Divider = () => (
    <div
        className="border-t mx-3"
        // To force dark gray-5 color
        style={{ borderColor: "rgb(58 58 59)", borderWidth: "1px" }}
    />
);

/**
 * Component for the left content of the header
 * @returns {JSX.Element} The left content component
 */
const LeftContent = React.memo(
    ({ onClick }: { onClick: () => void }): JSX.Element => (
        <button className="rounded-2xl border bg-black/50 border-white/10" onClick={onClick}>
            <div
                className="flex items-center space-x-2 h-12 px-3"
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
            >
                <img src={"images/internxt_logo.png"} alt="logo" className="h-7" />
                <span className="text-lg font-semibold text-white" style={{ fontWeight: 600 }}>
                    Meet
                </span>
            </div>
        </button>
    )
);

/**
 * Props for the RightContent component
 */
interface RightContentProps {
    /**
     * Whether the user is logged in or not
     */
    isLogged: boolean;

    /**
     * URL of the user's avatar or null if not available
     */
    avatar: string | null;

    /**
     * Full name of the user
     */
    fullName?: string;

    /**
     * Email of the user
     */
    email: string;

    /**
     * User subscription data
     */
    subscription?: UserSubscription | null;

    /**
     * Translation function
     */
    translate: Function;

    /**
     * MeetingButton component (handles New Meeting or Upgrade)
     */
    meetingButton?: React.ReactNode;

    /**
     * Handler for the login button
     */
    onLogin?: () => void;

    /**
     * Handler for the sign up button
     */
    onSignUp?: () => void;

    /**
     * Handler for the logout button
     */
    onLogout?: () => void;

    /**
     * Handler for the settings button
     */
    onOpenSettings?: () => void;

    /**
     * Whether the Meet feature is enabled
     */
    isMeetEnabled: boolean;
}

/**
 * Component for the right content of the header
 * @param {RightContentProps} props - The component props
 * @returns {JSX.Element} The right content component
 */
const RightContent = React.memo(
    ({
        isLogged,
        avatar,
        fullName,
        email,
        subscription,
        translate,
        meetingButton,
        onLogin,
        onSignUp,
        onLogout,
        onOpenSettings,
        isMeetEnabled,
    }: RightContentProps): JSX.Element => {
        const [showMenu, setShowMenu] = useState(false);

        const menuRef = useRef<HTMLDivElement>(null);
        const avatarRef = useRef<HTMLButtonElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    menuRef.current &&
                    !menuRef.current.contains(event.target as Node) &&
                    avatarRef.current &&
                    !avatarRef.current.contains(event.target as Node)
                ) {
                    setShowMenu(false);
                }
            };

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        const toggleMenu = () => {
            setShowMenu(!showMenu);
        };

        const planName = getPlanName(subscription);
        const showUpgrade = !isMeetEnabled;

        return isLogged ? (
            <div className="flex space-x-2 flex-row">
                {meetingButton}

                <div className="relative dark">
                    <button
                        ref={avatarRef}
                        onClick={toggleMenu}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleMenu();
                            }
                        }}
                        tabIndex={0}
                        className="cursor-pointer transition-transform duration-150 transform hover:scale-105 active:scale-95"
                    >
                        <Avatar src={avatar} fullName={fullName ?? ""} className="text-white" diameter={40} />
                    </button>

                    <div
                        ref={menuRef}
                        className={`absolute dark right-0 mt-2 min-w-56 w-max max-w-80 rounded-md shadow-lg z-50 overflow-hidden transition-all duration-200 ease-in-out transform origin-top-right
                            ${
                                showMenu
                                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                            }`}
                        // To force dark gray-5 color
                        style={{ backgroundColor: "rgb(44 44 48)", borderColor: "rgb(58 58 59)", borderWidth: "1px" }}
                    >
                        <div className="py-1">
                            {/* user info */}
                            <div className="flex items-center p-3">
                                <Avatar src={avatar} fullName={fullName ?? ""} className="text-white" diameter={40} />
                                <div className="ml-2 min-w-0">
                                    <p
                                        className="truncate font-medium text-white"
                                        title={fullName}
                                        style={{ lineHeight: 1 }}
                                    >
                                        {fullName}
                                    </p>
                                    <p className="truncate text-sm text-white/75" title={email}>
                                        {email}
                                    </p>
                                </div>
                            </div>

                            {/* upgrade and plan display */}
                            <div className="flex items-center justify-between pl-3 py-2 transition-colors duration-200">
                                <PlanBadge planName={planName} />
                                {showUpgrade && (
                                    <TextButton
                                        onClick={() => window.open("https://internxt.com/pricing", "_blank")}
                                        text={translate("meet.preMeeting.upgrade")}
                                        icon={ArrowSquareOut}
                                    />
                                )}
                            </div>

                            {/* Settings Option */}
                            {onOpenSettings && (
                                <>
                                    <Divider />
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (onOpenSettings) onOpenSettings();
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white active:bg-white/20"
                                    >
                                        {translate("settings.title") ?? "Settings"}
                                    </button>
                                </>
                            )}

                            {/* Logout Option */}
                            {onLogout && (
                                <>
                                    <Divider />
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            onLogout?.();
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white active:bg-white/20"
                                    >
                                        {translate("dialog.logoutTitle")}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex space-x-2 flex-row">
                {/* TODO: Change to secondary variant when dark mode works properly */}
                <Button variant="tertiary" onClick={onLogin}>
                    {translate("meet.login.login")}
                </Button>
                <Button variant="primary" onClick={onSignUp}>
                    {translate("meet.login.signUp")}
                </Button>
            </div>
        );
    }
);

/**
 * User data interface
 */
interface UserData {
    /**
     * URL of the user's avatar or null if not available
     */
    avatar: string | null;

    /**
     * First name of the user
     */
    name: string;

    /**
     * Last name of the user
     */
    lastname: string;

    /**
     * Additional user properties
     */
    [key: string]: any;
}

/**
 * Props for the Header component
 */
interface HeaderProps {
    /**
     * User data object
     */
    userData?: UserData | null;

    /**
     * User subscription data
     */
    subscription?: UserSubscription | null;

    /**
     * Translation function
     */
    translate: Function;

    /**
     * MeetingButton component (handles New Meeting or Upgrade)
     */
    meetingButton?: React.ReactNode;

    /**
     * Handler for the login button
     */
    onLogin?: () => void;

    /**
     * Handler for the sign up button
     */
    onSignUp?: () => void;

    /**
     * Handler for the logout button
     */
    onLogout?: () => void;

    /**
     * Handler for the settings button
     */
    onOpenSettings?: () => void;

    /**
     * Additional CSS class for the header
     */
    className?: string;

    /**
     * Handler for navigate to home page
     */
    navigateToHomePage: () => void;
}

/**
 * Header component for the application
 * @param {HeaderProps} props - The component props
 * @returns {JSX.Element} The header component
 */
const Header = ({
    userData,
    subscription,
    translate,
    meetingButton,
    onLogin,
    onSignUp,
    onLogout,
    onOpenSettings,
    className = "z-50 py-3",
    navigateToHomePage,
}: HeaderProps) => {
    const isMeetEnabled = useSelector(isMeetingEnabled);
    return (
        <IntxHeader
            leftContent={<LeftContent onClick={navigateToHomePage} />}
            rightContent={
                <RightContent
                    isLogged={!!userData}
                    avatar={userData?.avatar ?? null}
                    fullName={userData ? `${userData.name} ${userData.lastname}` : ""}
                    email={userData?.email ?? ""}
                    subscription={subscription}
                    translate={translate}
                    meetingButton={meetingButton}
                    onLogin={onLogin}
                    onSignUp={onSignUp}
                    onLogout={onLogout}
                    onOpenSettings={onOpenSettings}
                    isMeetEnabled={isMeetEnabled}
                />
            }
            className={className}
        />
    );
};

export default Header;
