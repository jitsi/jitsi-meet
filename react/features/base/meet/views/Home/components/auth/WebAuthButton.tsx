import { Button } from "@internxt/ui";
import React from "react";
import { ErrorMessage } from "../../../../general/components/ErrorMessage";

interface WebAuthButtonProps {
    onClick: () => void;
    isLoading: boolean;
    error: string;
    translate: (key: string) => string;
    type: "login" | "signup";
}

export const WebAuthButton: React.FC<WebAuthButtonProps> = ({ onClick, isLoading, error, translate, type }) => {
    return (
        <div className="space-y-2">
            <Button
                type="button"
                onClick={onClick}
                className="flex w-full items-center justify-center gap-2"
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
            >
                {type === "login"
                    ? translate("meet.auth.modal.signinWithInternxt")
                    : translate("meet.auth.modal.signupWithBrowser")}
            </Button>
            {error && <ErrorMessage message={error} />}
        </div>
    );
};
