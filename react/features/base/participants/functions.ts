/* eslint-disable lines-around-comment */
// @ts-ignore
import { getGravatarURL } from '@jitsi/js-utils/avatar';

import { IState, IStore } from '../../app/types';
// @ts-ignore
import { isStageFilmstripAvailable } from '../../filmstrip/functions';
import { GRAVATAR_BASE_URL } from '../avatar/constants';
import { isCORSAvatarURL } from '../avatar/functions';
// @ts-ignore
import { getMultipleVideoSupportFeatureFlag, getSourceNameSignalingFeatureFlag } from '../config';
import i18next from '../i18n/i18next';
import { JitsiParticipantConnectionStatus, JitsiTrackStreamingStatus } from '../lib-jitsi-meet';
// @ts-ignore
import { shouldRenderVideoTrack } from '../media';
import { toState } from '../redux/functions';
// @ts-ignore
import { getScreenShareTrack, getVideoTrackByParticipant } from '../tracks';
import { createDeferred } from '../util/helpers';

import { JIGASI_PARTICIPANT_ICON, MAX_DISPLAY_NAME_LENGTH, PARTICIPANT_ROLE } from './constants';
// @ts-ignore
import { preloadImage } from './preloadImage';
import { Participant } from './reducer';

/**
 * Temp structures for avatar urls to be checked/preloaded.
 */
const AVATAR_QUEUE: Object[] = [];
const AVATAR_CHECKED_URLS = new Map();
/* eslint-disable arrow-body-style, no-unused-vars */
const AVATAR_CHECKER_FUNCTIONS = [
    (participant: Participant) => {
        return participant && participant.isJigasi ? JIGASI_PARTICIPANT_ICON : null;
    },
    (participant: Participant) => {
        return participant && participant.avatarURL ? participant.avatarURL : null;
    },
    (participant: Participant, store: IStore) => {
        const config = store.getState()['features/base/config'];
        const isGravatarDisabled = config.gravatar?.disabled;

        if (participant && participant.email && !isGravatarDisabled) {
            const gravatarBaseURL = config.gravatar?.baseUrl
                || config.gravatarBaseURL
                || GRAVATAR_BASE_URL;

            return getGravatarURL(participant.email, gravatarBaseURL);
        }

        return null;
    }
];
/* eslint-enable arrow-body-style, no-unused-vars */

/**
 * Returns the list of active speakers that should be moved to the top of the sorted list of participants so that the
 * dominant speaker is visible always on the vertical filmstrip in stage layout.
 *
 * @param {Function | Object} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @returns {Array<string>}
 */
export function getActiveSpeakersToBeDisplayed(stateful: IStore | Function) {
    const state = toState(stateful);
    const {
        dominantSpeaker,
        fakeParticipants,
        sortedRemoteScreenshares,
        sortedRemoteVirtualScreenshareParticipants,
        speakersList
    } = state['features/base/participants'];
    const { visibleRemoteParticipants } = state['features/filmstrip'];
    let activeSpeakers = new Map(speakersList);

    // Do not re-sort the active speakers if dominant speaker is currently visible.
    if (dominantSpeaker && visibleRemoteParticipants.has(dominantSpeaker)) {
        return activeSpeakers;
    }
    let availableSlotsForActiveSpeakers = visibleRemoteParticipants.size;

    if (activeSpeakers.has(dominantSpeaker)) {
        activeSpeakers.delete(dominantSpeaker);
    }

    // Add dominant speaker to the beginning of the list (not including self) since the active speaker list is always
    // alphabetically sorted.
    if (dominantSpeaker && dominantSpeaker !== getLocalParticipant(state).id) {
        const updatedSpeakers = Array.from(activeSpeakers);

        updatedSpeakers.splice(0, 0, [ dominantSpeaker, getParticipantById(state, dominantSpeaker)?.name ]);
        activeSpeakers = new Map(updatedSpeakers);
    }

    // Remove screenshares from the count.
    if (getMultipleVideoSupportFeatureFlag(state)) {
        if (sortedRemoteVirtualScreenshareParticipants) {
            availableSlotsForActiveSpeakers -= sortedRemoteVirtualScreenshareParticipants.size * 2;
            for (const screenshare of Array.from(sortedRemoteVirtualScreenshareParticipants.keys())) {
                const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare as string);

                activeSpeakers.delete(ownerId);
            }
        }
    } else if (sortedRemoteScreenshares) {
        availableSlotsForActiveSpeakers -= sortedRemoteScreenshares.size;
        for (const id of Array.from(sortedRemoteScreenshares.keys())) {
            activeSpeakers.delete(id);
        }
    }

    // Remove shared video from the count.
    if (fakeParticipants) {
        availableSlotsForActiveSpeakers -= fakeParticipants.size;
    }
    const truncatedSpeakersList = Array.from(activeSpeakers).slice(0, availableSlotsForActiveSpeakers);

    truncatedSpeakersList.sort((a: any, b: any) => a[1].localeCompare(b[1]));

    return new Map(truncatedSpeakersList);
}

