// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';

import { NOISY_AUDIO_INPUT_SOUND_ID } from './constants';
import { NOISY_AUDIO_INPUT_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        store.dispatch(registerSound(NOISY_AUDIO_INPUT_SOUND_ID, NOISY_AUDIO_INPUT_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        store.dispatch(unregisterSound(NOISY_AUDIO_INPUT_SOUND_ID));
        break;
    case CONFERENCE_JOINED: {
        const { dispatch } = store;
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.NOISY_MIC, () => {
                dispatch(playSound(NOISY_AUDIO_INPUT_SOUND_ID));
            });
        break;
    }
    }

    return result;
});
