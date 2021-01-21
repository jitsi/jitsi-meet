/**
 * The type of the action which sets the list of known participant IDs which
 * have an active screen share.
 *
 * @returns {{
    *     type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
    *     participantIds: Array<string>
    * }}
    */
export const SCREEN_SHARE_PARTICIPANTS_UPDATED
    = 'SCREEN_SHARE_PARTICIPANTS_UPDATED';
