/* eslint-disable lines-around-comment */
import React from 'react';

// @ts-ignore
import { Icon, IconVolumeEmpty } from '../../../../base/icons';
// @ts-ignore
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * React component for Audio icon.
 *
 * @returns {JSX.Element} - The Audio icon.
 *
 */
const AudioIcon = () : JSX.Element => (<Icon
    color = { BaseTheme.palette.text06 }
    size = { 20 }
    src = { IconVolumeEmpty } />);

export default AudioIcon;
