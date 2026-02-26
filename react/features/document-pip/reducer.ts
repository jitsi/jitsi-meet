import ReducerRegistry from "../base/redux/ReducerRegistry";

import { SET_DOCUMENT_PIP_ACTIVE } from "./actionTypes";

/**
 * The default state for the document-pip feature.
 */
const DEFAULT_STATE = {
    isActive: false,
};

export interface IDocumentPipState {
    isActive: boolean;
}

/**
 * Reduces the Redux actions of the document-pip feature.
 */
ReducerRegistry.register<IDocumentPipState>(
    "features/document-pip",
    (state = DEFAULT_STATE, action): IDocumentPipState => {
        switch (action.type) {
            case SET_DOCUMENT_PIP_ACTIVE:
                return {
                    ...state,
                    isActive: action.isActive,
                };

            default:
                return state;
        }
    },
);
