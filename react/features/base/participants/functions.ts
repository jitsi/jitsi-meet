// @ts-expect-error
import { getGravatarURL } from '@jitsi/js-utils/avatar';

import { IReduxState, IStore } from '../../app/types';
import { isStageFilmstripAvailable } from '../../filmstrip/functions';
import { isAddPeopleEnabled, isDialOutEnabled } from '../../invite/functions';
import { toggleShareDialog } from '../../share-room/actions';
import { IStateful } from '../app/types';
import { GRAVATAR_BASE_URL } from '../avatar/constants';
import { isCORSAvatarURL } from '../avatar/functions';
import { getCurrentConference } from '../conference/functions';
import { ADD_PEOPLE_ENABLED } from '../flags/constants';
import { getFeatureFlag } from '../flags/functions';
import i18next from '../i18n/i18next';
import { MEDIA_TYPE, VIDEO_TYPE } from '../media/constants';
import { toState } from '../redux/functions';
import { getScreenShareTrack } from '../tracks/functions.any';
import { createDeferred } from '../util/helpers';

import {
    JIGASI_PARTICIPANT_ICON,
    MAX_DISPLAY_NAME_LENGTH,
    PARTICIPANT_ROLE,
    WHITEBOARD_PARTICIPANT_ICON
} from './constants';
import { preloadImage } from './preloadImage';
import { FakeParticipant, IJitsiParticipant, IParticipant, ISourceInfo } from './types';


/**
 * Temp structures for avatar urls to be checked/preloaded.
 */
const AVATAR_QUEUE: Object[] = [];
const AVATAR_CHECKED_URLS = new Map();
/* eslint-disable arrow-body-style */
const AVATAR_CHECKER_FUNCTIONS = [
    (participant: IParticipant) => {
        return participant?.isJigasi ? JIGASI_PARTICIPANT_ICON : null;
    },
    (participant: IParticipant) => {
        return isWhiteboardParticipant(participant) ? WHITEBOARD_PARTICIPANT_ICON : null;
    },
    (participant: IParticipant) => {
        return participant?.avatarURL ? participant.avatarURL : null;
    },
    (participant: IParticipant, store: IStore) => {
        const config = store.getState()['features/base/config'];
        const isGravatarDisabled = config.gravatar?.disabled;

        if (participant?.email && !isGravatarDisabled) {
            const gravatarBaseURL = config.gravatar?.baseUrl
                || config.gravatarBaseURL
                || GRAVATAR_BASE_URL;

            return getGravatarURL(participant.email, gravatarBaseURL);
        }

        return null;
    }
];
/* eslint-enable arrow-body-style */

/**
 * Returns the list of active speakers that should be moved to the top of the sorted list of participants so that the
 * dominant speaker is visible always on the vertical filmstrip in stage layout.
 *
 * @param {Function | Object} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @returns {Array<string>}
 */
