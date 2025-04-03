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
                    className="absolute bottom-4 right-4 h-[17%] w-[15%]"
                    flipX={flipX}
                />
            )}
        </div>
    );
};

export default VideoSpeaker;
