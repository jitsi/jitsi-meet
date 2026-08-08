import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    SET_EMBEDDED_DOCUMENT_PIP_AVAILABLE,
    SET_PIP_ACTIVE
} from './actionTypes';

/**
 * The default state for the pip feature.
 */
const DEFAULT_STATE = {
    isPiPActive: false
};

export interface IPipState {
    embeddedDocumentPiPAvailable?: boolean;
    isPiPActive: boolean;
}

/**
 * Reduces the Redux actions of the pip feature.
 */
ReducerRegistry.register<IPipState>('features/pip', (state = DEFAULT_STATE, action): IPipState => {
    switch (action.type) {
    case SET_EMBEDDED_DOCUMENT_PIP_AVAILABLE:
        return {
            ...state,
            embeddedDocumentPiPAvailable: action.available
        };
    case SET_PIP_ACTIVE:
        return {
            ...state,
            isPiPActive: action.isPiPActive
        };

    default:
        return state;
    }
});
