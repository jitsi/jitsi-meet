import { Button, TransparentModal } from "@internxt/ui";
import React from "react";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";
import NameInputSection from "./NameInputSection";
import ParticipantsList from "./ParticipantsList";
import VideoPreviewSection from "./VideoPreviewSection";

interface PreMeetingModalProps {
    /**
     * The video track to render as preview
     */
    videoTrack?: Object;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The audio track.
     */
    audioTrack?: any;

    /**
     * The name of the participant.
     */
    userName: string;

    /**
     * Whether to show name error or not
     */
    showNameError: boolean;

    /**
     * Handler to set the user name
     */
    setUserName: (name: string) => void;

    /**
     * Handler to set if name input is focused
     */
    setIsNameInputFocused: (isFocused: boolean) => void;

    /**
     * List of participants
     */
    participants: any[];

    /**
     * Translation function
     */
    translate: (key: string) => string;

    /**
     * Join conference handler
     */
    joinConference?: () => void;

    /**
     * Disable join button
     */
    disableJoinButton?: boolean;
}

/**
 * Component for the pre-meeting modal
 */
const PreMeetingModal = ({
    videoTrack,
    videoMuted = false,
    audioTrack,
    userName,
    showNameError,
    setUserName,
    setIsNameInputFocused,
    participants,
    translate,
    joinConference,
    disableJoinButton,
}: PreMeetingModalProps) => {
    return (
        <TransparentModal
            className={"flex p-7 bg-black/50 border border-white/15 rounded-[20px]"}
            isOpen={true}
            onClose={() => {}}
            disableBackdrop
        >
            <div className="flex flex-col h-full text-white space-y-4">
                <VideoPreviewSection
                    videoMuted={videoMuted}
                    videoTrack={videoTrack}
                    isAudioMuted={audioTrack?.isMuted()}
                />
                <NameInputSection
                    userName={userName}
                    showNameError={showNameError}
                    setUserName={setUserName}
                    setIsNameInputFocused={setIsNameInputFocused}
                    translate={translate}
                />
                <MediaControlsWrapper />
                <ParticipantsList participants={participants} translate={translate} />
                <Button
                    onClick={joinConference}
                    disabled={!userName || disableJoinButton}
                    loading={disableJoinButton}
                    variant="primary"
                    className="mt-5"
                >
                    {translate("meet.preMeeting.joinMeeting")}
                </Button>
            </div>
        </TransparentModal>
    );
};

export default PreMeetingModal;
