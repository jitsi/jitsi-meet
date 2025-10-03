// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getVideoTrackByParticipant } from '../base/tracks/functions.web';

import { SELECT_LARGE_VIDEO_PARTICIPANT } from './actionTypes';
import { selectParticipantInLargeVideo } from './actions.any';
import { getLargeVideoParticipant, shouldHideLargeVideo } from './functions';

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

/**
 * Updates the large video when transitioning from a hidden state to visible state.
 * This ensures the large video is properly updated when exiting tile view, stage filmstrip,
 * whiteboard, or etherpad editing modes.
 */
StateListenerRegistry.register(
    /* selector */ state => shouldHideLargeVideo(state),
    /* listener */ (isHidden, { dispatch }) => {
        // When transitioning from hidden to visible state, select participant (because currently it is undefined).
        // Otherwise set it to undefined because we don't show the large video.
        if (!isHidden) {
            dispatch(selectParticipantInLargeVideo());
        } else {
            dispatch({
                type: SELECT_LARGE_VIDEO_PARTICIPANT,
                participantId: undefined
            });
        }
    }
);
