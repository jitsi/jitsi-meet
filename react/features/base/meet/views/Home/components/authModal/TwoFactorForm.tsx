import { Button } from "@internxt/ui";
import React from "react";
import { useForm } from "react-hook-form";
import { AuthFormValues } from "../../types";
import PasswordInput from "../PasswordInput";
import { ErrorMessage } from "./ErrorMessage";


interface TwoFactorFormProps {
    onSubmit: (data: AuthFormValues) => void;
    isLoggingIn: boolean;
    loginError: string;
    translate: (key: string) => string;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSubmit, isLoggingIn, loginError, translate }) => {
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<AuthFormValues>({
        mode: "onChange",
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
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

                {loginError && <ErrorMessage message={loginError} />}

                <Button type="submit" className="flex w-full" loading={isLoggingIn} disabled={isLoggingIn}>
                    {isLoggingIn ? translate("meet.auth.modal.decrypting") : translate("meet.auth.modal.loginButton")}
                </Button>
            </div>
        </form>
    );
};
