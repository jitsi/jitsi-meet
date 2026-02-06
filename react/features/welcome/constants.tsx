import React from 'react';

import { IconCalendar, IconGear, IconRestore } from '../base/icons/svg';
import BaseTheme from '../base/ui/components/BaseTheme';

import TabIcon from './components/TabIcon';

export const ACTIVE_TAB_COLOR = BaseTheme.palette.welcomeTabActive;
export const INACTIVE_TAB_COLOR = BaseTheme.palette.welcomeTabInactive;

export const tabBarOptions = {
    tabBarActiveTintColor: ACTIVE_TAB_COLOR,
    tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
    tabBarLabelStyle: {
        fontSize: 12,
    },
    tabBarStyle: {
        backgroundColor: BaseTheme.palette.welcomeCard
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
