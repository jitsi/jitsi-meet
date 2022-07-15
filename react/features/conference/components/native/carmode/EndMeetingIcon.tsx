/* eslint-disable lines-around-comment */
import React from 'react';

// @ts-ignore
import { Icon, IconHangup } from '../../../../base/icons';
// @ts-ignore
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * Implements an end meeting icon.
 *
 * @returns {JSX.Element} - The end meeting icon.
 */
const EndMeetingIcon = () : JSX.Element => (<Icon
    color = { BaseTheme.palette.icon01 }
    size = { 20 }
    src = { IconHangup } />);

export default EndMeetingIcon;
