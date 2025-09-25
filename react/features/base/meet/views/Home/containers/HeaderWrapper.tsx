import React from "react";
import { useDispatch } from "react-redux";
import { redirectToStaticPage } from "../../../../../app/actions.any";
import { openSettingsDialog } from "../../../../../settings/actions.web";
import { logout } from "../../../general/store/auth/actions";
import { useLocalStorage } from "../../../LocalStorageManager";
import Header from "../../PreMeeting/components/Header";
import { useUserData } from "../../PreMeeting/hooks/useUserData";

interface HeaderWrapperProps {
    onLogin: () => void;
    onSignUp?: () => void;
    translate: (key: string) => string;
}

const HeaderWrapper = ({ onLogin, onSignUp, translate }: HeaderWrapperProps) => {
    const userData = useUserData();
    const dispatch = useDispatch();
    const localStorageManager = useLocalStorage();
    const subscription = localStorageManager.getSubscription();

    const handleSignUp = () => {
        onSignUp?.();
    };

    const onLogout = () => {
        dispatch(logout());
        dispatch(redirectToStaticPage("/"));
    };

    const navigateToHomePage = () => {
        dispatch(redirectToStaticPage("/"));
    };

    return (
        <div className="px-5">
            <Header
                userData={userData}
                subscription={subscription}
                translate={translate}
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
