import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import { IReduxState, IStore } from "../../app/types";
import { IconMic, IconMicSlash, IconVideo, IconVideoOff, IconCloseLarge } from "../../base/icons/svg";
import Icon from "../../base/icons/components/Icon";
import { MEDIA_TYPE } from "../../base/media/constants";
import { getLocalParticipant, getParticipantDisplayName } from "../../base/participants/functions";
import { getTrackByMediaTypeAndParticipant } from "../../base/tracks/functions.any";
import { isLocalTrackMuted } from "../../base/tracks/functions.any";
import { handleToggleVideoMuted } from "../../toolbox/actions.any";
import { muteLocal } from "../../video-menu/actions.any";
import { getLargeVideoParticipant } from "../../large-video/functions";
import { closeDocumentPiP, getDocumentPiPWindow } from "../actions";
import logger from "../logger";

import "../document-pip.css";

/**
 * Component that renders React content inside the Document PiP window via createPortal.
 * Shows the active speaker's video and basic controls (mute audio, mute video, close).
 *
 * @returns {React.ReactPortal | null}
 */
const DocumentPiPWindow: React.FC = () => {
    const dispatch: IStore["dispatch"] = useDispatch();
    const videoRef = useRef<HTMLVideoElement>(null);
    const previousTrackRef = useRef<any>(null);

    // Redux state
    const isActive = useSelector((state: IReduxState) => state["features/document-pip"]?.isActive);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const tracks = useSelector((state: IReduxState) => state["features/base/tracks"]);
    const audioMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state["features/base/tracks"], MEDIA_TYPE.AUDIO),
    );
    const videoMuted = useSelector((state: IReduxState) =>
        isLocalTrackMuted(state["features/base/tracks"], MEDIA_TYPE.VIDEO),
    );

    // Read dominant speaker ID directly from Redux (bypasses large-video guards
    // like isStageFilmstripAvailable which can block updates).
    const dominantSpeakerId = useSelector((state: IReduxState) => state["features/base/participants"].dominantSpeaker);
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);

    // Pick the participant to show in PiP:
    // 1. Dominant speaker if they are REMOTE (not yourself)
    // 2. Large video participant (fallback)
    // 3. Local participant (last resort)
    let participantId: string | undefined;

    if (dominantSpeakerId && dominantSpeakerId !== localParticipant?.id) {
        participantId = dominantSpeakerId;
    } else if (largeVideoParticipant && largeVideoParticipant.id !== localParticipant?.id) {
        participantId = largeVideoParticipant.id;
    } else {
        participantId = largeVideoParticipant?.id ?? localParticipant?.id;
    }

    const isLocalVideo = participantId === localParticipant?.id;
    const displayName = useSelector((state: IReduxState) =>
        participantId ? getParticipantDisplayName(state, participantId) : "Participant",
    );

    // Get the active speaker's video track.
    const videoTrack = participantId
        ? getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, participantId)
        : undefined;

    /**
     * Effect: attach/detach video track on the PiP window's video element.
     */
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement || !isActive) {
            return;
        }

        // Detach previous track.
        if (previousTrackRef.current?.jitsiTrack) {
            try {
                previousTrackRef.current.jitsiTrack.detach(videoElement);
            } catch (error) {
                logger.error("Error detaching previous track:", error);
            }
        }

        // Attach new track or clear stale video.
        if (videoTrack?.jitsiTrack) {
            videoTrack.jitsiTrack.attach(videoElement).catch((error: Error) => {
                logger.error("Error attaching video track:", error);
            });
        } else {
            // Clear the video element so it doesn't show the previous speaker's last frame.
            videoElement.srcObject = null;
        }

        previousTrackRef.current = videoTrack;

        return () => {
            if (videoTrack?.jitsiTrack && videoElement) {
                try {
                    videoTrack.jitsiTrack.detach(videoElement);
                } catch (error) {
                    logger.error("Error during track cleanup:", error);
                }
            }
        };
    }, [videoTrack, participantId, isActive]);

    const onToggleAudio = useCallback(() => {
        dispatch(muteLocal(!audioMuted, MEDIA_TYPE.AUDIO));
    }, [dispatch, audioMuted]);

    const onToggleVideo = useCallback(() => {
        dispatch(handleToggleVideoMuted(!videoMuted, true, true));
    }, [dispatch, videoMuted]);

    const onClose = useCallback(() => {
        dispatch(closeDocumentPiP());
    }, [dispatch]);

    if (!isActive) {
        return null;
    }

    const pipWindow = getDocumentPiPWindow();

    if (!pipWindow) {
        return null;
    }

    const hasVideo = videoTrack && !videoTrack.muted;
    const initials = displayName
        ? displayName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .substring(0, 2)
        : "?";

    // Mirror local video to match the main Jitsi self-view.
    const videoClassName = `document-pip-video${isLocalVideo ? " mirror" : ""}`;

    return createPortal(
        <div className="document-pip-container">
            <div className="document-pip-video-wrapper">
                {hasVideo ? (
                    <video autoPlay={true} className={videoClassName} muted={true} playsInline={true} ref={videoRef} />
                ) : (
                    <div className="document-pip-no-video">
                        <div className="document-pip-avatar">{initials}</div>
                        <span>{displayName}</span>
                    </div>
                )}
            </div>
            <div className="document-pip-controls">
                <button
                    className={`document-pip-btn ${audioMuted ? "muted" : ""}`}
                    onClick={onToggleAudio}
                    title={audioMuted ? "Unmute audio" : "Mute audio"}
                >
                    <Icon size={20} src={audioMuted ? IconMicSlash : IconMic} />
                </button>
                <button
                    className={`document-pip-btn ${videoMuted ? "muted" : ""}`}
                    onClick={onToggleVideo}
                    title={videoMuted ? "Start video" : "Stop video"}
                >
                    <Icon size={20} src={videoMuted ? IconVideoOff : IconVideo} />
                </button>
                <button className="document-pip-btn close-btn" onClick={onClose} title="Close PiP">
                    <Icon size={20} src={IconCloseLarge} />
                </button>
            </div>
        </div>,
        pipWindow.document.body,
    );
};

export default DocumentPiPWindow;
