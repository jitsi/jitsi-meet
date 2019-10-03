// @flow
import { setNoAudioSignalNotificationUid } from './actions';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import {
    ACTIVE_DEVICE_DETECTED,
    ActiveDeviceDetector,
    filterAudioDevices,
    formatDeviceLabel,
    getAvailableDevices,
    setAudioInputDevice
} from '../base/devices';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { MiddlewareRegistry } from '../base/redux';
import { updateSettings } from '../base/settings';
import { playSound, registerSound, unregisterSound } from '../base/sounds';
import { NO_AUDIO_SIGNAL_SOUND_ID } from './constants';
import { hideNotification, showNotification } from '../notifications';
import { NO_AUDIO_SIGNAL_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => async action => {
    const result = next(action);
    const { dispatch, getState } = store;
    const { conference } = action;
    let audioDetectService = null;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(NO_AUDIO_SIGNAL_SOUND_ID, NO_AUDIO_SIGNAL_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(NO_AUDIO_SIGNAL_SOUND_ID));
        break;

    case CONFERENCE_JOINED: {
        conference.on(JitsiConferenceEvents.TRACK_ADDED, track => {
            const { noAudioSignalNotificationUid } = getState()['features/no-audio-signal'];

            if (track.isAudioTrack() && track.isLocal()) {
                // In case the device is switched attempt to destroy, this should prevent the notification firing
                // when the device was switched, however it is possible that a user switches the device and the
                // notification from the previous devices pops up, but this will probably happen very rarely and even
                // if it does it's not that disruptive to the ux.
                if (audioDetectService) {
                    audioDetectService.destroy();
                    audioDetectService = null;
                }

                // When a new track is added hide the current notification is one is displayed, and reset the redux
                // state so that we begin monitoring on the new device as well.
                if (noAudioSignalNotificationUid) {
                    dispatch(hideNotification(noAudioSignalNotificationUid));
                    dispatch(setNoAudioSignalNotificationUid());
                }
            }
        });
        conference.on(JitsiConferenceEvents.NO_AUDIO_INPUT, async () => {
            const { noSrcDataNotiUid } = getState()['features/base/no-src-data'];

            // In case the 'no data detected from source' notification was already shown, we prevent the
            // no audio signal notification as it's redundant i.e. it's clear that the users microphone is
            // muted from system settings.
            if (noSrcDataNotiUid) {
                return;
            }

            const devices = await dispatch(getAvailableDevices());
            const audioDevices = filterAudioDevices(devices);

            audioDetectService = await ActiveDeviceDetector.create(audioDevices);

            audioDetectService.on(ACTIVE_DEVICE_DETECTED, detectEvent => {
                let descriptionKey = 'toolbar.noAudioSignalDesc';
                let customActionNameKey = null;
                let customActionHandler = null;

                // In case the detector picked up a device show a notification with a device suggestion
                if (detectEvent.deviceLabel !== '') {
                    descriptionKey = 'toolbar.noAudioSignalDescSuggestion';

                    // Preferably the label should be passed as an argument paired with a i18next string, however
                    // at the point of the implementation the showNotification function only supports doing that for
                    // the description.
                    // TODO Add support for arguments to showNotification title and customAction strings.
                    customActionNameKey = `Use ${formatDeviceLabel(detectEvent.deviceLabel)}`;
                    customActionHandler = () => {
                        // Select device callback
                        dispatch(
                                updateSettings({
                                    userSelectedMicDeviceId: detectEvent.deviceId,
                                    userSelectedMicDeviceLabel: detectEvent.deviceLabel
                                })
                        );

                        dispatch(setAudioInputDevice(detectEvent.deviceId));
                    };
                }

                const notification = showNotification({
                    titleKey: 'toolbar.noAudioSignalTitle',
                    descriptionKey,
                    customActionNameKey,
                    customActionHandler
                });

                dispatch(notification);

                dispatch(playSound(NO_AUDIO_SIGNAL_SOUND_ID));

                // Store the current notification uid so we can check for this state and hide it in case
                // a new track was added, thus changing the context of the notification
                dispatch(setNoAudioSignalNotificationUid(notification.uid));
            });
        });
        break;
    }
    }

    return result;
});
