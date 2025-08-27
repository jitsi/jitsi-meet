import React from "react";
import { WithTranslation } from "react-i18next";
import { connect, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { getCurrentConference } from "../../../../conference/functions";
import { translate } from "../../../../i18n/functions";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";
import { useE2EEActivation } from "../../../general/hooks/useE2EEActivation";
import VideoGallery from "../components/VideoGallery";
import VideoSpeaker from "../components/VideoSpeaker";
import { getParticipantsWithTracks } from "../utils";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    isE2EESupported: boolean;
}

const GalleryVideoWrapper = ({ videoMode, t, isE2EESupported }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    useE2EEActivation(isE2EESupported);

    const participants = useSelector((state: IReduxState) => getParticipantsWithTracks(state));
    const flipX = useSelector((state: IReduxState) => state["features/base/settings"].localFlipX);

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
    const conference = getCurrentConference(state);
    const isE2EESupported = conference?.isE2EESupported() ?? false;
    return {
        videoMode: galleryProps.videoMode || "gallery",
        isE2EESupported
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
