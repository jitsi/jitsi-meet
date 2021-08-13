// @flow
import isEqual from 'lodash.isequal';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { CLIENT_RESIZED } from '../base/responsive-ui';
import { SETTINGS_UPDATED } from '../base/settings';
import {
    getCurrentLayout,
    LAYOUTS
} from '../video-layout';

import {
    setHorizontalViewDimensions,
    setRemoteParticipants,
    setTileViewDimensions,
    setVerticalViewDimensions
} from './actions.web';
import { sortRemoteParticipants } from './functions.web';

import './subscriber.web';

/**
 * The middleware of the feature Filmstrip.
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case CLIENT_RESIZED: {
        const state = store.getState();
        const layout = getCurrentLayout(state);

        switch (layout) {
        case LAYOUTS.TILE_VIEW: {
            const { gridDimensions } = state['features/filmstrip'].tileViewDimensions;

            store.dispatch(setTileViewDimensions(gridDimensions));
            break;
        }
        case LAYOUTS.HORIZONTAL_FILMSTRIP_VIEW:
            store.dispatch(setHorizontalViewDimensions());
            break;

        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            store.dispatch(setVerticalViewDimensions());
            break;
        }
        break;
    }
    case PARTICIPANT_JOINED: {
        _updateRemoteParticipantsonJoin(store);
        break;
    }
    case PARTICIPANT_LEFT : {
        _updateRemoteParticipantsOnLeave(store, action.participant?.id);
        break;
    }
    case SETTINGS_UPDATED: {
        if (typeof action.settings?.localFlipX === 'boolean') {
            // TODO: This needs to be removed once the large video is Reactified.
            VideoLayout.onLocalFlipXChanged();
        }
        break;
    }
    }

    return result;
});

/**
 * Private helper to calculate the reordered list of remote participants when a remote participant joins.
 *
 * @param {*} store - The redux store.
 * @returns {void}
 * @private
 */
function _updateRemoteParticipantsonJoin(store) {
    const state = store.getState();
    const { remote } = state['features/base/participants'];

    if (!remote) {
        return;
    }
    const { remoteParticipants } = state['features/filmstrip'];
    const currentParticipants = Array.from(remote.values());

    // Sort the remote participants alphabetically.
    const reorderedParticipants = sortRemoteParticipants(currentParticipants);

    if (!isEqual(reorderedParticipants, remoteParticipants)) {
        store.dispatch(setRemoteParticipants(reorderedParticipants));
    }
}

/**
 * Private helper to calculate reordered list of remote participants when a remote participant leaves.
 *
 * @param {*} store - The redix store.
 * @param {string} participantId - The endpoint id of the participant leaving the call.
 * @returns {void}
 * @private
 */
function _updateRemoteParticipantsOnLeave(store, participantId = null) {
    if (!participantId) {
        return;
    }

    const state = store.getState();
    const { remoteParticipants } = state['features/filmstrip'];
    const reorderedParticipants = remoteParticipants.filter(p => p !== participantId);

    store.dispatch(setRemoteParticipants(reorderedParticipants));
}
