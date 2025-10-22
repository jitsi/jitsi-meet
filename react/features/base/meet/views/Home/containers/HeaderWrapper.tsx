import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { redirectToStaticPage } from "../../../../../app/actions.any";
import { openSettingsDialog } from "../../../../../settings/actions.web";
import { logout } from "../../../general/store/auth/actions";
import { getPlanName } from "../../../general/store/meeting/selectors";
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
    const planName = useSelector(getPlanName);
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
                planName={planName}
            />
        </div>
    );
};

export default HeaderWrapper;
