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
 * @returns {Object | undefined}
 */
export function useClosedCaptionButton() {
    const isStartSubtitlesButtonVisible = useSelector(canStartSubtitles);
    const showSubtitlesButton = useSelector(state => state['features/base/settings'].showSubtitlesButton);
    const { disableShowSubtitlesButton = false } = useSelector(state => state['features/base/config'].testing);

    if (isStartSubtitlesButtonVisible && (showSubtitlesButton || disableShowSubtitlesButton)) {
        return cc;
    }
}