/**
 * Resolves the first loadable avatar URL for a participant.
 *
 * @param {Object} participant - The participant to resolve avatars for.
 * @param {Store} store - Redux store.
 * @returns {Promise}
 */
export function getFirstLoadableAvatarUrl(participant: Participant, store: IStore) {
    const deferred: any = createDeferred();
    const fullPromise = deferred.promise
        .then(() => _getFirstLoadableAvatarUrl(participant, store))
        .then((result: any) => {

            if (AVATAR_QUEUE.length) {
                const next: any = AVATAR_QUEUE.shift();

                next.resolve();
            }

            return result;
        });

    if (AVATAR_QUEUE.length) {
        AVATAR_QUEUE.push(deferred);
    } else {
        deferred.resolve();
    }

    return fullPromise;
}

/**
 * Returns local participant from Redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {(Participant|undefined)}
 */
export function getLocalParticipant(stateful: IStore | Function | IState) {
    const state = toState(stateful)['features/base/participants'];

    return state.local;
}

/**
 * Returns local screen share participant from Redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {(Participant|undefined)}
 */
export function getLocalScreenShareParticipant(stateful: IStore | Function) {
    const state = toState(stateful)['features/base/participants'];

    return state.localScreenShare;
}

/**
 * Returns screenshare participant.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state features/base/participants.
 * @param {string} id - The owner ID of the screenshare participant to retrieve.
 * @returns {(Participant|undefined)}
 */
export function getVirtualScreenshareParticipantByOwnerId(stateful: IStore | Function, id: string) {
    const state = toState(stateful);

    if (getMultipleVideoSupportFeatureFlag(state)) {
        const track = getScreenShareTrack(state['features/base/tracks'], id);

        return getParticipantById(stateful, track?.jitsiTrack.getSourceName());
    }

    return;
}

/**
 * Normalizes a display name so then no invalid values (padding, length...etc)
 * can be set.
 *
 * @param {string} name - The display name to set.
 * @returns {string}
 */
export function getNormalizedDisplayName(name: string) {
    if (!name || !name.trim()) {
        return undefined;
    }

    return name.trim().substring(0, MAX_DISPLAY_NAME_LENGTH);
}

/**
 * Returns participant by ID from Redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @param {string} id - The ID of the participant to retrieve.
 * @private
 * @returns {(Participant|undefined)}
 */
export function getParticipantById(
        stateful: IStore | Function | IState, id: string): Participant|undefined {
    const state = toState(stateful)['features/base/participants'];
    const { local, localScreenShare, remote } = state;

    return remote.get(id)
        || (local?.id === id ? local : undefined)
        || (localScreenShare?.id === id ? localScreenShare : undefined);
}

/**
 * Returns the participant with the ID matching the passed ID or the local participant if the ID is
 * undefined.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @param {string|undefined} [participantID] - An optional partipantID argument.
 * @returns {Participant|undefined}
 */
export function getParticipantByIdOrUndefined(stateful: IStore | Function, participantID?: string) {
    return participantID ? getParticipantById(stateful, participantID) : getLocalParticipant(stateful);
}

/**
 * Returns a count of the known participants in the passed in redux state,
 * excluding any fake participants.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {number}
 */
export function getParticipantCount(stateful: IStore | Function) {
    const state = toState(stateful);
    const {
        local,
        remote,
        fakeParticipants,
        sortedRemoteVirtualScreenshareParticipants
    } = state['features/base/participants'];

    if (getMultipleVideoSupportFeatureFlag(state)) {
        return remote.size - fakeParticipants.size - sortedRemoteVirtualScreenshareParticipants.size + (local ? 1 : 0);
    }

    return remote.size - fakeParticipants.size + (local ? 1 : 0);

}

/**
 * Returns participant ID of the owner of a virtual screenshare participant.
 *
 * @param {string} id - The ID of the virtual screenshare participant.
 * @private
 * @returns {(string|undefined)}
 */
export function getVirtualScreenshareParticipantOwnerId(id: string) {
    return id.split('-')[0];
}

/**
 * Returns the Map with fake participants.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {Map<string, Participant>} - The Map with fake participants.
 */
export function getFakeParticipants(stateful: IStore | Function) {
    return toState(stateful)['features/base/participants'].fakeParticipants;
}

