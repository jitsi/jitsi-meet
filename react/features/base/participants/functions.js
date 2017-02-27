/* global MD5 */

declare var config: Object;
declare var interfaceConfig: Object;

/**
 * Returns local participant from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @returns {(Participant|undefined)}
 */
export function getLocalParticipant(participantsOrGetState) {
    const participants = _getParticipants(participantsOrGetState);

    return participants.find(p => p.local);
}

/**
 * Returns participant by ID from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @param {string} id - The ID of the participant to retrieve.
 * @private
 * @returns {(Participant|undefined)}
 */
export function getParticipantById(participantsOrGetState, id) {
    const participants = _getParticipants(participantsOrGetState);

    return participants.find(p => p.id === id);
}

/**
 * Returns array of participants from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @private
 * @returns {Participant[]}
 */
function _getParticipants(participantsOrGetState) {
    const participants
        = typeof participantsOrGetState === 'function'
            ? participantsOrGetState()['features/base/participants']
            : participantsOrGetState;

    return participants || [];
}

/**
 * Returns the URL of the image for the avatar of a particular participant
 * identified by their id and/or e-mail address.
 *
 * @param {string} [participantId] - Participant's id.
 * @param {Object} [options] - The optional arguments.
 * @param {string} [options.avatarId] - Participant's avatar id.
 * @param {string} [options.avatarUrl] - Participant's avatar url.
 * @param {string} [options.email] - Participant's email.
 * @returns {string} The URL of the image for the avatar of the participant
 * identified by the specified participantId and/or email.
 *
 * @public
 */
export function getAvatarURL(participantId, options = {}) {
    // If disableThirdPartyRequests is enabled we shouldn't use third party
    // avatar services, we are returning one of our images.
    if (typeof config === 'object' && config.disableThirdPartyRequests) {
        return 'images/avatar2.png';
    }

    const { avatarId, avatarUrl, email } = options;

    // If we have avatarUrl we don't need to generate new one.
    if (avatarUrl) {
        return avatarUrl;
    }

    let avatarKey = null;

    if (email) {
        avatarKey = email;
    } else {
        avatarKey = avatarId;
    }

    // If the ID looks like an email, we'll use gravatar.
    // Otherwise, it's a random avatar, and we'll use the configured
    // URL.
    const isEmail = avatarKey && avatarKey.indexOf('@') > 0;

    if (!avatarKey) {
        avatarKey = participantId;
    }

    avatarKey = MD5.hexdigest(avatarKey.trim().toLowerCase());

    let urlPref = null;
    let urlSuf = null;

    // gravatar doesn't support random avatars that's why we need to use other
    // services for the use case when the email is undefined.
    if (isEmail) {
        urlPref = 'https://www.gravatar.com/avatar/';
        urlSuf = '?d=wavatar&size=200';
    } else if (typeof interfaceConfig === 'object'
        && interfaceConfig.RANDOM_AVATAR_URL_PREFIX) { // custom avatar service
        urlPref = interfaceConfig.RANDOM_AVATAR_URL_PREFIX;
        urlSuf = interfaceConfig.RANDOM_AVATAR_URL_SUFFIX;
    } else { // default avatar service
        urlPref = 'https://api.adorable.io/avatars/200/';
        urlSuf = '.png';
    }

    return urlPref + avatarKey + urlSuf;
}
