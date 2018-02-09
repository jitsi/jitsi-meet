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

                    // FIXME Push the latest reaction at the top because I'm
                    // currently rendering only the first reaction.
                    action.reaction,
                    ...state.receivedReactions
                ]
            };
        }

        return state;
    });
