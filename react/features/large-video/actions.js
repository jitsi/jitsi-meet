// @flow

import { _handleParticipantError } from '../base/conference';
import { MEDIA_TYPE, VIDEO_TYPE } from '../base/media';
import { getTrackByMediaTypeAndParticipant } from '../base/tracks';

import {
    SELECT_LARGE_VIDEO_PARTICIPANT,
    UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION
} from './actionTypes';

/**
 * Signals conference to select a participant.
 *
 * @returns {Function}
 */
export function selectParticipant() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const { conference } = state['features/base/conference'];

        if (conference) {
            const largeVideo = state['features/large-video'];
            const tracks = state['features/base/tracks'];

            const id = largeVideo.participantId;
            const videoTrack
                = getTrackByMediaTypeAndParticipant(
                    tracks,
                    MEDIA_TYPE.VIDEO,
                    id);

            try {
                conference.selectParticipant(
                    videoTrack && videoTrack.videoType === VIDEO_TYPE.CAMERA
                        ? id
                        : null);
            } catch (err) {
                _handleParticipantError(err);
            }
        }
    };
}

/**
 * Action to select the participant to be displayed in LargeVideo based on a
 * variety of factors: if there is a dominant or pinned speaker, or if there are
 * remote tracks, etc.
 *
 * @returns {Function}
 */
export function selectParticipantInLargeVideo() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const state = getState();
        const participantId = _electParticipantInLargeVideo(state);
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
 * Returns the identifier of the participant who is to be on the stage i.e.
 * should be displayed in {@code LargeVideo}.
 *
 * @param {Object} state - The Redux state from which the participant to be
 * displayed in {@code LargeVideo} is to be elected.
 * @private
 * @returns {(string|undefined)}
 */
function _electParticipantInLargeVideo(state) {
    // First get the pinned participant. If a participant is pinned, they will
    // be shown in the LargeVideo.
    const participants = state['features/base/participants'];
    let participant = participants.find(p => p.pinned);
    let id = participant && participant.id;

    if (!id) {
        // No participant is pinned so get the dominant speaker. But the local
        // participant won't be displayed in LargeVideo even if he/she is the
        // dominant speaker.
        participant = participants.find(p => p.dominantSpeaker && !p.local);
        id = participant && participant.id;

        if (!id) {
            // There is no dominant speaker so select the participant which last
            // had visible video (excluding ourselves).
            const tracks = state['features/base/tracks'];
            const videoTrack = _electLastVisibleRemoteVideo(tracks);

            id = videoTrack && videoTrack.participantId;

            if (!id) {
                // It's possible there is no participant with visible video,
                // this can happen for a number or reasons:
                //  - there is only one participant (the local user)
                //  - other participants joined with video muted
                // As a last resort, pick the last participant.
                participant = participants[participants.length - 1];
                id = participant && participant.id;
            }
        }
    }

    return id;
}
