import { _handleParticipantError } from '../base/conference';
import {
    MEDIA_TYPE,
    VIDEO_TYPE
} from '../base/media';
import {
    getLocalVideoTrack,
    getTrackByMediaTypeAndParticipant
} from '../base/tracks';

import { LARGE_VIDEO_PARTICIPANT_CHANGED } from './actionTypes';
import './middleware';
import './reducer';

/**
 * Signals conference to select a participant.
 *
 * @returns {Function}
 */
export function selectParticipant() {
    return (dispatch, getState) => {
        const state = getState();
        const conference = state['features/base/conference'].conference;

        if (conference) {
            const largeVideo = state['features/largeVideo'];
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
 * remote tracks etc.
 *
 * @returns {Function}
 */
export function selectParticipantInLargeVideo() {
    return (dispatch, getState) => {
        const state = getState();
        const participantId = _electParticipantInLargeVideo(state);
        const largeVideo = state['features/largeVideo'];

        if (participantId !== largeVideo.participantId) {
            dispatch({
                type: LARGE_VIDEO_PARTICIPANT_CHANGED,
                participantId
            });

            dispatch(selectParticipant());
        }
    };
}

/**
 * Returns the most recent existing video track. It can be local or remote
 * video.
 *
 * @param {Track[]} tracks - All current tracks.
 * @private
 * @returns {(Track|undefined)}
 */
function _electLastVisibleVideo(tracks) {
    // First we try to get most recent remote video track.
    for (let i = tracks.length - 1; i >= 0; --i) {
        const track = tracks[i];

        if (!track.local && track.mediaType === MEDIA_TYPE.VIDEO) {
            return track;
        }
    }

    // And if no remote video tracks are available, we select the local one.
    return getLocalVideoTrack(tracks);
}

/**
 * Returns the identifier of the participant who is to be on the stage i.e.
 * should be displayed in <tt>LargeVideo</tt>.
 *
 * @param {Object} state - The Redux state from which the participant to be
 * displayed in <tt>LargeVideo</tt> is to be elected.
 * @private
 * @returns {(string|undefined)}
 */
function _electParticipantInLargeVideo(state) {
    // First get the pinned participant. If the local participant is pinned,
    // he/she will be shown in LargeVideo.
    const participants = state['features/base/participants'];
    let participant = participants.find(p => p.pinned);
    let id = participant ? participant.id : undefined;

    if (!id) {
        // No participant is pinned so get the dominant speaker. But the local
        // participant won't be displayed in LargeVideo even if he/she is the
        // dominant speaker.
        participant = participants.find(p => p.dominantSpeaker && !p.local);
        if (participant) {
            id = participant.id;
        }

        if (!id) {
            // There is no dominant speaker so get the participant with the last
            // visible video track. This may turn out to be the local
            // participant.
            const tracks = state['features/base/tracks'];
            const videoTrack = _electLastVisibleVideo(tracks);

            id = videoTrack && videoTrack.participantId;
        }
    }

    return id;
}
