import React from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import { translate } from "../../../../i18n/functions";
import VideoGallery from "../components/VideoGallery";
import VideoSpeaker from "../components/VideoSpeaker";
import { VideoParticipantType } from "../types";
import { getParticipantsWithTracks } from "../utils";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";


interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    participants?: VideoParticipantType[];
    flipX?: boolean;
}

const GalleryVideoWrapper = ({ videoMode, participants, flipX, t }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    const contStyle = videoMode === "gallery" ? containerStyle : {};

    return (
        <div className="h-full w-full bg-gray-950" style={contStyle}>
            <AudioTracksContainer />
            <div className={videoMode === "gallery" ? "block" : "hidden"}>
                <VideoGallery participants={participants ?? []} translate={t} flipX={flipX} />
            </div>
            <div className={videoMode === "speaker" ? "block" : "hidden"}>
                <VideoSpeaker participants={participants ?? []} translate={t} flipX={flipX} />
            </div>
        </div>
    );
};

function mapStateToProps(state: IReduxState, galleryProps: GalleryVideoWrapperProps) {
    const participantsWithTracks = getParticipantsWithTracks(state);

    const { localFlipX } = state["features/base/settings"];

    return {
        videoMode: galleryProps.videoMode || "gallery",
        flipX: localFlipX,
        participants: participantsWithTracks,
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));