import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { redirectToStaticPage } from "../../../../../app/actions.any";
import { appNavigate } from "../../../../../app/actions.web";
import { openSettingsDialog } from "../../../../../settings/actions.web";
import MeetingButton from "../../../general/containers/MeetingButton";
import { useLocalStorage } from "../../../LocalStorageManager";
import Header from "../../PreMeeting/components/Header";
import { useUserData } from "../../PreMeeting/hooks/useUserData";

interface HeaderWrapperProps {
    onNewMeeting?: () => void;
    onLogin: () => void;
    onSignUp?: () => void;
    translate: (key: string) => string;
}

const HeaderWrapper = ({ onNewMeeting, onLogin, onSignUp, translate }: HeaderWrapperProps) => {
    const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
    const userData = useUserData();
    const dispatch = useDispatch();
    const localStorageManager = useLocalStorage();

    const handleNewMeeting = async () => {
        setIsCreatingMeeting(true);
        try {
            onNewMeeting?.();
        } catch (error) {
            console.error("Error creating new meeting:", error);
        } finally {
            setIsCreatingMeeting(false);
        }
    };

    const handleSignUp = () => {
        onSignUp?.();
    };

    const onLogout = () => {
        localStorageManager.clearCredentials();
        dispatch(redirectToStaticPage("/"));
    };

    const navigateToHomePage = () => {
        dispatch(appNavigate("/"));
    };

    return (
        <div className="px-5">
            <Header
                userData={userData}
                translate={translate}
                meetingButton={
                    userData ? (
                        <MeetingButton
                            onNewMeeting={handleNewMeeting}
                            translate={translate}
                            loading={isCreatingMeeting}
                        />
                    ) : null
                }
                onLogin={onLogin}
                onLogout={onLogout}
                onSignUp={handleSignUp}
                onOpenSettings={() => dispatch(openSettingsDialog(undefined, true))}
                className="z-50 py-3 flex-grow"
                navigateToHomePage={navigateToHomePage}
            />
        </div>
    );
};

export default HeaderWrapper;
