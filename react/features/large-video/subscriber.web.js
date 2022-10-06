// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { getMultipleVideoSupportFeatureFlag } from '../base/config';
import { MEDIA_TYPE } from '../base/media';
import { isScreenShareParticipant } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';
import { getTrackByMediaTypeAndParticipant, getVirtualScreenshareParticipantTrack } from '../base/tracks';

import { getLargeVideoParticipant } from './functions';

/**
 * Updates the on stage participant video.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ participantId => {
        VideoLayout.updateLargeVideo(participantId, true);
    }
);

/**
 * Schedules a large video update when the streaming status of the track associated with the large video changes.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const largeVideoParticipant = getLargeVideoParticipant(state);
        const tracks = state['features/base/tracks'];
        let videoTrack;

        if (getMultipleVideoSupportFeatureFlag(state) && isScreenShareParticipant(largeVideoParticipant)) {
            videoTrack = getVirtualScreenshareParticipantTrack(tracks, largeVideoParticipant?.id);
        } else {
            videoTrack = getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.VIDEO, largeVideoParticipant?.id);
        }

        return {
            participantId: largeVideoParticipant?.id,
            streamingStatus: videoTrack?.streamingStatus
        };
    },
    /* listener */ ({ participantId, streamingStatus }, previousState = {}) => {
        if (streamingStatus !== previousState.streamingStatus) {
            VideoLayout.updateLargeVideo(participantId, true);
        }
    }, {
        deepEquals: true
    }
);
