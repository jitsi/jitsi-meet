import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../base/environment/utils';
import { isVpaasMeeting } from '../jaas/functions';

import EmbedMeetingButton from './components/EmbedMeetingButton';

const embed = {
    key: 'embedmeeting',
    Content: EmbedMeetingButton,
    group: 4
};

/**
 * A hook that returns the embed button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useEmbedButton() {
    const _isVpaasMeeting = useSelector(isVpaasMeeting);

    if (!isMobileBrowser() && !_isVpaasMeeting) {
        return embed;
    }
}
