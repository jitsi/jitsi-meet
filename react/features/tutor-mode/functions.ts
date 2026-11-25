import { IReduxState } from '../app/types';
import { MEDIA_TYPE } from '../base/media/constants';
import {
    getSourceNamesByMediaTypeAndParticipant,
    getVirtualScreenshareParticipantOwnerId
} from '../base/participants/functions';

import {
    getTutorId,
    isLocalParticipantTutor,
    isTutorModeStudent
} from './functions.any';

/**
 * Returns the video source names the local student is allowed to request from
 * the bridge: the tutor's camera and any screen share owned by the tutor.
 *
 * The result feeds {@code setReceiverConstraints}, so the bridge only forwards
 * these sources. This is the client-requested half of the video isolation; a
 * deployment that also enforces source authorization in Jicofo/JVB is required
 * to stop a modified client from requesting other sources.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Array<string>}
 */
export function getTutorModeAllowedVideoSourceNames(state: IReduxState): string[] {
    const tutorId = getTutorId(state);

    if (!tutorId) {
        return [];
    }

    const sources = getSourceNamesByMediaTypeAndParticipant(state, tutorId, MEDIA_TYPE.VIDEO);
    const { sortedRemoteVirtualScreenshareParticipants } = state['features/base/participants'];

    if (sortedRemoteVirtualScreenshareParticipants) {
        for (const id of sortedRemoteVirtualScreenshareParticipants.keys()) {
            if (getVirtualScreenshareParticipantOwnerId(id) === tutorId) {
                sources.push(...getSourceNamesByMediaTypeAndParticipant(state, id, MEDIA_TYPE.VIDEO));
            }
        }
    }

    return Array.from(new Set(sources));
}

/**
 * Whether the local participant should play the audio of the given remote
 * participant.
 *
 * For a student this is the tutor only. For the tutor this honours the local
 * "listen to" selection (null/empty means everyone). Everyone else hears
 * everyone, which is the normal behaviour outside tutor mode.
 *
 * This is a playback filter. It does not change what the bridge sends, and it
 * is deliberately not presented as audio isolation.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The remote participant id.
 * @returns {boolean}
 */
export function shouldPlayAudioFromParticipant(state: IReduxState, participantId: string): boolean {
    if (isTutorModeStudent(state)) {
        return participantId === getTutorId(state);
    }

    if (isLocalParticipantTutor(state)) {
        const { listenTo } = state['features/tutor-mode'];

        if (listenTo?.length) {
            return listenTo.includes(participantId);
        }
    }

    return true;
}
