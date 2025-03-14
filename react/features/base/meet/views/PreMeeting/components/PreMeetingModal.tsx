import { Button, TransparentModal } from "@internxt/ui";
import React from "react";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";
import NameInputSection from "./NameInputSection";
import ParticipantsList from "./ParticipantsList";
import VideoPreviewSection from "./VideoPreviewSection";
import { MAX_SIZE_PARTICIPANTS } from "../../../constants";
import { useTranslation } from "react-i18next";

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
     * Join conference handler
     */
    joinConference?: () => void;

    /**
     * Disable join button
     */
    disableJoinButton?: boolean;

    /**
     * Mirror video
     */
    flipX?: boolean;

    /**
     * Flag to indicate if conference is creating.
     */
    isCreatingConference?: boolean;
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
    joinConference,
    disableJoinButton,
    flipX,
    isCreatingConference,
}: PreMeetingModalProps) => {
    const num = MAX_SIZE_PARTICIPANTS;
    const { t } = useTranslation();
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
                    flipX={flipX}
                />
                <NameInputSection
                    userName={userName}
                    showNameError={showNameError}
                    setUserName={setUserName}
                    setIsNameInputFocused={setIsNameInputFocused}
                    translate={t}
                />
                <MediaControlsWrapper />
                {isCreatingConference ? (
                    <div className="flex flex-col items-center justify-center space-y-5">
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xl font-semibold text-white">{t("meet.internxtMeet")}</span>

                            <span className="text-base font-normal text-white/75">
                                {t("meet.preMeeting.upToParticipants", { num })}
                            </span>
                        </div>
                    </div>
                ) : (
                    <ParticipantsList participants={participants} translate={t} />
                )}
                <Button
                    onClick={joinConference}
                    disabled={!userName || disableJoinButton}
                    loading={disableJoinButton}
                    variant="primary"
                    className="mt-5"
                >
                    {isCreatingConference ? t("meet.preMeeting.newMeeting") : t("meet.preMeeting.joinMeeting")}
                </Button>
            </div>
        </TransparentModal>
    );
};

export default PreMeetingModal;
