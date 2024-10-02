/**
 * Create an action to mark the participant as notified to speak next.
 *
 * {
 *     type: NOTIFIED_TO_SPEAK
 * }
 */
export const NOTIFIED_TO_SPEAK = 'NOTIFIED_TO_SPEAK';

/**
 * Create an action for when dominant speaker changes.
 *
 * {
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string,
 *         previousSpeakers: Array<string>,
 *         silence: boolean
 *     }
 * }
 */
export const DOMINANT_SPEAKER_CHANGED = 'DOMINANT_SPEAKER_CHANGED';

/**
 * Create an action for granting moderator to a participant.
 *
 * {
 *     type: GRANT_MODERATOR,
 *     id: string
 * }
 */
export const GRANT_MODERATOR = 'GRANT_MODERATOR';

/**
 * Create an action for removing a participant from the conference.
 *
 * {
 *     type: KICK_PARTICIPANT,
 *     id: string
 * }
 */
export const KICK_PARTICIPANT = 'KICK_PARTICIPANT';

/**
 * Create an action for muting a remote participant.
 *
 * {
 *     type: MUTE_REMOTE_PARTICIPANT,
 *     id: string
 * }
 */
export const MUTE_REMOTE_PARTICIPANT = 'MUTE_REMOTE_PARTICIPANT';

/**
 * Action to signal that ID of participant has changed. This happens when
 * local participant joins a new conference or quits one.
 *
 * {
 *     type: PARTICIPANT_ID_CHANGED,
 *     conference: JitsiConference
 *     newValue: string,
 *     oldValue: string
 * }
 */
export const PARTICIPANT_ID_CHANGED = 'PARTICIPANT_ID_CHANGED';

/**
 * Action to signal that participant role has changed. e.
 *
 * {
 *     type: PARTICIPANT_ROLE_CHANGED,
 *     participant: {
 *         id: string
 *     }
 *     role: string
 * }
 */
export const PARTICIPANT_ROLE_CHANGED = 'PARTICIPANT_ROLE_CHANGED';

/**
 * Action to signal that a participant has joined.
 *
 * {
 *     type: PARTICIPANT_JOINED,
 *     participant: Participant
 * }
 */
export const PARTICIPANT_JOINED = 'PARTICIPANT_JOINED';

/**
 * Action to signal that a participant has been removed from a conference by
 * another participant.
 *
 * {
 *     type: PARTICIPANT_KICKED,
 *     kicked: Object,
 *     kicker: Object
 * }
 */
export const PARTICIPANT_KICKED = 'PARTICIPANT_KICKED';

/**
 * Action to handle case when participant lefts.
 *
 * {
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const PARTICIPANT_LEFT = 'PARTICIPANT_LEFT';

/**
 * Action to handle case when the sources attached to a participant are updated.
 *
 * {
 *      type: PARTICIPANT_SOURCES_UPDATED,
 *      participant: {
 *          id: string
 *      }
 * }
 */
export const PARTICIPANT_SOURCES_UPDATED = 'PARTICIPANT_SOURCES_UPDATED';

/**
 * Action to handle case when info about participant changes.
 *
 * {
 *     type: PARTICIPANT_UPDATED,
 *     participant: Participant
 * }
 */
export const PARTICIPANT_UPDATED = 'PARTICIPANT_UPDATED';

/**
 * The type of the Redux action which pins a conference participant.
 *
 * {
 *     type: PIN_PARTICIPANT,
 *     participant: {
 *         id: string
 *     }
 * }
 */
export const PIN_PARTICIPANT = 'PIN_PARTICIPANT';

/**
 * The type of Redux action which notifies the app that the loadable avatar URL has changed.
 *
 * {
 *     type: SET_LOADABLE_AVATAR_URL,
 *     participant: {
 *         id: string,
           loadableAvatarUrl: string
 *     }
 * }
 */
export const SET_LOADABLE_AVATAR_URL = 'SET_LOADABLE_AVATAR_URL';

/**
 * The type of Redux action which notifies that the screenshare participant's display name has changed.
 *
 * {
 *     type: SCREENSHARE_PARTICIPANT_NAME_CHANGED,
 *     id: string,
 *     name: string
 * }
 */
 export const SCREENSHARE_PARTICIPANT_NAME_CHANGED = 'SCREENSHARE_PARTICIPANT_NAME_CHANGED';

/**
 * Raises hand for the local participant.
 * {
 *     type: LOCAL_PARTICIPANT_RAISE_HAND
 * }
 */
export const LOCAL_PARTICIPANT_RAISE_HAND = 'LOCAL_PARTICIPANT_RAISE_HAND';

/**
 * Clear the raise hand queue.
 * {
 *     type: RAISE_HAND_CLEAR
 * }
 */
export const RAISE_HAND_CLEAR = 'RAISE_HAND_CLEAR';

/**
 * Updates participant in raise hand queue.
 * {
 *     type: RAISE_HAND_UPDATED,
 *     participant: {
 *         id: string,
 *         raiseHand: boolean
 *     }
 * }
 */
export const RAISE_HAND_UPDATED = 'RAISE_HAND_UPDATED';

/**
 * The type of Redux action which notifies that the local participant has changed the audio levels.
 * {
 *     type: LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED
 *     level: number
 * }
 */
export const LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED = 'LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED'

/**
 * The type of Redux action which overwrites the name of a participant.
 * {
 *     type: OVERWRITE_PARTICIPANT_NAME,
 *     id: string,
 *     name: string
 * }
 */
export const OVERWRITE_PARTICIPANT_NAME = 'OVERWRITE_PARTICIPANT_NAME';

/**
 * The type of Redux action which overwrites the names of multiple participants.
 * {
 *     type: OVERWRITE_PARTICIPANTS_NAMES,
 *     participantsList: Array<Object>,
 * }
 */
export const OVERWRITE_PARTICIPANTS_NAMES = 'OVERWRITE_PARTICIPANTS_NAMES';

/**
 * Updates participants local recording status.
 * {
 *     type: SET_LOCAL_PARTICIPANT_RECORDING_STATUS,
 *     recording: boolean,
 *     onlySelf: boolean
 * }
 */
export const SET_LOCAL_PARTICIPANT_RECORDING_STATUS = 'SET_LOCAL_PARTICIPANT_RECORDING_STATUS';