/**
 * Returns a count of the known remote participants in the passed in redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {number}
 */
export function getRemoteParticipantCount(stateful: IStore | Function) {
    const state = toState(stateful)['features/base/participants'];

    if (getMultipleVideoSupportFeatureFlag(state)) {
        return state.remote.size - state.sortedRemoteVirtualScreenshareParticipants.size;
    }

    return state.remote.size;
}

/**
 * Returns a count of the known participants in the passed in redux state,
 * including fake participants.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {number}
 */
export function getParticipantCountWithFake(stateful: IStore | Function) {
    const state = toState(stateful);
    const { local, localScreenShare, remote } = state['features/base/participants'];

    if (getMultipleVideoSupportFeatureFlag(state)) {
        return remote.size + (local ? 1 : 0) + (localScreenShare ? 1 : 0);
    }

    return remote.size + (local ? 1 : 0);
}

/**
 * Returns participant's display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @param {string} id - The ID of the participant's display name to retrieve.
 * @returns {string}
 */
export function getParticipantDisplayName(stateful: IStore | Function | IState, id: string): string {
    const participant = getParticipantById(stateful, id);
    const {
        defaultLocalDisplayName,
        defaultRemoteDisplayName
    } = toState(stateful)['features/base/config'];

    if (participant) {
        if (participant.isVirtualScreenshareParticipant) {
            return getScreenshareParticipantDisplayName(stateful, id);
        }

        if (participant.name) {
            return participant.name;
        }

        if (participant.local) {
            return defaultLocalDisplayName;
        }
    }

    return defaultRemoteDisplayName;
}

/**
 * Returns screenshare participant's display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @param {string} id - The ID of the screenshare participant's display name to retrieve.
 * @returns {string}
 */
export function getScreenshareParticipantDisplayName(stateful: IStore | Function| IState, id: string) {
    const ownerDisplayName = getParticipantDisplayName(stateful, getVirtualScreenshareParticipantOwnerId(id));

    return i18next.t('screenshareDisplayName', { name: ownerDisplayName });
}

/**
 * Returns the presence status of a participant associated with the passed id.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {string} id - The id of the participant.
 * @returns {string} - The presence status.
 */
export function getParticipantPresenceStatus(
        stateful: IStore | Function, id: string) {
    if (!id) {
        return undefined;
    }
    const participantById = getParticipantById(stateful, id);

    if (!participantById) {
        return undefined;
    }

    return participantById.presence;
}

/**
 * Selectors for getting all remote participants.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {Map<string, Object>}
 */
export function getRemoteParticipants(stateful: IStore | Function) {
    return toState(stateful)['features/base/participants'].remote;
}

/**
 * Selectors for the getting the remote participants in the order that they are displayed in the filmstrip.
 *
@param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state features/filmstrip.
 * @returns {Array<string>}
 */
export function getRemoteParticipantsSorted(stateful: IStore | Function) {
    return toState(stateful)['features/filmstrip'].remoteParticipants;
}

/**
 * Returns the participant which has its pinned state set to truthy.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {(Participant|undefined)}
 */
export function getPinnedParticipant(stateful: IStore | Function) {
    const state = toState(stateful);
    const { pinnedParticipant } = state['features/base/participants'];
    const stageFilmstrip = isStageFilmstripAvailable(state);

    if (stageFilmstrip) {
        const { activeParticipants } = state['features/filmstrip'];
        const id = activeParticipants.find((p: Participant) => p.pinned)?.participantId;

        return id ? getParticipantById(stateful, id) : undefined;
    }

    if (!pinnedParticipant) {
        return undefined;
    }

    return getParticipantById(stateful, pinnedParticipant);
}

/**
 * Returns true if the participant is a moderator.
 *
 * @param {string} participant - Participant object.
 * @returns {boolean}
 */
export function isParticipantModerator(participant?: Participant) {
    return participant?.role === PARTICIPANT_ROLE.MODERATOR;
}

/**
 * Returns the dominant speaker participant.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {Participant} - The participant from the redux store.
 */
export function getDominantSpeakerParticipant(stateful: IStore | Function) {
    const state = toState(stateful)['features/base/participants'];
    const { dominantSpeaker } = state;

    if (!dominantSpeaker) {
        return undefined;
    }

    return getParticipantById(stateful, dominantSpeaker);
}

/**
 * Returns true if all of the meeting participants are moderators.
 *
 * @param {Object|Function} stateful -Object or function that can be resolved
 * to the Redux state.
 * @returns {boolean}
 */
export function isEveryoneModerator(stateful: IStore | Function) {
    const state = toState(stateful)['features/base/participants'];

    return state.everyoneIsModerator === true;
}

