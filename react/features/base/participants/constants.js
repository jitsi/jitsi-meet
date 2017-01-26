/**
 * Local participant might not have real ID until he joins a conference,
 * so use 'local' as its default ID.
 *
 * @type {string}
 */
export const LOCAL_PARTICIPANT_DEFAULT_ID = 'local';

/**
 * The set of possible XMPP MUC roles for conference participants.
 *
 * @enum {string}
 */
export const PARTICIPANT_ROLE = {
    MODERATOR: 'moderator',
    NONE: 'none',
    PARTICIPANT: 'participant'
};
