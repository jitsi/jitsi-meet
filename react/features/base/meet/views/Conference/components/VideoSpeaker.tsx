import React from "react";
import { VideoParticipantType } from "../types";
import VideoParticipant from "./VideoParticipant";
import LargeVideo from "../../../../../large-video/components/LargeVideo.web";

export interface VideoSpeakerProps {
    participants: VideoParticipantType[];
    translate: (key: string) => string;
    flipX?: boolean;
}

const VideoSpeaker = ({ participants, translate, flipX }: VideoSpeakerProps) => {
    const localParticipant = participants.find((participant) => participant.local);

    return (
        <div className="flex h-screen w-full overflow-hidden relative">
            <LargeVideo />
            {localParticipant && participants.length > 1 && (
                <VideoParticipant
                    key={localParticipant.id}
                    participant={localParticipant}
                    translate={translate}
                    className="absolute sm:bottom-4 bottom-24 right-4 aspect-video w-1/5 max-w-xs"
                    flipX={flipX}
                />
            )}
        </div>
    );
};

export default VideoSpeaker;
