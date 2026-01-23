import { createSelector } from 'reselect';

import { IReduxState } from '../../app/types';

import { IParticipantsState } from './reducer';
import { ILocalParticipant, IParticipant } from './types';

/**
 * Gets the participants state slice.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {IParticipantsState} The participants state.
 */
const getParticipantsState = (state: IReduxState): IParticipantsState =>
    state['features/base/participants'];

/**
 * Gets the local participant.
 *
 * @returns {ILocalParticipant | undefined}
 */
export const getLocalParticipant = createSelector(
    [getParticipantsState],
    (participantsState): ILocalParticipant | undefined => participantsState.local
);

/**
 * Gets all remote participants as a Map.
 *
 * @returns {Map<string, IParticipant>}
 */
export const getRemoteParticipants = createSelector(
    [getParticipantsState],
    (participantsState): Map<string, IParticipant> => participantsState.remote
);

/**
 * Gets remote participants as an array.
 *
 * @returns {Array<IParticipant>}
 */
export const getRemoteParticipantsArray = createSelector(
    [getRemoteParticipants],
    (remoteParticipants): Array<IParticipant> => Array.from(remoteParticipants.values())
);

/**
 * Gets the number of remote participants.
 *
 * @returns {number}
 */
export const getRemoteParticipantCount = createSelector(
    [getRemoteParticipants],
    (remoteParticipants): number => remoteParticipants.size
);

/**
 * Gets the dominant speaker ID.
 *
 * @returns {string | undefined}
 */
export const getDominantSpeakerId = createSelector(
    [getParticipantsState],
    (participantsState): string | undefined => participantsState.dominantSpeaker
);

/**
 * Gets the dominant speaker participant object.
 *
 * @returns {IParticipant | ILocalParticipant | undefined}
 */
export const getDominantSpeaker = createSelector(
    [getDominantSpeakerId, getLocalParticipant, getRemoteParticipants],
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
 * Gets the pinned participant ID.
 *
 * @returns {string | undefined}
 */
export const getPinnedParticipantId = createSelector(
    [getParticipantsState],
    (participantsState): string | undefined => participantsState.pinnedParticipant
);

/**
 * Gets the pinned participant.
 *
 * @returns {IParticipant | ILocalParticipant | undefined}
 */
export const getPinnedParticipant = createSelector(
    [getPinnedParticipantId, getLocalParticipant, getRemoteParticipants],
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
 * Gets the raised hands queue.
 *
 * @returns {Array<{hasBeenNotified?: boolean; id: string; raisedHandTimestamp: number;}>}
 */
export const getRaisedHandsQueue = createSelector(
    [getParticipantsState],
    participantsState => participantsState.raisedHandsQueue
);

/**
 * Gets the count of raised hands.
 *
 * @returns {number}
 */
export const getRaisedHandsCount = createSelector(
    [getRaisedHandsQueue],
    (raisedHandsQueue): number => raisedHandsQueue.length
);

/**
 * Gets sorted remote participants.
 *
 * @returns {Map<string, string>}
 */
export const getSortedRemoteParticipants = createSelector(
    [getParticipantsState],
    (participantsState): Map<string, string> => participantsState.sortedRemoteParticipants
);

/**
 * Gets fake participants (used for testing).
 *
 * @returns {Map<string, IParticipant>}
 */
export const getFakeParticipants = createSelector(
    [getParticipantsState],
    (participantsState): Map<string, IParticipant> => participantsState.fakeParticipants
);

/**
 * Gets the local screen share participant.
 *
 * @returns {IParticipant | undefined}
 */
export const getLocalScreenShareParticipant = createSelector(
    [getParticipantsState],
    (participantsState): IParticipant | undefined => participantsState.localScreenShare
);

/**
 * Gets the count of non-moderator participants.
 *
 * @returns {number}
 */
export const getNonModeratorParticipantCount = createSelector(
    [getParticipantsState],
    (participantsState): number => participantsState.numberOfNonModeratorParticipants
);

/**
 * Gets the count of participants with E2EE disabled.
 *
 * @returns {number}
 */
export const getParticipantsWithE2EEDisabledCount = createSelector(
    [getParticipantsState],
    (participantsState): number => participantsState.numberOfParticipantsDisabledE2EE
);

/**
 * Gets the count of participants not supporting E2EE.
 *
 * @returns {number}
 */
export const getParticipantsNotSupportingE2EECount = createSelector(
    [getParticipantsState],
    (participantsState): number => participantsState.numberOfParticipantsNotSupportingE2EE
);

/**
 * Gets remote video sources.
 *
 * @returns {Set<string>}
 */
export const getRemoteVideoSources = createSelector(
    [getParticipantsState],
    (participantsState): Set<string> => participantsState.remoteVideoSources
);

/**
 * Gets sorted remote virtual screenshare participants.
 *
 * @returns {Map<string, string>}
 */
export const getSortedRemoteVirtualScreenshareParticipants = createSelector(
    [getParticipantsState],
    (participantsState): Map<string, string> => participantsState.sortedRemoteVirtualScreenshareParticipants
);

/**
 * Gets the speakers list.
 *
 * @returns {Map<string, string>}
 */
export const getSpeakersList = createSelector(
    [getParticipantsState],
    (participantsState): Map<string, string> => participantsState.speakersList
);

/**
 * Gets overwritten participant names.
 *
 * @returns {{[id: string]: string}}
 */
export const getOverwrittenNameList = createSelector(
    [getParticipantsState],
    (participantsState): { [id: string]: string; } => participantsState.overwrittenNameList
);

/**
 * Creates a selector that gets a specific participant by ID.
 * Checks local participant first, then looks in remote participants.
 *
 * @param {string} participantId - The ID of the participant.
 * @returns {Function} A memoized selector.
 */
export const makeGetParticipantById = (participantId: string) =>
    createSelector(
        [getLocalParticipant, getRemoteParticipants],
        (localParticipant, remoteParticipants): IParticipant | ILocalParticipant | undefined => {
            if (localParticipant?.id === participantId) {
                return localParticipant;
            }

            return remoteParticipants.get(participantId);
        }
    );

/**
 * Gets total participant count including local and remote.
 *
 * @returns {number}
 */
export const getTotalParticipantCount = createSelector(
    [getLocalParticipant, getRemoteParticipantCount],
    (localParticipant, remoteCount): number => (localParticipant ? 1 : 0) + remoteCount
);

/**
 * Checks if there are multiple participants in the conference.
 *
 * @returns {boolean}
 */
export const hasMultipleParticipants = createSelector(
    [getTotalParticipantCount],
    (totalCount): boolean => totalCount > 1
);
