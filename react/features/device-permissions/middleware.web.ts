import { DEVICE_PERMISSION_STATUS_CHANGED, NOTIFY_CAMERA_ERROR, NOTIFY_MIC_ERROR } from '../base/devices/actionTypes';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_CREATE_ERROR, TRACK_STOPPED } from '../base/tracks/actionTypes';
import { getLocalTrack } from '../base/tracks/functions.any';
import { SET_PREJOIN_DEVICE_ERRORS } from '../prejoin/actionTypes';

import { handleEndedTrack, showPermissionGuidance } from './actions.web';
import { CaptureKind, isPermissionDenied } from './functions';

// The browser reports a change of the permission separately from the end of the track, shortly after it.
const ENDED_TRACK_DELAY = 1000;

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const kinds: CaptureKind[] = [];

    switch (action.type) {
    case DEVICE_PERMISSION_STATUS_CHANGED:
        for (const kind of [ 'audio', 'video' ] as CaptureKind[]) {
            const { state } = action.permissionStatus[kind] ?? {};
            const track = getLocalTrack(store.getState()['features/base/tracks'], kind);

            if ((state === 'denied' || state === 'prompt') && track?.jitsiTrack.isEnded()) {
                store.dispatch(handleEndedTrack(track.jitsiTrack));
            }
        }
        break;
    case NOTIFY_CAMERA_ERROR:
        isPermissionDenied(action.error) && kinds.push('video');
        break;
    case NOTIFY_MIC_ERROR:
        isPermissionDenied(action.error) && kinds.push('audio');
        break;
    case SET_PREJOIN_DEVICE_ERRORS: {
        const { audioOnlyError, videoOnlyError } = action.value ?? {};

        isPermissionDenied(audioOnlyError) && kinds.push('audio');
        isPermissionDenied(videoOnlyError) && kinds.push('video');
        break;
    }
    case TRACK_CREATE_ERROR:
        if (action.permissionDenied && (action.trackType === 'audio' || action.trackType === 'video')) {
            kinds.push(action.trackType);
        }
        break;
    case TRACK_STOPPED: {
        const { jitsiTrack } = action.track;

        setTimeout(() => store.dispatch(handleEndedTrack(jitsiTrack)), ENDED_TRACK_DELAY);
        break;
    }
    }

    kinds.length && store.dispatch(showPermissionGuidance(kinds));

    return result;
});
