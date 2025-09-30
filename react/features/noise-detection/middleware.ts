import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import SoundService from '../base/sounds/components/SoundService';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { setNoisyAudioInputNotificationUid } from './actions';
import { NOISY_AUDIO_INPUT_SOUND_ID } from './constants';
import { NOISY_AUDIO_INPUT_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        SoundService.register(NOISY_AUDIO_INPUT_SOUND_ID, NOISY_AUDIO_INPUT_SOUND_FILE);
        break;
    case APP_WILL_UNMOUNT:
        SoundService.unregister(NOISY_AUDIO_INPUT_SOUND_ID);
        break;
    case CONFERENCE_JOINED: {
        const { dispatch, getState } = store;
        const { conference } = action;

        conference.on(
            JitsiConferenceEvents.TRACK_MUTE_CHANGED,
            (track: any) => {
                const { noisyAudioInputNotificationUid } = getState()['features/noise-detection'];

                // Hide the notification in case the user mutes the microphone
                if (noisyAudioInputNotificationUid && track.isAudioTrack() && track.isLocal() && track.isMuted()) {
                    dispatch(hideNotification(noisyAudioInputNotificationUid));
                    dispatch(setNoisyAudioInputNotificationUid());
                }
            });
        conference.on(
            JitsiConferenceEvents.NOISY_MIC, () => {
                const notification = dispatch(showNotification({
                    titleKey: 'toolbar.noisyAudioInputTitle',
                    descriptionKey: 'toolbar.noisyAudioInputDesc'
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));

                SoundService.play(NOISY_AUDIO_INPUT_SOUND_ID, getState());

                if (notification) {
                    // we store the last notification id so we can hide it if the mic is muted
                    dispatch(setNoisyAudioInputNotificationUid(notification.uid));
                }
            });
        break;
    }
    }

    return result;
});
