import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_DOCUMENT_EDITING_STATUS, SET_DOCUMENT_URL } from './actionTypes';

const DEFAULT_STATE = {

    /**
     * URL for the shared document.
     */
    documentUrl: undefined,

    /**
     * Whether or not Etherpad is currently open.
     *
     * @public
     * @type {boolean}
     */
    editing: false
};

export interface IEtherpadState {
    documentUrl?: string;
    editing: boolean;
}

/**
 * Reduces the Redux actions of the feature features/etherpad.
 */
ReducerRegistry.register<IEtherpadState>(
    'features/etherpad',
    (state = DEFAULT_STATE, action): IEtherpadState => {
        switch (action.type) {
        case SET_DOCUMENT_EDITING_STATUS:
            return {
                ...state,
                editing: action.editing
            };

        case SET_DOCUMENT_URL:
            return {
                ...state,
                documentUrl: action.documentUrl
            };

        default:
            return state;
        }
    });
