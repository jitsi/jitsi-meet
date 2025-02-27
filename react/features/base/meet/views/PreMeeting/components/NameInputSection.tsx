import { Input } from "@internxt/ui";
import React from "react";

interface NameInputProps {
    userName: string;
    showNameError: boolean;
    setUserName: (name: string) => void;
    setIsNameInputFocused: (focused: boolean) => void;
    translate: (key: string) => string;
}

const NameInputSection = React.memo(
    ({ userName, showNameError, setUserName, setIsNameInputFocused, translate }: NameInputProps) => (
        <div className="flex mt-7 space-y-2 flex-col">
            <Input
                variant="default"
                accent={showNameError ? "error" : undefined}
                onChange={setUserName}
                placeholder={translate("meet.preMeeting.enterYourName")}
                value={userName}
                inputClassName="text-white bg-white/10 text-base font-medium text-center rounded-lg"
                borderRadius="rounded-lg"
                fontClasses="text-base font-medium"
                onFocus={() => setIsNameInputFocused(true)}
                onBlur={() => setIsNameInputFocused(false)}
            />
            {showNameError && (
                <div className="flex flex-grow justify-center items-center text-red">
                    <p className="text-sm">{translate("meet.preMeeting.nameRequired")}</p>
                </div>
            )}
        </div>
    )
);

export default NameInputSection;