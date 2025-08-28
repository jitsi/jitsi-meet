import React from 'react';
import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { setAudioInputDevice } from '../base/devices/actions';
import { formatDeviceLabel } from '../base/devices/functions';
import JitsiMeetJS, { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { updateSettings } from '../base/settings/actions';
import { playSound, registerSound, unregisterSound } from '../base/sounds/actions';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { setNoAudioSignalNotificationUid } from './actions';
import DialInLink from './components/DialInLink';
import { NO_AUDIO_SIGNAL_SOUND_ID } from './constants';
import { NO_AUDIO_SIGNAL_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch } = store;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(NO_AUDIO_SIGNAL_SOUND_ID, NO_AUDIO_SIGNAL_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(NO_AUDIO_SIGNAL_SOUND_ID));
        break;
    case CONFERENCE_JOINED:
        _handleNoAudioSignalNotification(store, action);
        break;
    }

    return result;
});

/**
 * Handles the logic of displaying the no audio input detected notification as well as finding a valid device on the
 * system.
 *
 * @param {Store} store - The redux store in which the specified action is being dispatched.
 * @param {Action} action - The redux action {@code CONFERENCE_JOINED} which is being dispatched in the specified redux
 * store.
 * @private
 * @returns {void}
 */
async function _handleNoAudioSignalNotification({ dispatch, getState }: IStore, action: AnyAction) {

    const { conference } = action;

    conference.on(JitsiConferenceEvents.AUDIO_INPUT_STATE_CHANGE, (hasAudioInput: boolean) => {
        const { noAudioSignalNotificationUid } = getState()['features/no-audio-signal'];

        // In case the notification is displayed but the conference detected audio input signal we hide it.
        if (noAudioSignalNotificationUid && hasAudioInput) {
            dispatch(hideNotification(noAudioSignalNotificationUid));
            dispatch(setNoAudioSignalNotificationUid());
        }
    });
    conference.on(JitsiConferenceEvents.NO_AUDIO_INPUT, async () => {
        const { noSrcDataNotificationUid } = getState()['features/base/no-src-data'];

        // In case the 'no data detected from source' notification was already shown, we prevent the
        // no audio signal notification as it's redundant i.e. it's clear that the users microphone is
        // muted from system settings.
        if (noSrcDataNotificationUid) {
            return;
        }

        const activeDevice = await JitsiMeetJS.getActiveAudioDevice();

        // In case there is a previous notification displayed just hide it.
        const { noAudioSignalNotificationUid } = getState()['features/no-audio-signal'];

        if (noAudioSignalNotificationUid) {
            dispatch(hideNotification(noAudioSignalNotificationUid));
            dispatch(setNoAudioSignalNotificationUid());
        }


        let descriptionKey = 'toolbar.noAudioSignalDesc';
        let customActionNameKey;
        let customActionHandler;

        // In case the detector picked up a device show a notification with a device suggestion
        if (activeDevice.deviceLabel !== '') {
            descriptionKey = 'toolbar.noAudioSignalDescSuggestion';

            // Preferably the label should be passed as an argument paired with a i18next string, however
            // at the point of the implementation the showNotification function only supports doing that for
            // the description.
            // TODO Add support for arguments to showNotification title and customAction strings.
            customActionNameKey = [ `Switch to ${formatDeviceLabel(activeDevice.deviceLabel)}` ];
            customActionHandler = [ () => {
                // Select device callback
                dispatch(
                        updateSettings({
                            userSelectedMicDeviceId: activeDevice.deviceId,
                            userSelectedMicDeviceLabel: activeDevice.deviceLabel
                        })
                );

                dispatch(setAudioInputDevice(activeDevice.deviceId));
            } ];
        }

        const notification = dispatch(showNotification({
            titleKey: 'toolbar.noAudioSignalTitle',
            description: <DialInLink />,
            descriptionKey,
            customActionNameKey,
            customActionHandler
        }, NOTIFICATION_TIMEOUT_TYPE.LONG));

        dispatch(playSound(NO_AUDIO_SIGNAL_SOUND_ID));

        if (notification) {
            // Store the current notification uid so we can check for this state and hide it in case
            // a new track was added, thus changing the context of the notification
            dispatch(setNoAudioSignalNotificationUid(notification.uid));
        }
    });
}
