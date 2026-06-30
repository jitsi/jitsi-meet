import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IToolboxNativeButton } from '../toolbox/types';

import CustomPanelButton from './components/native/CustomPanelButton';
import { isCustomPanelEnabled } from './functions.native';

/**
 * Returns the Copilot toolbox button descriptor when the feature is enabled via
 * config, otherwise undefined. Group 2 keeps it out of the main bar so it lands
 * in the overflow menu.
 *
 * @returns {IToolboxNativeButton | undefined}
 */
export function useCustomPanelButton(): IToolboxNativeButton | undefined {
    const enabled = useSelector(isCustomPanelEnabled);

    return useMemo(() => (enabled ? {
        key: 'custom-panel',
        Content: CustomPanelButton,
        group: 2
    } : undefined), [ enabled ]);
}
