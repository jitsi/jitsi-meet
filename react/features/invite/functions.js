declare var $: Function;

/**
 * Sends an ajax request for dial-out country codes.
 *
 * @returns {Function}
 */
export function searchPeople(text, serviceUrl) {
    console.log('==============', `${serviceUrl}?name=${text}`);

    return $.getJSON(`${serviceUrl}?name=${text}`);
}
