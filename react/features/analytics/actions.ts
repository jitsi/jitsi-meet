import { IStore } from '../app/types';
import { analytics } from '../base/lib-jitsi-meet';

import { SET_INITIAL_PERMANENT_PROPERTIES } from './actionTypes';

/**
 * Updates a permanentProperty.
 *
 * @param {Object} properties - An object with properties to be updated.
 * @returns {Function}
 */
export function setPermanentProperty(properties: Object) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { isInitialized = false } = getState()['features/analytics'];

        if (isInitialized) {
            analytics.addPermanentProperties(properties);
        } else {
            dispatch({
                type: SET_INITIAL_PERMANENT_PROPERTIES,
                properties
            });
        }
    };
}
