/**
 * Returns a new {@code Promise} which settles when a specific {@code Promise}
 * settles and is automatically rejected if the specified {@code Promise}
 * doesn't settle within a specific time interval.
 *
 * @param {Promise} promise - The {@code Promise} for which automatic rejecting
 * after the specified timeout is to be implemented.
 * @param {number} timeout - The number of milliseconds to wait the specified
 * {@code promise} to settle before automatically rejecting the returned
 * {@code Promise}.
 * @returns {Promise} - A new {@code Promise} which settles when the specified
 * {@code promise} settles and is automatically rejected after {@code timeout}
 * milliseconds.
 */
export function timeoutPromise<T>(
        promise: Promise<T>,
        timeout: number
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutID
            = setTimeout(() => reject(new Error('timeout')), timeout);

        promise.then(
            /* onFulfilled */ value => {
                resolve(value);
                clearTimeout(timeoutID);
            },
            /* onRejected */ reason => {
                reject(reason);
                clearTimeout(timeoutID);
            }
        );
    });
}
