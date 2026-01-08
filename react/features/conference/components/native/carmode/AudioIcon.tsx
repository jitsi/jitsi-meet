import React from 'react';

import Icon from '../../../../base/icons/components/Icon';
import { IconVolumeUp } from '../../../../base/icons/svg';
import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

/**
 * React component for Audio icon.
 *
 * @returns {JSX.Element} - The Audio icon.
 */
const AudioIcon = (): JSX.Element => (<Icon
    color = { BaseTheme.palette.ui02 }
    size = { 20 }
    src = { IconVolumeUp } />);

export default AudioIcon;
