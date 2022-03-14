// @flow

import { ReducerRegistry } from '../base/redux';

import {
    OPEN_POPOUT,
    CLOSE_POPOUT,
    SET_POPOUT_DISPLAY_MODE,
    SET_POPOUT_AVATAR,
} from './actionTypes';

// {
//   [participantId]: {
//       popout,
//       displayMode,
//       avatarHtml,
//   }
// }
const DEFAULT_STATE = {};

ReducerRegistry.register(
    'features/popout',
    (state = DEFAULT_STATE, action) => {
        switch (action.type) {
            case OPEN_POPOUT: {
                const participantId = action.participantId;
                const previousPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [participantId]: {
                        ...previousPopoutState,
                        popout: action.popout
                    }
                }
            }
            case CLOSE_POPOUT: {
                const participantId = action.participantId;
                const previousPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [action.participantId]: {
                        ...previousPopoutState,
                        popout: null
                    }
                };
            }
            case SET_POPOUT_DISPLAY_MODE: {
                const participantId = action.participantId;
                const previousPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [participantId]: {
                        ...previousPopoutState,
                        displayMode: action.displayMode
                    }
                }
            }
            case SET_POPOUT_AVATAR: {
                const participantId = action.participantId;
                const previousPopoutState = state[participantId] || {};
                return {
                    ...state,
                    [participantId]: {
                        ...previousPopoutState,
                        avatarHtml: action.avatarHtml
                    }
                }
            }
            default: return state;
        }
    }
);
