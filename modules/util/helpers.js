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

/**
 * Downloads a JSON object.
 *
 * @param json the JSON object to download.
 * @param filename the filename to give to the downloaded file.
 */
export function downloadJSON(json, filename) {
    const data = encodeURIComponent(JSON.stringify(json, null, '  '));

    const elem = document.createElement('a');

    elem.download = filename;
    elem.href = `data:application/json;charset=utf-8,\n${data}`;
    elem.dataset.downloadurl = [ 'text/json', elem.download, elem.href ].join(':');
    elem.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: false
    }));
}
