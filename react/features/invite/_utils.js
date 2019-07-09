// @flow

/**
 * Utility class with no dependencies. Used in components that are stripped in separate bundles
 * and requires as less dependencies as possible.
 */

/**
 * Formats the conference pin in readable way for UI to display it.
 * Formats the pin in 3 groups of digits:
 * XXXX XXXX XX or XXXXX XXXXX XXX.
 * The length of first and second group is Math.ceil(pin.length / 3).
 *
 * @param {Object} conferenceID - The conference id to format, string or number.
 * @returns {string} - The formatted conference pin.
 * @private
 */
export function _formatConferenceIDPin(conferenceID: Object) {
    const conferenceIDStr = conferenceID.toString();

    // let's split the conferenceID in 3 parts, to be easier to read
    const partLen = Math.ceil(conferenceIDStr.length / 3);

    return `${
        conferenceIDStr.substring(0, partLen)} ${
        conferenceIDStr.substring(partLen, 2 * partLen)} ${
        conferenceIDStr.substring(2 * partLen, conferenceIDStr.length)}`;
}
