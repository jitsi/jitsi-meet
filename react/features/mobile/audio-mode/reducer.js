// @flow

import { equals, set, ReducerRegistry } from '../../base/redux';

import { _SET_AUDIOMODE_DEVICES, _SET_AUDIOMODE_SUBSCRIPTIONS } from './actionTypes';

const DEFAULT_STATE = {
    devices: [],
    subscriptions: []
};

ReducerRegistry.register('features/mobile/audio-mode', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case _SET_AUDIOMODE_DEVICES: {
        const { devices } = action;

        if (equals(state.devices, devices)) {
            return state;
        }

        return set(state, 'devices', devices);
    }
    case _SET_AUDIOMODE_SUBSCRIPTIONS:
        return set(state, 'subscriptions', action.subscriptions);
    }

    return state;
});
