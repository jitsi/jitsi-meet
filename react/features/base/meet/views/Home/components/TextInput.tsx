import React from "react";
import { FieldError, Path, UseFormRegister, ValidationRule } from "react-hook-form";

export interface IFormValues {
    email: string;
    password: string;
    twoFactorCode?: string;
    [key: string]: any;
}

interface InputProps {
    label: Path<IFormValues>;
    type?: "text" | "email" | "number";
    disabled?: boolean;
    register: UseFormRegister<IFormValues>;
    minLength?: ValidationRule<number> | undefined;
    maxLength?: ValidationRule<number> | undefined;
    placeholder: string;
    pattern?: ValidationRule<RegExp> | undefined;
    error: FieldError | undefined;
    min?: ValidationRule<number | string> | undefined;
    required?: boolean;
    className?: string;
    autoFocus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    autoComplete?: string;
    inputDataCy?: string;
}

const TextInput = ({
    label,
    type = "text",
    disabled,
    register,
    minLength,
    maxLength,
    placeholder,
    pattern,
    error,
    min,
    required,
    className,
    autoFocus,
    autoComplete,
    inputDataCy,
    onFocus,
    onBlur,
}: Readonly<InputProps>): JSX.Element => {
    return (
        <div className={`${className || ""}`}>
            <input
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                autoComplete={autoComplete}
                id={label}
                min={0}
                required={true}
                autoFocus={autoFocus}
                data-cy={inputDataCy}
                {...register(label, {
                    required,
                    minLength,
                    min,
                    maxLength,
                    pattern,
                    onBlur: onBlur ? () => onBlur() : undefined,
                })}
                className={`w-full ${error ? "input-error" : "input-primary"}`}
            />
        </div>
    );
};

export default TextInput;
