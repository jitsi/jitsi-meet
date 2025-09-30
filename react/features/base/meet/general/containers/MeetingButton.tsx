import { Button } from "@internxt/ui";
import { Info } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useUserData } from "../../views/PreMeeting/hooks/useUserData";
import { isMeetingEnabled } from "../store/meeting/selectors";

interface MeetingButtonProps {
    /**
     * Handler for the new meeting button
     */
    onNewMeeting: () => void;

    /**
     * Translation function
     */
    translate: (key: string) => string;

    /**
     * Whether the new meeting button should be disabled
     */
    loading?: boolean;

    /**
     * Additional CSS class for the button
     */
    className?: string;

    /**
     * Button variant
     */
    variant?: "primary" | "secondary" | "tertiary";

    /**
     * Whether to display the upgrade button
     * @default false
     * */
    displayUpgradeButton?: boolean;

    /**
     * Whether to always display the new meeting button
     * @default false
     * */
    displayNewMeetingButtonAlways?: boolean;
}

/**
 * A smart component that automatically displays either "New Meeting" or "Upgrade"
 * button based on user's login status and meeting feature access.
 */
const MeetingButton: React.FC<MeetingButtonProps> = ({
    onNewMeeting,
    translate,
    loading = false,
    className = "",
    variant = "primary",
    displayUpgradeButton = false,
    displayNewMeetingButtonAlways = false,
}) => {
    const isMeetEnabled = useSelector(isMeetingEnabled);
    const isLogged = !!useUserData();
    const [showTooltip, setShowTooltip] = useState(false);

    if (!isLogged) {
        if (displayNewMeetingButtonAlways) {
            return (
                <Button
                    variant={variant}
                    onClick={onNewMeeting}
                    disabled={loading}
                    loading={loading}
                    className={className}
                >
                    {translate("meet.preMeeting.newMeeting")}
                </Button>
            );
        } else {
            return null;
        }
    }

    if (isMeetEnabled) {
        return (
            <Button variant={variant} onClick={onNewMeeting} disabled={loading} loading={loading} className={className}>
                {translate("meet.preMeeting.newMeeting")}
            </Button>
        );
    } else {
        return displayUpgradeButton ? (
            <div className="flex flex-row items-center space-x-3">
                <Button
                    variant={variant}
                    onClick={() => window.open("https://internxt.com/pricing", "_blank")}
                    disabled={loading}
                    loading={loading}
                    className={className}
                >
                    {translate("meet.preMeeting.upgrade")}
                </Button>

                <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Info size={20} className="text-white cursor-pointer" />

                    {showTooltip && (
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 w-max max-w-sm">
                            <div className="relative bg-white rounded-lg shadow-lg px-4 py-3">
                                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
                                <p className="text-sm text-black leading-tight whitespace-pre-line">
                                    {translate("meet.preMeeting.upgradeMessage")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : null;
    }
};

export default MeetingButton;
