import { useSelector } from 'react-redux';

import { SharedVideoButton } from './components';
import { isShareVideoDisabled, isSharedVideoEnabled } from './functions';

const shareVideo = {
    key: 'sharedvideo',
    Content: SharedVideoButton,
    group: 3
};

/**
 * A hook that returns the shared video button if it is enabled and the local participant may share a video,
 * and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSharedVideoButton() {
    const sharedVideoEnabled = useSelector(isSharedVideoEnabled);
    const shareVideoDisabled = useSelector(isShareVideoDisabled);

    if (sharedVideoEnabled && !shareVideoDisabled) {
        return shareVideo;
    }
}

