import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
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
 * A hook that returns the custom panel button if the feature is enabled through
 * `config.customPanel`.
 *
 * The button is also gated on a JWT, so the advisor is never reachable without a token,
 * and hidden in breakout rooms, since the advisor works from transcriptions that aren't
 * available there.
 *
 * @returns {Object | undefined} The button configuration or undefined if disabled.
 */
export function useCustomPanelButton() {
    const enabled = useSelector(isCustomPanelEnabled);
    const jwt = useSelector((state: IReduxState) => state['features/base/jwt'].jwt);
    const inBreakoutRoom = useSelector(isInBreakoutRoom);

    if (enabled && jwt && !inBreakoutRoom) {
        return customPanel;
    }

    return undefined;
}
