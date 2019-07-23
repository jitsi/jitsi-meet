// @flow

import { setCurrentNotificationUid } from './actions';

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { setAudioMuted } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import {
    hideNotification,
    showNotification
} from '../notifications';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;
    const { conference } = action;

    switch (action.type) {
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
            JitsiConferenceEvents.TALK_WHILE_MUTED, () => {
                const notification = dispatch(showNotification({
                    titleKey: 'toolbar.talkWhileMutedPopup',
                    customActionNameKey: 'notify.unmute',
                    customActionHandler: () => dispatch(setAudioMuted(false))
                }));

                // we store the last start muted notification id that we showed,
                // so we can hide it when unmuted mic is detected
                dispatch(setCurrentNotificationUid(notification.uid));
            });
        break;
    }
    }

    return result;
});
