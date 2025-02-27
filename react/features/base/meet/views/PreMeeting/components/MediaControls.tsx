import { CircleButton } from "@internxt/ui";
import { ExclamationMark, Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import React from "react";

import MeetAudioSettingsPopUp from "../MeetAudioSettingsPopup";
import CustomVideoSettingsPopUp from "../MeetVideoSettingsPopUp";

interface MediaControlsProps {
    videoTrack?: any;
    isVideoMuted?: boolean;
    audioTrack?: any;
    onVideoClick: () => void;
    onAudioClick: () => void;
    onVideoOptionsClick: () => void;
    onAudioOptionsClick: () => void;
}
const indicatorProps = {
    icon: <ExclamationMark size={12} color="white" weight="bold" />,
    className: "bg-orange",
};
const MediaControls: React.FC<MediaControlsProps> = ({
    videoTrack,
    isVideoMuted,
    audioTrack,
    onVideoClick,
    onAudioClick,
    onVideoOptionsClick,
    onAudioOptionsClick,
}) => {
    const isAudioTrackMuted = audioTrack?.isMuted();

    const audioIndicatorProps = !audioTrack ? indicatorProps : undefined;
    const videoIndicatorProps = !videoTrack ? indicatorProps : undefined;

    return (
        <div className="flex space-x-2 justify-center items-center">
            <CircleButton
                variant="default"
                active={videoTrack && !isVideoMuted}
                indicator={videoIndicatorProps}
                onClick={onVideoClick}
                onClickToggleButton={onVideoOptionsClick}
                dropdown={<CustomVideoSettingsPopUp />}
            >
                {videoTrack && !isVideoMuted ? (
                    <VideoCamera size={22} color="black" weight="fill" />
                ) : (
                    <VideoCameraSlash size={22} color="white" weight="fill" />
                )}
            </CircleButton>
            <CircleButton
                variant="default"
                active={audioTrack && !isAudioTrackMuted}
                indicator={audioIndicatorProps}
                onClick={onAudioClick}
                onClickToggleButton={onAudioOptionsClick}
                dropdown={<MeetAudioSettingsPopUp />}
            >
                {audioTrack && !isAudioTrackMuted ? (
                    <Microphone size={22} color="black" weight="fill" />
                ) : (
                    <MicrophoneSlash size={20} color="white" weight="fill" />
                )}
            </CircleButton>
        </div>
    );
};

export default MediaControls;
