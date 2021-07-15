// @flow

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { setAudioMuted } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import {
    hideNotification,
    showNotification
} from '../notifications';

import { setCurrentNotificationUid } from './actions';
import { TALK_WHILE_MUTED_SOUND_ID } from './constants';
import { TALK_WHILE_MUTED_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;
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
            JitsiConferenceEvents.TRACK_MUTE_CHANGED,
            track => {
                const { currentNotificationUid } = getState()['features/talk-while-muted'];

                if (currentNotificationUid && track.isAudioTrack() && track.isLocal() && !track.isMuted()) {
                    dispatch(hideNotification(currentNotificationUid));
                    dispatch(setCurrentNotificationUid());
                }
            });
        conference.on(
            JitsiConferenceEvents.TALK_WHILE_MUTED, async () => {
                const notification = await dispatch(showNotification({
                    titleKey: 'toolbar.talkWhileMutedPopup',
                    customActionNameKey: 'notify.unmute',
                    customActionHandler: () => dispatch(setAudioMuted(false))
                }));

                const { soundsTalkWhileMuted } = getState()['features/base/settings'];

                if (soundsTalkWhileMuted) {
                    dispatch(playSound(TALK_WHILE_MUTED_SOUND_ID));
                }


                if (notification) {
                    // we store the last start muted notification id that we showed,
                    // so we can hide it when unmuted mic is detected
                    dispatch(setCurrentNotificationUid(notification.uid));
                }
            });
        break;
    }
    }

    return result;
});
