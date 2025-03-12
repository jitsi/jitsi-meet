import { Avatar } from "@internxt/ui";
import { Hand, MicrophoneSlash } from "@phosphor-icons/react";
import React from "react";
import ConnectionIndicator from "../../../../../connection-indicator/components/web/ConnectionIndicator";
import Video from "../../../../media/components/web/Video";
import { VideoParticipantType } from "../types";
import clsx from "clsx";

export type VideoParticipantProps = {
    participant: VideoParticipantType;
    flipX?: boolean;
    className?: string;
    translate: (key: string) => string;
};

const VideoParticipant = ({ participant, className = "", flipX, translate }: VideoParticipantProps) => {
    const { id, name, videoEnabled, audioMuted, videoTrack, local, dominantSpeaker, raisedHand, avatarSource } =
        participant;

    return (
        <div
            className={`flex aspect-square min-w-40 items-center justify-center rounded-[20px] overflow-hidden bg-gray-90 sm:aspect-video ${className}
            ${dominantSpeaker ? "ring-4 ring-white" : ""}`}
            data-testid={`participant-${id}`}
        >
            {videoEnabled ? (
                <Video
                    videoTrack={{ jitsiTrack: videoTrack }}
                    className={clsx("w-full h-full object-cover", flipX && local && "scale-x-[-1]")}
                    key={`video-${id}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar src={avatarSource} fullName={name ?? ""} className="text-white bg-white/10" diameter={80} />
                </div>
            )}

            {/* status items */}
            <div className="absolute bottom-2 left-2 px-3 py-2 bg-black/50 flex justify-bedtween items-center space-x-2 rounded-[20px]">
                <div className="text-white truncate max-w-full">
                    {name} {local ? ` (${translate("meet.meeting.videoParticipants.you")})` : ""}
                </div>
                <div className="flex space-x-2 justify-center items-center">
                    {audioMuted && (
                        <div className="text-red-500">
                            <MicrophoneSlash width={18} height={18} color="red" weight="fill" />
                        </div>
                    )}
                    {raisedHand && (
                        <div className="text-yellow">
                            <Hand width={18} height={18} weight="fill" />
                        </div>
                    )}
                    <ConnectionIndicator
                        participantId={id}
                        iconSize={18}
                        enableStatsDisplay={true}
                        alwaysVisible={true}
                        statsPopoverPosition="top"
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoParticipant;
