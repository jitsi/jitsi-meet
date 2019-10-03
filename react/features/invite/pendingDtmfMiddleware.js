import { CONNECTED_USER } from '../presence-status';

import { getCurrentConference } from '../base/conference';
import { StateListenerRegistry } from '../base/redux';

import { storePendingDTMF } from './actions';
import logger from './logger';
import { getPendingDtmf } from './selectors';

StateListenerRegistry.register(
    state => {
        const jigasiParticipantId
            = state['features/base/participants']
                .find(p => p.isJigasi && p.presence?.toLowerCase() === CONNECTED_USER)
                    ?.id;

        return jigasiParticipantId;
    },
    (jigasiParticipantId, { getState, dispatch }) => {
        const state = getState();
        const pendingDtmf = jigasiParticipantId && getPendingDtmf(state);
        const conference = getCurrentConference(state);

        if (conference && pendingDtmf) {
            logger.info('Sending pending DTMF tones');
            conference.sendTones(pendingDtmf);
            dispatch(storePendingDTMF(undefined));
        }
    }
);

StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch }, prevConference) => {
        if (prevConference && conference !== prevConference) {
            dispatch(storePendingDTMF(undefined));
        }
    }
);
