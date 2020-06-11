// @flow

import { CONFERENCE_JOINED } from '../base/conference';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { hideNotification, showNotification } from '../notifications';

import { setNoisyAudioInputNotificationUid } from './actions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    if (action.type === CONFERENCE_JOINED) {
        const { dispatch, getState } = store;
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.TRACK_MUTE_CHANGED,
            track => {
                const { noisyAudioInputNotificationUid } = getState()['features/noise-detection'];

                // Hide the notification in case the user mutes the microphone
                if (noisyAudioInputNotificationUid && track.isAudioTrack() && track.isLocal() && track.isMuted()) {
                    dispatch(hideNotification(noisyAudioInputNotificationUid));
                    dispatch(setNoisyAudioInputNotificationUid());
                }
            });
        conference.on(
            JitsiConferenceEvents.NOISY_MIC, () => {
                const notification = showNotification({
                    titleKey: 'toolbar.noisyAudioInputTitle',
                    descriptionKey: 'toolbar.noisyAudioInputDesc'
                });

                dispatch(notification);

                // we store the last notification id so we can hide it if the mic is muted
                dispatch(setNoisyAudioInputNotificationUid(notification.uid));
            });
    }

    return result;
});
