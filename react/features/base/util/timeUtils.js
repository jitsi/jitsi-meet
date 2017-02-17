/**
 * Counts how many whole hours are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get hours from.
 * @returns {number}
 */
export function getHoursCount(milliseconds) {
    return Math.floor(milliseconds / (60 * 60 * 1000));
}

/**
 * Counts how many whole minutes are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get minutes from.
 * @returns {number}
 */
export function getMinutesCount(milliseconds) {
    return Math.floor(milliseconds / (60 * 1000) % 60);
}

/**
 * Counts how many whole seconds are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get seconds from.
 * @returns {number}
 */
export function getSecondsCount(milliseconds) {
    return Math.floor(milliseconds / 1000 % 60);
}
