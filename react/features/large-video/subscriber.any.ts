import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { SELECT_LARGE_VIDEO_PARTICIPANT } from './actionTypes';
import { selectParticipantInLargeVideo } from './actions.any';
import { shouldHideLargeVideo } from './functions';

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
