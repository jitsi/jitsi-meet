// @flow

import { getGravatarURL } from '@jitsi/js-utils/avatar';
import type { Store } from 'redux';

import { i18next } from '../../base/i18n';
import { isStageFilmstripAvailable } from '../../filmstrip/functions';
import { GRAVATAR_BASE_URL, isCORSAvatarURL } from '../avatar';
import { getSourceNameSignalingFeatureFlag } from '../config';
import { JitsiParticipantConnectionStatus } from '../lib-jitsi-meet';
import { MEDIA_TYPE, shouldRenderVideoTrack } from '../media';
import { toState } from '../redux';
import { getTrackByMediaTypeAndParticipant } from '../tracks';
import { createDeferred } from '../util';

import {
    JIGASI_PARTICIPANT_ICON,
    MAX_DISPLAY_NAME_LENGTH,
    PARTICIPANT_ROLE
} from './constants';
import { preloadImage } from './preloadImage';


/**
 * Temp structures for avatar urls to be checked/preloaded.
 */
const AVATAR_QUEUE = [];
const AVATAR_CHECKED_URLS = new Map();
/* eslint-disable arrow-body-style, no-unused-vars */
const AVATAR_CHECKER_FUNCTIONS = [
    (participant, _) => {
        return participant && participant.isJigasi ? JIGASI_PARTICIPANT_ICON : null;
    },
    (participant, _) => {
        return participant && participant.avatarURL ? participant.avatarURL : null;
    },
    (participant, store) => {
        if (participant && participant.email) {
            // TODO: remove once libravatar has deployed their new scaled up infra. -saghul
            const gravatarBaseURL
                = store.getState()['features/base/config'].gravatarBaseURL ?? GRAVATAR_BASE_URL;

            return getGravatarURL(participant.email, gravatarBaseURL);
        }

        return null;
    }
];
/* eslint-enable arrow-body-style, no-unused-vars */

/**
 * Resolves the first loadable avatar URL for a participant.
 *
 * @param {Object} participant - The participant to resolve avatars for.
 * @param {Store} store - Redux store.
 * @returns {Promise}
 */
