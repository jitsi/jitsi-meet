// @flow

import debounce from 'lodash/debounce';

import { _handleParticipantError } from '../base/conference';
import { getParticipantCount } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { reportError } from '../base/util';
import { shouldDisplayTileView } from '../video-layout';

import { setMaxReceiverVideoQuality } from './actions';
import { VIDEO_QUALITY_LEVELS } from './constants';
import { getReceiverVideoQualityLevel } from './functions';
import logger from './logger';
import { getMinHeightForQualityLvlMap } from './selector';

declare var APP: Object;

/**
 * StateListenerRegistry provides a reliable way of detecting changes to selected
 * endpoints state and dispatching additional actions. The listener is debounced
 * so that the client doesn't end up sending too many bridge messages when the user is
 * scrolling through the thumbnails prompting updates to the selected endpoints.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].selectedEndpoints,
    /* listener */ debounce((selectedEndpoints, store) => {
        _updateReceiverVideoConstraints(store);
    }, 1000));

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * lastn state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/lastn'].lastN,
    /* listener */ (lastN, store) => {
        _updateReceiverVideoConstraints(store);
    });

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * maxReceiverVideoQuality and preferredVideoQuality state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const {
            maxReceiverVideoQuality,
            preferredVideoQuality
        } = state['features/video-quality'];

        return {
            maxReceiverVideoQuality,
            preferredVideoQuality
        };
    },
    /* listener */ (currentState, store, previousState = {}) => {
        const { maxReceiverVideoQuality, preferredVideoQuality } = currentState;
        const changedPreferredVideoQuality = preferredVideoQuality !== previousState.preferredVideoQuality;
        const changedReceiverVideoQuality = maxReceiverVideoQuality !== previousState.maxReceiverVideoQuality;

        if (changedPreferredVideoQuality) {
            _setSenderVideoConstraint(preferredVideoQuality, store);
            typeof APP !== 'undefined' && APP.API.notifyVideoQualityChanged(preferredVideoQuality);
        }
        changedReceiverVideoQuality && _updateReceiverVideoConstraints(store);
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
 * Helper function for updating the preferred sender video constraint, based on the user preference.
 *
 * @param {number} preferred - The user preferred max frame height.
 * @returns {void}
 */
function _setSenderVideoConstraint(preferred, { getState }) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        return;
    }

    logger.info(`Setting sender resolution to ${preferred}`);
    conference.setSenderVideoConstraint(preferred)
        .catch(error => {
            _handleParticipantError(error);
            reportError(error, `Changing sender resolution to ${preferred} failed.`);
        });
}

/**
 * Private helper to calculate the receiver video constraints and set them on the bridge channel.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 */
function _updateReceiverVideoConstraints({ getState }) {
    const state = getState();
    const { conference } = state['features/base/conference'];

    if (!conference) {
        return;
    }
    const { lastN } = state['features/base/lastn'];
    const { maxReceiverVideoQuality, preferredVideoQuality } = state['features/video-quality'];
    const { selectedEndpoints } = state['features/video-layout'];
    const maxFrameHeight = Math.min(maxReceiverVideoQuality, preferredVideoQuality);
    const receiverConstraints = {
        constraints: {},
        defaultConstraints: { 'maxHeight': VIDEO_QUALITY_LEVELS.LOW },
        lastN,
        onStageEndpoints: [],
        selectedEndpoints: []
    };

    if (!selectedEndpoints?.length) {
        return;
    }

    // Stage view.
    if (selectedEndpoints?.length === 1) {
        receiverConstraints.constraints[selectedEndpoints[0]] = { 'maxHeight': maxFrameHeight };
        receiverConstraints.onStageEndpoints = selectedEndpoints;

    // Tile view.
    } else {
        receiverConstraints.defaultConstraints = { 'maxHeight': maxFrameHeight };
    }

    logger.info(`Setting receiver video constraints to ${JSON.stringify(receiverConstraints)}`);
    try {
        conference.setReceiverConstraints(receiverConstraints);
    } catch (error) {
        _handleParticipantError(error);
        reportError(error, `Failed to set receiver video constraints ${JSON.stringify(receiverConstraints)}`);
    }
}
