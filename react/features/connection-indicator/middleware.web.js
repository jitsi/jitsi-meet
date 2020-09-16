// @flow

import { MiddlewareRegistry } from '../base/redux';

import { CONNECTION_INDICATOR_SAVE_LOGS } from './actionTypes';

/**
 * Implements the middleware of the feature connection-indicator.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    // FIXME duplicate code with conference.saveLogs()
    switch (action.type) {
    case CONNECTION_INDICATOR_SAVE_LOGS: {
        // this can be called from console and will not have reference to this
        // that's why we reference the global var
        const logs = store.getState()['features/base/connection'].connection.getLogs();
        const data = encodeURIComponent(JSON.stringify(logs, null, '  '));

        const elem = document.createElement('a');

        elem.download = 'meet.json';
        elem.href = `data:application/json;charset=utf-8,\n${data}`;
        elem.dataset.downloadurl = [ 'text/json', elem.download, elem.href ].join(':');
        elem.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
        }));
    }
    }

    return next(action);
});
