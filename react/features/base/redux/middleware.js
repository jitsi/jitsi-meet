// @flow

import _ from 'lodash';

import { toState } from './functions';
import MiddlewareRegistry from './MiddlewareRegistry';
import PersistencyRegistry from './PersistencyRegistry';

/**
 * The delay that passes between the last state change and the persisting of
 * that state in the storage.
 */
const PERSIST_STATE_DELAY = 2000;

/**
 * A throttled function to avoid repetitive state persisting.
 */
const throttledPersistState
    = _.throttle(
        state => PersistencyRegistry.persistState(state),
        PERSIST_STATE_DELAY);

/**
 * A master MiddleWare to selectively persist state. Please use the
 * {@link persisterconfig.json} to set which subtrees of the Redux state should
 * be persisted.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    throttledPersistState(toState(store));

    return result;
});
