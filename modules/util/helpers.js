import { TaskQueue } from './TaskQueue';

/**
 * Creates a deferred object whose promise can be resolved or rejected by the caller.
 *
 * @returns {{promise: Promise<*>, resolve: function(*=): void, reject: function(*=): void}}
 *     The promise and its corresponding resolve and reject functions.
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
 * Creates a task queue.
 *
 * @returns {TaskQueue} A new task queue instance.
 */
export function createTaskQueue() {
    return new TaskQueue();
}
