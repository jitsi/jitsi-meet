import { ReducerRegistry } from '../base/redux';

import {
    ENABLE_PREJOIN_PAGE, INIT_WEB_SOCKET, DISCONNECT_WEB_SOCKET
} from './actionTypes';

const DEFAULT_STATE = {
    enablePreJoinPage: false,
    socket: null,
    showPrejoin: false
};

ReducerRegistry.register(
    'features/jane-waiting-area-native', (state = DEFAULT_STATE, action) => {
        switch (action.type) {
        case ENABLE_PREJOIN_PAGE:
            return {
                ...state,
                enablePreJoinPage: action.enablePreJoinPage
            };

        case INIT_WEB_SOCKET:
            return {
                ...state,
                socket: action.socket
            };

        case DISCONNECT_WEB_SOCKET:
            return {
                ...state,
                socket: null
            };

        default:
            return state;
        }
    }
);

