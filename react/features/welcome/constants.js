// @flow

import React from 'react';

import { IconEventNote, IconRestore } from '../base/icons';
import BaseTheme from '../base/ui/components/BaseTheme';

import TabIcon from './components/TabIcon';

export const INACTIVE_TAB_COLOR = BaseTheme.palette.tab01Disabled;

export const tabBarOptions = {
    tabBarActiveTintColor: BaseTheme.palette.icon01,
    tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
    tabBarLabelStyle: {
        fontSize: 12
    },
    tabBarStyle: {
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
