import { useSelector } from 'react-redux';

import { isInBreakoutRoom } from '../breakout-rooms/functions';

import CustomPanelButton from './components/web/CustomPanelButton';
import { isCustomPanelEnabled } from './functions.web';

/**
 * Configuration for the custom panel toolbar button.
 */
const customPanel = {
    key: 'custom-panel',
    Content: CustomPanelButton,
    group: 5
};

/**
 * A hook that returns the custom panel button.
 *
 * @returns {Object | undefined} The button configuration or undefined if disabled.
 */
export function useCustomPanelButton() {
    const enabled = useSelector(isCustomPanelEnabled);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);

    if (enabled && !inBreakoutRoom) {
        return customPanel;
    }

    return undefined;
}
