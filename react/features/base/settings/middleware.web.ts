import { IStore } from '../../app/types';
import { PREJOIN_INITIALIZED } from '../../prejoin/actionTypes';
import { setPrejoinPageVisibility } from '../../prejoin/actions';
import { APP_WILL_MOUNT } from '../app/actionTypes';
import { getJwtName } from '../jwt/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { updateSettings } from './actions';

import './middleware.any';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        _initializeShowPrejoin(store);
        break;
    case PREJOIN_INITIALIZED:
        _maybeUpdateDisplayName(store);
        break;
    }

    return result;
});

/**
 * Overwrites the showPrejoin flag based on cached used selection for showing prejoin screen.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _initializeShowPrejoin({ dispatch, getState }: IStore) {
    const { userSelectedSkipPrejoin } = getState()['features/base/settings'];

    if (userSelectedSkipPrejoin) {
        dispatch(setPrejoinPageVisibility(false));
    }
}

/**
 * Updates the display name to the one in JWT if there is one.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _maybeUpdateDisplayName({ dispatch, getState }: IStore) {
    const state = getState();
    const hasJwt = Boolean(state['features/base/jwt'].jwt);

    if (hasJwt) {
        const displayName = getJwtName(state);

        if (displayName) {
            dispatch(updateSettings({
                displayName
            }));
        }
    }
}
