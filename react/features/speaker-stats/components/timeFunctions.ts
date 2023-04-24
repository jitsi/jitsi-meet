/**
 * Counts how many whole hours are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get hours from.
 * @private
 * @returns {number}
 */
function getHoursCount(milliseconds: number) {
    return Math.floor(milliseconds / (60 * 60 * 1000));
}

/**
 * Counts how many whole minutes are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get minutes from.
 * @private
 * @returns {number}
 */
function getMinutesCount(milliseconds: number) {
    return Math.floor(milliseconds / (60 * 1000) % 60);
}

/**
 * Counts how many whole seconds are included in the given time total.
 *
 * @param {number} milliseconds - The millisecond total to get seconds from.
 * @private
 * @returns {number}
 */
function getSecondsCount(milliseconds: number) {
    return Math.floor(milliseconds / 1000 % 60);
}

/**
 * Creates human readable localized time string.
 *
 * @param {number} time - Value in milliseconds.
 * @param {Function} t - Translate function.
 * @returns {string}
 */
export function createLocalizedTime(time: number, t: Function) {
    const hours = getHoursCount(time);
    const minutes = getMinutesCount(time);
    const seconds = getSecondsCount(time);
    const timeElapsed = [];

    if (hours) {
        const hourPassed
            = createTimeDisplay(hours, 'speakerStats.hours', t);

        timeElapsed.push(hourPassed);
    }

    if (hours || minutes) {
        const minutesPassed
            = createTimeDisplay(
            minutes,
            'speakerStats.minutes',
            t);

        timeElapsed.push(minutesPassed);
    }

    const secondsPassed
        = createTimeDisplay(
        seconds,
        'speakerStats.seconds',
        t);

    timeElapsed.push(secondsPassed);

    return timeElapsed;
}

/**
 * Returns a string to display the passed in count and a count noun.
 *
 * @private
 * @param {number} count - The number used for display and to check for
 * count noun plurality.
 * @param {string} countNounKey - Translation key for the time's count noun.
 * @param {Function} t - What is being counted. Used as the element's
 * key for react to iterate upon.
 * @returns {string}
 */
function createTimeDisplay(count: number, countNounKey: string, t: Function) {
    return t(countNounKey, { count });
}
