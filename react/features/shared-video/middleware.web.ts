import { CONFERENCE_JOIN_IN_PROGRESS } from '../base/conference/actionTypes';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { setDisableButton } from './actions.web';
import { SHARED_VIDEO } from './constants';

import './middleware.any';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const state = getState();
    const localParticipantId = getLocalParticipant(state)?.id;

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.addCommandListener(SHARED_VIDEO, ({ attributes }: { attributes:
            { from: string; state: string; }; }) => {
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
    }

    return next(action);
});
