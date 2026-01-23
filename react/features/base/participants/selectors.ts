import { createSelector } from 'reselect';

import { IReduxState } from '../../app/types';

import { IParticipantsState } from './reducer';
import { ILocalParticipant, IParticipant } from './types';

/**
 * Base selector to get the participants state slice.
 * This is a simple selector that doesn't need memoization.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {IParticipantsState} The participants state.
 */
const getParticipantsState = (state: IReduxState): IParticipantsState =>
    state['features/base/participants'];

/**
 * Memoized selector to get the local participant.
 * Re-computes only when the local participant reference changes.
 *
 * @returns {ILocalParticipant | undefined}
 */
export const getLocalParticipant = createSelector(
    [ getParticipantsState ],
    (participantsState): ILocalParticipant | undefined => participantsState.local
);

/**
 * Memoized selector to get all remote participants as a Map.
 * Re-computes only when the remote participants Map reference changes.
 *
 * @returns {Map<string, IParticipant>}
 */
export const getRemoteParticipants = createSelector(
    [ getParticipantsState ],
    (participantsState): Map<string, IParticipant> => participantsState.remote
);

/**
 * Memoized selector to get remote participants as an array.
 * Re-computes only when the remote participants Map reference changes.
 *
 * @returns {Array<IParticipant>}
 */
export const getRemoteParticipantsArray = createSelector(
    [ getRemoteParticipants ],
    (remoteParticipants): Array<IParticipant> => Array.from(remoteParticipants.values())
);

/**
 * Memoized selector to get the count of remote participants.
 * Re-computes only when the remote participants Map size changes.
 *
 * @returns {number}
 */
export const getRemoteParticipantCount = createSelector(
    [ getRemoteParticipants ],
    (remoteParticipants): number => remoteParticipants.size
);

/**
 * Memoized selector to get the dominant speaker ID.
 * Re-computes only when the dominant speaker changes.
 *
 * @returns {string | undefined}
 */
export const getDominantSpeakerId = createSelector(
    [ getParticipantsState ],
    (participantsState): string | undefined => participantsState.dominantSpeaker
);

/**
 * Memoized selector to get the dominant speaker participant.
 * Re-computes only when the dominant speaker ID or remote participants change.
 *
 * @returns {IParticipant | ILocalParticipant | undefined}
 */
export const getDominantSpeaker = createSelector(
    [ getDominantSpeakerId, getLocalParticipant, getRemoteParticipants ],
    (dominantSpeakerId, localParticipant, remoteParticipants): IParticipant | ILocalParticipant | undefined => {
        if (!dominantSpeakerId) {
            return undefined;
        }
        if (localParticipant?.id === dominantSpeakerId) {
            return localParticipant;
        }

        return remoteParticipants.get(dominantSpeakerId);
    }
);

/**
 * Memoized selector to get the pinned participant ID.
 * Re-computes only when the pinned participant changes.
 *
 * @returns {string | undefined}
 */
export const getPinnedParticipantId = createSelector(
    [ getParticipantsState ],
    (participantsState): string | undefined => participantsState.pinnedParticipant
);

/**
 * Memoized selector to get the pinned participant.
 * Re-computes only when the pinned participant ID or participants change.
 *
 * @returns {IParticipant | ILocalParticipant | undefined}
 */
export const getPinnedParticipant = createSelector(
    [ getPinnedParticipantId, getLocalParticipant, getRemoteParticipants ],
    (pinnedParticipantId, localParticipant, remoteParticipants): IParticipant | ILocalParticipant | undefined => {
        if (!pinnedParticipantId) {
            return undefined;
        }
        if (localParticipant?.id === pinnedParticipantId) {
            return localParticipant;
        }

        return remoteParticipants.get(pinnedParticipantId);
    }
);

/**
 * Memoized selector to get raised hands queue.
 * Re-computes only when the raised hands queue reference changes.
 *
 * @returns {Array<{hasBeenNotified?: boolean; id: string; raisedHandTimestamp: number;}>}
 */
export const getRaisedHandsQueue = createSelector(
    [ getParticipantsState ],
    participantsState => participantsState.raisedHandsQueue
);

/**
 * Memoized selector to get the count of participants with raised hands.
 * Re-computes only when the raised hands queue length changes.
 *
 * @returns {number}
 */
export const getRaisedHandsCount = createSelector(
    [ getRaisedHandsQueue ],
    (raisedHandsQueue): number => raisedHandsQueue.length
);

