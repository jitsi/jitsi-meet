import { useSelector } from 'react-redux';

import { SharedVideoButton } from './components';
import { isSharedVideoButtonVisible } from './functions';

const shareVideo = {
    key: 'sharedvideo',
    Content: SharedVideoButton,
    group: 3
};

/**
 * A hook that returns the shared video button if the local participant may share a video or shares one,
 * and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSharedVideoButton() {
    const sharedVideoButtonVisible = useSelector(isSharedVideoButtonVisible);

    if (sharedVideoButtonVisible) {
        return shareVideo;
    }
}

