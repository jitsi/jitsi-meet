import React from "react";
import { WithTranslation } from "react-i18next";
import { connect, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { getCurrentConference } from "../../../../conference/functions";
import { translate } from "../../../../i18n/functions";
import Video from "../../../../media/components/web/Video";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";
import { useParticipantAvatar } from "../../PreMeeting/hooks/useParticipantAvatar";
import VideoGallery from "../components/VideoGallery";
import VideoParticipant from "../components/VideoParticipant";
import VideoSpeaker from "../components/VideoSpeaker";
import { getParticipantsWithTracks, getScreenShareParticipants } from "../utils";

interface OwnProps {
    videoMode: string;
}

interface MappedStateProps {
    isE2EESupported: boolean;
    room?: string;
}

interface GalleryVideoWrapperProps extends WithTranslation, OwnProps, MappedStateProps {}

const GalleryVideoWrapper = ({ videoMode, t }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();

    useParticipantAvatar();
    const participants = useSelector(getParticipantsWithTracks);
    const screenShareParticipants = useSelector(getScreenShareParticipants);
    const flipX = useSelector((state: IReduxState) => state["features/base/settings"].localFlipX);

    const contStyle = videoMode === "gallery" ? containerStyle : {};
    const hasScreenShare = screenShareParticipants.length > 0;

    return (
        <div className="h-full w-full bg-gray-950" style={contStyle}>
            <AudioTracksContainer />
            {hasScreenShare && (
                <div className="absolute h-full items-center inset-0 z-[99] flex bg-gray-950 gap-4 p-4">
                    <div className="flex-1 flex h-full items-center justify-center">
                        {screenShareParticipants.map((participant) => (
                            <VideoParticipant
                                key={participant.id}
                                participant={participant}
                                className="w-full h-5/6 bg-black"
                                translate={t}
                                flipX={false}
                                isScreenShare={true}
                            />
                        ))}
                    </div>

                    <div className="w-80 h-5/6 flex flex-col gap-3 overflow-y-auto">
                        {participants.map((participant) => (
                            <div key={participant.id} className="flex-shrink-0">
                                <VideoParticipant
                                    participant={participant}
                                    className="w-full aspect-video"
                                    translate={t}
                                    flipX={flipX}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className={videoMode === "gallery" && !hasScreenShare ? "block" : "hidden"}>
                <VideoGallery participants={participants} translate={t} flipX={flipX} />
            </div>
            <div className={videoMode === "speaker" && !hasScreenShare ? "block" : "hidden"}>
                <VideoSpeaker participants={participants} translate={t} flipX={flipX} />
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
        room,
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