export function getActiveSpeakersToBeDisplayed(stateful: IStateful) {
    const state = toState(stateful);
    const {
        dominantSpeaker,
        fakeParticipants,
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

    if (activeSpeakers.has(dominantSpeaker ?? '')) {
        activeSpeakers.delete(dominantSpeaker ?? '');
    }

    // Add dominant speaker to the beginning of the list (not including self) since the active speaker list is always
    // alphabetically sorted.
    if (dominantSpeaker && dominantSpeaker !== getLocalParticipant(state)?.id) {
        const updatedSpeakers = Array.from(activeSpeakers);

        updatedSpeakers.splice(0, 0, [ dominantSpeaker, getParticipantById(state, dominantSpeaker)?.name ?? '' ]);
        activeSpeakers = new Map(updatedSpeakers);
    }

    // Remove screenshares from the count.
    if (sortedRemoteVirtualScreenshareParticipants) {
        availableSlotsForActiveSpeakers -= sortedRemoteVirtualScreenshareParticipants.size * 2;
        for (const screenshare of Array.from(sortedRemoteVirtualScreenshareParticipants.keys())) {
            const ownerId = getVirtualScreenshareParticipantOwnerId(screenshare as string);

            activeSpeakers.delete(ownerId);
        }
    }

    // Remove fake participants from the count.
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
export function getFirstLoadableAvatarUrl(participant: IParticipant, store: IStore) {
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
 * @returns {(IParticipant|undefined)}
 */
export function getLocalParticipant(stateful: IStateful) {
    const state = toState(stateful)['features/base/participants'];

    return state.local;
}

/**
 * Returns local screen share participant from Redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {(IParticipant|undefined)}
 */
export function getLocalScreenShareParticipant(stateful: IStateful) {
    const state = toState(stateful)['features/base/participants'];

    return state.localScreenShare;
}

/**
 * Returns screenshare participant.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state features/base/participants.
 * @param {string} id - The owner ID of the screenshare participant to retrieve.
 * @returns {(IParticipant|undefined)}
 */
export function getVirtualScreenshareParticipantByOwnerId(stateful: IStateful, id: string) {
    const state = toState(stateful);
    const track = getScreenShareTrack(state['features/base/tracks'], id);

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
    if (!name?.trim()) {
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
 * @returns {(IParticipant|undefined)}
 */
export function getParticipantById(stateful: IStateful, id: string): IParticipant | undefined {
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
 * @returns {IParticipant|undefined}
 */
export function getParticipantByIdOrUndefined(stateful: IStateful, participantID?: string) {
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
export function getParticipantCount(stateful: IStateful) {
    const state = toState(stateful);
    const {
        local,
        remote,
        fakeParticipants,
        sortedRemoteVirtualScreenshareParticipants
    } = state['features/base/participants'];

    return remote.size - fakeParticipants.size - sortedRemoteVirtualScreenshareParticipants.size + (local ? 1 : 0);
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
 * @returns {Map<string, IParticipant>} - The Map with fake participants.
 */
export function getFakeParticipants(stateful: IStateful) {
    return toState(stateful)['features/base/participants'].fakeParticipants;
}

/**
 * Returns whether the fake participant is a local screenshare.
 *
 * @param {IParticipant|undefined} participant - The participant entity.
 * @returns {boolean} - True if it's a local screenshare participant.
 */
export function isLocalScreenshareParticipant(participant?: IParticipant): boolean {
    return participant?.fakeParticipant === FakeParticipant.LocalScreenShare;
}

/**
 * Returns whether the fake participant is a remote screenshare.
 *
 * @param {IParticipant|undefined} participant - The participant entity.
 * @returns {boolean} - True if it's a remote screenshare participant.
 */
export function isRemoteScreenshareParticipant(participant?: IParticipant): boolean {
    return participant?.fakeParticipant === FakeParticipant.RemoteScreenShare;
}

/**
 * Returns whether the fake participant is of local or virtual screenshare type.
 *
 * @param {IReduxState} state - The (whole) redux state, or redux's.
 * @param {string|undefined} participantId - The participant id.
 * @returns {boolean} - True if it's one of the two.
 */
export function isScreenShareParticipantById(state: IReduxState, participantId?: string): boolean {
    const participant = getParticipantByIdOrUndefined(state, participantId);

    return isScreenShareParticipant(participant);
}

/**
 * Returns whether the fake participant is of local or virtual screenshare type.
 *
 * @param {IParticipant|undefined} participant - The participant entity.
 * @returns {boolean} - True if it's one of the two.
 */
export function isScreenShareParticipant(participant?: IParticipant): boolean {
    return isLocalScreenshareParticipant(participant) || isRemoteScreenshareParticipant(participant);
}

/**
 * Returns whether the (fake) participant is a shared video.
 *
 * @param {IParticipant|undefined} participant - The participant entity.
 * @returns {boolean} - True if it's a shared video participant.
 */
export function isSharedVideoParticipant(participant?: IParticipant): boolean {
    return participant?.fakeParticipant === FakeParticipant.SharedVideo;
}

/**
 * Returns whether the fake participant is a whiteboard.
 *
 * @param {IParticipant|undefined} participant - The participant entity.
 * @returns {boolean} - True if it's a whiteboard participant.
 */
export function isWhiteboardParticipant(participant?: IParticipant): boolean {
    return participant?.fakeParticipant === FakeParticipant.Whiteboard;
}

/**
 * Returns a count of the known remote participants in the passed in redux state.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {number}
 */
export function getRemoteParticipantCountWithFake(stateful: IStateful) {
    const state = toState(stateful);
    const participantsState = state['features/base/participants'];

    return participantsState.remote.size;
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
export function getParticipantCountWithFake(stateful: IStateful) {
    const state = toState(stateful);
    const { local, localScreenShare, remote } = state['features/base/participants'];

    return remote.size + (local ? 1 : 0) + (localScreenShare ? 1 : 0);
}

/**
 * Returns participant's display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @param {string} id - The ID of the participant's display name to retrieve.
 * @returns {string}
 */
export function getParticipantDisplayName(stateful: IStateful, id: string): string {
    const state = toState(stateful);
    const participant = getParticipantById(state, id);
    const {
        defaultLocalDisplayName,
        defaultRemoteDisplayName
    } = state['features/base/config'];

    if (participant) {
        if (isScreenShareParticipant(participant)) {
            return getScreenshareParticipantDisplayName(state, id);
        }

        if (participant.name) {
            return participant.name;
        }

        if (participant.local) {
            return defaultLocalDisplayName ?? '';
        }
    }

    return defaultRemoteDisplayName ?? '';
}

/**
 * Returns the source names of the screenshare sources in the conference based on the presence shared by the remote
 * endpoints. This should be only used for creating/removing virtual screenshare participant tiles when ssrc-rewriting
 * is enabled. Once the tile is created, the source-name gets added to the receiver constraints based on which the
 * JVB will add the source to the video sources map and signal it to the local endpoint. Only then, a remote track is
 * created/remapped and the tracks in redux will be updated. Once the track is updated in redux, the client will
 * will continue to use the other track based getter functions for other operations related to screenshare.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @returns {string[]}
 */
export function getRemoteScreensharesBasedOnPresence(stateful: IStateful): string[] {
    const conference = getCurrentConference(stateful);

    return conference?.getParticipants()?.reduce((screenshares: string[], participant: IJitsiParticipant) => {
        const sources: Map<string, Map<string, ISourceInfo>> = participant.getSources();
        const videoSources = sources.get(MEDIA_TYPE.VIDEO);
        const screenshareSources = Array.from(videoSources ?? new Map())
            .filter(source => source[1].videoType === VIDEO_TYPE.DESKTOP && !source[1].muted)
            .map(source => source[0]);

        // eslint-disable-next-line no-param-reassign
        screenshares = [ ...screenshares, ...screenshareSources ];

        return screenshares;
    }, []);
}

/**
 * Returns screenshare participant's display name.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @param {string} id - The ID of the screenshare participant's display name to retrieve.
 * @returns {string}
 */
export function getScreenshareParticipantDisplayName(stateful: IStateful, id: string) {
    const ownerDisplayName = getParticipantDisplayName(stateful, getVirtualScreenshareParticipantOwnerId(id));

    return i18next.t('screenshareDisplayName', { name: ownerDisplayName });
}

/**
 * Returns a list of IDs of the participants that are currently screensharing.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @returns {Array<string>}
 */
export function getScreenshareParticipantIds(stateful: IStateful): Array<string> {
    return toState(stateful)['features/base/tracks']
        .filter(track => track.videoType === VIDEO_TYPE.DESKTOP && !track.muted)
        .map(t => t.participantId);
}

/**
 * Returns a list source name associated with a given remote participant and for the given media type.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state.
 * @param {string} id - The id of the participant whose source names are to be retrieved.
 * @param {string} mediaType - The type of source, audio or video.
 * @returns {Array<string>|undefined}
 */
export function getSourceNamesByMediaType(
        stateful: IStateful,
        id: string,
        mediaType: string): Array<string> | undefined {
    const participant: IParticipant | undefined = getParticipantById(stateful, id);

    if (!participant) {
        return;
    }

    const sources = participant.sources;

    if (!sources) {
        return;
    }

    return Array.from(sources.get(mediaType) ?? new Map())
        .filter(source => source[1].videoType !== VIDEO_TYPE.DESKTOP || !source[1].muted)
        .map(s => s[0]);
}

/**
 * Returns the presence status of a participant associated with the passed id.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @param {string} id - The id of the participant.
 * @returns {string} - The presence status.
 */
export function getParticipantPresenceStatus(stateful: IStateful, id: string) {
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
export function getRemoteParticipants(stateful: IStateful): Map<string, IParticipant> {
    return toState(stateful)['features/base/participants'].remote;
}

/**
 * Selectors for the getting the remote participants in the order that they are displayed in the filmstrip.
 *
@param {(Function|Object)} stateful - The (whole) redux state, or redux's {@code getState} function to be used to
 * retrieve the state features/filmstrip.
 * @returns {Array<string>}
 */
export function getRemoteParticipantsSorted(stateful: IStateful) {
    return toState(stateful)['features/filmstrip'].remoteParticipants;
}

/**
 * Returns the participant which has its pinned state set to truthy.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {(IParticipant|undefined)}
 */
export function getPinnedParticipant(stateful: IStateful) {
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
export function isParticipantModerator(participant?: IParticipant) {
    return participant?.role === PARTICIPANT_ROLE.MODERATOR;
}

/**
 * Returns the dominant speaker participant.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state or redux's
 * {@code getState} function to be used to retrieve the state features/base/participants.
 * @returns {IParticipant} - The participant from the redux store.
 */
export function getDominantSpeakerParticipant(stateful: IStateful) {
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
export function isEveryoneModerator(stateful: IStateful) {
    const state = toState(stateful)['features/base/participants'];

    return state.numberOfNonModeratorParticipants === 0;
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
export function isLocalParticipantModerator(stateful: IStateful) {
    const state = toState(stateful)['features/base/participants'];

    const { local } = state;

    if (!local) {
        return false;
    }

    return isParticipantModerator(local);
}

/**
 * Resolves the first loadable avatar URL for a participant.
 *
 * @param {Object} participant - The participant to resolve avatars for.
 * @param {Store} store - Redux store.
 * @returns {?string}
 */
async function _getFirstLoadableAvatarUrl(participant: IParticipant, store: IStore) {
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
                    const useCORS = isIconUrl(url) ? false : isCORSAvatarURL(url, corsAvatarURLs);
                    const { isUsingCORS, src } = await preloadImage(url, useCORS);

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
export function getRaiseHandsQueue(stateful: IStateful): Array<{ id: string; raisedHandTimestamp: number; }> {
    const { raisedHandsQueue } = toState(stateful)['features/base/participants'];

    return raisedHandsQueue;
}

/**
 * Returns whether the given participant has his hand raised or not.
 *
 * @param {Object} participant - The participant.
 * @returns {boolean} - Whether participant has raise hand or not.
 */
export function hasRaisedHand(participant?: IParticipant): boolean {
    return Boolean(participant?.raisedHandTimestamp);
}

/**
 * Add people feature enabling/disabling.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @returns {boolean}
 */
export const addPeopleFeatureControl = (stateful: IStateful) => {
    const state = toState(stateful);

    return getFeatureFlag(state, ADD_PEOPLE_ENABLED, true)
    && (isAddPeopleEnabled(state) || isDialOutEnabled(state));
};

/**
 * Controls share dialog visibility.
 *
 * @param {boolean} addPeopleFeatureEnabled - Checks if add people functionality is enabled.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Function}
 */
export const setShareDialogVisiblity = (addPeopleFeatureEnabled: boolean, dispatch: IStore['dispatch']) => {
    if (addPeopleFeatureEnabled) {
        dispatch(toggleShareDialog(false));
    } else {
        dispatch(toggleShareDialog(true));
    }
};
