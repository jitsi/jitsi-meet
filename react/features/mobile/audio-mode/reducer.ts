import ReducerRegistry from '../../base/redux/ReducerRegistry';
import { equals, set } from '../../base/redux/functions';

import { _SET_AUDIOMODE_DEVICES, _SET_AUDIOMODE_SUBSCRIPTIONS } from './actionTypes';
import { IRawDevice } from './components/AudioRoutePickerDialog';

export interface IMobileAudioModeState {
    devices: IRawDevice[];
    subscriptions: {
        remove: Function;
    }[];
}

const DEFAULT_STATE = {
    devices: [],
    subscriptions: []
};

ReducerRegistry.register<IMobileAudioModeState>('features/mobile/audio-mode',
(state = DEFAULT_STATE, action): IMobileAudioModeState => {
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
