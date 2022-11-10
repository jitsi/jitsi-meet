/* eslint-disable lines-around-comment */

import React from 'react';

import { IconCalendar, IconGear, IconRestore } from '../base/icons/svg';
import BaseTheme from '../base/ui/components/BaseTheme';

// @ts-ignore
import TabIcon from './components/TabIcon';

// @ts-ignore
export const ACTIVE_TAB_COLOR = BaseTheme.palette.icon01;
export const INACTIVE_TAB_COLOR = BaseTheme.palette.icon03;

export const tabBarOptions = {
    tabBarActiveTintColor: ACTIVE_TAB_COLOR,
    tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
    tabBarLabelStyle: {
        fontSize: 12
    },
    tabBarStyle: { // @ts-ignore
        backgroundColor: BaseTheme.palette.screen02Header
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
            src = { IconCalendar } />
    )
};

export const settingsTabBarOptions = {
    tabBarIcon: ({ focused }: { focused: boolean; }) => (
        <TabIcon
            focused = { focused }
            src = { IconGear } />
    )
};
