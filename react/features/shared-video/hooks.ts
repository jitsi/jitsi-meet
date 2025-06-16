import { useSelector } from 'react-redux';

import { SharedVideoButton } from './components';
import { isSharedVideoEnabled } from './functions';

const shareVideo = {
    key: 'sharedvideo',
    Content: SharedVideoButton,
    group: 3
};

/**
 * A hook that returns the shared video button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSharedVideoButton() {
    const sharedVideoEnabled = useSelector(isSharedVideoEnabled);

    if (sharedVideoEnabled) {
        return shareVideo;
    }
}

