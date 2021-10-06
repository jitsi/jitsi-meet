const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Manages a queue of functions where the current function in progress will
 * automatically execute the next queued function.
 */
export class TaskQueue {
    /**
     * Creates a new instance of {@link TaskQueue} and sets initial instance
     * variable values.
     */
    constructor() {
        this._queue = [];
        this._currentTask = null;

        this._onTaskComplete = this._onTaskComplete.bind(this);
    }

    /**
     * Adds a new function to the queue. It will be immediately invoked if no
     * other functions are queued.
     *
     * @param {Function} taskFunction - The function to be queued for execution.
     * @private
     * @returns {void}
     */
    enqueue(taskFunction) {
        this._queue.push(taskFunction);
        this._executeNext();
    }

    /**
     * If no queued task is currently executing, invokes the first task in the
     * queue if any.
     *
     * @private
     * @returns {void}
     */
    _executeNext() {
        if (this._currentTask) {
            logger.warn('Task queued while a task is in progress.');

            return;
        }

        this._currentTask = this._queue.shift() || null;

        if (this._currentTask) {
            logger.debug('Executing a task.');

            try {
                this._currentTask(this._onTaskComplete);
            } catch (error) {
                logger.error(`Task execution failed: ${error}`);
                this._onTaskComplete();
            }
        }
    }

    /**
     * Prepares to invoke the next function in the queue.
     *
     * @private
     * @returns {void}
     */
    _onTaskComplete() {
        this._currentTask = null;
        logger.debug('Task completed.');
        this._executeNext();
    }
}
