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
    // The pending state is persisted on pagehide and not on unload. Browsers are removing the unload event (Chrome
    // no longer fires it by default), so a change made right before the page goes away would otherwise be lost.
    window.addEventListener('pagehide', () => {
        throttledPersistState.flush();
    });

    // A hidden page can be discarded without a pagehide, which is common on mobile once the browser is in the
    // background. Its timers are suspended as well, so the throttled write would not run either.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            throttledPersistState.flush();
        }
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
