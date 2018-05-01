// @flow

import { assign, ReducerRegistry } from '../base/redux';

import {
    _SET_EMITTER_SUBSCRIPTIONS,
    UPDATE_DIAL_IN_NUMBERS_FAILED,
    UPDATE_DIAL_IN_NUMBERS_SUCCESS
} from './actionTypes';

const DEFAULT_STATE = {
    numbersEnabled: true
};

ReducerRegistry.register('features/invite', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case _SET_EMITTER_SUBSCRIPTIONS:
        return (
            assign(state, 'emitterSubscriptions', action.emitterSubscriptions));

    case UPDATE_DIAL_IN_NUMBERS_FAILED:
        return {
            ...state,
            error: action.error
        };

    case UPDATE_DIAL_IN_NUMBERS_SUCCESS: {
        const {
            defaultCountry,
            numbers,
            numbersEnabled
        } = action.dialInNumbers;

        return {
            ...state,
            conferenceID: action.conferenceID,
            defaultCountry,
            numbers,
            numbersEnabled
        };
    }
    }

    return state;
});
