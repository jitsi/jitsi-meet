import { useSelector } from 'react-redux';

import { isLocalParticipantModerator } from '../base/participants/functions';

import GoLiveButton from './components/GoLiveButton';
import { isGoLiveButtonEnabled, isVisitorsLive, isVisitorsSupported } from './functions';

const golive = {
    key: 'golive',
    Content: GoLiveButton,
    group: 2
};

/**
 * A hook that returns the CC button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useGoLiveButtonButton() {
    const isModerator = useSelector(isLocalParticipantModerator);
    const supported = useSelector(isVisitorsSupported);
    const enabled = useSelector(isGoLiveButtonEnabled);
    const isLive = useSelector(isVisitorsLive);

    if (isModerator && supported && enabled && !isLive) {
        return golive;
    }
}