/**
 * Memoized selector to get sorted remote participants.
 * Re-computes only when sortedRemoteParticipants Map reference changes.
 *
 * @returns {Map<string, string>}
 */
export const getSortedRemoteParticipants = createSelector(
    [ getParticipantsState ],
    (participantsState): Map<string, string> => participantsState.sortedRemoteParticipants
);

/**
 * Memoized selector to get fake participants.
 * Re-computes only when the fakeParticipants Map reference changes.
 *
 * @returns {Map<string, IParticipant>}
 */
export const getFakeParticipants = createSelector(
    [ getParticipantsState ],
    (participantsState): Map<string, IParticipant> => participantsState.fakeParticipants
);

/**
 * Memoized selector to get the local screen share participant.
 * Re-computes only when the localScreenShare reference changes.
 *
 * @returns {IParticipant | undefined}
 */
export const getLocalScreenShareParticipant = createSelector(
    [ getParticipantsState ],
    (participantsState): IParticipant | undefined => participantsState.localScreenShare
);

/**
 * Memoized selector to get the count of non-moderator participants.
 * Re-computes only when the count changes.
 *
 * @returns {number}
 */
export const getNonModeratorParticipantCount = createSelector(
    [ getParticipantsState ],
    (participantsState): number => participantsState.numberOfNonModeratorParticipants
);

/**
 * Memoized selector to get the count of participants with E2EE disabled.
 * Re-computes only when the count changes.
 *
 * @returns {number}
 */
export const getParticipantsWithE2EEDisabledCount = createSelector(
    [ getParticipantsState ],
    (participantsState): number => participantsState.numberOfParticipantsDisabledE2EE
);

/**
 * Memoized selector to get the count of participants not supporting E2EE.
 * Re-computes only when the count changes.
 *
 * @returns {number}
 */
export const getParticipantsNotSupportingE2EECount = createSelector(
    [ getParticipantsState ],
    (participantsState): number => participantsState.numberOfParticipantsNotSupportingE2EE
);

/**
 * Memoized selector to get remote video sources.
 * Re-computes only when the remoteVideoSources Set reference changes.
 *
 * @returns {Set<string>}
 */
export const getRemoteVideoSources = createSelector(
    [ getParticipantsState ],
    (participantsState): Set<string> => participantsState.remoteVideoSources
);

/**
 * Memoized selector to get sorted remote virtual screenshare participants.
 * Re-computes only when the Map reference changes.
 *
 * @returns {Map<string, string>}
 */
export const getSortedRemoteVirtualScreenshareParticipants = createSelector(
    [ getParticipantsState ],
    (participantsState): Map<string, string> => participantsState.sortedRemoteVirtualScreenshareParticipants
);

/**
 * Memoized selector to get the speakers list.
 * Re-computes only when the speakersList Map reference changes.
 *
 * @returns {Map<string, string>}
 */
export const getSpeakersList = createSelector(
    [ getParticipantsState ],
    (participantsState): Map<string, string> => participantsState.speakersList
);

/**
 * Memoized selector to get overwritten name list.
 * Re-computes only when the overwrittenNameList reference changes.
 *
 * @returns {{[id: string]: string}}
 */
export const getOverwrittenNameList = createSelector(
    [ getParticipantsState ],
    (participantsState): { [id: string]: string; } => participantsState.overwrittenNameList
);

/**
 * Factory function to create a memoized selector for a specific participant by ID.
 * Each returned selector is memoized independently based on the participant ID.
 *
 * @param {string} participantId - The ID of the participant to select.
 * @returns {Function} A memoized selector function.
 */
export const makeGetParticipantById = (participantId: string) =>
    createSelector(
        [ getLocalParticipant, getRemoteParticipants ],
        (localParticipant, remoteParticipants): IParticipant | ILocalParticipant | undefined => {
            if (localParticipant?.id === participantId) {
                return localParticipant;
            }

            return remoteParticipants.get(participantId);
        }
    );

/**
 * Memoized selector to get total participant count (local + remote).
 * Re-computes only when local participant or remote count changes.
 *
 * @returns {number}
 */
export const getTotalParticipantCount = createSelector(
    [ getLocalParticipant, getRemoteParticipantCount ],
    (localParticipant, remoteCount): number => (localParticipant ? 1 : 0) + remoteCount
);

/**
 * Memoized selector to check if there are multiple participants.
 * Re-computes only when the total count changes.
 *
 * @returns {boolean}
 */
export const hasMultipleParticipants = createSelector(
    [ getTotalParticipantCount ],
    (totalCount): boolean => totalCount > 1
);
