// @flow
import { appNavigate } from '../app';
import {
    CONFERENCE_JOINED,
    KICKED_OUT,
    VIDEO_QUALITY_LEVELS,
    conferenceLeft,
    getCurrentConference,
    setPreferredVideoQuality
} from '../base/conference';
import { hideDialog, isDialogOpen } from '../base/dialog';
import { setActiveModalId } from '../base/modal';
import { pinParticipant } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { SET_REDUCED_UI } from '../base/responsive-ui';
import { FeedbackDialog } from '../feedback';
import { setFilmstripEnabled } from '../filmstrip';
import { setToolboxEnabled } from '../toolbox';

import { notifyKickedOut } from './actions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED:
    case SET_REDUCED_UI: {
        const { dispatch, getState } = store;
        const state = getState();
        const { reducedUI } = state['features/base/responsive-ui'];

        dispatch(setToolboxEnabled(!reducedUI));
        dispatch(setFilmstripEnabled(!reducedUI));

        dispatch(
            setPreferredVideoQuality(
                reducedUI
                    ? VIDEO_QUALITY_LEVELS.LOW
                    : VIDEO_QUALITY_LEVELS.HIGH));

        break;
    }

    case KICKED_OUT: {
        const { dispatch } = store;

        dispatch(notifyKickedOut(
            action.participant,
            () => {
                dispatch(conferenceLeft(action.conference));
                dispatch(appNavigate(undefined));
            }
        ));

        break;
    }
    }

    return result;
});

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed, close all dialogs and unpin any pinned participants.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, prevConference) => {
        const { authRequired, passwordRequired }
            = getState()['features/base/conference'];

        if (conference !== prevConference) {
            // Unpin participant, in order to avoid the local participant
            // remaining pinned, since it's not destroyed across runs.
            dispatch(pinParticipant(null));

            // XXX I wonder if there is a better way to do this. At this stage
            // we do know what dialogs we want to keep but the list of those
            // we want to hide is a lot longer. Thus we take a bit of a shortcut
            // and explicitly check.
            if (typeof authRequired === 'undefined'
                    && typeof passwordRequired === 'undefined'
                    && !isDialogOpen(getState(), FeedbackDialog)) {
                // Conference changed, left or failed... and there is no
                // pending authentication, nor feedback request, so close any
                // dialog we might have open.
                dispatch(hideDialog());
            }

            // We want to close all modals.
            dispatch(setActiveModalId());
        }
    });
