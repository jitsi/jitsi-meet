import { Button } from "@internxt/ui";
import React from "react";
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
}) => {
    const isMeetEnabled = useSelector(isMeetingEnabled);
    const isLogged = !!useUserData();

    if (!isLogged) {
        return null;
    }

    if (isMeetEnabled) {
        return (
            <Button variant={variant} onClick={onNewMeeting} disabled={loading} loading={loading} className={className}>
                {translate("meet.preMeeting.newMeeting")}
            </Button>
        );
    } else {
        return null;
    }
};

export default MeetingButton;