/**
 * Checks a value and returns true if it's a preloaded icon object.
 *
 * @param {?string | ?Object} icon - The icon to check.
 * @returns {boolean}
 */
export function isIconUrl(icon?: string | Object) {
    return Boolean(icon) && (typeof icon === 'object' || typeof icon === 'function');
}

/**
 * Returns true if the current local participant is a moderator in the
 * conference.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @returns {boolean}
 */
export function isLocalParticipantModerator(stateful: IStore | Function | IState) {
    const state = toState(stateful)['features/base/participants'];

    const { local } = state;

    if (!local) {
        return false;
    }

    return isParticipantModerator(local);
}

/**
 * Returns true if the video of the participant should be rendered.
 * NOTE: This is currently only used on mobile.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @param {string} id - The ID of the participant.
 * @returns {boolean}
 */
export function shouldRenderParticipantVideo(stateful: IStore | Function, id: string) {
    const state = toState(stateful);
    const participant = getParticipantById(state, id);

    if (!participant) {
        return false;
    }

    /* First check if we have an unmuted video track. */
    const videoTrack = getVideoTrackByParticipant(state['features/base/tracks'], participant);

    if (!shouldRenderVideoTrack(videoTrack, /* waitForVideoStarted */ false)) {
        return false;
    }

    /* Then check if the participant connection or track streaming status is active. */
    if (getSourceNameSignalingFeatureFlag(state)) {
        // Note that this will work only if a listener is registered for the track's TrackStreamingStatus.
        // The associated TrackStreamingStatusImpl instance is not created or disposed when there are zero listeners.
        if (videoTrack
            && !videoTrack.local
            && videoTrack.jitsiTrack?.getTrackStreamingStatus() !== JitsiTrackStreamingStatus.ACTIVE) {
            return false;
        }
    } else {
        const connectionStatus = participant.connectionStatus || JitsiParticipantConnectionStatus.ACTIVE;

        if (connectionStatus !== JitsiParticipantConnectionStatus.ACTIVE) {
            return false;
        }
    }

    /* Then check if audio-only mode is not active. */
    const audioOnly = state['features/base/audio-only'].enabled;

    if (!audioOnly) {
        return true;
    }

    /* Last, check if the participant is sharing their screen and they are on stage. */
    const remoteScreenShares = state['features/video-layout'].remoteScreenShares || [];
    const largeVideoParticipantId = state['features/large-video'].participantId;
    const participantIsInLargeVideoWithScreen
        = participant.id === largeVideoParticipantId && remoteScreenShares.includes(participant.id);

    return participantIsInLargeVideoWithScreen;
}

/**
 * Resolves the first loadable avatar URL for a participant.
 *
 * @param {Object} participant - The participant to resolve avatars for.
 * @param {Store} store - Redux store.
 * @returns {?string}
 */
async function _getFirstLoadableAvatarUrl(participant: Participant, store: IStore) {
    for (let i = 0; i < AVATAR_CHECKER_FUNCTIONS.length; i++) {
        const url = AVATAR_CHECKER_FUNCTIONS[i](participant, store);

        if (url !== null) {
            if (AVATAR_CHECKED_URLS.has(url)) {
                const { isLoadable, isUsingCORS } = AVATAR_CHECKED_URLS.get(url) || {};

                if (isLoadable) {
                    return {
                        isUsingCORS,
                        src: url
                    };
                }
            } else {
                try {
                    const { corsAvatarURLs } = store.getState()['features/base/config'];
                    const { isUsingCORS, src } = await preloadImage(url, isCORSAvatarURL(url, corsAvatarURLs));

                    AVATAR_CHECKED_URLS.set(src, {
                        isLoadable: true,
                        isUsingCORS
                    });

                    return {
                        isUsingCORS,
                        src
                    };
                } catch (e) {
                    AVATAR_CHECKED_URLS.set(url, {
                        isLoadable: false,
                        isUsingCORS: false
                    });
                }
            }
        }
    }

    return undefined;
}

/**
 * Get the participants queue with raised hands.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {Array<Object>}
 */
export function getRaiseHandsQueue(stateful: IStore | Function): Array<Object> {
    const { raisedHandsQueue } = toState(stateful)['features/base/participants'];

    return raisedHandsQueue;
}

/**
 * Returns whether the given participant has his hand raised or not.
 *
 * @param {Object} participant - The participant.
 * @returns {boolean} - Whether participant has raise hand or not.
 */
export function hasRaisedHand(participant?: Participant): boolean {
    return Boolean(participant?.raisedHandTimestamp);
}
