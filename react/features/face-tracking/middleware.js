import {
    ENABLE_FACE_TRACKING,
    DISABLE_FACE_TRACKING,
    ADD_FACE_TRACKER
} from './actionTypes';
import { showPrompt, hidePrompt } from './actions.js';
import { FaceTracker } from './components';
import { MiddlewareRegistry } from '../base/redux';

const faceTrackers = new Map();

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type, ...options } = action;

    switch (type) {
    case ADD_FACE_TRACKER:
        console.warn(ADD_FACE_TRACKER);
        if (faceTrackers.has(action.videoElement)) {
            break;
        }
        faceTrackers.set(action.videoElement, new FaceTracker(options));
        console.warn(faceTrackers);
        break;

    case ENABLE_FACE_TRACKING:
        console.warn(ENABLE_FACE_TRACKING);
        faceTrackers
            .get(action.videoElement)
            .attachFaceTracking(
                () => store.dispatch(showPrompt(action.videoElement)),
                () => store.dispatch(hidePrompt(action.videoElement)));
        break;

    case DISABLE_FACE_TRACKING:
        console.warn(DISABLE_FACE_TRACKING);
        faceTrackers
            .get(action.videoElement)
            .detachFaceTracking();
        store.dispatch(hidePrompt(action.videoElement));
        break;

    default:
        break;
    }

    return result;
});
