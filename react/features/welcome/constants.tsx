/* eslint-disable lines-around-comment */
import React from 'react';

import { IconEventNote, IconRestore, IconSettings } from '../base/icons/svg';
// @ts-ignore
import BaseTheme from '../base/ui/components/BaseTheme';

// @ts-ignore
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
    tabBarIcon: ({ focused }: { focused: boolean; }) => (
        <TabIcon
            focused = { focused }
            src = { IconRestore } />
    )
};

export const calendarListTabBarOptions = {
    tabBarIcon: ({ focused }: { focused: boolean; }) => (
        <TabIcon
            focused = { focused }
            src = { IconEventNote } />
    )
};

export const settingsTabBarOptions = {
    tabBarIcon: ({ focused }: { focused: boolean; }) => (
        <TabIcon
            focused = { focused }
            src = { IconSettings } />
    )
};
