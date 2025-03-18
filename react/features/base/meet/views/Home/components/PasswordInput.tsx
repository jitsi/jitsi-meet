import { Eye, EyeSlash } from "@phosphor-icons/react";
import React, { useState } from "react";
import { FieldError, Path, UseFormRegister, ValidationRule } from "react-hook-form";
import { IFormValues } from "./TextInput";

interface InputProps {
    label: Path<IFormValues>;
    disabled?: boolean;
    register: UseFormRegister<IFormValues>;
    minLength?: ValidationRule<number> | undefined;
    maxLength?: ValidationRule<number> | undefined;
    placeholder: string;
    pattern?: ValidationRule<RegExp> | undefined;
    error: FieldError | undefined;
    min?: ValidationRule<number | string> | undefined;
    required?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
    autoFocus?: boolean;
    value?: string;
    autoComplete?: string;
    inputDataCy?: string;
}

const PasswordInput = ({
    label,
    disabled,
    register,
    minLength,
    maxLength,
    placeholder,
    pattern,
    error,
    min,
    required,
    onFocus,
    onBlur,
    className,
    autoFocus,
    autoComplete,
    inputDataCy,
}: InputProps): JSX.Element => {
    const [showPassword, setShowPassword] = useState(false);
    const primaryClass =
        "h-11 w-full rounded-md border bg-transparent text-lg font-normal text-gray-80 outline-none ring-opacity-10 focus:ring-3 disabled:text-gray-40 disabled:placeholder-gray-20 dark:ring-opacity-20 ring-primary disabled:border-gray-10 border-gray-40 placeholder-gray-30 px-4 focus:border-primary";
    const errorClass =
        "h-11 w-full rounded-md border bg-transparent text-lg font-normal text-gray-80 outline-none ring-opacity-10 focus:ring-3 disabled:text-gray-40 disabled:placeholder-gray-20 dark:ring-opacity-20 ring-red disabled:border-gray-10 border-gray-40 placeholder-gray-30 px-4 focus:border-red";
    return (
        <>
            <div className={`relative flex-1 ${className || ""}`}>
                <input
                    type={showPassword ? "text" : "password"}
                    disabled={disabled}
                    placeholder={placeholder}
                    min={0}
                    required={true}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    data-cy={inputDataCy}
                    {...register(label, {
                        required,
                        minLength,
                        min,
                        maxLength,
                        pattern,
                    })}
                    onFocus={() => {
                        if (onFocus) onFocus();
                    }}
                    onBlur={() => {
                        if (onBlur) onBlur();
                    }}
                    className={`${error ? errorClass : primaryClass}`}
                />
                <div
                    onClick={() => setShowPassword(!showPassword)}
                    onKeyDown={(e) =>
                        (e["code"] === "Space" || e["code"] === "Enter") && setShowPassword(!showPassword)
                    }
                    tabIndex={0}
                    className="absolute right-4 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-gray-100"
                >
                    {showPassword ? <Eye className="h-6 w-6" /> : <EyeSlash className="h-6 w-6" />}
                </div>
            </div>
            {error && <p className="text-sm text-red">{error.message}</p>}
        </>
    );
};

export default PasswordInput;
