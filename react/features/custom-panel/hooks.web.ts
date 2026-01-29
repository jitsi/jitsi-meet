import { useSelector } from 'react-redux';

import CustomPanelButton from './components/web/CustomPanelButton';
import { isCustomPanelEnabled } from './functions';

/**
 * Configuration for the custom panel toolbar button.
 */
const customPanel = {
    key: 'custom-panel',
    Content: CustomPanelButton,
    group: 2
};

/**
 * A hook that returns the custom panel button if the feature is enabled.
 * Uses useSelector for reactive updates when the feature is toggled dynamically.
 *
 * @returns {Object | undefined} The button configuration or undefined if disabled.
 */
export function useCustomPanelButton() {
    const enabled = useSelector(isCustomPanelEnabled);

    if (enabled) {
        return customPanel;
    }

    return undefined;
}
