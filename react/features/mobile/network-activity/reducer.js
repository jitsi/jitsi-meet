// @flow

import { ReducerRegistry, set } from '../../base/redux';

import {
    _ADD_NETWORK_REQUEST,
    _REMOVE_ALL_NETWORK_REQUESTS,
    _REMOVE_NETWORK_REQUEST
} from './actionTypes';

/**
 * The default/initial redux state of the feature network-activity.
 *
 * @type {{
 *     requests: Map
 * }}
 */
const DEFAULT_STATE = {
    /**
     * The ongoing network requests i.e. the network request which have been
     * added to the redux store/state and have not been removed.
     *
     * @type {Map}
     */
    requests: new Map()
};

ReducerRegistry.register(
    'features/network-activity',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case _ADD_NETWORK_REQUEST: {
            const {
                type, // eslint-disable-line no-unused-vars

                request: key,
                ...value
            } = action;
            const requests = new Map(state.requests);

            requests.set(key, value);

            return set(state, 'requests', requests);
        }

        case _REMOVE_ALL_NETWORK_REQUESTS:
            return set(state, 'requests', DEFAULT_STATE.requests);

        case _REMOVE_NETWORK_REQUEST: {
            const { request: key } = action;
            const requests = new Map(state.requests);

            requests.delete(key);

            return set(state, 'requests', requests);
        }
        }

        return state;
    });
