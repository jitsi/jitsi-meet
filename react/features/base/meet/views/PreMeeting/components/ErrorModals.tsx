import { Button } from "@internxt/ui";
import React from "react";

export type ErrorType = "joinRoom" | "createRoom";

interface ErrorModalsProps {
    errorType?: ErrorType;
    translate: (key: string) => string;
    onGoHome: () => void;
    onRetry?: () => void;
}

export const ErrorModals: React.FC<ErrorModalsProps> = ({ errorType, translate, onGoHome, onRetry }) => {

    if (!errorType) return null;
    return (
        <div className="flex items-center justify-center h-full">
            {renderErrorModal(errorType, {
                translate,
                onGoHome,
                onRetry,
            })}
        </div>
    );
};

const renderErrorModal = (
    errorType: ErrorType,
    { translate, onGoHome, onRetry }: Omit<ErrorModalsProps, "errorType">
) => {
    const errorModals = {
        joinRoom: () => (
            <div className="flex flex-col items-center p-6 bg-black/60 border border-white/15 rounded-[20px] mt-5 max-w-md">
                <h2 className="text-xl font-semibold text-white mb-4">
                    {translate("meet.joinRoomErrorDialog.joinRoomError")}
                </h2>
                <p className="text-white mb-6 text-center">
                    {translate("meet.joinRoomErrorDialog.joinRoomErrorDescription")}
                </p>
                <Button variant="primary" onClick={onGoHome}>
                    {translate("meet.joinRoomErrorDialog.goHome")}
                </Button>
            </div>
        ),

        createRoom: () => (
            <div className="flex flex-col items-center p-6 bg-black/60 border border-white/15 rounded-[20px] mt-5 max-w-md">
                <h2 className="text-xl font-semibold text-white mb-4">
                    {translate("meet.createRoomErrorDialog.createRoomError")}
                </h2>
                <p className="text-white mb-6 text-center">
                    {translate("meet.createRoomErrorDialog.createRoomErrorDescription")}
                </p>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={onRetry}>
                        {translate("meet.createRoomErrorDialog.retry")}
                    </Button>
                    <Button variant="primary" onClick={onGoHome}>
                        {translate("meet.createRoomErrorDialog.goHome")}
                    </Button>
                </div>
            </div>
        ),
    };

    return errorModals[errorType]?.() || null;
};
