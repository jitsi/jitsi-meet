import ReducerRegistry from '../../base/redux/ReducerRegistry';
import { equals, set } from '../../base/redux/functions';

import { _SET_AUDIOMODE_DEVICES, _SET_AUDIOMODE_SUBSCRIPTIONS } from './actionTypes';

export interface IMobileAudioModeState {
    devices: Object[];
    subscriptions: Object[];
}

const DEFAULT_STATE = {
    devices: [],
    subscriptions: []
};

ReducerRegistry.register('features/mobile/audio-mode', (state: IMobileAudioModeState = DEFAULT_STATE, action) => {
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
