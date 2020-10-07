// @flow

import {
    CONFERENCE_JOINED,
    DATA_CHANNEL_OPENED
} from '../base/conference';
import { SET_CONFIG } from '../base/config';
import { getParticipantCount } from '../base/participants';
import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';
import { shouldDisplayTileView } from '../video-layout';

import { setPreferredVideoQuality, setMaxReceiverVideoQuality } from './actions';
import { VIDEO_QUALITY_LEVELS } from './constants';
import { getReceiverVideoQualityLevel } from './functions';
import logger from './logger';
import { getMinHeightForQualityLvlMap } from './selector';

declare var APP: Object;

/**
 * Implements the middleware of the feature video-quality.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    if (action.type === DATA_CHANNEL_OPENED) {
        return _syncReceiveVideoQuality(getState, next, action);
    }

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
    case SET_CONFIG: {
        const state = getState();
        const { videoQuality = {} } = state['features/base/config'];
        const { persistedPrefferedVideoQuality } = state['features/video-quality-persistent-storage'];

        if (videoQuality.persist && typeof persistedPrefferedVideoQuality !== 'undefined') {
            dispatch(setPreferredVideoQuality(persistedPrefferedVideoQuality));
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
        const { maxReceiverVideoQuality } = state['features/video-quality'];
        const { maxFullResolutionParticipants = 2 } = state['features/base/config'];

        let newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.ULTRA;

        if (reducedUI) {
            newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.LOW;
        } else if (displayTileView && !Number.isNaN(thumbnailHeight)) {
            newMaxRecvVideoQuality = getReceiverVideoQualityLevel(thumbnailHeight, getMinHeightForQualityLvlMap(state));

            // Override HD level calculated for the thumbnail height when # of participants threshold is exceeded
            if (maxReceiverVideoQuality !== newMaxRecvVideoQuality && maxFullResolutionParticipants !== -1) {
                const override
                    = participantCount > maxFullResolutionParticipants
                        && newMaxRecvVideoQuality > VIDEO_QUALITY_LEVELS.STANDARD;

                logger.info(`Video quality level for thumbnail height: ${thumbnailHeight}, `
                    + `is: ${newMaxRecvVideoQuality}, `
                    + `override: ${String(override)}, `
                    + `max full res N: ${maxFullResolutionParticipants}`);

                if (override) {
                    newMaxRecvVideoQuality = VIDEO_QUALITY_LEVELS.STANDARD;
                }
            }
        }

        if (maxReceiverVideoQuality !== newMaxRecvVideoQuality) {
            dispatch(setMaxReceiverVideoQuality(newMaxRecvVideoQuality));
        }
    }, {
        deepEquals: true
    });

/**
 * Helper function for updating the preferred receiver video constraint, based
 * on the user preference and the internal maximum.
 *
 * @param {JitsiConference} conference - The JitsiConference instance for the
 * current call.
 * @param {number} preferred - The user preferred max frame height.
 * @param {number} max - The maximum frame height the application should
 * receive.
 * @returns {void}
 */
function _setReceiverVideoConstraint(conference, preferred, max) {
    if (conference) {
        const value = Math.min(preferred, max);

        conference.setReceiverVideoConstraint(value);
        logger.info(`setReceiverVideoConstraint: ${value}`);
    }
}

/**
 * Helper function for updating the preferred sender video constraint, based
 * on the user preference.
 *
 * @param {JitsiConference} conference - The JitsiConference instance for the
 * current call.
 * @param {number} preferred - The user preferred max frame height.
 * @returns {void}
 */
function _setSenderVideoConstraint(conference, preferred) {
    if (conference) {
        conference.setSenderVideoConstraint(preferred)
            .catch(err => {
                logger.error(`Changing sender resolution to ${preferred} failed - ${err} `);
            });
    }
}

/**
 * Sets the maximum receive video quality.
 *
 * @param {Function} getState - The redux function which returns the current redux state.
 * @param {Dispatch} next - The redux {@code dispatch} function to dispatch the
 * specified {@code action} to the specified {@code store}.
 * @param {Action} action - The redux action {@code DATA_CHANNEL_STATUS_CHANGED}
 * which is being dispatched in the specified {@code store}.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _syncReceiveVideoQuality(getState, next, action) {
    const state = getState();
    const {
        conference
    } = state['features/base/conference'];
    const {
        maxReceiverVideoQuality,
        preferredVideoQuality
    } = state['features/video-quality'];

    _setReceiverVideoConstraint(
        conference,
        preferredVideoQuality,
        maxReceiverVideoQuality);

    return next(action);
}


/**
 * Registers a change handler for state['features/base/conference'] to update
 * the preferred video quality levels based on user preferred and internal
 * settings.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const { conference } = state['features/base/conference'];
        const {
            maxReceiverVideoQuality,
            preferredVideoQuality
        } = state['features/video-quality'];

        return {
            conference,
            maxReceiverVideoQuality,
            preferredVideoQuality
        };
    },
    /* listener */ (currentState, store, previousState = {}) => {
        const {
            conference,
            maxReceiverVideoQuality,
            preferredVideoQuality
        } = currentState;
        const changedConference = conference !== previousState.conference;
        const changedPreferredVideoQuality = preferredVideoQuality !== previousState.preferredVideoQuality;
        const changedMaxVideoQuality = maxReceiverVideoQuality !== previousState.maxReceiverVideoQuality;

        if (changedConference || changedPreferredVideoQuality || changedMaxVideoQuality) {
            _setReceiverVideoConstraint(conference, preferredVideoQuality, maxReceiverVideoQuality);
        }
        if (changedConference || changedPreferredVideoQuality) {
            _setSenderVideoConstraint(conference, preferredVideoQuality);
        }

        if (typeof APP !== 'undefined' && changedPreferredVideoQuality) {
            APP.API.notifyVideoQualityChanged(preferredVideoQuality);
        }
    });
