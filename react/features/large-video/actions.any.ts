import { IReduxState, IStore } from '../app/types';
import { IStateful } from '../base/app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import {
    getDominantSpeakerParticipant,
    getLocalParticipant,
    getLocalScreenShareParticipant,
    getParticipantById,
    getPinnedParticipant,
    getRemoteParticipants,
    getVirtualScreenshareParticipantByOwnerId
} from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { isStageFilmstripAvailable } from '../filmstrip/functions';
import { getAutoPinSetting } from '../video-layout/functions';

import {
    SELECT_LARGE_VIDEO_PARTICIPANT,
    SET_LARGE_VIDEO_DIMENSIONS,
    UPDATE_KNOWN_LARGE_VIDEO_RESOLUTION
} from './actionTypes';

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
export function selectParticipantInLargeVideo(participant?: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        if (isStageFilmstripAvailable(state, 2)) {
            return;
        }

        // Keep Etherpad open.
        if (state['features/etherpad'].editing) {
            return;
        }

        const participantId = participant ?? _electParticipantInLargeVideo(state);
        const largeVideo = state['features/large-video'];
        const remoteScreenShares = state['features/video-layout'].remoteScreenShares;
        let latestScreenshareParticipantId;

        if (remoteScreenShares?.length) {
            latestScreenshareParticipantId = remoteScreenShares[remoteScreenShares.length - 1];
        }

        // When trying to auto pin screenshare, always select the endpoint even though it happens to be
        // the large video participant in redux (for the reasons listed above in the large video selection
        // logic above). The auto pin screenshare logic kicks in after the track is added
        // (which updates the large video participant and selects all endpoints because of the auto tile
        // view mode). If the screenshare endpoint is not among the forwarded endpoints from the bridge,
        // it needs to be selected again at this point.
        if (participantId !== largeVideo.participantId || participantId === latestScreenshareParticipantId) {
            dispatch({
                type: SELECT_LARGE_VIDEO_PARTICIPANT,
                participantId
            });
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
 * Sets the dimenstions of the large video in redux.
 *
 * @param {number} height - The height of the large video.
 * @param {number} width - The width of the large video.
 * @returns {{
 *     type: SET_LARGE_VIDEO_DIMENSIONS,
 *     height: number,
 *     width: number
 * }}
 */
export function setLargeVideoDimensions(height: number, width: number) {
    return {
        type: SET_LARGE_VIDEO_DIMENSIONS,
        height,
        width
    };
}

/**
 * Returns the most recent existing remote video track.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @private
 * @returns {(Track|undefined)}
 */
function _electLastVisibleRemoteParticipant(stateful: IStateful) {
    const state = toState(stateful);
    const tracks = state['features/base/tracks'];

    // First we try to get most recent remote video track.
    for (let i = tracks.length - 1; i >= 0; --i) {
        const track = tracks[i];

        if (!track.local && track.mediaType === MEDIA_TYPE.VIDEO && track.participantId) {
            const participant = getParticipantById(state, track.participantId);

            if (participant) {
                return participant;
            }
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
function _electParticipantInLargeVideo(state: IReduxState) {
    // If a participant is pinned, they will be shown in the LargeVideo (regardless of whether they are local or
    // remote) when the filmstrip on stage is disabled.
    let participant = getPinnedParticipant(state);

    if (participant) {
        return participant.id;
    }

    const autoPinSetting = getAutoPinSetting();

    if (autoPinSetting) {
        // when the setting auto_pin_latest_screen_share is true as spot does, prioritize local screenshare
        if (autoPinSetting === true) {
            const localScreenShareParticipant = getLocalScreenShareParticipant(state);

            if (localScreenShareParticipant) {
                return localScreenShareParticipant.id;
            }
        }

        // Pick the most recent remote screenshare that was added to the conference.
        const remoteScreenShares = state['features/video-layout'].remoteScreenShares;

        if (remoteScreenShares?.length) {
            return remoteScreenShares[remoteScreenShares.length - 1];
        }
    }

    // Next, pick the dominant speaker (other than self).
    participant = getDominantSpeakerParticipant(state);
    if (participant && !participant.local) {
        // Return the screensharing participant id associated with this endpoint if multi-stream is enabled and
        // auto_pin_latest_screen_share setting is disabled.
        const screenshareParticipant = getVirtualScreenshareParticipantByOwnerId(state, participant.id);

        return screenshareParticipant?.id ?? participant.id;
    }

    // In case this is the local participant.
    participant = undefined;

    // Next, pick the most recent participant with video.
    const lastVisibleRemoteParticipant = _electLastVisibleRemoteParticipant(state);

    if (lastVisibleRemoteParticipant) {
        return lastVisibleRemoteParticipant.id;
    }

    // Last, select the participant that joined last (other than poltergist or other bot type participants).
    const participants = [ ...getRemoteParticipants(state).values() ];

    for (let i = participants.length; i > 0 && !participant; i--) {
        const p = participants[i - 1];

        !p.botType && (participant = p);
    }
    if (participant) {
        return participant.id;
    }

    return getLocalParticipant(state)?.id;
}
