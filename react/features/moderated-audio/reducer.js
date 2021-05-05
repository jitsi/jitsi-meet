/* @flow */

import { ReducerRegistry } from '../base/redux';

import { REDUCER_KEY,
    ADD_MODERATED_AUDIO_EXCEPTION_FINISH,
    DISABLE_MODERATED_AUDIO_FINISH,
    ENABLE_MODERATED_AUDIO_FINISH,
    REMOVE_MODERATED_AUDIO_EXCEPTION_FINISH
} from './constants';


const initialState = {
    isEnabled: null,
    exceptions: Object.create(null)
};

ReducerRegistry.register(REDUCER_KEY, (state = initialState, action) => {
    const { payload, type } = action;

    switch (type) {
    case ADD_MODERATED_AUDIO_EXCEPTION_FINISH: {
        const { participantId } = payload;

        return {
            ...state,
            exceptions: Object.assign(
          Object.create(null),
          state.exceptions, {
              [participantId]: true
          }
            )
        };
    }

    case DISABLE_MODERATED_AUDIO_FINISH:
        return {
            ...state,
            isEnabled: false
        };

    case ENABLE_MODERATED_AUDIO_FINISH:
        return {
            ...state,
            isEnabled: true
        };

    case REMOVE_MODERATED_AUDIO_EXCEPTION_FINISH: {
        const { participantId } = payload;
        // eslint-disable-next-line no-unused-vars
        const { [participantId]: omitted, ...rest } = state.exceptions;

        return {
            ...state,
            exceptions: Object.assign(
          Object.create(null),
          rest
            )
        };
    }

    default:
        return state;
    }
});
