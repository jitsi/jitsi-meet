import React from "react";
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
    const hasOneParticipant = participantsNumber === 1;

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

        if (hasOneParticipant) {
            return "relative aspect-square sm:aspect-video h-full max-w-full";
        } else if (participantsNumber === 2) {
            widthClass = "w-[calc(50%-5px)]";
            heightClass = "sm:max-h-[75%]";
        } else if (participantsNumber === 3) {
            widthClass = "w-[calc(33.333%-5px)] sm:w-[calc(33%-10px)]";
            heightClass = "sm:max-h-[36%]";
        } else if (participantsNumber === 4) {
            widthClass = "w-[calc(50%-5px)]";
            heightClass = "sm:max-h-[36%]";
        } else if (participantsNumber > 4 && participantsNumber < 10) {
            widthClass = "w-[calc(50%-5px)] sm:w-[calc(33.333%-7px)]";
            heightClass = "sm:max-h-[24%]";
        } else {
            widthClass = "w-[calc(50%-5px)] sm:w-[calc(25%-7px)]";
            heightClass = "sm:max-h-[18%]";
        }


        const mobileHeightClass = participantsNumber > 4 ? "max-h-[120px]" : "";

        return `relative ${widthClass} ${heightClass} ${mobileHeightClass} aspect-square sm:aspect-video`;
    };

    return (
        <div className="h-full w-full flex items-center justify-center overflow-hidden bg-gray-950">
            <div
                className={`max-h-[85vh] sm:h-[90%] w-[95%] sm:w-[90%] flex justify-center items-center`}
                style={containerStyle}
            >
                <div className={`${hasOneParticipant ? "h-full": ""} w-full flex flex-wrap justify-center items-start content-start gap-2.5`}>
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