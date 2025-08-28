import { useSelector } from 'react-redux';

import { isScreenVideoShared } from '../screen-share/functions';

import VideoBackgroundButton from './components/VideoBackgroundButton';
import { checkBlurSupport, checkVirtualBackgroundEnabled } from './functions';

const virtualBackground = {
    key: 'select-background',
    Content: VideoBackgroundButton,
    group: 3
};

/**
 * A hook that returns the virtual background button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useVirtualBackgroundButton() {
    const _checkBlurSupport = checkBlurSupport();
    const _isScreenVideoShared = useSelector(isScreenVideoShared);
    const _checkVirtualBackgroundEnabled = useSelector(checkVirtualBackgroundEnabled);

    if (_checkBlurSupport && !_isScreenVideoShared && _checkVirtualBackgroundEnabled) {
        return virtualBackground;
    }
}
