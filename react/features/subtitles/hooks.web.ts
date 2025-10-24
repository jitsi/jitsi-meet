import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import ClosedCaptionButton from './components/web/ClosedCaptionButton';
import { areClosedCaptionsEnabled, canStartSubtitles } from './functions.any';

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
    const { showSubtitlesOnStage = false } = useSelector((state: IReduxState) => state['features/base/settings']);
    const _areClosedCaptionsEnabled = useSelector(areClosedCaptionsEnabled);

    if (!_areClosedCaptionsEnabled) {
        return undefined;
    }

    if (isStartSubtitlesButtonVisible || !showSubtitlesOnStage) {
        return cc;
    }
}
