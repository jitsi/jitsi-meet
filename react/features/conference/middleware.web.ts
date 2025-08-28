import i18next from 'i18next';

import { ENDPOINT_MESSAGE_RECEIVED, KICKED_OUT } from '../base/conference/actionTypes';
import { hangup } from '../base/connection/actions.web';
import { getParticipantDisplayName } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { openAllowToggleCameraDialog, setCameraFacingMode } from '../base/tracks/actions.web';
import { CAMERA_FACING_MODE_MESSAGE } from '../base/tracks/constants';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { participant, data } = action;

        if (data?.name === CAMERA_FACING_MODE_MESSAGE) {
            APP.store.dispatch(openAllowToggleCameraDialog(
                /* onAllow */ () => APP.store.dispatch(setCameraFacingMode(data.facingMode)),
                /* initiatorId */ participant.getId()
            ));
        }
        break;
    }

    case KICKED_OUT: {
        const { dispatch } = store;
        const { participant } = action;

        // we need to first finish dispatching or the notification can be cleared out
        const result = next(action);

        const participantDisplayName
            = participant && getParticipantDisplayName(store.getState, participant.getId());

        dispatch(hangup(true,
            participantDisplayName ? i18next.t('dialog.kickTitle', { participantDisplayName })
                : i18next.t('dialog.kickSystemTitle'),
            true));

        return result;
    }
    }

    return next(action);
});
