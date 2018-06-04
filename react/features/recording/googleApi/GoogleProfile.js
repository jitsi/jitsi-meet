// @flow

/**
 * An object meant to mimic the Google JS API Client's profile object. Holds
 * profile data retrieved from the Google API and exposes getters.
 */
export default class GoogleProfile {
    data: Object;

    /**
     * Creates a new {@code GoogleProfile} instance.
     *
     * @param {Object} data - The profile data a request for Google user data.
     * @returns {void}
     */
    constructor(data: Object = {}) {
        this.data = data;
    }

    /**
     * Returns the profile's email.
     *
     * @returns {string}
     */
    getEmail() {
        return this.data.email;
    }
}
