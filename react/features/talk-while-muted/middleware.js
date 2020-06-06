// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { setAudioMuted } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import {
    hideNotification,
    showNotification
} from '../notifications';

import { setCurrentNotificationUid } from './actions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;
    const { conference } = action;

    if (action.type === CONFERENCE_JOINED) {
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
                const notification = showNotification({
                    titleKey: 'toolbar.talkWhileMutedPopup',
                    customActionNameKey: 'notify.unmute',
                    customActionHandler: () => dispatch(setAudioMuted(false))
                });

                dispatch(notification);

                // we store the last start muted notification id that we showed,
                // so we can hide it when unmuted mic is detected
                dispatch(setCurrentNotificationUid(notification.uid));
            });
    }

    return result;
});
