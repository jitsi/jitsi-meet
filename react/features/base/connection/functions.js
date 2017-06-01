/* @flow */

/**
 * Retrieves a simplified version of the conference/location URL stripped of URL
 * params (i.e. query/search and hash) which should be used for sending invites.
 *
 * @param {Function|Object} stateOrGetState - The redux state or redux's
 * {@code getState} function.
 * @returns {string|undefined}
 */
export function getInviteURL(stateOrGetState: Function | Object): ?string {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;
    const { locationURL } = state['features/base/connection'];
    let inviteURL;

    if (locationURL) {
        inviteURL = getURLWithoutParams(locationURL).href;
    }

    return inviteURL;
}

/**
 * Gets a {@link URL} without hash and query/search params from a specific
 * {@code URL}.
 *
 * @param {URL} url - The {@code URL} which may have hash and query/search
 * params.
 * @returns {URL}
 */
export function getURLWithoutParams(url: URL): URL {
    const { hash, search } = url;

    if ((hash && hash.length > 1) || (search && search.length > 1)) {
        // eslint-disable-next-line no-param-reassign
        url = new URL(url.href);
        url.hash = '';
        url.search = '';
    }

    return url;
}
