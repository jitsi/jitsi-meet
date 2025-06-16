import { IStore } from '../../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app/actionTypes';
import { CONFERENCE_JOINED } from '../conference/actionTypes';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { clientResized } from './actions';

/**
 * Dimensions change handler.
 */
let handler: undefined | ((this: Window, ev: UIEvent) => any);

/**
 * Middleware that handles window dimension changes.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_UNMOUNT: {
        _appWillUnmount();
        break;
    }
    case APP_WILL_MOUNT:
        _appWillMount(store);
        break;

    case CONFERENCE_JOINED: {
        const { clientHeight = 0, clientWidth = 0 } = store.getState()['features/base/responsive-ui'];

        if (!clientHeight && !clientWidth) {
            const {
                innerHeight,
                innerWidth
            } = window;

            store.dispatch(clientResized(innerWidth, innerHeight));
        }
        break;
    }
    }

    return result;
});

/**
 * Notifies this feature that the action {@link APP_WILL_MOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @param {Store} store - The redux store in which the specified {@code action}
 * is being dispatched.
 * @private
 * @returns {void}
 */
function _appWillMount(store: IStore) {
    handler = () => {
        const {
            innerHeight,
            innerWidth
        } = window;

        store.dispatch(clientResized(innerWidth, innerHeight));
    };

    window.addEventListener('resize', handler);
}

/**
 * Notifies this feature that the action {@link APP_WILL_UNMOUNT} is being
 * dispatched within a specific redux {@code store}.
 *
 * @private
 * @returns {void}
 */
function _appWillUnmount() {
    handler && window.removeEventListener('resize', handler);

    handler = undefined;
}
