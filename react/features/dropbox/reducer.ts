import PersistenceRegistry from '../base/redux/PersistenceRegistry';
import ReducerRegistry from '../base/redux/ReducerRegistry';

import { UPDATE_DROPBOX_TOKEN } from './actionTypes';

/**
 * The redux subtree of this feature.
 */
const STORE_NAME = 'features/dropbox';

export interface IDropboxState {
    expireDate?: number;
    rToken?: string;
    token?: string;
}

/**
 * Sets up the persistence of the feature {@code dropbox}.
 */
PersistenceRegistry.register(STORE_NAME);

ReducerRegistry.register<IDropboxState>(STORE_NAME, (state = {}, action): IDropboxState => {
    switch (action.type) {
    case UPDATE_DROPBOX_TOKEN:
        return {
            ...state,
            token: action.token,
            rToken: action.rToken,
            expireDate: action.expireDate
        };
    default:
        return state;
    }
});
