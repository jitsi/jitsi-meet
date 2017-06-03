import {
    CONNECTION_ESTABLISHED,
    getURLWithoutParams
} from '../base/connection';
import { MiddlewareRegistry } from '../base/redux';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONNECTION_ESTABLISHED:
        return _connectionEstablished(store, next, action);
    }

    return next(action);
});

/**
 * Notifies the feature app that the action {@link CONNECTION_ESTABLISHED} is
 * being dispatched within a specific Redux {@code store}.
 *
 * @param {Store} store - The Redux store in which the specified {@code action}
 * is being dispatched.
 * @param {Dispatch} next - The Redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The Redux action {@code CONNECTION_ESTABLISHED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The new state that is the result of the reduction of the
 * specified {@code action}.
 */
function _connectionEstablished(store, next, action) {
    const result = next(action);

    // In the Web app we explicitly do not want to display the hash and
    // query/search URL params. Unfortunately, window.location and, more
    // importantly, its params are used not only in jitsi-meet but also in
    // lib-jitsi-meet. Consequenlty, the time to remove the params is
    // determined by when no one needs them anymore.
    const { history, location } = window;

    if (history
            && location
            && history.length
            && typeof history.replaceState === 'function') {
        const replacement = getURLWithoutParams(location);

        if (location !== replacement) {
            history.replaceState(
                history.state,
                (document && document.title) || '',
                replacement);
        }
    }

    return result;
}
