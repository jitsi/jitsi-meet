import { useSelector } from 'react-redux';

import ClosedCaptionButton from './components/web/ClosedCaptionButton';
import { canStartSubtitles } from './functions.any';

const cc = {
    key: 'closedcaptions',
    Content: ClosedCaptionButton,
    group: 2
};

/**
 * A hook that returns the CC button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useClosedCaptionButton() {
    const isStartSubtitlesButtonVisible = useSelector(canStartSubtitles);

    if (isStartSubtitlesButtonVisible) {
        return cc;
    }
}
