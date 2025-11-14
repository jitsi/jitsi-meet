import { Avatar } from "@internxt/ui";
import { Hand, MicrophoneSlash } from "@phosphor-icons/react";
import clsx from "clsx";
import React, { useMemo } from "react";
import ConnectionIndicator from "../../../../../connection-indicator/components/web/ConnectionIndicator";
import Video from "../../../../media/components/web/Video";
import { isSafari } from "../../../general/utils/safariDetector";
import { ConfigService } from "../../../services/config.service";
import { useVideoEncoding } from "../../PreMeeting/containers/VideoEncodingToggle";
import { VideoParticipantType } from "../types";

export type VideoParticipantProps = {
    participant: VideoParticipantType;
    flipX?: boolean;
    className?: string;
    translate: (key: string) => string;
    isScreenShare?: boolean;
    backgroundColor?: string;
    relativePositioning?: boolean;
};

const VideoParticipant = ({
    participant,
    className = "",
    flipX,
    translate,
    isScreenShare = false,
    backgroundColor = "",
    relativePositioning,
}: VideoParticipantProps) => {
    const { id, name, videoEnabled, audioMuted, videoTrack, local, dominantSpeaker, raisedHand, avatarSource } =
        participant;

    const { isEncodingEnabled } = useVideoEncoding();
    // Encoding will not be used for now, it has decoding problems and video lag. We will leave it set to false.
    const encodeVideo = useMemo(() => {
        if (isSafari()) {
            return false;
        }

        return ConfigService.instance.isDevelopment() ? isEncodingEnabled : true;
    }, [isEncodingEnabled]);

    return (
        <div
            className={`${relativePositioning ? "relative" : ""} flex ${
                isScreenShare ? "" : "aspect-square sm:aspect-video"
            } min-w-40 ${className} items-center justify-center rounded-[20px] overflow-hidden ${
                !!backgroundColor ? backgroundColor : "bg-gray-90"
            }
            ${dominantSpeaker && !isScreenShare ? "ring-4 ring-white" : ""}`}
            data-testid={`participant-${id}`}
        >
            {videoEnabled ? (
                <Video
                    videoTrack={isScreenShare ? videoTrack : { jitsiTrack: videoTrack }}
                    className={clsx(
                        "w-full h-full",
                        isScreenShare ? "object-contain" : "object-cover",
                        flipX && local && !isScreenShare && "scale-x-[-1]"
                    )}
                    key={`video-${id}`}
                    // Set to false due to decoding issues and video lag
                    encodeVideo={true}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar src={avatarSource} fullName={name ?? ""} className="text-white bg-white/10" diameter={80} />
                </div>
            )}

            {/* status items */}
            <div className="absolute bottom-2 left-2 px-3 py-2 bg-black/70 backdrop-blur-sm flex justify-between items-center space-x-2 rounded-[20px]">
                <div className="text-white text-sm font-medium truncate max-w-full">
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
