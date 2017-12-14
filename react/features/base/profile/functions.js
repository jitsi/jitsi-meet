/* @flow */

/**
 * Retreives the current profile settings from redux store. The profile
 * is persisted to localStorage so it's a good candidate to store settings
 * in it.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
export function getProfile(state: Object) {
    const profileStateSlice = state['features/base/profile'];

    return profileStateSlice ? profileStateSlice.profile || {} : {};
}
