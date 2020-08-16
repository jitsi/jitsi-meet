// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { StateListenerRegistry } from '../base/redux';

/**
 * Updates the on stage participant video.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ participantId => {
        VideoLayout.updateLargeVideo(participantId, true);
    }
);
