// @flow

import { ReducerRegistry } from '../base/redux';

import { ADD_RECEIVED_REACTION } from './actionTypes';

const _INITIAL_STATE = {
    receivedReactions: []
};

ReducerRegistry.register(
    'features/reactions', (state = _INITIAL_STATE, action) => {
        switch (action.type) {
        case ADD_RECEIVED_REACTION:
            return {
                ...state,
                receivedReactions: [
                    ...state.receivedReactions,
                    {
                        reaction: action.reaction,
                        uuid: action.uuid
                    }
                ]
            };
        }

        return state;
    });
