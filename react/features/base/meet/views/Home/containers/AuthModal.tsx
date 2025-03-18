import { Modal } from "@internxt/ui";
import { X } from "@phosphor-icons/react";
import React, { useEffect } from "react";
import { LoginForm } from "../components/authModal/LoginForm";
import { TwoFactorForm } from "../components/authModal/TwoFactorForm";
import { Divider } from "../components/Divider";
import { useAuthModal } from "../hooks/useAuthModal";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    updateInxtToken: (token: string) => void;
    translate: (key: string) => string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, updateInxtToken, translate }) => {
    const { showTwoFactor, loginError, isLoggingIn, handleLogin, resetState } = useAuthModal({
        onClose,
        updateInxtToken,
        translate,
    });

    useEffect(() => {
        if (!isOpen) {
            resetState();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="p-0">
            <ModalHeader onClose={onClose} translate={translate} />
            <div className="p-6">
                <h1 className="text-3xl font-medium text-gray-100 mb-6">{translate("meet.auth.modal.loginTitle")}</h1>

                {showTwoFactor ? (
                    <TwoFactorForm
                        onSubmit={handleLogin}
                        isLoggingIn={isLoggingIn}
                        loginError={loginError}
                        translate={translate}
                    />
                ) : (
                    <LoginForm
                        onSubmit={handleLogin}
                        isLoggingIn={isLoggingIn}
                        loginError={loginError}
                        translate={translate}
                    />
                )}

                <ForgotPasswordLink translate={translate} />
                <Divider />
                <CreateAccountLink translate={translate} />
            </div>
        </Modal>
    );
};

const ModalHeader: React.FC<{ onClose: () => void; translate: (key: string) => string }> = ({ onClose, translate }) => (
    <div className="flex justify-between items-center py-4 px-6 border-b border-gray-10">
        <h2 className="text-xl text-gray-100 font-medium">{translate("meet.auth.modal.title")}</h2>
        <button onClick={onClose} className="text-gray-100 hover:text-gray-700">
            <X size={24} />
        </button>
    </div>
);

const ForgotPasswordLink: React.FC<{ translate: (key: string) => string }> = ({ translate }) => (
    <div className="text-center mt-4 cursor-pointer">
        <button
            onClick={() => alert("Open forgot password")}
            className="cursor-pointer appearance-none text-center text-primary font-medium no-underline hover:text-primary focus:text-primary-dark"
        >
            {translate("meet.auth.modal.forgotPassword")}
        </button>
    </div>
);

const CreateAccountLink: React.FC<{ translate: (key: string) => string }> = ({ translate }) => (
    <div className="text-center">
        <span className="text-gray-60">{translate("meet.auth.modal.noAccount")}</span>{" "}
        <button
            onClick={() => alert("Open create account")}
            className="cursor-pointer appearance-none text-center text-primary font-medium no-underline hover:text-primary focus:text-primary-dark"
        >
            {translate("meet.auth.modal.createAccount")}
        </button>
    </div>
);

export default AuthModal;
