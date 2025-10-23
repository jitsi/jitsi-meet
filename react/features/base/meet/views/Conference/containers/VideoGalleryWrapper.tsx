import { CaretDown, CaretUp, CheckCircle, MonitorArrowUp } from "@phosphor-icons/react";
import React, { useRef, useState } from "react";
import { WithTranslation } from "react-i18next";
import { connect, useSelector } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import AudioTracksContainer from "../../../../../filmstrip/components/web/AudioTracksContainer";
import { startScreenShareFlow } from "../../../../../screen-share/actions.web";
import { isScreenVideoShared } from "../../../../../screen-share/functions";
import { getCurrentConference } from "../../../../conference/functions";
import { translate } from "../../../../i18n/functions";
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

interface GalleryVideoWrapperProps extends WithTranslation, OwnProps, MappedStateProps {
    dispatch: any;
}

const GalleryVideoWrapper = ({ videoMode, t, dispatch }: GalleryVideoWrapperProps) => {
    const { containerStyle } = useAspectRatio();
    const participantsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);

    useParticipantAvatar();
    const participants = useSelector(getParticipantsWithTracks);
    const screenShareParticipants = useSelector(getScreenShareParticipants);
    const flipX = useSelector((state: IReduxState) => state["features/base/settings"].localFlipX);
    const isLocalSharing = useSelector((state: IReduxState) => isScreenVideoShared(state));

    const contStyle = videoMode === "gallery" ? containerStyle : {};
    const hasScreenShare = screenShareParticipants.length > 0;
    const sharingParticipant = screenShareParticipants[0];

    const handleStopSharing = () => {
        dispatch(startScreenShareFlow(false));
    };

    const checkScrollButtons = () => {
        if (participantsScrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = participantsScrollRef.current;
            const hasScrollableContent = scrollHeight > clientHeight;
            setHasScroll(hasScrollableContent);
            setCanScrollUp(scrollTop > 0);
            setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
        }
    };

    const scrollUp = () => {
        if (participantsScrollRef.current) {
            participantsScrollRef.current.scrollBy({ top: -200, behavior: "smooth" });
        }
    };

    const scrollDown = () => {
        if (participantsScrollRef.current) {
            participantsScrollRef.current.scrollBy({ top: 200, behavior: "smooth" });
        }
    };

    React.useEffect(() => {
        checkScrollButtons();
        const scrollContainer = participantsScrollRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener("scroll", checkScrollButtons);
            window.addEventListener("resize", checkScrollButtons);
            return () => {
                scrollContainer.removeEventListener("scroll", checkScrollButtons);
                window.removeEventListener("resize", checkScrollButtons);
            };
        }
    }, [participants]);

    return (
        <div className="h-full w-full bg-gray-950" style={contStyle}>
            <AudioTracksContainer />

            {/* Screen Sharing Notification */}
            {hasScreenShare && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#EAF9EE] border border-[#F9F9FC] text-white rounded-lg shadow-lg">
                        {isLocalSharing ? (
                            <MonitorArrowUp size={20} weight="fill" color="#32C356" />
                        ) : (
                            <CheckCircle size={20} weight="fill" color="#32C356" />
                        )}
                        <span className="text-base text-[#1C1C1C] font-normal">
                            {isLocalSharing
                                ? t("meet.meeting.screenShare.youAreSharing")
                                : t("meet.meeting.screenShare.viewing", { name: sharingParticipant?.rawName })}
                        </span>
                        {isLocalSharing && (
                            <button
                                onClick={handleStopSharing}
                                className="ml-2 text-base text-[#E50B00] font-medium hover:underline"
                            >
                                {t("meet.meeting.screenShare.stopSharing")}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {hasScreenShare && (
                <div className="absolute h-full items-center inset-0 z-50 flex bg-gray-950 gap-4 p-4">
                    <div className="flex-1 flex h-full items-center justify-center">
                        <VideoParticipant
                            key={screenShareParticipants[0].id}
                            participant={screenShareParticipants[0]}
                            className="w-full h-5/6"
                            translate={t}
                            flipX={false}
                            isScreenShare={true}
                            backgroundColor="bg-black"
                            relativePositioning
                        />
                    </div>

                    <div className="w-80 h-5/6 flex flex-col">
                        {hasScroll && (
                            <button
                                onClick={scrollUp}
                                disabled={!canScrollUp}
                                className={`w-full h-12 flex items-start justify-center bg-gray-950/80 transition-all ${
                                    canScrollUp
                                        ? "opacity-100 hover:bg-gray-900 cursor-pointer"
                                        : "opacity-30 cursor-not-allowed"
                                }`}
                            >
                                <CaretUp size={24} color="white" weight="bold" />
                            </button>
                        )}

                        <div
                            ref={participantsScrollRef}
                            className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-hide"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex-shrink-0">
                                    <VideoParticipant
                                        participant={{ ...participant, dominantSpeaker: false }}
                                        className="w-full aspect-video"
                                        translate={t}
                                        flipX={flipX}
                                        relativePositioning
                                    />
                                </div>
                            ))}
                        </div>

                        {hasScroll && (
                            <button
                                onClick={scrollDown}
                                disabled={!canScrollDown}
                                className={`w-full h-12 flex items-end justify-center bg-gray-950/80 transition-all ${
                                    canScrollDown
                                        ? "opacity-100 hover:bg-gray-900 cursor-pointer"
                                        : "opacity-30 cursor-not-allowed"
                                }`}
                            >
                                <CaretDown size={24} color="white" weight="bold" />
                            </button>
                        )}
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
