// @flow

import { StateListenerRegistry } from '../base/redux';
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';

/**
 * Updates the on stage participant video.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/large-video'].participantId,
    /* listener */ participantId => {
        VideoLayout.updateLargeVideo(participantId, true);
    }
);
