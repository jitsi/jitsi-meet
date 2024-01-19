import { IStore } from '../../app/types';
import { showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { IJitsiConference } from '../conference/reducer';
import { set } from '../redux/functions';

import {
    DOMINANT_SPEAKER_CHANGED,
    GRANT_MODERATOR,
    HIDDEN_PARTICIPANT_JOINED,
    HIDDEN_PARTICIPANT_LEFT,
    KICK_PARTICIPANT,
    LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED,
    LOCAL_PARTICIPANT_RAISE_HAND,
    MUTE_REMOTE_PARTICIPANT,
    OVERWRITE_PARTICIPANTS_NAMES,
    OVERWRITE_PARTICIPANT_NAME,
    PARTICIPANT_ID_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_KICKED,
    PARTICIPANT_LEFT,
    PARTICIPANT_SOURCES_UPDATED,
    PARTICIPANT_UPDATED,
    PIN_PARTICIPANT,
    RAISE_HAND_CLEAR,
    RAISE_HAND_UPDATED,
    SCREENSHARE_PARTICIPANT_NAME_CHANGED,
    SET_LOADABLE_AVATAR_URL,
    SET_LOCAL_PARTICIPANT_RECORDING_STATUS
} from './actionTypes';
import {
    DISCO_REMOTE_CONTROL_FEATURE
} from './constants';
import {
    getLocalParticipant,
    getNormalizedDisplayName,
    getParticipantById,
    getParticipantDisplayName,
    getVirtualScreenshareParticipantOwnerId
} from './functions';
import logger from './logger';
import { FakeParticipant, IJitsiParticipant, IParticipant } from './types';

/**
 * Create an action for when dominant speaker changes.
 *
 * @param {string} dominantSpeaker - Participant ID of the dominant speaker.
 * @param {Array<string>} previousSpeakers - Participant IDs of the previous speakers.
 * @param {boolean} silence - Whether the dominant speaker is silent or not.
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @returns {{
 *     type: DOMINANT_SPEAKER_CHANGED,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string,
 *         previousSpeakers: Array<string>,
 *         silence: boolean
 *     }
 * }}
 */
export function dominantSpeakerChanged(
        dominantSpeaker: string, previousSpeakers: string[], silence: boolean, conference: IJitsiConference) {
    return {
        type: DOMINANT_SPEAKER_CHANGED,
        participant: {
            conference,
            id: dominantSpeaker,
            previousSpeakers,
            silence
        }
    };
}

/**
 * Create an action for granting moderator to a participant.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: GRANT_MODERATOR,
 *     id: string
 * }}
 */
export function grantModerator(id: string) {
    return {
        type: GRANT_MODERATOR,
        id
    };
}

/**
 * Create an action for removing a participant from the conference.
 *
 * @param {string} id - Participant's ID.
 * @returns {{
 *     type: KICK_PARTICIPANT,
 *     id: string
 * }}
 */
export function kickParticipant(id: string) {
    return {
        type: KICK_PARTICIPANT,
        id
    };
}

/**
 * Action to signal that the ID of local participant has changed. It happens
 * when the local participant joins a new conference or leaves an existing
 * conference.
 *
 * @param {string} id - New ID for local participant.
 * @returns {Function}
 */
export function localParticipantIdChanged(id: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch({
                type: PARTICIPANT_ID_CHANGED,

                // XXX A participant is identified by an id-conference pair.
                // Only the local participant is with an undefined conference.
                conference: undefined,
                newValue: id,
                oldValue: participant.id
            });
        }
    };
}

/**
 * Action to signal that a local participant has joined.
 *
 * @param {IParticipant} participant={} - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: IParticipant
 * }}
 */
export function localParticipantJoined(participant: IParticipant = { id: '' }) {
    return participantJoined(set(participant, 'local', true));
}

/**
 * Action to remove a local participant.
 *
 * @returns {Function}
 */
export function localParticipantLeft() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return (
                dispatch(
                    participantLeft(
                        participant.id,

                        // XXX Only the local participant is allowed to leave
                        // without stating the JitsiConference instance because
                        // the local participant is uniquely identified by the
                        // very fact that there is only one local participant
                        // (and the fact that the local participant "joins" at
                        // the beginning of the app and "leaves" at the end of
                        // the app).
                        undefined)));
        }
    };
}

/**
 * Action to signal the role of the local participant has changed. It can happen
 * when the participant has joined a conference, even before a non-default local
 * id has been set, or after a moderator leaves.
 *
 * @param {string} role - The new role of the local participant.
 * @returns {Function}
 */
