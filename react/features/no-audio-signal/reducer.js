// @flow

import { ReducerRegistry, set } from '../base/redux';

import { SET_NO_AUDIO_SIGNAL_NOTIFICATION_UID } from './actionTypes';

/**
 * Reduces the redux actions of the feature no audio signal.
 */
ReducerRegistry.register('features/no-audio-signal', (state = {}, action) => {
    switch (action.type) {
    case SET_NO_AUDIO_SIGNAL_NOTIFICATION_UID:
        return set(state, 'noAudioSignalNotificationUid', action.uid);
    }

    return state;
});
