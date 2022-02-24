// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout.js';
import { CONFERENCE_WILL_LEAVE } from '../base/conference';
import { MEDIA_TYPE } from '../base/media';
import {
    getLocalParticipant,
    PARTICIPANT_JOINED,
    PARTICIPANT_UPDATED
} from '../base/participants';
import { MiddlewareRegistry } from '../base/redux';
import { TRACK_ADDED, TRACK_REMOVED, TRACK_STOPPED } from '../base/tracks';
import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN } from '../participants-pane/actionTypes.js';

import './middleware.any';

/**
 * Middleware which intercepts actions and updates the legacy component
 * {@code VideoLayout} as needed. The purpose of this middleware is to redux-ify
 * {@code VideoLayout} without having to simultaneously react-ifying it.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
// eslint-disable-next-line no-unused-vars
MiddlewareRegistry.register(store => next => action => {
    // Purposefully perform additional actions after state update to mimic
    // being connected to the store for updates.
    const result = next(action);

    switch (action.type) {
    case CONFERENCE_WILL_LEAVE:
        VideoLayout.reset();
        break;

    case PARTICIPANT_JOINED:
        if (!action.participant.local) {
            VideoLayout.updateVideoMutedForNoTracks(action.participant.id);
        }
        break;

    case PARTICIPANT_UPDATED: {
        // Look for actions that triggered a change to connectionStatus. This is
        // done instead of changing the connection status change action to be
        // explicit in order to minimize changes to other code.
        if (typeof action.participant.connectionStatus !== 'undefined') {
            VideoLayout.onParticipantConnectionStatusChanged(
                action.participant.id,
                action.participant.connectionStatus);
        }
        break;
    }

    case PARTICIPANTS_PANE_CLOSE:
    case PARTICIPANTS_PANE_OPEN:
        VideoLayout.resizeVideoArea();
        break;

    case TRACK_ADDED:
        if (action.track.mediaType !== MEDIA_TYPE.AUDIO) {
            VideoLayout._updateLargeVideoIfDisplayed(action.track.participantId, true);
        }

        break;

    case TRACK_STOPPED: {
        if (action.track.jitsiTrack.isLocal()) {
            const participant = getLocalParticipant(store.getState);

            VideoLayout._updateLargeVideoIfDisplayed(participant?.id);
        }
        break;
    }
    case TRACK_REMOVED:
        if (!action.track.local && action.track.mediaType !== MEDIA_TYPE.AUDIO) {
            VideoLayout.updateVideoMutedForNoTracks(action.track.jitsiTrack.getParticipantId());
        }

        break;
    }

    return result;
});