export function localParticipantRoleChanged(role: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const participant = getLocalParticipant(getState);

        if (participant) {
            return dispatch(participantRoleChanged(participant.id, role));
        }
    };
}

/**
 * Create an action for muting another participant in the conference.
 *
 * @param {string} id - Participant's ID.
 * @param {MEDIA_TYPE} mediaType - The media to mute.
 * @returns {{
 *     type: MUTE_REMOTE_PARTICIPANT,
 *     id: string,
 *     mediaType: MEDIA_TYPE
 * }}
 */
export function muteRemoteParticipant(id: string, mediaType: string) {
    return {
        type: MUTE_REMOTE_PARTICIPANT,
        id,
        mediaType
    };
}

/**
 * Action to signal that a participant has joined.
 *
 * @param {IParticipant} participant - Information about participant.
 * @returns {{
 *     type: PARTICIPANT_JOINED,
 *     participant: IParticipant
 * }}
 */
export function participantJoined(participant: IParticipant) {
    // Only the local participant is not identified with an id-conference pair.
    if (participant.local) {
        return {
            type: PARTICIPANT_JOINED,
            participant
        };
    }

    // In other words, a remote participant is identified with an id-conference
    // pair.
    const { conference } = participant;

    if (!conference) {
        throw Error(
            'A remote participant must be associated with a JitsiConference!');
    }

    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        // A remote participant is only expected to join in a joined or joining
        // conference. The following check is really necessary because a
        // JitsiConference may have moved into leaving but may still manage to
        // sneak a PARTICIPANT_JOINED in if its leave is delayed for any purpose
        // (which is not outragous given that leaving involves network
        // requests.)
        const stateFeaturesBaseConference
            = getState()['features/base/conference'];

        if (conference === stateFeaturesBaseConference.conference
                || conference === stateFeaturesBaseConference.joining) {
            return dispatch({
                type: PARTICIPANT_JOINED,
                participant
            });
        }
    };
}

/**
 * Updates the sources of a remote participant.
 *
 * @param {IJitsiParticipant} jitsiParticipant - The IJitsiParticipant instance.
 * @returns {{
 *      type: PARTICIPANT_SOURCES_UPDATED,
 *      participant: IParticipant
 * }}
 */
export function participantSourcesUpdated(jitsiParticipant: IJitsiParticipant) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const id = jitsiParticipant.getId();
        const participant = getParticipantById(getState(), id);

        if (participant?.local) {
            return;
        }
        const sources = jitsiParticipant.getSources();

        if (!sources?.size) {
            return;
        }

        return dispatch({
            type: PARTICIPANT_SOURCES_UPDATED,
            participant: {
                id,
                sources
            }
        });
    };
}

/**
 * Updates the features of a remote participant.
 *
 * @param {JitsiParticipant} jitsiParticipant - The ID of the participant.
 * @returns {{
*     type: PARTICIPANT_UPDATED,
*     participant: IParticipant
* }}
*/
export function updateRemoteParticipantFeatures(jitsiParticipant: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!jitsiParticipant) {
            return;
        }

        const id = jitsiParticipant.getId();

        jitsiParticipant.getFeatures()
            .then((features: Map<string, string>) => {
                const supportsRemoteControl = features.has(DISCO_REMOTE_CONTROL_FEATURE);
                const participant = getParticipantById(getState(), id);

                if (!participant || participant.local) {
                    return;
                }

                if (participant?.supportsRemoteControl !== supportsRemoteControl) {
                    return dispatch({
                        type: PARTICIPANT_UPDATED,
                        participant: {
                            id,
                            supportsRemoteControl
                        }
                    });
                }
            })
            .catch((error: any) => {
                logger.error(`Failed to get participant features for ${id}!`, error);
            });
    };
}

/**
 * Action to signal that a hidden participant has joined the conference.
 *
 * @param {string} id - The id of the participant.
 * @param {string} displayName - The display name, or undefined when
 * unknown.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_JOINED,
 *     displayName: string,
 *     id: string
 * }}
 */
export function hiddenParticipantJoined(id: string, displayName: string) {
    return {
        type: HIDDEN_PARTICIPANT_JOINED,
        id,
        displayName
    };
}

/**
 * Action to signal that a hidden participant has left the conference.
 *
 * @param {string} id - The id of the participant.
 * @returns {{
 *     type: HIDDEN_PARTICIPANT_LEFT,
 *     id: string
 * }}
 */
export function hiddenParticipantLeft(id: string) {
    return {
        type: HIDDEN_PARTICIPANT_LEFT,
        id
    };
}

