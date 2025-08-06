import React, { useEffect, useRef } from "react";
import { WithTranslation } from "react-i18next";
import { connect, useDispatch, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import { toggleE2EE } from "../../../../../e2ee/actions";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { getIsLobbyVisible } from "../../../../../lobby/functions";
import { isPrejoinPageVisible } from "../../../../../prejoin/functions";
import { translate } from "../../../../i18n/functions";
import { isLocalParticipantModerator } from "../../../../participants/functions";
import { useAspectRatio } from "../../../general/hooks/useAspectRatio";
import VideoGallery from "../components/VideoGallery";
import VideoSpeaker from "../components/VideoSpeaker";
import { getParticipantsWithTracks } from "../utils";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
}

const GalleryVideoWrapper = ({ videoMode, t }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    const isModerator = useSelector(isLocalParticipantModerator);
    const participants = useSelector((state: IReduxState) => getParticipantsWithTracks(state));
    const flipX = useSelector((state: IReduxState) => state["features/base/settings"].localFlipX);
    const _showLobby = useSelector((state: IReduxState) => getIsLobbyVisible(state));
    const _showPrejoin = useSelector((state: IReduxState) => isPrejoinPageVisible(state));

    const dispatch = useDispatch();
    const prevShowStateRef = useRef<{ showLobby: boolean; showPrejoin: boolean }>({
        showLobby: _showLobby,
        showPrejoin: _showPrejoin,
    });

    const contStyle = videoMode === "gallery" ? containerStyle : {};

    useEffect(() => {
        const wasPrejoinOrLobbyVisible = prevShowStateRef.current.showPrejoin || prevShowStateRef.current.showLobby;
        const isConferenceDisplayed = !_showPrejoin && !_showLobby;

        const shouldActivateE2EE =
            (isConferenceDisplayed && isModerator) ||
            (wasPrejoinOrLobbyVisible && isConferenceDisplayed && isModerator);

        if (shouldActivateE2EE) {
            dispatch(toggleE2EE(true));
        }

        prevShowStateRef.current = {
            showLobby: _showLobby,
            showPrejoin: _showPrejoin,
        };
    }, [_showLobby, _showPrejoin, dispatch, isModerator]);

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
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));
