import { throttle } from 'lodash-es';

import MiddlewareRegistry from './MiddlewareRegistry';
import PersistenceRegistry from './PersistenceRegistry';
import { toState } from './functions';

/**
 * The delay in milliseconds that passes between the last state change and the
 * persisting of that state in the storage.
 */
const PERSIST_STATE_DELAY = 2000;

/**
 * A throttled function to avoid repetitive state persisting.
 */
const throttledPersistState = throttle(state => PersistenceRegistry.persistState(state), PERSIST_STATE_DELAY);

// Web only code.
// We need the <tt>if</tt> because it appears that on mobile the polyfill is not
// executed yet.
if (typeof window.addEventListener === 'function') {
    window.addEventListener('unload', () => {
        throttledPersistState.flush();
    });
}

/**
 * A master MiddleWare to selectively persist state. Please use the
 * {@link persisterconfig.json} to set which subtrees of the redux state should
 * be persisted.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const oldState = toState(store);
    const result = next(action);
    const newState = toState(store);

    oldState === newState || throttledPersistState(newState);

    return result;
});
