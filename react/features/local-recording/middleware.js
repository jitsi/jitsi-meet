/* @flow */

import { createShortcutEvent, sendAnalytics } from '../analytics';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app';
import { CONFERENCE_JOINED } from '../base/conference';
import { toggleDialog } from '../base/dialog';
import { i18next } from '../base/i18n';
import { MiddlewareRegistry } from '../base/redux';
import { showNotification } from '../notifications';

import { localRecordingEngaged, localRecordingUnengaged } from './actions';
import { LocalRecordingInfoDialog } from './components';
import { recordingController } from './controller';

declare var APP: Object;
declare var config: Object;

const isFeatureEnabled = config.localRecording
    && config.localRecording.enabled === true;

isFeatureEnabled
&& MiddlewareRegistry.register(({ getState, dispatch }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = getState()['features/base/conference'];

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

        APP.keyboardshortcut.registerShortcut('L', null, () => {
            sendAnalytics(createShortcutEvent('local.recording'));
            dispatch(toggleDialog(LocalRecordingInfoDialog));
        }, 'keyboardShortcuts.localRecording');
        break;
    case APP_WILL_UNMOUNT:
        recordingController.onStateChanged = null;
        recordingController.onNotify = null;
        recordingController.onWarning = null;
        break;
    }

    // @todo: detect change in features/base/settings micDeviceID
    // @todo: SET_AUDIO_MUTED, when audio is muted

    return result;
});
