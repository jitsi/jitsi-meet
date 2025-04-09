import React, { useMemo } from "react";
import { VideoParticipantType } from "../types";
import VideoParticipant from "./VideoParticipant";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";


export interface VideoGalleryProps {
    participants: VideoParticipantType[];
    flipX?: boolean;
    translate: (key: string) => string;
}

const VideoGallery = ({ participants, flipX, translate }: VideoGalleryProps) => {
    const participantsNumber = participants.length;
    const { containerStyle } = useAspectRatio();

    const sortedParticipants = [...participants].sort((a, b) => {
        // Local user first
        if (a.local) return -1;
        if (b.local) return 1;
        // dominantSpeaker next
        if (a.dominantSpeaker) return -1;
        if (b.dominantSpeaker) return 1;
        // alfabetical order
        return a.name.localeCompare(b.name);
    });

    const getParticipantClasses = () => {
        let widthClass = "";
        let heightClass = "";

        if (participantsNumber === 1) {
            return "relative aspect-video max-h-[75%] max-w-full";
        } else if (participantsNumber === 2) {
            widthClass = "w-[calc(50%-5px)]";
            heightClass = "max-h-[75%]";
        } else if (participantsNumber === 3) {
            widthClass = "w-[calc(33%-10px)]";
            heightClass = "max-h-[36%]";
        } else if (participantsNumber === 4) {
            widthClass = "w-[calc(50%-5px)]";
            heightClass = "max-h-[36%]";
        } else if (participantsNumber > 4 && participantsNumber < 10) {
            widthClass = "w-[calc(33.333%-7px)]";
            heightClass = "max-h-[24%]";
        } else {
            widthClass = "w-[calc(25%-7px)]";
            heightClass = "max-h-[18%]";
        }

        return `relative ${widthClass} ${heightClass} aspect-video`;
    };

    return (
        <div className="h-full w-full flex items-center justify-center overflow-hidden bg-gray-950">
            <div
                className="h-[90%] w-[90%] flex justify-center items-center overflow-hidden"
                style={containerStyle}
            >
                <div className="max-h-full w-full flex flex-wrap justify-center items-center content-center gap-2.5 overflow-hidden">
                    {sortedParticipants.map((participant) => (
                        <VideoParticipant
                            key={participant.id}
                            participant={participant}
                            className={getParticipantClasses()}
                            translate={translate}
                            flipX={flipX}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoGallery;