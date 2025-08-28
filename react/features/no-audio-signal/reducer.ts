import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import { SET_NO_AUDIO_SIGNAL_NOTIFICATION_UID } from './actionTypes';

export interface INoAudioSignalState {
    noAudioSignalNotificationUid?: string;
}

/**
 * Reduces the redux actions of the feature no audio signal.
 */
ReducerRegistry.register<INoAudioSignalState>('features/no-audio-signal', (state = {}, action): INoAudioSignalState => {
    switch (action.type) {
    case SET_NO_AUDIO_SIGNAL_NOTIFICATION_UID:
        return set(state, 'noAudioSignalNotificationUid', action.uid);
    }

    return state;
});
