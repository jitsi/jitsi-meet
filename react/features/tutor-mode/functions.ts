import { IReduxState } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import {
    getRemoteParticipants,
    getSourceNamesByMediaTypeAndParticipant,
    isLocalParticipantModerator,
    isParticipantModerator
} from '../base/participants/functions';

/**
 * Returns whether tutor mode is configured for the room.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeEnabled(state: IReduxState): boolean {
    return Boolean(state['features/base/config'].tutorMode?.enabled);
}

/**
 * Returns whether the local participant should be isolated from other non-moderator participants.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function shouldIsolateLocalParticipant(state: IReduxState): boolean {
    return isTutorModeEnabled(state) && !isLocalParticipantModerator(state);
}

/**
 * Returns remote moderator participant ids.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string[]}
 */
export function getRemoteModeratorIds(state: IReduxState): string[] {
    return Array.from(getRemoteParticipants(state).values())
        .filter(participant => isParticipantModerator(participant))
        .map(participant => participant.id);
}

/**
 * Returns source names for remote moderators.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} mediaType - The media type to collect sources for.
 * @returns {string[]}
 */
export function getRemoteModeratorSourceNames(state: IReduxState, mediaType: string): string[] {
    return getRemoteModeratorIds(state)
        .flatMap(id => getSourceNamesByMediaTypeAndParticipant(state, id, mediaType));
}

/**
 * Returns audio source names that a non-moderator should receive in tutor mode.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string[]}
 */
export function getTutorModeAllowedAudioSources(state: IReduxState): string[] {
    return getRemoteModeratorSourceNames(state, MEDIA_TYPE.AUDIO);
}

/**
 * Returns video source names that a non-moderator should receive in tutor mode.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string[]}
 */
export function getTutorModeAllowedVideoSources(state: IReduxState): string[] {
    return getRemoteModeratorSourceNames(state, MEDIA_TYPE.VIDEO);
}
