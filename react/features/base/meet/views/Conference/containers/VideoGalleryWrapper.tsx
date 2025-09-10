import React, { useEffect, useMemo } from "react";
import { WithTranslation } from "react-i18next";
import { connect, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { getCurrentConference } from "../../../../conference/functions";
import { translate } from "../../../../i18n/functions";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";
import { useE2EEActivation } from "../../../general/hooks/useE2EEActivation";
import MeetingService from "../../../services/meeting.service";
import { MeetingUser } from "../../../services/types/meeting.types";
import VideoGallery from "../components/VideoGallery";
import VideoSpeaker from "../components/VideoSpeaker";
import { getParticipantsWithTracks } from "../utils";

interface OwnProps {
    videoMode: string;
}

interface MappedStateProps {
    isE2EESupported: boolean;
    room?: string;
}

interface GalleryVideoWrapperProps extends WithTranslation, OwnProps, MappedStateProps {}

const GalleryVideoWrapper = ({ videoMode, t, isE2EESupported, room }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    useE2EEActivation(isE2EESupported);

    const participants = useSelector((state: IReduxState) => getParticipantsWithTracks(state));
    const flipX = useSelector((state: IReduxState) => state["features/base/settings"].localFlipX);

    const contStyle = videoMode === "gallery" ? containerStyle : {};
    const [meetingParticipants, setMeetingParticipants] = React.useState<MeetingUser[]>([]);

    useEffect(() => {
        const fetchMeetingParticipants = async (): Promise<void> => {
            if (!room) return;

            try {
                const meetingParticipantsData = await MeetingService.instance.getCurrentUsersInCall(room);
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

function mapStateToProps(state: IReduxState, ownProps: OwnProps): MappedStateProps & OwnProps {
    const conference = getCurrentConference(state);
    const isE2EESupported = conference?.isE2EESupported() ?? false;
    const room = state["features/base/conference"].room ?? "";

    return {
        ...ownProps,
        isE2EESupported,
        room
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
