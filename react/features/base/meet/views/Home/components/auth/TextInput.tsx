import React from "react";
import { FieldError, Path, UseFormRegister, ValidationRule } from "react-hook-form";
import { IFormValues } from "../../types";


interface InputProps {
    label: Path<IFormValues>;
    type?: "text" | "email" | "number";
    disabled?: boolean;
    register: UseFormRegister<IFormValues>;
    minLength?: ValidationRule<number>;
    maxLength?: ValidationRule<number>;
    placeholder: string;
    pattern?: ValidationRule<RegExp>;
    error?: FieldError;
    min?: ValidationRule<number | string>;
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
                className={`w-full text-lg text-gray-80 ${error ? "input-error" : "input-primary"}`}
            />
            {error && <p className="mt-1 text-sm  text-red">{error.message}</p>}
        </div>
    );
};

export default TextInput;
