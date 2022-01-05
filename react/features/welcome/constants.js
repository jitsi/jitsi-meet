// @flow

import React from 'react';

import { IconEventNote, IconRestore } from '../base/icons';
import BaseTheme from '../base/ui/components/BaseTheme';

import TabIcon from './components/TabIcon';

export const INACTIVE_TAB_COLOR = BaseTheme.palette.tab01Disabled;

export const tabBarOptions = {
    activeTintColor: BaseTheme.palette.icon01,
    inactiveTintColor: INACTIVE_TAB_COLOR,
    labelStyle: {
        fontSize: 12
    },
    style: {
        backgroundColor: BaseTheme.palette.screen01Header
    }
};

export const recentListTabBarOptions = {
    // $FlowExpectedError
    tabBarIcon: ({ focused }) => (
        <TabIcon
            focused = { focused }
            src = { IconRestore } />
    )
};

export const calendarListTabBarOptions = {
    // $FlowExpectedError
    tabBarIcon: ({ focused }) => (
        <TabIcon
            focused = { focused }
            src = { IconEventNote } />
    )
};
