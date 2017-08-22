import {
    ENABLE_FACE_TRACKING,
    DISABLE_FACE_TRACKING,
    ADD_FACE_TRACKER
} from './actionTypes';
import { showPrompt, hidePrompt } from './actions.js';
import { FaceTrackerFactory } from './components';
import { MiddlewareRegistry } from '../base/redux';

const faceTrackerFactory = new FaceTrackerFactory();

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { type, ...options } = action;

    switch (type) {
    case ADD_FACE_TRACKER:
        if (faceTrackerFactory.hasFaceTracker(action.videoElement)) {
            break;
        }
        faceTrackerFactory.addFaceTracker(action.videoElement, options);
        break;

    case ENABLE_FACE_TRACKING:
        faceTrackerFactory
            .getFaceTracker(action.videoElement)
            .attachFaceTracking(
                () => store.dispatch(showPrompt(action.videoElement)),
                () => store.dispatch(hidePrompt(action.videoElement)));
        break;

    case DISABLE_FACE_TRACKING:
        faceTrackerFactory
            .getFaceTracker(action.videoElement)
            .detachFaceTracking();
        store.dispatch(hidePrompt(action.videoElement));
        break;

    default:
        break;
    }

    return result;
});
