import { IReduxState } from '../app/types';
import { PARTICIPANT_ROLE } from '../base/participants/constants';

/**
 * The server-published tutor-mode state, or undefined when the room has none.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object|undefined}
 */
export function getTutorModeMetadata(state: IReduxState) {
    return state['features/base/conference'].metadata?.tutorMode;
}

/**
 * The server-only capability advertisement. Its presence is the client's proof
 * that the deployment enforces tutor mode server-side.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Object|undefined}
 */
export function getTutorModeCapabilities(state: IReduxState) {
    return state['features/base/conference'].metadata?.tutorModeCapabilities;
}

/**
 * Whether the server has advertised that it enforces tutor mode. When this is
 * false the client must not present the mode as active or protected.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeCapabilityEnforced(state: IReduxState): boolean {
    return getTutorModeCapabilities(state)?.enforced === true;
}

/**
 * Whether tutor mode is enabled and server-enforced. Metadata claiming the mode
 * is on without the capability advertisement is deliberately ignored: the
 * client fails closed rather than trusting a flag it cannot verify.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeEnabled(state: IReduxState): boolean {
    return isTutorModeCapabilityEnforced(state) && getTutorModeMetadata(state)?.enabled === true;
}

/**
 * The participant id of the tutor, as published by the server.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string|undefined}
 */
export function getTutorId(state: IReduxState): string | undefined {
    return getTutorModeMetadata(state)?.tutorId;
}

/**
 * The local participant id.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string|undefined}
 */
export function getLocalParticipantId(state: IReduxState): string | undefined {
    return state['features/base/participants'].local?.id;
}

/**
 * Whether the local participant is the tutor.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalParticipantTutor(state: IReduxState): boolean {
    const localId = getLocalParticipantId(state);

    return Boolean(localId && localId === getTutorId(state));
}

/**
 * Whether the local participant must be treated as a student: tutor mode is
 * enabled and the local participant is not the tutor. Other moderators are
 * deliberately included, because only the tutor is allowed to see everyone.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeStudent(state: IReduxState): boolean {
    return isTutorModeEnabled(state) && !isLocalParticipantTutor(state);
}

/**
 * Whether the local participant is a moderator.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isLocalParticipantModerator(state: IReduxState): boolean {
    return state['features/base/participants'].local?.role === PARTICIPANT_ROLE.MODERATOR;
}

/**
 * Whether the deployment opted into the tutor-mode UI through config.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeConfigured(state: IReduxState): boolean {
    return state['features/base/config'].tutorMode?.enabled === true;
}

/**
 * Whether the local moderator may use the tutor-mode controls: the feature must
 * be enabled in config, the local participant must be a moderator, and the
 * server must advertise enforcement.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean}
 */
export function isTutorModeFeatureAvailable(state: IReduxState): boolean {
    return isTutorModeConfigured(state)
        && isTutorModeCapabilityEnforced(state)
        && isLocalParticipantModerator(state);
}

/**
 * The set of participant ids a student is allowed to see, or null when no
 * filtering applies. Students see themselves and the tutor only.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {Set<string>|null}
 */
export function getTutorModeVisibleParticipantIds(state: IReduxState): Set<string> | null {
    if (!isTutorModeStudent(state)) {
        return null;
    }

    const ids = new Set<string>();
    const localId = getLocalParticipantId(state);
    const tutorId = getTutorId(state);

    if (localId) {
        ids.add(localId);
    }
    if (tutorId) {
        ids.add(tutorId);
    }

    return ids;
}

/**
 * Whether a participant is visible to the local participant under tutor mode.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} participantId - The participant id.
 * @returns {boolean}
 */
export function isParticipantVisibleInTutorMode(state: IReduxState, participantId: string): boolean {
    const visible = getTutorModeVisibleParticipantIds(state);

    return visible ? visible.has(participantId) : true;
}
