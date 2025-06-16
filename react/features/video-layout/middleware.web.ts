// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout.js';
import { CONFERENCE_WILL_INIT, CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_REMOVED, TRACK_STOPPED } from '../base/tracks/actionTypes';
import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN } from '../participants-pane/actionTypes';

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
    case CONFERENCE_WILL_INIT:
        // Reset VideoLayout. It's destroyed on CONFERENCE_WILL_LEAVE so re-initialize it.
        VideoLayout.initLargeVideo();
        VideoLayout.resizeVideoArea();
        break;
    case CONFERENCE_WILL_LEAVE:
        VideoLayout.reset();
        break;

    case PARTICIPANT_JOINED:
        if (!action.participant.local) {
            VideoLayout.updateVideoMutedForNoTracks(action.participant.id);
        }
        break;

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
