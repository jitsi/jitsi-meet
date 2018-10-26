import { TaskQueue } from './TaskQueue';

/**
 * Create deferred object.
 *
 * @returns {{promise, resolve, reject}}
 */
export function createDeferred() {
    const deferred = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
}

/**
 * Returns an instance of {@link TaskQueue}.
 *
 * @returns {Object}
 */
export function createTaskQueue() {
    return new TaskQueue();
}
