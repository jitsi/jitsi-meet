/* @flow */

import { createShortcutEvent, sendAnalytics } from '../analytics';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { toggleDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { SET_AUDIO_MUTED } from '../base/media';
import { MiddlewareRegistry } from '../base/redux';
import { SETTINGS_UPDATED } from '../base/settings/actionTypes';
import { showNotification } from '../notifications';

import { localRecordingEngaged, localRecordingUnengaged } from './actions';
import { LocalRecordingInfoDialog } from './components';
import { recordingController } from './controller';

declare var APP: Object;
declare var config: Object;

const isFeatureEnabled = typeof config === 'object' && config.localRecording
    && config.localRecording.enabled === true;

isFeatureEnabled
&& MiddlewareRegistry.register(({ getState, dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = getState()['features/base/conference'];
        const { localRecording } = getState()['features/base/config'];

        if (localRecording && localRecording.format) {
            recordingController.switchFormat(localRecording.format);
        }

        recordingController.registerEvents(conference);
        break;
    }
    case APP_WILL_MOUNT:

        // realize the delegates on recordingController, allowing the UI to
        // react to state changes in recordingController.
        recordingController.onStateChanged = isEngaged => {
            if (isEngaged) {
                const nowTime = new Date();

                dispatch(localRecordingEngaged(nowTime));
            } else {
                dispatch(localRecordingUnengaged());
            }
        };

        recordingController.onWarning = (messageKey, messageParams) => {
            dispatch(showNotification({
                title: i18next.t('localRecording.localRecording'),
                description: i18next.t(messageKey, messageParams)
            }, 10000));
        };

        recordingController.onNotify = (messageKey, messageParams) => {
            dispatch(showNotification({
                title: i18next.t('localRecording.localRecording'),
                description: i18next.t(messageKey, messageParams)
            }, 10000));
        };

        typeof APP === 'object' && typeof APP.keyboardshortcut === 'object'
            && APP.keyboardshortcut.registerShortcut('L', null, () => {
                sendAnalytics(createShortcutEvent('local.recording'));
                dispatch(toggleDialog(LocalRecordingInfoDialog));
            }, 'keyboardShortcuts.localRecording');
        break;
    case APP_WILL_UNMOUNT:
        recordingController.onStateChanged = null;
        recordingController.onNotify = null;
        recordingController.onWarning = null;
        break;
    case SET_AUDIO_MUTED:
        recordingController.setMuted(action.muted);
        break;
    case SETTINGS_UPDATED: {
        const { micDeviceId } = getState()['features/base/settings'];

        if (micDeviceId) {
            recordingController.setMicDevice(micDeviceId);
        }
        break;
    }
    }

    return result;
});
