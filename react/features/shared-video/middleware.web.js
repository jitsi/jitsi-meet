// @flow

import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';

import { setDisableButton } from './actions.web';
import { SHARED_VIDEO } from './constants';

import './middleware.any';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const state = getState();
    const conference = getCurrentConference(state);
    const localParticipantId = getLocalParticipant(state)?.id;

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS:
        conference.addCommandListener(SHARED_VIDEO, ({ attributes }) => {
            const { from } = attributes;
            const status = attributes.state;

            if (status === 'playing') {
                if (localParticipantId !== from) {
                    dispatch(setDisableButton(true));
                }
            } else if (status === 'stop') {
                dispatch(setDisableButton(false));
            }
        });
        break;
    }

    return next(action);
});
