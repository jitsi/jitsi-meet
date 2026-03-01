import React, { useCallback } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop!;

/**
 * Stateless hangup button for the Always-on-Top windows.
 *
 * @param {Partial<IProps>} props - The props of the component.
 * @returns {JSX.Element}
 */
const HangupButton = (props: Partial<IProps>) => {
    const onClick = useCallback(() => {
        api.executeCommand('hangup');
    }, []);

    return (
        <ToolbarButton
            accessibilityLabel = 'Hangup'
            customClass = 'hangup-button'
            icon = { DEFAULT_ICON.IconHangup }
            onClick = { onClick } />
    );
};

export default HangupButton;