/**
 * Action to signal that a participant has left.
 *
 * @param {string} id - Participant's ID.
 * @param {JitsiConference} conference - The {@code JitsiConference} associated
 * with the participant identified by the specified {@code id}. Only the local
 * participant is allowed to not specify an associated {@code JitsiConference}
 * instance.
 * @param {Object} participantLeftProps - Other participant properties.
 * @typedef {Object} participantLeftProps
 * @param {FakeParticipant|undefined} participantLeftProps.fakeParticipant - The type of fake participant.
 * @param {boolean} participantLeftProps.isReplaced - Whether the participant is to be replaced in the meeting.
 *
 * @returns {{
 *     type: PARTICIPANT_LEFT,
 *     participant: {
 *         conference: JitsiConference,
 *         id: string
 *     }
 * }}
 */
export function participantLeft(id: string, conference?: IJitsiConference, participantLeftProps: {
    fakeParticipant?: string; isReplaced?: boolean;
} = {}) {
    return {
        type: PARTICIPANT_LEFT,
        participant: {
            conference,
            fakeParticipant: participantLeftProps.fakeParticipant,
            id,
            isReplaced: participantLeftProps.isReplaced
        }
    };
}

/**
 * Action to signal that a participant's presence status has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {string} presence - Participant's new presence status.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         presence: string
 *     }
 * }}
 */
export function participantPresenceChanged(id: string, presence: string) {
    return participantUpdated({
        id,
        presence
    });
}

/**
 * Action to signal that a participant's role has changed.
 *
 * @param {string} id - Participant's ID.
 * @param {PARTICIPANT_ROLE} role - Participant's new role.
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: {
 *         id: string,
 *         role: PARTICIPANT_ROLE
 *     }
 * }}
 */
export function participantRoleChanged(id: string, role: string) {
    return participantUpdated({
        id,
        role
    });
}

/**
 * Action to signal that a participant's display name has changed.
 *
 * @param {string} id - Screenshare participant's ID.
 * @param {name} name - The new display name of the screenshare participant's owner.
 * @returns {{
 *     type: SCREENSHARE_PARTICIPANT_NAME_CHANGED,
 *     id: string,
 *     name: string
 * }}
 */
export function screenshareParticipantDisplayNameChanged(id: string, name: string) {
    return {
        type: SCREENSHARE_PARTICIPANT_NAME_CHANGED,
        id,
        name
    };
}

/**
 * Action to signal that some of participant properties has been changed.
 *
 * @param {IParticipant} participant={} - Information about participant. To
 * identify the participant the object should contain either property id with
 * value the id of the participant or property local with value true (if the
 * local participant hasn't joined the conference yet).
 * @returns {{
 *     type: PARTICIPANT_UPDATED,
 *     participant: IParticipant
 * }}
 */
export function participantUpdated(participant: IParticipant = { id: '' }) {
    const participantToUpdate = {
        ...participant
    };

    if (participant.name) {
        participantToUpdate.name = getNormalizedDisplayName(participant.name);
    }

    return {
        type: PARTICIPANT_UPDATED,
        participant: participantToUpdate
    };
}

/**
 * Action to signal that a participant has muted us.
 *
 * @param {JitsiParticipant} participant - Information about participant.
 * @param {JitsiLocalTrack} track - Information about the track that has been muted.
 * @returns {Promise}
 */
export function participantMutedUs(participant: any, track: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (!participant) {
            return;
        }

        const isAudio = track.isAudioTrack();

        dispatch(showNotification({
            titleKey: isAudio ? 'notify.mutedRemotelyTitle' : 'notify.videoMutedRemotelyTitle',
            titleArguments: {
                participantDisplayName: getParticipantDisplayName(getState, participant.getId())
            }
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    };
}

/**
 * Action to create a virtual screenshare participant.
 *
 * @param {(string)} sourceName - The source name of the JitsiTrack instance.
 * @param {(boolean)} local - Whether it's a local or remote participant.
 * @param {JitsiConference} conference - The conference instance for which the participant is to be created.
 * @returns {Function}
 */
export function createVirtualScreenshareParticipant(sourceName: string, local: boolean, conference?: IJitsiConference) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const ownerId = getVirtualScreenshareParticipantOwnerId(sourceName);
        const ownerName = getParticipantDisplayName(state, ownerId);

        dispatch(participantJoined({
            conference,
            fakeParticipant: local ? FakeParticipant.LocalScreenShare : FakeParticipant.RemoteScreenShare,
            id: sourceName,
            name: ownerName
        }));
    };
}

/**
 * Action to signal that a participant had been kicked.
 *
 * @param {JitsiParticipant} kicker - Information about participant performing the kick.
 * @param {JitsiParticipant} kicked - Information about participant that was kicked.
 * @returns {Promise}
 */
