import React from 'react';

import Icon from '../../../../base/icons/components/Icon';
import { IconHangup } from '../../../../base/icons/svg';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * Implements an end meeting icon.
 *
 * @returns {JSX.Element} - The end meeting icon.
 */
const EndMeetingIcon = (): JSX.Element => (<Icon
    color = { BaseTheme.palette.icon01 }
    size = { 20 }
    src = { IconHangup } />);

export default EndMeetingIcon;
