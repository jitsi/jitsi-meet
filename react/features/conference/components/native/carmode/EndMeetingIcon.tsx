import React from 'react';

import { Icon, IconHangup } from '../../../../base/icons';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * Implements an end meeting icon.
 * 
 * @returns {JSX.Element} - the end meeting icon.
 */
const EndMeetingIcon = () : JSX.Element => (<Icon
    color = { BaseTheme.palette.icon01 }
    size = { 20 }
    src = { IconHangup } />);

export default EndMeetingIcon;