export function participantKicked(kicker: any, kicked: any) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {

        dispatch({
            type: PARTICIPANT_KICKED,
            kicked: kicked.getId(),
            kicker: kicker?.getId()
        });

        if (kicked.isReplaced?.()) {
            return;
        }

        dispatch(showNotification({
            titleArguments: {
                kicked:
                    getParticipantDisplayName(getState, kicked.getId()),
                kicker:
                    getParticipantDisplayName(getState, kicker.getId())
            },
            titleKey: 'notify.kickParticipant'
        }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
    };
}

/**
 * Create an action which pins a conference participant.
 *
 * @param {string|null} id - The ID of the conference participant to pin or null
 * if none of the conference's participants are to be pinned.
 * @returns {{
 *     type: PIN_PARTICIPANT,
 *     participant: {
 *         id: string
 *     }
 * }}
 */
export function pinParticipant(id?: string | null) {
    return {
        type: PIN_PARTICIPANT,
        participant: {
            id
        }
    };
}

/**
 * Creates an action which notifies the app that the loadable URL of the avatar of a participant got updated.
 *
 * @param {string} participantId - The ID of the participant.
 * @param {string} url - The new URL.
 * @param {boolean} useCORS - Indicates whether we need to use CORS for this URL.
 * @returns {{
 *     type: SET_LOADABLE_AVATAR_URL,
 *     participant: {
 *         id: string,
 *         loadableAvatarUrl: string,
 *         loadableAvatarUrlUseCORS: boolean
 *     }
 * }}
*/
export function setLoadableAvatarUrl(participantId: string, url: string, useCORS: boolean) {
    return {
        type: SET_LOADABLE_AVATAR_URL,
        participant: {
            id: participantId,
            loadableAvatarUrl: url,
            loadableAvatarUrlUseCORS: useCORS
        }
    };
}

/**
 * Raise hand for the local participant.
 *
 * @param {boolean} enabled - Raise or lower hand.
 * @returns {{
 *     type: LOCAL_PARTICIPANT_RAISE_HAND,
 *     raisedHandTimestamp: number
 * }}
 */
export function raiseHand(enabled: boolean) {
    return {
        type: LOCAL_PARTICIPANT_RAISE_HAND,
        raisedHandTimestamp: enabled ? Date.now() : 0
    };
}

/**
 * Clear the raise hand queue.
 *
 * @returns {{
*     type: RAISE_HAND_CLEAR
* }}
*/
export function raiseHandClear() {
    return {
        type: RAISE_HAND_CLEAR
    };
}

/**
 * Update raise hand queue of participants.
 *
 * @param {Object} participant - Participant that updated raised hand.
 * @returns {{
 *      type: RAISE_HAND_UPDATED,
 *      participant: Object
 * }}
 */
export function raiseHandUpdateQueue(participant: IParticipant) {
    return {
        type: RAISE_HAND_UPDATED,
        participant
    };
}

/**
 * Notifies if the local participant audio level has changed.
 *
 * @param {number} level - The audio level.
 * @returns {{
 *      type: LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED,
 *      level: number
 * }}
 */
export function localParticipantAudioLevelChanged(level: number) {
    return {
        type: LOCAL_PARTICIPANT_AUDIO_LEVEL_CHANGED,
        level
    };
}

/**
 * Overwrites the name of the participant with the given id.
 *
 * @param {string} id - Participant id;.
 * @param {string} name - New participant name.
 * @returns {Object}
 */
export function overwriteParticipantName(id: string, name: string) {
    return {
        type: OVERWRITE_PARTICIPANT_NAME,
        id,
        name
    };
}

/**
 * Overwrites the names of the given participants.
 *
 * @param {Array<Object>} participantList - The list of participants to overwrite.
 * @returns {Object}
 */
export function overwriteParticipantsNames(participantList: IParticipant[]) {
    return {
        type: OVERWRITE_PARTICIPANTS_NAMES,
        participantList
    };
}

/**
 * Local video recording status for the local participant.
 *
 * @param {boolean} recording - If local recording is ongoing.
 * @param {boolean} onlySelf - If recording only local streams.
 * @returns {{
 *     type: SET_LOCAL_PARTICIPANT_RECORDING_STATUS,
 *     recording: boolean
 * }}
 */
export function updateLocalRecordingStatus(recording: boolean, onlySelf?: boolean) {
    return {
        type: SET_LOCAL_PARTICIPANT_RECORDING_STATUS,
        recording,
        onlySelf
    };
}
