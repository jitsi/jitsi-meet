declare var config: Object;
declare var interfaceConfig: Object;
declare var MD5: Object;

/**
 * Returns the URL of the image for the avatar of a specific participant.
 *
 * @param {Participant} [participant] - The participant to return the avatar URL
 * of.
 * @param {string} [participant.avatarID] - Participant's avatar ID.
 * @param {string} [participant.avatarURL] - Participant's avatar URL.
 * @param {string} [participant.email] - Participant's e-mail address.
 * @param {string} [participant.id] - Participant's ID.
 * @returns {string} The URL of the image for the avatar of the specified
 * participant.
 *
 * @public
 */
export function getAvatarURL(participant) {
    // If disableThirdPartyRequests disables third-party avatar services, we are
    // restricted to a stock image of ours.
    if (typeof config === 'object' && config.disableThirdPartyRequests) {
        return 'images/avatar2.png';
    }

    const { avatarID, avatarURL, email, id } = participant;

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
            // Otherwise, use a default (of course).
            urlPrefix = 'https://api.adorable.io/avatars/200/';
            urlSuffix = '.png';
        }
    }

    return urlPrefix + MD5.hexdigest(key.trim().toLowerCase()) + urlSuffix;
}

/**
 * Returns local participant from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateOrGetState - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the
 * features/base/participants state.
 * @returns {(Participant|undefined)}
 */
export function getLocalParticipant(stateOrGetState) {
    const participants = _getParticipants(stateOrGetState);

    return participants.find(p => p.local);
}

/**
 * Returns participant by ID from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateOrGetState - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the
 * features/base/participants state.
 * @param {string} id - The ID of the participant to retrieve.
 * @private
 * @returns {(Participant|undefined)}
 */
export function getParticipantById(stateOrGetState, id) {
    const participants = _getParticipants(stateOrGetState);

    return participants.find(p => p.id === id);
}

/**
 * Returns array of participants from Redux state.
 *
 * @param {(Function|Object|Participant[])} stateOrGetState - The redux state
 * features/base/participants, the (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the
 * features/base/participants state.
 * @private
 * @returns {Participant[]}
 */
function _getParticipants(stateOrGetState) {
    if (Array.isArray(stateOrGetState)) {
        return stateOrGetState;
    }

    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;

    return state['features/base/participants'] || [];
}
