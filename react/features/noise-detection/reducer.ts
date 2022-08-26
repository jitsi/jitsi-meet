import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import { SET_NOISY_AUDIO_INPUT_NOTIFICATION_UID } from './actionTypes';

export interface INoiseDetectionState {
    noisyAudioInputNotificationUid?: number;
}

/**
 * Reduces the redux actions of noise detection feature.
 */
ReducerRegistry.register('features/noise-detection', (state: INoiseDetectionState = {}, action) => {
    switch (action.type) {
    case SET_NOISY_AUDIO_INPUT_NOTIFICATION_UID:
        return set(state, 'noisyAudioInputNotificationUid', action.uid);
    }

    return state;
});
