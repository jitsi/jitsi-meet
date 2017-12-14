/* @flow */
import _ from 'lodash';

import { persistState } from './functions';
import MiddlewareRegistry from './MiddlewareRegistry';

import { toState } from '../redux';

/**
 * The delay that passes between the last state change and the state to be
 * persisted in the storage.
 */
const PERSIST_DELAY = 2000;

/**
 * A throttled function to avoid repetitive state persisting.
 */
const throttledFunc = _.throttle(state => {
    persistState(state);
}, PERSIST_DELAY);

/**
 * A master MiddleWare to selectively persist state. Please use the
 * {@link persisterconfig.json} to set which subtrees of the Redux state
 * should be persisted.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    throttledFunc(toState(store));

    return result;
});
