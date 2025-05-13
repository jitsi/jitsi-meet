import React, { useEffect, useMemo } from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { translate } from "../../../../i18n/functions";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";
import MeetingService from "../../../services/meeting.service";
import { MeetingUser } from "../../../services/types/meeting.types";
import VideoGallery from "../components/VideoGallery";
import VideoSpeaker from "../components/VideoSpeaker";
import { VideoParticipantType } from "../types";
import { getParticipantsWithTracks } from "../utils";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    participants?: VideoParticipantType[];
    flipX?: boolean;
    room?: string;
}

const GalleryVideoWrapper = ({ videoMode, participants, flipX, t, room }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    const contStyle = videoMode === "gallery" ? containerStyle : {};
    const [meetingParticipants, setMeetingParticipants] = React.useState<MeetingUser[]>([]);

    useEffect(() => {
        const fetchMeetingParticipants = async (): Promise<void> => {
            if (!room) return;

            try {
                const meetingParticipantsData = await MeetingService.getInstance().getCurrentUsersInCall(room);
                setMeetingParticipants(meetingParticipantsData);
            } catch (error) {
                console.error("Error fetching meeting participants:", error);
            }
        };

        fetchMeetingParticipants();
    }, [room, participants?.length]);

    const participantsWithAvatar = useMemo(() => {
        if (!participants || participants.length === 0) return [];
        if (!meetingParticipants || meetingParticipants.length === 0) return participants;

        const avatarMap: Record<string, string | undefined> = {};
        meetingParticipants.forEach((mp) => {
            if (mp.userId) {
                avatarMap[mp.userId] = mp.avatar;
            }
        });

        return participants.map((participant) => ({
            ...participant,
            avatarSource: avatarMap[participant.id],
        }));
    }, [participants, meetingParticipants]);

    return (
        <div className="h-full w-full bg-gray-950" style={contStyle}>
            <AudioTracksContainer />
            <div className={videoMode === "gallery" ? "block" : "hidden"}>
                <VideoGallery participants={participantsWithAvatar} translate={t} flipX={flipX} />
            </div>
            <div className={videoMode === "speaker" ? "block" : "hidden"}>
                <VideoSpeaker participants={participantsWithAvatar} translate={t} flipX={flipX} />
            </div>
        </div>
    );
};

function mapStateToProps(state: IReduxState, galleryProps: GalleryVideoWrapperProps) {
    const participantsWithTracks = getParticipantsWithTracks(state);

    const { localFlipX } = state["features/base/settings"];
    const room = state["features/base/conference"].room ?? "";

    return {
        videoMode: galleryProps.videoMode || "gallery",
        flipX: localFlipX,
        participants: participantsWithTracks,
        room,
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
