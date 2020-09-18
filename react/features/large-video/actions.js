// @flow

import type { Dispatch } from 'redux';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import {
    createSelectParticipantFailedEvent,
    sendAnalytics
} from '../analytics';
import { _handleParticipantError } from '../base/conference';
import { MEDIA_TYPE } from '../base/media';
import { getParticipants } from '../base/participants';
import { getTrackByMediaTypeAndParticipant } from '../base/tracks';
import { reportError } from '../base/util';
import { shouldDisplayTileView } from '../video-layout';

import {
    SELECT_LARGE_VIDEO_PARTICIPANT,
    UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION
} from './actionTypes';

declare var APP: Object;

/**
* Captures a screenshot of the video displayed on the large video.
*
* @returns {Function}
*/
export function captureLargeVideoScreenshot() {
    return (dispatch: Dispatch<any>, getState: Function): Promise<Object> => {
        const state = getState();
        const largeVideo = state['features/large-video'];

        if (!largeVideo) {
            return Promise.resolve();
        }
        const tracks = state['features/base/tracks'];
        const { jitsiTrack } = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, largeVideo.participantId);
        const videoStream = jitsiTrack.getOriginalStream();

        // Create a HTML canvas and draw video from the track on to the canvas.
        const [ track ] = videoStream.getVideoTracks();
        const { height, width } = track.getSettings() ?? track.getConstraints();
        const canvasElement = document.createElement('canvas');
        const ctx = canvasElement.getContext('2d');
        const videoElement = document.createElement('video');

        videoElement.height = parseInt(height, 10);
        videoElement.width = parseInt(width, 10);
        videoElement.autoplay = true;
        videoElement.srcObject = videoStream;
        canvasElement.height = videoElement.height;
        canvasElement.width = videoElement.width;

        // Wait for the video to load before drawing on to the canvas.
        const promise = new Promise(resolve => {
            videoElement.onloadeddata = () => resolve();
        });

        return promise.then(() => {
            ctx.drawImage(videoElement, 0, 0, videoElement.width, videoElement.height);
            const dataURL = canvasElement.toDataURL('image/png', 1.0);

            // Cleanup.
            ctx.clearRect(0, 0, videoElement.width, videoElement.height);
            videoElement.srcObject = null;
            canvasElement.remove();
            videoElement.remove();

            return Promise.resolve(dataURL);
        });
    };
}

/**
 * Resizes the large video container based on the dimensions provided.
 *
 * @param {number} width - Width that needs to be applied on the large video container.
 * @param {number} height - Height that needs to be applied on the large video container.
 * @returns {Function}
 */
export function resizeLargeVideo(width: number, height: number) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const largeVideo = state['features/large-video'];

        if (largeVideo) {
            const largeVideoContainer = VideoLayout.getLargeVideo();

            largeVideoContainer.updateContainerSize(width, height);
            largeVideoContainer.resize();
        }
    };
}

/**
 * Signals conference to select a participant.
 *
 * @returns {Function}
 */
export function selectParticipant() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const { conference } = state['features/base/conference'];

        if (conference) {
            const ids = shouldDisplayTileView(state)
                ? getParticipants(state).map(participant => participant.id)
                : [ state['features/large-video'].participantId ];

            try {
                conference.selectParticipants(ids);
            } catch (err) {
                _handleParticipantError(err);

                sendAnalytics(createSelectParticipantFailedEvent(err));

                reportError(
                    err, `Failed to select participants ${ids.toString()}`);
            }
        }
    };
}

/**
 * Action to select the participant to be displayed in LargeVideo based on the
 * participant id provided. If a participant id is not provided, the LargeVideo
 * participant will be selected based on a variety of factors: If there is a
 * dominant or pinned speaker, or if there are remote tracks, etc.
 *
 * @param {string} participant - The participant id of the user that needs to be
 * displayed on the large video.
 * @returns {Function}
 */
export function selectParticipantInLargeVideo(participant: ?string) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const state = getState();
        const participantId = participant ?? _electParticipantInLargeVideo(state);
        const largeVideo = state['features/large-video'];

        if (participantId !== largeVideo.participantId) {
            dispatch({
                type: SELECT_LARGE_VIDEO_PARTICIPANT,
                participantId
            });

            dispatch(selectParticipant());
        }
    };
}

/**
 * Updates the currently seen resolution of the video displayed on large video.
 *
 * @param {number} resolution - The current resolution (height) of the video.
 * @returns {{
 *     type: UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
 *     resolution: number
 * }}
 */
export function updateKnownLargeVideoResolution(resolution: number) {
    return {
        type: UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION,
        resolution
    };
}

/**
 * Returns the most recent existing remote video track.
 *
 * @param {Track[]} tracks - All current tracks.
 * @private
 * @returns {(Track|undefined)}
 */
function _electLastVisibleRemoteVideo(tracks) {
    // First we try to get most recent remote video track.
    for (let i = tracks.length - 1; i >= 0; --i) {
        const track = tracks[i];

        if (!track.local && track.mediaType === MEDIA_TYPE.VIDEO) {
            return track;
        }
    }
}

/**
 * Returns the identifier of the participant who is to be on the stage and
 * should be displayed in {@code LargeVideo}.
 *
 * @param {Object} state - The Redux state from which the participant to be
 * displayed in {@code LargeVideo} is to be elected.
 * @private
 * @returns {(string|undefined)}
 */
function _electParticipantInLargeVideo(state) {
    // 1. If a participant is pinned, they will be shown in the LargeVideo (
    //    regardless of whether they are local or remote).
    const participants = state['features/base/participants'];
    let participant = participants.find(p => p.pinned);
    let id = participant && participant.id;

    if (!id) {
        // 2. No participant is pinned so get the dominant speaker. But the
        //    local participant won't be displayed in LargeVideo even if she is
        //    the dominant speaker.
        participant = participants.find(p => p.dominantSpeaker && !p.local);
        id = participant && participant.id;

        if (!id) {
            // 3. There is no dominant speaker so select the remote participant
            //    who last had visible video.
            const tracks = state['features/base/tracks'];
            const videoTrack = _electLastVisibleRemoteVideo(tracks);

            id = videoTrack && videoTrack.participantId;

            if (!id) {
                // 4. It's possible there is no participant with visible video.
                //    This can happen for a number of reasons:
                //    - there is only one participant (i.e. the local user),
                //    - other participants joined with video muted.
                //    As a last resort, pick the last participant who joined the
                //    conference (regardless of whether they are local or
                //    remote).
                //
                // HOWEVER: We don't want to show poltergeist or other bot type participants on stage
                // automatically, because it's misleading (users may think they are already
                // joined and maybe speaking).
                for (let i = participants.length; i > 0 && !participant; i--) {
                    const p = participants[i - 1];

                    !p.botType && (participant = p);
                }

                id = participant && participant.id;
            }
        }
    }

    return id;
}
