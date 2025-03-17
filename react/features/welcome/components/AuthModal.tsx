import { Button, Modal } from "@internxt/ui";
import { WarningCircle, X } from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { get8x8BetaJWT } from "../../base/connection/options8x8";
import { useLocalStorage } from "../../base/meet/LocalStorageManager";
import { AuthService } from "../../base/meet/services/auth.service";
import PasswordInput from "./PasswordInput";
import TextInput from "./TextInput";

interface IFormValues {
    email: string;
    password: string;
    twoFactorCode?: string;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    updateInxtToken: (token: string) => void;
    translate: (key: string) => string;
}

const AuthModal = ({ isOpen, onClose, updateInxtToken, translate }: AuthModalProps) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [loginError, setLoginError] = useState("");
    const storageManager = useLocalStorage();

    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
        watch,
    } = useForm<IFormValues>({
        mode: "onChange",
    });

    const twoFactorCode = watch("twoFactorCode", "");

    useEffect(() => {
        if (!isOpen) {
            reset();
            setShowTwoFactor(false);
            setLoginError("");
        }
    }, [isOpen, reset]);

    const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
        setIsLoggingIn(true);
        setLoginError("");

        const { email, password } = formData;

        try {
            const is2FANeeded = await AuthService.instance.is2FANeeded(email);

            if (!is2FANeeded || showTwoFactor) {
                let loginCredentials;
                try {
                    loginCredentials = await AuthService.instance.doLogin(
                        email,
                        password,
                        showTwoFactor ? twoFactorCode : ""
                    );
                } catch (err) {
                    throw new Error(translate("meet.auth.modal.error.invalidCredentials"));
                }

                if (loginCredentials?.newToken && loginCredentials?.user) {
                    let meetTokenCreator;
                    try {
                        meetTokenCreator = await get8x8BetaJWT(loginCredentials.newToken);
                    } catch (err) {
                        throw new Error(translate("meet.auth.modal.error.cannotCreateMeetings"));
                    }

                    if (meetTokenCreator?.token && meetTokenCreator?.room) {
                        storageManager.saveCredentials(
                            loginCredentials.token,
                            loginCredentials.newToken,
                            loginCredentials.mnemonic,
                            loginCredentials.user
                        );
                        updateInxtToken(loginCredentials.newToken);
                        onClose();
                    } else {
                        throw new Error(translate("meet.auth.modal.error.cannotCreateMeetings"));
                    }
                } else {
                    throw new Error(translate("meet.auth.modal.error.invalidCredentials"));
                }
            } else {
                setShowTwoFactor(true);
                setIsLoggingIn(false);
                return;
            }
        } catch (err) {
            setLoginError(err.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="p-0">
            <div className="flex justify-between items-center py-4 px-6 border-b border-gray-10">
                <h2 className="text-xl text-gray-100 font-medium">{translate("meet.auth.modal.title")}</h2>
                <button onClick={onClose} className="text-gray-100 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>
            <div className="p-6">
                <h1 className="text-3xl font-medium text-gray-100 mb-6">{translate("meet.auth.modal.loginTitle")}</h1>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <TextInput
                            label="email"
                            type="email"
                            placeholder={translate("meet.auth.modal.emailPlaceholder")}
                            register={register}
                            error={errors.email}
                            required={true}
                            minLength={{
                                value: 1,
                                message: translate("meet.auth.modal.error.emailEmpty"),
                            }}
                            pattern={{
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: translate("meet.auth.modal.error.emailInvalid"),
                            }}
                            autoComplete="email"
                        />

                        <PasswordInput
                            label="password"
                            placeholder={translate("meet.auth.modal.passwordPlaceholder")}
                            register={register}
                            error={errors.password}
                            required={true}
                            minLength={{
                                value: 1,
                                message: translate("meet.auth.modal.error.passwordEmpty"),
                            }}
                            autoComplete="current-password"
                        />

                        {showTwoFactor && (
                            <PasswordInput
                                label="twoFactorCode"
                                placeholder={translate("meet.auth.modal.twoFactorCodePlaceholder")}
                                register={register}
                                error={errors.twoFactorCode}
                                required={true}
                                autoComplete="one-time-code"
                                minLength={{
                                    value: 6,
                                    message: translate("meet.auth.modal.error.twoFactorCodeLength"),
                                }}
                                maxLength={{
                                    value: 6,
                                    message: translate("meet.auth.modal.error.twoFactorCodeLength"),
                                }}
                                pattern={{
                                    value: /^\d{6}$/,
                                    message: translate("meet.auth.modal.error.twoFactorCodeInvalid"),
                                }}
                            />
                        )}

                        {loginError && (
                            <div className="flex flex-row items-start pt-1">
                                <div className="flex h-5 flex-row items-center">
                                    <WarningCircle weight="fill" className="mr-1 h-4 text-red" />
                                </div>
                                <span className="font-base w-full text-sm text-red">{loginError}</span>
                            </div>
                        )}

                        <Button type="submit" className="flex w-full" loading={isLoggingIn} disabled={isLoggingIn}>
                            {isLoggingIn
                                ? translate("meet.auth.modal.decrypting")
                                : translate("meet.auth.modal.loginButton")}
                        </Button>
                    </div>
                </form>
                <div className="text-center mt-4 cursor-pointer">
                    <button
                        onClick={() => alert("Open forgot apassword")}
                        className="cursor-pointer appearance-none text-center text-primary font-medium no-underline hover:text-primary
                focus:text-primary-dark"
                    >
                        {translate("meet.auth.modal.forgotPassword")}
                    </button>
                </div>

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-10"></div>
                </div>
                <div className="text-center">
                    <span className="text-gray-60">{translate("meet.auth.modal.noAccount")}</span>{" "}
                    <button
                        onClick={() => alert("Open create account")}
                        className="cursor-pointer appearance-none text-center text-primary  font-medium no-underline hover:text-primary
                focus:text-primary-dark"
                    >
                        {translate("meet.auth.modal.createAccount")}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AuthModal;
