// @flow

import {
    CONFERENCE_JOINED,
    VIDEO_QUALITY_LEVELS,
    getNearestReceiverVideoQualityLevel,
    setMaxReceiverVideoQuality,
    setPreferredVideoQuality
} from '../base/conference';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { shouldDisplayTileView } from '../video-layout';

import logger from './logger';

/**
 * Implements the middleware of the feature video-quality.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_JOINED: {
        if (navigator.product === 'ReactNative') {
            const { resolution } = getState()['features/base/config'];

            if (typeof resolution !== 'undefined') {
                dispatch(setPreferredVideoQuality(Number.parseInt(resolution, 10)));
                logger.info(`Configured preferred receiver video frame height to: ${resolution}`);
            }
        }
        break;
    }
    }

    return result;
});

/**
 * Implements a state listener in order to calculate max receiver video quality.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { reducedUI } = state['features/base/responsive-ui'];
        const _shouldDisplayTileView = shouldDisplayTileView(state);
        const thumbnailSize = state['features/filmstrip']?.tileViewDimensions?.thumbnailSize;

        return {
            displayTileView: _shouldDisplayTileView,
            reducedUI,
            thumbnailHeight: thumbnailSize?.height
        };
    },
    /* listener */ ({ displayTileView, reducedUI, thumbnailHeight }, { dispatch, getState }) => {
        const { maxReceiverVideoQuality } = getState()['features/base/conference'];
        let newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.HIGH;

        if (reducedUI) {
            newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.LOW;
        } else if (displayTileView && !Number.isNaN(thumbnailHeight)) {
            newMaxRecvVideoQuality = getNearestReceiverVideoQualityLevel(thumbnailHeight);
        }

        if (maxReceiverVideoQuality !== newMaxRecvVideoQuality) {
            dispatch(setMaxReceiverVideoQuality(newMaxRecvVideoQuality));
        }
    }, {
        deepEquals: true
    });
