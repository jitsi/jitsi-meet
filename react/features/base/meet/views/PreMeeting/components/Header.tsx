import { Avatar, Button, Header as IntxHeader } from "@internxt/ui";
import React, { useEffect, useRef, useState } from "react";

/**
 * Component for the left content of the header
 * @returns {JSX.Element} The left content component
 */
const LeftContent = React.memo(
    (): JSX.Element => (
        <div className="rounded-2xl border bg-black/50 border-white/10 ">
            <div
                className="flex items-center space-x-2 h-12 px-3"
                style={{ paddingLeft: "12px", paddingRight: "12px" }}
            >
                <img src={"images/internxt_logo.png"} alt="logo" className="h-7" />
                <span className="text-lg font-semibold text-white" style={{ fontWeight: 600 }}>
                    Meet
                </span>
                <img src={"images/beta.png"} alt="logo" className="h-6" style={{ margin: "0px" }} />
            </div>
        </div>
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
     * Translation function
     */
    translate: Function;

    /**
     * Handler for the new meeting button
     */
    onNewMeeting?: () => void;

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
     * Whether the new meeting button should be disabled
     */
    isCreatingMeeting?: boolean;
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
        translate,
        onNewMeeting,
        onLogin,
        onSignUp,
        onLogout,
        onOpenSettings,
        isCreatingMeeting = false,
    }: RightContentProps): JSX.Element => {
        const [showMenu, setShowMenu] = useState(false);

        const menuRef = useRef<HTMLDivElement>(null);
        const avatarRef = useRef<HTMLDivElement>(null);

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

        return isLogged ? (
            <div className="flex space-x-2 flex-row items-center">
                <Button
                    variant="primary"
                    onClick={onNewMeeting}
                    disabled={isCreatingMeeting}
                    loading={isCreatingMeeting}
                >
                    {translate("meet.preMeeting.newMeeting")}
                </Button>

                <div className="relative">
                    <div
                        ref={avatarRef}
                        onClick={toggleMenu}
                        className="cursor-pointer transition-transform duration-150 transform hover:scale-105 active:scale-95"
                    >
                        <Avatar src={avatar} fullName={fullName ?? ""} className="text-white" diameter={40} />
                    </div>

                    <div
                        ref={menuRef}
                        className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-90 border border-gray-10 z-50 overflow-hidden transition-all duration-200 ease-in-out transform origin-top-right
                            ${
                                showMenu
                                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                            }`}
                    >
                        <div className="py-1">
                            {/* Settings Option */}
                            {onOpenSettings && (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            if (onOpenSettings) onOpenSettings();
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-100 transition-colors duration-150 hover:bg-gray-5 hover:text-primary dark:hover:bg-gray-80 active:bg-primary/20 active:text-primary"
                                    >
                                        {translate("settings.title") || "Settings"}
                                    </button>

                                    {/* Divider */}
                                    <div className="border-t border-gray-10 my-1"></div>
                                </>
                            )}
                            {/* Logout Option */}
                            {onLogout && (
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onLogout?.();
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-100 transition-colors duration-150 hover:bg-gray-5 hover:text-primary dark:hover:bg-gray-80 active:bg-primary/20 active:text-primary"
                                >
                                    {translate("dialog.logoutTitle")}
                                </button>
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
     * Translation function
     */
    translate: Function;

    /**
     * Handler for the new meeting button
     */
    onNewMeeting?: () => void;

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
     * Whether a new meeting is being created
     */
    isCreatingMeeting?: boolean;
}

/**
 * Header component for the application
 * @param {HeaderProps} props - The component props
 * @returns {JSX.Element} The header component
 */
const Header = ({
    userData,
    translate,
    onNewMeeting,
    onLogin,
    onSignUp,
    onLogout,
    onOpenSettings,
    className = "z-50 py-3",
    isCreatingMeeting = false,
}: HeaderProps) => (
    <IntxHeader
        leftContent={<LeftContent />}
        rightContent={
            <RightContent
                isLogged={!!userData}
                avatar={userData?.avatar ?? null}
                fullName={userData ? `${userData.name} ${userData.lastname}` : ""}
                translate={translate}
                onNewMeeting={onNewMeeting}
                onLogin={onLogin}
                onSignUp={onSignUp}
                onLogout={onLogout}
                onOpenSettings={onOpenSettings}
                isCreatingMeeting={isCreatingMeeting}
            />
        }
        className={className}
    />
);

export default Header;
