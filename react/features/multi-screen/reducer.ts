import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_MULTI_SCREEN_ACTIVE, SET_SECONDARY_LAYOUT } from './actionTypes';
import { SECONDARY_LAYOUTS, SecondaryLayout } from './constants';

/**
 * The Redux state shape for the multi-screen feature.
 */
export interface IMultiScreenState {

    /**
     * Whether the secondary window is currently open and active.
     */
    isActive: boolean;

    /**
     * The current layout mode of the secondary window.
     * One of the values from SECONDARY_LAYOUTS.
     */
    secondaryLayout: SecondaryLayout;
}

/**
 * The default state for the multi-screen feature.
 */
const DEFAULT_STATE: IMultiScreenState = {
    isActive: false,
    secondaryLayout: SECONDARY_LAYOUTS.GALLERY
};

/**
 * Reduces the Redux actions of the multi-screen feature.
 */
ReducerRegistry.register<IMultiScreenState>(
    'features/multi-screen',
    (state = DEFAULT_STATE, action): IMultiScreenState => {
        switch (action.type) {
        case SET_MULTI_SCREEN_ACTIVE:
            return {
                ...state,
                isActive: action.isActive
            };

        case SET_SECONDARY_LAYOUT:
            return {
                ...state,
                secondaryLayout: action.layout
            };

        default:
            return state;
        }
    }
);
