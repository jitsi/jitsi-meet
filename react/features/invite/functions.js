declare var $: Function;

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
export function searchPeople(// eslint-disable-line max-params
    serviceUrl,
    jwt,
    text,
    queryTypes = [ 'conferenceRooms', 'user', 'room' ]
) {
    const queryTypesString = JSON.stringify(queryTypes);

    return new Promise((resolve, reject) => {
        $.getJSON(`${serviceUrl}?query=${encodeURIComponent(text)}`
            + `&queryTypes=${queryTypesString}&jwt=${jwt}`,
        response => resolve(response)
        ).fail((jqxhr, textStatus, error) =>
            reject(error)
        );
    });
}

/**
 * Sends a post request to an invite service.
 *
 * @param {string} inviteServiceUrl - The invite service that generates the
 * invitation.
 * @param {string} inviteUrl - The url to the conference.
 * @param {string} jwt - The jwt token to pass to the search service.
 * @param {Immutable.List} people - The list of the "user" type items to invite.
 * @returns {Promise} - The promise created by the request.
 */
export function invitePeople(inviteServiceUrl, inviteUrl, jwt, people) { // eslint-disable-line max-params, max-len
    return new Promise((resolve, reject) => {
        $.post(`${inviteServiceUrl}?token=${jwt}`,
            JSON.stringify({
                'invited': people,
                'url': inviteUrl }),
            response => resolve(response),
            'json')
            .fail((jqxhr, textStatus, error) =>
                reject(error)
            );
    });
}

/**
 * Invites room participants to the conference through the SIP Jibri service.
 *
 * @param {JitsiMeetConference} conference - The conference to which the rooms
 * will be invited to.
 * @param {Immutable.List} rooms - The list of the "videosipgw" type items to
 * invite.
 * @returns {void}
 */
export function inviteRooms(conference, rooms) {
    for (const room of rooms) {
        const sipAddress = room.id;
        const displayName = room.name;

        if (sipAddress && displayName) {
            const newSession
                = conference.createVideoSIPGWSession(sipAddress, displayName);

            newSession.start();
        } else {
            console.error(
                `No display name or sip number for ${JSON.stringify(room)}`);
        }
    }
}
