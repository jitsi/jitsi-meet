import { useSelector } from 'react-redux';

import SpeakerStatsButton from './components/web/SpeakerStatsButton';
import { isSpeakerStatsDisabled } from './functions';

const speakerStats = {
    key: 'stats',
    Content: SpeakerStatsButton,
    group: 3
};

/**
 * A hook that returns the speaker stats button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useSpeakerStatsButton() {
    const disabled = useSelector(isSpeakerStatsDisabled);

    if (!disabled) {
        return speakerStats;
    }
}
