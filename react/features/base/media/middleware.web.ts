/* eslint-disable import/order */
import './middleware.any.js';

import { IStore } from '../../app/types';

// @ts-ignore
import { NOTIFICATION_TIMEOUT_TYPE, showNotification } from '../../notifications';
import LocalRecordingManager from '../../recording/components/Recording/LocalRecordingManager.web';

// @ts-ignore
import StopRecordingDialog from '../../recording/components/Recording/web/StopRecordingDialog';

// @ts-ignore
import { openDialog } from '../dialog';

import MiddlewareRegistry from '../redux/MiddlewareRegistry';

import { SET_VIDEO_MUTED } from './actionTypes';

/**
 * Implements the entry point of the middleware of the feature base/media.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    const { dispatch } = store;

    switch (action.type) {
    case SET_VIDEO_MUTED: {
        if (LocalRecordingManager.isRecordingLocally() && LocalRecordingManager.selfRecording.on) {
            if (action.muted && LocalRecordingManager.selfRecording.withVideo) {
                dispatch(openDialog(StopRecordingDialog, { localRecordingVideoStop: true }));

                return;
            } else if (!action.muted && !LocalRecordingManager.selfRecording.withVideo) {
                dispatch(showNotification({
                    titleKey: 'recording.localRecordingNoVideo',
                    descriptionKey: 'recording.localRecordingVideoWarning',
                    uid: 'recording.localRecordingNoVideo'
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
            }
        }
    }
    }

    return next(action);
});
