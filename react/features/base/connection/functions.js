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
        const { host, pathname, protocol } = locationURL;

        inviteURL = `${protocol}//${host}${pathname}`;
    }

    return inviteURL;
}
