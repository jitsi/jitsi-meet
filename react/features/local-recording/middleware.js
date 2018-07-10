/* @flow */

import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../app';
import { CONFERENCE_JOINED } from '../base/conference';
import { i18next } from '../base/i18n';
import { MiddlewareRegistry } from '../base/redux';
import { showNotification } from '../notifications';

import { localRecordingEngaged, localRecordingUnengaged } from './actions';
import { recordingController } from './controller';

MiddlewareRegistry.register(({ getState, dispatch }) => next => action => {
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
        recordingController.onStateChanged = function(isEngaged) {
            if (isEngaged) {
                const nowTime = new Date();

                dispatch(localRecordingEngaged(nowTime));
            } else {
                dispatch(localRecordingUnengaged());
            }
        };

        recordingController.onWarning = function(message) {
            dispatch(showNotification({
                title: i18next.t('localRecording.localRecording'),
                description: message
            }, 10000));
        };

        recordingController.onNotify = function(message) {
            dispatch(showNotification({
                title: i18next.t('localRecording.localRecording'),
                description: message
            }, 10000));
        };
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
