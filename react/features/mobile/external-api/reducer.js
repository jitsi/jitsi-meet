// @flow

import { ReducerRegistry } from '../../base/redux';

import { SCREEN_SHARE_PARTICIPANTS_UPDATED } from './actionTypes';

const DEFAULT_STATE = {
    screenShares: []
};

ReducerRegistry.register('features/mobile/external-api', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SCREEN_SHARE_PARTICIPANTS_UPDATED: {
        return {
            ...state,
            screenShares: action.participantIds
        };
    }
    }

    return state;
});
