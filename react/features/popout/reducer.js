// @flow

import { ReducerRegistry } from '../base/redux';

import {
    OPEN_POPOUT,
    CLOSE_POPOUT,
    SET_POPOUT_DISPLAY_MODE,
} from './actionTypes';

// {
//   [participantId]: {
//       popoutOpen: boolean,
//       displayMode: DISPLAY_VIDEO | DISPLAY_AVATAR,
//   }
// }
const DEFAULT_STATE = {};

ReducerRegistry.register(
    'features/popout',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
            case OPEN_POPOUT: {
                const participantId = action.participantId;
                const currentPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [participantId]: {
                        ...currentPopoutState,
                        popoutOpen: true
                    }
                }
            }
            case CLOSE_POPOUT: {
                const participantId = action.participantId;
                const currentPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [action.participantId]: {
                        ...currentPopoutState,
                        popoutOpen: false
                    }
                };
            }
            case SET_POPOUT_DISPLAY_MODE: {
                const participantId = action.participantId;
                const currentPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [participantId]: {
                        ...currentPopoutState,
                        displayMode: action.displayMode
                    }
                }
            }
            default: return state;
        }
    }
);
