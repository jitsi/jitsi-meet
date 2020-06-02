// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';

import { TALK_WHILE_MUTED_SOUND_ID } from './constants';
import { TALK_WHILE_MUTED_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch } = store;
    const { conference } = action;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(TALK_WHILE_MUTED_SOUND_ID, TALK_WHILE_MUTED_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(TALK_WHILE_MUTED_SOUND_ID));
        break;

    case CONFERENCE_JOINED: {
        conference.on(
            JitsiConferenceEvents.TALK_WHILE_MUTED, () => {
                dispatch(playSound(TALK_WHILE_MUTED_SOUND_ID));
            });
        break;
    }
    }

    return result;
});
