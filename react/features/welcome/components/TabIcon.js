// @flow

import React from 'react';

import { Icon } from '../../base/icons';
import BaseTheme from '../../base/ui/components/BaseTheme';
import { INACTIVE_TAB_COLOR } from '../constants';

type Props = {

    /**
     * Is the tab focused?
     */
    focused?: boolean,

    /**
     * The ImageSource to be rendered as image.
     */
    src: Object,

    /**
     * The component's external style.
     */
    style?: Object
}

const TabIcon = ({ focused, src, style }: Props) => (
    <Icon
        color = { focused ? BaseTheme.palette.icon01 : INACTIVE_TAB_COLOR }
        size = { 24 }
        src = { src }
        style = { style } />
);


export default TabIcon;
