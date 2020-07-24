// @flow

import {
    CONFERENCE_JOINED,
    VIDEO_QUALITY_LEVELS,
    getNearestReceiverVideoQualityLevel,
    setMaxReceiverVideoQuality,
    setPreferredVideoQuality
} from '../base/conference';
import { getParticipantCount } from '../base/participants';
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
        const participantCount = getParticipantCount(state);

        return {
            displayTileView: _shouldDisplayTileView,
            participantCount,
            reducedUI,
            thumbnailHeight: thumbnailSize?.height
        };
    },
    /* listener */ ({ displayTileView, participantCount, reducedUI, thumbnailHeight }, { dispatch, getState }) => {
        const state = getState();
        const { maxReceiverVideoQuality } = state['features/base/conference'];
        let { maxFullResolutionParticipants } = state['features/base/config'];

        if (typeof maxFullResolutionParticipants === 'undefined') {
            maxFullResolutionParticipants = 4;
        }

        let newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.HIGH;

        if (reducedUI) {
            newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.LOW;
        } else if (displayTileView && !Number.isNaN(thumbnailHeight)) {
            newMaxRecvVideoQuality = getNearestReceiverVideoQualityLevel(thumbnailHeight);
        }

        if (maxReceiverVideoQuality !== newMaxRecvVideoQuality) {
            if (displayTileView && maxFullResolutionParticipants !== -1) {
                const overrideNearestHeight
                    = participantCount > maxFullResolutionParticipants
                            && newMaxRecvVideoQuality > VIDEO_QUALITY_LEVELS.STANDARD;

                logger.info(`The nearest receiver video quality level for thumbnail height: ${thumbnailHeight}, `
                    + `is: ${newMaxRecvVideoQuality}, `
                    + `override: ${String(overrideNearestHeight)}, `
                    + `max full res N: ${maxFullResolutionParticipants}`);

                if (overrideNearestHeight) {
                    newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.STANDARD;
                }
            }
            dispatch(setMaxReceiverVideoQuality(newMaxRecvVideoQuality));
        }
    }, {
        deepEquals: true
    });
