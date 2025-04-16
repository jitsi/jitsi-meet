import testPasswordStrength from "@internxt/lib/dist/src/auth/testPasswordStrength";
import { useEffect, useState } from "react";

export type PasswordState = {
    tag: "error" | "warning" | "success";
    label: string;
};

interface UsePasswordStrengthProps {
    password: string;
    email?: string;
    maxLength?: number;
    translate: (key: string) => string;
}

export const usePasswordStrength = ({ password, email = "", maxLength = 64, translate }: UsePasswordStrengthProps) => {
    const [isValidPassword, setIsValidPassword] = useState(false);
    const [passwordState, setPasswordState] = useState<PasswordState | null>(null);
    const [showPasswordIndicator, setShowPasswordIndicator] = useState(false);

    const getPasswordState = (result: { valid: boolean; strength?: string; reason?: string }): PasswordState => {
        if (result.valid) {
            if (result.strength === "medium") {
                return {
                    tag: "warning",
                    label: translate("meet.auth.modal.signup.password.weak") || "Password is weak",
                };
            }
            return {
                tag: "success",
                label: translate("meet.auth.modal.signup.password.strong") || "Password is strong",
            };
        } else {
            return {
                tag: "error",
                label:
                    result.reason === "NOT_COMPLEX_ENOUGH"
                        ? translate("meet.auth.modal.signup.password.notComplex") || "Password is not complex enough"
                        : translate("meet.auth.modal.signup.error.passwordTooShort") ||
                          "Password has to be at least 8 characters long",
            };
        }
    };

    useEffect(() => {
        if (password.length > 0) {
            validatePassword(password);
        }
    }, [password, email]);

    const validatePassword = (input: string) => {
        setIsValidPassword(false);

        if (input.length > maxLength) {
            setPasswordState({
                tag: "error",
                label: translate("meet.auth.modal.signup.password.tooLong"),
            });
            return;
        }

        const result = testPasswordStrength(input, email);
        setIsValidPassword(result.valid);
        setPasswordState(getPasswordState(result));
    };

    const handleShowPasswordIndicator = (show: boolean = true) => {
        setShowPasswordIndicator(show);
    };

    return {
        isValidPassword,
        passwordState,
        showPasswordIndicator,
        validatePassword,
        handleShowPasswordIndicator,
    };
};
