import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { redirectToStaticPage } from "../../../../../app/actions.any";
import { openSettingsDialog } from "../../../../../settings/actions.web";
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

    return (
        <div className="px-5 py-2">
            <Header
                userData={userData}
                translate={translate}
                onNewMeeting={handleNewMeeting}
                onLogin={onLogin}
                onLogout={onLogout}
                onSignUp={handleSignUp}
                isCreatingMeeting={isCreatingMeeting}
                onOpenSettings={() => dispatch(openSettingsDialog(undefined, true))}
                className="z-50 py-3 flex-grow"
            />
        </div>
    );
};

export default HeaderWrapper;
