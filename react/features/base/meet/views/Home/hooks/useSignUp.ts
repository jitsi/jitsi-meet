import { RegisterDetails } from "@internxt/sdk";
import * as bip39 from "bip39";
import { useState } from "react";
import { CryptoService } from "../../../services/crypto.service";
import { KeysService } from "../../../services/keys.service";
import { SdkManager } from "../../../services/sdk-manager.service";
import { IFormValues } from "../types";

interface UseSignupModalProps {
    onClose: () => void;
    onSignup?: (token: string, userData?: any) => void;
    translate: (key: string) => string;
    referrer?: string;
}

export const readReferalCookie = (): string | undefined => {
    const cookie = document.cookie.match(/(^| )REFERRAL=([^;]+)/);

    return cookie ? cookie[2] : undefined;
};

export const useSignupModal = ({ onClose, onSignup, translate, referrer }: UseSignupModalProps) => {
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signupError, setSignupError] = useState("");

    const resetSignupState = () => {
        setIsSigningUp(false);
        setSignupError("");
    };

    const handleSignup = async (data: IFormValues) => {
        try {
            setIsSigningUp(true);
            setSignupError("");

            const { email, password, confirmPassword } = data;

            if (password !== confirmPassword) {
                throw new Error(translate("meet.auth.modal.signup.error.passwordsDoNotMatch"));
            }

            const hashObj = CryptoService.instance.passToHash({ password });
            const encPass = CryptoService.instance.encryptText(hashObj.hash);
            const encSalt = CryptoService.instance.encryptText(hashObj.salt);

            const mnemonic = bip39.generateMnemonic(256);
            const encMnemonic = CryptoService.instance.encryptTextWithKey(mnemonic, password);

            const keys = await KeysService.instance.getKeys(password);
            const captcha = data.captcha;

            const registerDetails: RegisterDetails = {
                name: "My",
                lastname: "Internxt",
                email: email.toLowerCase(),
                password: encPass,
                salt: encSalt,
                mnemonic: encMnemonic,
                keys: keys,
                captcha: captcha,
                referral: readReferalCookie(),
                referrer: referrer,
            };

            const authClient = SdkManager.instance.getNewAuth();

            const response = await authClient.register(registerDetails);

            // need to add login flow after this
            if (onSignup) {
                onSignup(response.token, {
                    ...response.user,
                    mnemonic: mnemonic,
                });
            }

            onClose();
        } catch (error: any) {
            console.error("Signup error:", error);
            setSignupError(error.message || translate("meet.auth.modal.signup.error.signupFailed"));
        } finally {
            setIsSigningUp(false);
        }
    };

    return {
        isSigningUp,
        signupError,
        handleSignup,
        resetSignupState,
    };
};
