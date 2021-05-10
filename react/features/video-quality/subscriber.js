// @flow

import debounce from 'lodash/debounce';

import { _handleParticipantError } from '../base/conference';
import { StateListenerRegistry } from '../base/redux';
import { reportError } from '../base/util';

import { VIDEO_QUALITY_LEVELS } from './constants';

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
    }
);

/**
 * StateListenerRegistry provides a reliable way of detecting changes to
 * maxReceiverVideoQuality state and dispatching additional actions.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-quality'].maxReceiverVideoQuality,
    /* listener */ (maxReceiverVideoQuality, store) => {

        _updateReceiverVideoConstraints(store);
    }
);

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

    try {
        conference.setReceiverConstraints(receiverConstraints);
    } catch (error) {
        _handleParticipantError(error);
        reportError(error, `Failed to set receiver video constraints ${JSON.stringify(receiverConstraints)}`);
    }
}
