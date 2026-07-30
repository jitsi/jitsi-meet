import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { exitPiP } from './actions';
import './subscriber';

/**
 * Middleware that intercepts conference termination actions and exits active Picture-in-Picture mode.
 *
 * @param {Store} store - The Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        if (store.getState()['features/pip'].isPiPActive) {
            store.dispatch(exitPiP());
        }
    }

    return result;
});
