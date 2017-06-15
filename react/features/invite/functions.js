declare var $: Function;

/**
 * Sends an ajax request for dial-out country codes.
 *
 * @param {string} text - text to search
 * @param {string} serviceUrl - the service to query
 * @param {string} jwt - the jwt token to pass to the search service
 * @returns {Function}
 */
export function searchPeople(text, serviceUrl, jwt) {
    const queryTypes = '["conferenceRooms","user","room"]';

    return $.getJSON(
            `${serviceUrl}?query=${text}&queryTypes${queryTypes}=&jwt=${jwt}`);
}
