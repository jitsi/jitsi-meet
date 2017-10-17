// @flow
import md5 from 'js-md5';

import { toState } from '../redux';

import { DEFAULT_AVATAR_RELATIVE_PATH } from './constants';

declare var config: Object;
declare var interfaceConfig: Object;

/**
 * Returns the URL of the image for the avatar of a specific participant.
 *
 * @param {Participant} [participant] - The participant to return the avatar URL
 * of.
 * @param {string} [participant.avatarID] - Participant's avatar ID.
 * @param {string} [participant.avatarURL] - Participant's avatar URL.
 * @param {string} [participant.email] - Participant's e-mail address.
 * @param {string} [participant.id] - Participant's ID.
 * @public
 * @returns {string} The URL of the image for the avatar of the specified
 * participant.
 */
export function getAvatarURL({ avatarID, avatarURL, email, id }: {
        avatarID: string,
        avatarURL: string,
        email: string,
        id: string
}) {
    // If disableThirdPartyRequests disables third-party avatar services, we are
    // restricted to a stock image of ours.
    if (typeof config === 'object' && config.disableThirdPartyRequests) {
        return DEFAULT_AVATAR_RELATIVE_PATH;
    }

    // If an avatarURL is specified, then obviously there's nothing to generate.
    if (avatarURL) {
        return avatarURL;
    }

    let key = email || avatarID;
    let urlPrefix;
    let urlSuffix;

    // If the ID looks like an e-mail address, we'll use Gravatar because it
    // supports e-mail addresses.
    if (key && key.indexOf('@') > 0) {
        urlPrefix = 'https://www.gravatar.com/avatar/';
        urlSuffix = '?d=wavatar&size=200';
    } else {
        // Otherwise, we do not have much a choice but a random avatar (fetched
        // from a configured avatar service).
        if (!key) {
            key = id;
            if (!key) {
                return undefined;
            }
        }

        // The deployment is allowed to choose the avatar service which is to
        // generate the random avatars.
        urlPrefix
            = typeof interfaceConfig === 'object'
                && interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
        if (urlPrefix) {
            urlSuffix = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
        } else {
            // Otherwise, use a default (meeples, of course).
            urlPrefix = 'https://abotars.jitsi.net/meeple/';
            urlSuffix = '';
        }
    }

    return urlPrefix + md5.hex(key.trim().toLowerCase()) + urlSuffix;
}

/**
 * Returns local participant from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {(Participant|undefined)}
 */
export function getLocalParticipant(stateful: Object | Function) {
    const participants = _getAllParticipants(stateful);

    return participants.find(p => p.local);
}

/**
 * Returns participant by ID from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @param {string} id - The ID of the participant to retrieve.
 * @private
 * @returns {(Participant|undefined)}
 */
export function getParticipantById(
        stateful: Object | Function,
        id: string) {
    const participants = _getAllParticipants(stateful);

    return participants.find(p => p.id === id);
}

/**
 * Returns a count of the known participants in the passed in redux state,
 * excluding any fake participants.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {number}
 */
export function getParticipantCount(stateful: Object | Function) {
    return getParticipants(stateful).length;
}


/**
 * Selectors for getting all known participants with fake participants filtered
 * out.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {Participant[]}
 */
export function getParticipants(stateful: Object | Function) {
    return _getAllParticipants(stateful).filter(p => !p.isBot);
}

/**
 * Returns the participant which has its pinned state set to truthy.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @returns {(Participant|undefined)}
 */
export function getPinnedParticipant(stateful: Object | Function) {
    return _getAllParticipants(stateful).find(p => p.pinned);
}

/**
 * Returns array of participants from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateful - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/participants.
 * @private
 * @returns {Participant[]}
 */
function _getAllParticipants(stateful) {
    return (
        Array.isArray(stateful)
            ? stateful
            : toState(stateful)['features/base/participants'] || []);
}
