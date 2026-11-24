import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { showErrorNotification } from '../notifications/actions';
import { maybeNotifyRecordingStart, maybeNotifyRecordingStop } from '../recording/middleware';
import { setSubtitlesError } from '../subtitles/actions.any';

import { TRANSCRIBER_LEFT } from './actionTypes';
import './subscriber';

/**
 * Implements the middleware of the feature transcribing.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    switch (action.type) {
    case TRANSCRIBER_LEFT: {
        if (action.abruptly) {
            dispatch(showErrorNotification({
                titleKey: 'transcribing.failed'
            }));

            // TRANSCRIBER_LEFT resets subtitles state to default (_hasError: false).
            // If we're in the coordinated start flow, we need _hasError = true
            // so maybeNotifyRecordingStart sees transcription as resolved-failed.
            const startIntent = getState()['features/recording'].startRecordingIntent;

            if (startIntent) {
                dispatch(setSubtitlesError(true));
                maybeNotifyRecordingStart(dispatch, getState);
            }

            // If we're in the coordinated stop flow, the transcriber leaving is
            // the transcription resolution — re-evaluate.
            const stopIntent = getState()['features/recording'].stopRecordingIntent;

            if (stopIntent) {
                maybeNotifyRecordingStop(dispatch, getState);
            }
        }
        break;
    }
    }

    return next(action);
});