export function getFirstLoadableAvatarUrl(participant: Object, store: Store<any, any>) {
    const deferred = createDeferred();
    const fullPromise = deferred.promise
        .then(() => _getFirstLoadableAvatarUrl(participant, store))
        .then(result => {

            if (AVATAR_QUEUE.length) {
                const next = AVATAR_QUEUE.shift();

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
export function getLocalParticipant(stateful: Object | Function) {
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
export function getLocalScreenShareParticipant(stateful: Object | Function) {
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
export function getScreenshareParticipantByOwnerId(stateful: Object | Function, id: string) {
    const track = getTrackByMediaTypeAndParticipant(
        toState(stateful)['features/base/tracks'], MEDIA_TYPE.SCREENSHARE, id
    );

    return getParticipantById(stateful, track?.jitsiTrack.getSourceName());
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
        stateful: Object | Function, id: string): ?Object {
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
export function getParticipantByIdOrUndefined(stateful: Object | Function, participantID: ?string) {
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
export function getParticipantCount(stateful: Object | Function) {
    const state = toState(stateful);
    const {
        local,
        remote,
        fakeParticipants,
        sortedRemoteFakeScreenShareParticipants
    } = state['features/base/participants'];

    if (getSourceNameSignalingFeatureFlag(state)) {
        return remote.size - fakeParticipants.size - sortedRemoteFakeScreenShareParticipants.size + (local ? 1 : 0);
    }

    return remote.size - fakeParticipants.size + (local ? 1 : 0);

}

/**
 * Returns participant ID of the owner of a fake screenshare participant.
 *
 * @param {string} id - The ID of the fake screenshare participant.
 * @private
 * @returns {(string|undefined)}
 */
export function getFakeScreenShareParticipantOwnerId(id: string) {
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
export function getFakeParticipants(stateful: Object | Function) {
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
export function getRemoteParticipantCount(stateful: Object | Function) {
    const state = toState(stateful)['features/base/participants'];

    if (getSourceNameSignalingFeatureFlag(state)) {
        return state.remote.size - state.sortedRemoteFakeScreenShareParticipants.size;
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
export function getParticipantCountWithFake(stateful: Object | Function) {
    const state = toState(stateful);
    const { local, localScreenShare, remote } = state['features/base/participants'];

    if (getSourceNameSignalingFeatureFlag(state)) {
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
export function getParticipantDisplayName(stateful: Object | Function, id: string) {
    const participant = getParticipantById(stateful, id);
    const {
        defaultLocalDisplayName,
        defaultRemoteDisplayName
    } = toState(stateful)['features/base/config'];

    if (participant) {
        if (participant.isFakeScreenShareParticipant) {
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
export function getScreenshareParticipantDisplayName(stateful: Object | Function, id: string) {
    const owner = getParticipantById(stateful, getFakeScreenShareParticipantOwnerId(id));
    const name = owner.name;

    return i18next.t('screenshareDisplayName', { name });
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
        stateful: Object | Function, id: string) {
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
 * Returns true if there is at least 1 participant with screen sharing feature and false otherwise.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean}
 */
export function haveParticipantWithScreenSharingFeature(stateful: Object | Function) {
    return toState(stateful)['features/base/participants'].haveParticipantWithScreenSharingFeature;
}

/**
 * Selectors for getting all remote participants.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {Map<string, Object>}
 */
export function getRemoteParticipants(stateful: Object | Function) {
    return toState(stateful)['features/base/participants'].remote;
}

/**
 * Selectors for the getting the remote participants in the order that they are displayed in the filmstrip.
 *
@param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state features/filmstrip.
 * @returns {Array<string>}
 */
export function getRemoteParticipantsSorted(stateful: Object | Function) {
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
export function getPinnedParticipant(stateful: Object | Function) {
    const state = toState(stateful);
    const { pinnedParticipant } = state['features/base/participants'];
    const stageFilmstrip = isStageFilmstripAvailable(state);

    if (stageFilmstrip) {
        const { activeParticipants } = state['features/filmstrip'];
        const id = activeParticipants.find(p => p.pinned)?.participantId;

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
export function isParticipantModerator(participant: Object) {
    return participant?.role === PARTICIPANT_ROLE.MODERATOR;
}

/**
 * Returns the dominant speaker participant.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {Participant} - The participant from the redux store.
 */
export function getDominantSpeakerParticipant(stateful: Object | Function) {
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
export function isEveryoneModerator(stateful: Object | Function) {
    const state = toState(stateful)['features/base/participants'];

    return state.everyoneIsModerator === true;
}

/**
 * Checks a value and returns true if it's a preloaded icon object.
 *
 * @param {?string | ?Object} icon - The icon to check.
 * @returns {boolean}
 */
export function isIconUrl(icon: ?string | ?Object) {
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
export function isLocalParticipantModerator(stateful: Object | Function) {
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
export function shouldRenderParticipantVideo(stateful: Object | Function, id: string) {
    const state = toState(stateful);
    const participant = getParticipantById(state, id);

    if (!participant) {
        return false;
    }

    /* First check if we have an unmuted video track. */
    const videoTrack
        = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, id);

    if (!shouldRenderVideoTrack(videoTrack, /* waitForVideoStarted */ false)) {
        return false;
    }

    /* Then check if the participant connection is active. */
    const connectionStatus = participant.connectionStatus || JitsiParticipantConnectionStatus.ACTIVE;

    if (connectionStatus !== JitsiParticipantConnectionStatus.ACTIVE) {
        return false;
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
async function _getFirstLoadableAvatarUrl(participant, store) {
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
export function getRaiseHandsQueue(stateful: Object | Function): Array<Object> {
    const { raisedHandsQueue } = toState(stateful)['features/base/participants'];

    return raisedHandsQueue;
}

/**
 * Returns whether the given participant has his hand raised or not.
 *
 * @param {Object} participant - The participant.
 * @returns {boolean} - Whether participant has raise hand or not.
 */
export function hasRaisedHand(participant: Object): boolean {
    return Boolean(participant && participant.raisedHandTimestamp);
}
