import React from "react";
import { VideoParticipantType } from "../types";
import VideoParticipant from "./VideoParticipant";

export interface VideoGalleryProps {
    participants: VideoParticipantType[];
    flipX?: boolean;
    translate: (key: string) => string;
}

const VideoGallery = ({ participants, flipX, translate }: VideoGalleryProps) => {
    const participantsNumber = participants.length;
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

    const getParticipantClasses = (index: number) => {
        let classes = "";

        if (participantsNumber === 1) {
            classes = "relative flex-[0_0_80%] max-h-[80vh]";
        } else if (participantsNumber === 2) {
            classes = "relative flex-[0_0_calc(50%-10px)] sm:flex-[0_0_calc(45%-10px)]";
        } else if (participantsNumber === 3) {
            if (index < 2) {
                classes = "relative flex-[0_0_calc(40%-10px)] sm:flex-[0_0_calc(45%-10px)]";
            } else {
                classes = "relative flex-[0_0_calc(40%-10px)] sm:flex-[0_0_calc(45%-10px)]";
            }
        } else if (participantsNumber === 4) {
            classes = "relative flex-[0_0_calc(50%-10px)] sm:flex-[0_0_calc(45%-10px)]";
        } else {
            classes = "relative flex-[0_0_calc(50%-10px)] sm:flex-[0_0_calc(33.333%-20px)]";
        }

        return classes;
    };

    return (
        <div className="flex h-screen w-full items-center justify-center overflow-hidden">
            <div
                className={`flex max-h-4/5 w-full flex-row flex-wrap items-center justify-center gap-2.5 p-2.5 sm:gap-5 sm:p-5`}
            >
                {sortedParticipants.map((participant, index) => (
                    <VideoParticipant
                        key={participant.id}
                        participant={participant}
                        className={getParticipantClasses(index)}
                        translate={translate}
                        flipX={flipX}
                    />
                ))}
            </div>
        </div>
    );
};

export default VideoGallery;
