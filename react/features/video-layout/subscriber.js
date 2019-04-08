// @flow

import {
    VIDEO_QUALITY_LEVELS,
    setMaxReceiverVideoQuality
} from '../base/conference';
import {
    getPinnedParticipant,
    pinParticipant
} from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { selectParticipant } from '../large-video';
import { shouldDisplayTileView } from './functions';

declare var interfaceConfig: Object;

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * preferred layout state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldDisplayTileView(state),
    /* listener */ (displayTileView, { dispatch }) => {
        dispatch(selectParticipant());

        if (!displayTileView) {
            dispatch(setMaxReceiverVideoQuality(VIDEO_QUALITY_LEVELS.HIGH));
        }
    }
);

/**
 * For auto-pin mode, listen for changes to the last known screen share
 * participant and automatically pin that participant.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        if (typeof interfaceConfig === 'object'
                && interfaceConfig.AUTO_PIN_LATEST_SCREEN_SHARE) {
            return state['features/video-layout'].screenShares;
        }
    },
    /* listener */ (screenShares, { dispatch, getState }) => {
        // Exit early in case auto-pinning is not supported
        if (!screenShares) {
            return;
        }

        const latestScreenshareParticipantId = Array.from(screenShares).pop();

        if (latestScreenshareParticipantId) {
            dispatch(pinParticipant(latestScreenshareParticipantId));
        } else if (getPinnedParticipant(getState()['features/base/participants'])) {
            dispatch(pinParticipant(null));
        }
    });
