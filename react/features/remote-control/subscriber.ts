import {
    getParticipantById,
    getVirtualScreenshareParticipantByOwnerId,
    getVirtualScreenshareParticipantOwnerId,
    isScreenShareParticipant
} from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { pause, resume } from './actions';

/**
 * Listens for large video participant ID changes.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { participantId = '' } = state['features/large-video'];
        const { controller } = state['features/remote-control'];
        const { controlled } = controller;

        if (!controlled) {
            return undefined;
        }

        const participant = getParticipantById(state, participantId);

        if (isScreenShareParticipant(participant)) {
            // multistream support is enabled and the user has selected the desktop sharing thumbnail.
            const id = getVirtualScreenshareParticipantOwnerId(participantId);

            return id === controlled;
        }

        const virtualParticipant = getVirtualScreenshareParticipantByOwnerId(state, participantId);

        if (virtualParticipant) { // multistream is enabled and the user has selected the camera thumbnail.
            return false;

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
