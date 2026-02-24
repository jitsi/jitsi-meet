// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getVideoTrackByParticipant } from '../base/tracks/functions.web';

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
        const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);

        return {
            participantId: largeVideoParticipant?.id,
            streamingStatus: videoTrack?.streamingStatus
        };
    },
    /* listener */ ({ participantId, streamingStatus }, previousState: any = {}) => {
        if (streamingStatus !== previousState.streamingStatus) {
            VideoLayout.updateLargeVideo(participantId, true);
        }
    }, {
        deepEquals: true
    }
);
