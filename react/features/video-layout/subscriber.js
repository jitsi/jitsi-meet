// @flow

import {
    VIDEO_QUALITY_LEVELS,
    setMaxReceiverVideoQuality
} from '../base/conference';
import { StateListenerRegistry } from '../base/redux';
import { selectParticipant } from '../large-video';
import { shouldDisplayTileView } from './functions';

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
