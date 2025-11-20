import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import LargeVideo from "../../../../../large-video/components/LargeVideo.web";
import { VideoParticipantType } from "../types";
import VideoParticipant from "./VideoParticipant";

interface VideoLayoutManager {
    id?: string;
    state?: string;
}

interface VideoLayoutInterface {
    initLargeVideo?: () => void;
    updateLargeVideo?: (participantId: string, forceUpdate?: boolean) => void;
    largeVideo?: VideoLayoutManager;
}

interface UIInterface {
    VideoLayout?: VideoLayoutInterface;
}

interface APPInterface {
    UI?: UIInterface;
}

declare global {
    interface Window {
        APP?: APPInterface;
    }
}

export interface VideoSpeakerProps {
    participants: VideoParticipantType[];
    translate: (key: string) => string;
    flipX?: boolean;
}

const VideoSpeaker = ({ participants, translate, flipX }: VideoSpeakerProps) => {
    const dispatch = useDispatch();
    const localParticipant = participants.find((participant) => participant.local);

    const largeVideoParticipantId = useSelector((state: IReduxState) =>
        state['features/large-video'].participantId
    );
    const conference = useSelector((state: IReduxState) => state['features/base/conference']);
    const participants_state = useSelector((state: IReduxState) => state['features/base/participants']);

    const getVideoLayoutStatus = useCallback(() => {
        const videoLayoutExists = !!window.APP?.UI?.VideoLayout;
        const largeVideoExists = !!window.APP?.UI?.VideoLayout?.largeVideo;
        return { videoLayoutExists, largeVideoExists };
    }, []);

    const updateVideoLayout = useCallback((participantId: string) => {
        const { videoLayoutExists } = getVideoLayoutStatus();
        if (videoLayoutExists && window.APP?.UI?.VideoLayout?.updateLargeVideo) {
            try {
                window.APP.UI.VideoLayout.updateLargeVideo(participantId, true);
            } catch (error) {
                // Silent fail
            }
        }
    }, [getVideoLayoutStatus]);

    const initializeVideoLayout = useCallback(() => {
        dispatch({
            type: 'CONFERENCE_WILL_INIT',
            conference: conference.conference
        });
    }, [dispatch, conference.conference]);

    const selectLargeVideoParticipant = useCallback((participantId: string) => {
        dispatch({
            type: 'SELECT_LARGE_VIDEO_PARTICIPANT',
            participantId
        });
    }, [dispatch]);

    const handleVideoLayoutInitialization = useCallback((targetParticipant: string) => {
        const { videoLayoutExists, largeVideoExists } = getVideoLayoutStatus();

        if (!videoLayoutExists) {
            // Force VideoLayout initialization for new-meeting flow
            initializeVideoLayout();
            setTimeout(() => updateVideoLayout(targetParticipant), 200);
        } else if (!largeVideoExists) {
            // Initialize largeVideo if VideoLayout exists but largeVideo doesn't
            try {
                window.APP?.UI?.VideoLayout?.initLargeVideo?.();
            } catch (error) {
                // Silent fail
            }
        }
    }, [getVideoLayoutStatus, initializeVideoLayout, updateVideoLayout]);

    useEffect(() => {
        const remoteParticipants = participants.filter(p => !p.local);
        const dominantSpeaker = participants_state.dominantSpeaker;

        if (remoteParticipants.length === 0) {
            return;
        }

        const targetParticipant = dominantSpeaker || remoteParticipants[0]?.id;

        if (largeVideoParticipantId !== targetParticipant && targetParticipant) {
            // Handle VideoLayout initialization
            handleVideoLayoutInitialization(targetParticipant);

            // Set participant in Redux
            selectLargeVideoParticipant(targetParticipant);

            // Update VideoLayout directly
            setTimeout(() => updateVideoLayout(targetParticipant), 100);
        }
    }, [
        largeVideoParticipantId,
        participants_state.dominantSpeaker,
        participants.length,
        handleVideoLayoutInitialization,
        selectLargeVideoParticipant,
        updateVideoLayout
    ]);

    return (
        <div className="flex h-screen w-full overflow-hidden relative">
            <LargeVideo />
            {localParticipant && (
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