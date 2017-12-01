// @flow

declare var $: Function;
declare var interfaceConfig: Object;

/**
 * Get the position of the invite option in the interfaceConfig.INVITE_OPTIONS
 * list.
 *
 * @param {string} name - The invite option name.
 * @private
 * @returns {number} - The position of the option in the list.
 */
export function getInviteOptionPosition(name: string): number {
    return interfaceConfig.INVITE_OPTIONS.indexOf(name);
}

/**
 * Sends a post request to an invite service.
 *
 * @param {string} inviteServiceUrl - The invite service that generates the
 * invitation.
 * @param {string} inviteUrl - The url to the conference.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {Immutable.List} inviteItems - The list of the "user" or "room"
 * type items to invite.
 * @returns {Promise} - The promise created by the request.
 */
export function invitePeopleAndChatRooms( // eslint-disable-line max-params
        inviteServiceUrl: string,
        inviteUrl: string,
        jwt: string,
        inviteItems: Object): Promise<void> {
    if (!inviteItems || inviteItems.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        $.post(
                `${inviteServiceUrl}?token=${jwt}`,
                JSON.stringify({
                    'invited': inviteItems,
                    'url': inviteUrl
                }),
                resolve,
                'json')
            .fail((jqxhr, textStatus, error) => reject(error));
    });
}

/**
 * Indicates if an invite option is enabled in the configuration.
 *
 * @param {string} name - The name of the option defined in
 * interfaceConfig.INVITE_OPTIONS.
 * @returns {boolean} - True to indicate that the given invite option is
 * enabled, false - otherwise.
 */
export function isInviteOptionEnabled(name: string) {
    return getInviteOptionPosition(name) !== -1;
}

/**
 * Sends an ajax request to a directory service.
 *
 * @param {string} serviceUrl - The service to query.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {string} text - Text to search.
 * @param {Array<string>} queryTypes - Array with the query types that will be
 * executed - "conferenceRooms" | "user" | "room".
 * @returns {Promise} - The promise created by the request.
 */
export function searchDirectory( // eslint-disable-line max-params
        serviceUrl: string,
        jwt: string,
        text: string,
        queryTypes: Array<string> = [ 'conferenceRooms', 'user', 'room' ]
): Promise<void> {
    const queryTypesString = JSON.stringify(queryTypes);

    return new Promise((resolve, reject) => {
        $.getJSON(
                `${serviceUrl}?query=${encodeURIComponent(text)}&queryTypes=${
                    queryTypesString}&jwt=${jwt}`,
                resolve)
            .fail((jqxhr, textStatus, error) => reject(error));
    });
}
