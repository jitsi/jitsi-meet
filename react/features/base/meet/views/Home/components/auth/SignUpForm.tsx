import { Button } from "@internxt/ui";
import { Info } from "@phosphor-icons/react";
import React from "react";
import { useForm } from "react-hook-form";
import { usePasswordStrength } from "../../hooks/usePasswordStrength";
import { IFormValues } from "../../types";
import { ErrorMessage } from "./ErrorMessage";
import PasswordStrengthIndicator from "./PasswordIndicator";
import PasswordInput from "./PasswordInput";
import TextInput from "./TextInput";

const MAX_PASSWORD_LENGTH = 64;

interface SignupFormProps {
    onSubmit: (data: IFormValues) => void;
    isSigningUp: boolean;
    signupError: string;
    translate: (key: string) => string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, isSigningUp, signupError, translate }) => {
    const {
        register,
        formState: { errors, isSubmitted },
        handleSubmit,
        watch,
    } = useForm<IFormValues>({
        mode: "onChange",
        reValidateMode: "onChange",
    });

    const password = watch("password", "");
    const email = watch("email", "");

    const { isValidPassword, passwordState, showPasswordIndicator, handleShowPasswordIndicator } = usePasswordStrength({
        password,
        email,
        maxLength: MAX_PASSWORD_LENGTH,
        translate,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
                <TextInput
                    label="email"
                    type="email"
                    placeholder={translate("meet.auth.modal.emailPlaceholder")}
                    register={register}
                    error={isSubmitted ? errors.email : undefined}
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

                <div className="space-y-1">
                    <PasswordInput
                        label="password"
                        placeholder={translate("meet.auth.modal.signup.newPasswordPlaceholder")}
                        register={register}
                        error={isSubmitted ? errors.password : undefined}
                        required
                        onFocus={() => handleShowPasswordIndicator(true)}
                        className={passwordState?.tag || ""}
                        autoComplete="new-password"
                    />
                    {showPasswordIndicator && passwordState && (
                        <PasswordStrengthIndicator
                            className="pt-1"
                            strength={passwordState.tag}
                            label={passwordState.label}
                        />
                    )}
                </div>

                <PasswordInput
                    label="confirmPassword"
                    placeholder={translate("meet.auth.modal.signup.confirmPasswordPlaceholder")}
                    register={register}
                    error={isSubmitted ? errors.confirmPassword : undefined}
                    required
                    autoComplete="new-password"
                />

                <div className="flex space-x-2.5 rounded-lg bg-primary/10 p-3 pr-4 dark:bg-primary/20">
                    <Info size={20} className="shrink-0 text-primary" />
                    <p className="text-xs">
                        {translate("meet.auth.modal.signup.info.normalText")}{" "}
                        <span className="font-semibold">{translate("meet.auth.modal.signup.info.boldText")}</span>{" "}
                        <span className="font-semibold text-primary underline">
                            <a
                                href="https://help.internxt.com/en/articles/8450457-how-do-i-create-a-backup-key"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {translate("meet.auth.modal.signup.info.cta")}
                            </a>
                        </span>
                    </p>
                </div>

                {signupError && <ErrorMessage message={signupError} />}

                <Button
                    type="submit"
                    className="flex w-full"
                    loading={isSigningUp}
                    disabled={isSigningUp || !isValidPassword}
                >
                    {isSigningUp
                        ? translate("meet.auth.modal.signup.creatingAccount")
                        : translate("meet.auth.modal.signup.signupButton")}
                </Button>
            </div>
        </form>
    );
};
