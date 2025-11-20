import { Modal } from "@internxt/ui";
import { X } from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import { LoginCredentials } from "../../../services/types/command.types";
import { WebAuthButton } from "../components/auth/WebAuthButton";
import { useWebAuth } from "../hooks/useWebAuth";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin?: (token: string) => void;
    onSignup?: (signupData: LoginCredentials) => void;
    translate: (key: string) => string;
    openLogin?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, translate, openLogin = true }) => {
    const [isLoginView, setIsLoginView] = useState(openLogin);

    const { isLoggingIn: isWebAuthLoading, webAuthError, handleWebLogin, handleWebSignup, resetState: resetWebAuthState } = useWebAuth({
        onClose,
        onLogin,
        translate,
    });

    useEffect(() => {
        setIsLoginView(openLogin);
    }, [openLogin]);

    useEffect(() => {
        if (!isOpen) {
            resetWebAuthState();
        }
    }, [isOpen]);

    const switchToLogin = () => {
        setIsLoginView(true);
    };

    const switchToSignup = () => {
        setIsLoginView(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="p-0">
            <ModalHeader onClose={onClose} translate={translate} isLoginView={isLoginView} />
            <div className="p-6">
                <h1 className="text-3xl font-medium text-gray-100 mb-6">
                    {isLoginView ? translate("meet.auth.modal.loginTitle") : translate("meet.auth.modal.signup.title")}
                </h1>
                {isLoginView ? (
                    <>
                        <WebAuthButton
                            onClick={handleWebLogin}
                            isLoading={isWebAuthLoading}
                            error={webAuthError}
                            translate={translate}
                            type="login"
                        />
                        <div className="mt-6 text-center">
                            <span className="text-gray-60">{translate("meet.auth.modal.noAccount")}</span>{" "}
                            <button
                                onClick={switchToSignup}
                                className="cursor-pointer appearance-none text-center text-primary font-medium no-underline hover:text-primary focus:text-primary-dark"
                            >
                                {translate("meet.auth.modal.createAccount")}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <WebAuthButton
                            onClick={handleWebSignup}
                            isLoading={isWebAuthLoading}
                            error={webAuthError}
                            translate={translate}
                            type="signup"
                        />
                        <TermsAndPrivacyText translate={translate} />
                        <div className="mt-6 text-center">
                            <span className="text-gray-60">{translate("meet.auth.modal.signup.alreadyHaveAccount")}</span>{" "}
                            <button
                                onClick={switchToLogin}
                                className="cursor-pointer appearance-none text-center text-primary font-medium no-underline hover:text-primary focus:text-primary-dark"
                            >
                                {translate("meet.auth.modal.signup.loginLink")}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

const ModalHeader: React.FC<{
    onClose: () => void;
    translate: (key: string) => string;
    isLoginView: boolean;
}> = ({ onClose, translate, isLoginView }) => (
    <div className="flex justify-between items-center py-4 px-6 border-b border-gray-10">
        <h2 className="text-xl text-gray-100 font-medium">
            {isLoginView ? translate("meet.auth.modal.title") : translate("meet.auth.modal.signup.createAccountTitle")}
        </h2>
        <button onClick={onClose} className="text-gray-100 hover:text-gray-700">
            <X size={24} />
        </button>
    </div>
);

const TermsAndPrivacyText: React.FC<{ translate: (key: string) => string }> = ({ translate }) => (
    <div className="text-center mt-4 text-sm text-gray-60">
        {translate("meet.auth.modal.signup.termsNotice")}{" "}
        <a
            href="https://internxt.com/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-dark"
        >
            {translate("meet.auth.modal.signup.terms")}
        </a>
    </div>
);

export default AuthModal;
