import { ReducerRegistry } from '../base/redux';

import {
    ENABLE_JANE_WAITING_AREA_PAGE
} from './actionTypes';

const DEFAULT_STATE = {
    enableJaneWaitingAreaPage: false
};

ReducerRegistry.register(
    'features/jane-waiting-area-native', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ENABLE_JANE_WAITING_AREA_PAGE:
            return {
                ...state,
                enableJaneWaitingAreaPage: action.enableJaneWaitingAreaPage
            };

        default:
            return state;
        }
    }
);

