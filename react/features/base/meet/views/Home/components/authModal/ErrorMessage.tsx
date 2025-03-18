import { WarningCircle } from "@phosphor-icons/react";
import React from "react";

interface ErrorMessageProps {
    message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
    <div className="flex flex-row items-start pt-1">
        <div className="flex h-5 flex-row items-center">
            <WarningCircle weight="fill" className="mr-1 h-4 text-red" />
        </div>
        <span className="font-base w-full text-sm text-red">{message}</span>
    </div>
);
