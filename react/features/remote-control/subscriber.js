// @flow

import { StateListenerRegistry } from '../base/redux';

import { resume, pause } from './actions';

/**
 * Listens for large video participant ID changes.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { participantId } = state['features/large-video'];
        const { controller } = state['features/remote-control'];
        const { controlled } = controller;

        if (!controlled) {
            return undefined;
        }

        return controlled === participantId;
    },
    /* listener */ (isControlledParticipantOnStage, { dispatch }) => {
        if (isControlledParticipantOnStage === true) {
            dispatch(resume());
        } else if (isControlledParticipantOnStage === false) {
            dispatch(pause());
        }

        // else {
        // isControlledParticipantOnStage === undefined. Ignore!
        // }
    }
);
