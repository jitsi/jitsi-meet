// @flow

import { MiddlewareRegistry } from '../base/redux';
import {  OPEN_POPOUT, CLOSE_POPOUT, UPDATE_POPOUT_VIDEO_STREAM, SET_POPOUT_DISPLAY_MODE } from './actionTypes';
import { closePopout, setPopoutDisplayMode, updatePopoutVideoStream } from './actions';
import { getTrackByMediaTypeAndParticipant } from '../base/tracks';
import { MEDIA_TYPE } from '../base/media';
import { createPopoutWindow, getPopoutVideoElement, displayPopoutVideo, displayPopoutAvatar, isPopoutOpen } from './functions';
import { getParticipantDisplayName, PARTICIPANT_LEFT } from '../base/participants';
import { DISPLAY_AVATAR, DISPLAY_VIDEO } from '../filmstrip/constants';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === OPEN_POPOUT) {
        const participantId = action.participantId;
        const popoutState = getState()['features/popout'][participantId];
        if (!isPopoutOpen(popoutState?.popout)) {
            action.popout = createPopoutWindow(participantId, getParticipantDisplayName(getState(), participantId), popoutState.avatarHtml);
            const result = next(action);
            dispatch(setPopoutDisplayMode(participantId, getState()['features/popout'][participantId]?.displayMode));
            return result;
        }
    }
    return next(action);
});


MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === CLOSE_POPOUT) {
        const popout = getState()['features/popout'][action.participantId]?.popout;
        if (isPopoutOpen(popout)) {
            popout.close();
        }
    }
    return next(action);
});

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === UPDATE_POPOUT_VIDEO_STREAM) {
        const participantId = action.participantId;
        const state = getState();
        const popout = state['features/popout'][participantId]?.popout;
        if (popout && !popout.closed) {
            const videoTrack = getTrackByMediaTypeAndParticipant(state['features/base/tracks'], MEDIA_TYPE.VIDEO, participantId);
            const stream = videoTrack?.jitsiTrack?.stream;
            if (stream) {
                const videoElement = getPopoutVideoElement(popout);
                videoElement.srcObject = stream;
            }
        }
    }
    return next(action);
});

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === PARTICIPANT_LEFT) {
        dispatch(closePopout(action.participant.id));
    }
    return next(action);
});

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);
    if (action.type === SET_POPOUT_DISPLAY_MODE) {
        const participantId = action.participantId;
        const popoutState = getState()['features/popout'][participantId];
        const displayMode = popoutState?.displayMode;
        const popout = popoutState?.popout;
        if (isPopoutOpen(popout)) {
            if (displayMode === DISPLAY_VIDEO) {
                displayPopoutVideo(popout);
                dispatch(updatePopoutVideoStream(participantId));
            } else if (displayMode === DISPLAY_AVATAR) {
                displayPopoutAvatar(popout);
            }
        }
    }
    return result;
});
