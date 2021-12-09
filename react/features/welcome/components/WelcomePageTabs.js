// @flow

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { CalendarList, isCalendarEnabled } from '../../calendar-sync';
import { screen } from '../../conference/components/native/routes';
import { RecentList } from '../../recent-list';
import {
    calendarListTabBarOptions,
    recentListTabBarOptions,
    tabBarOptions
} from '../constants';

const WelcomePage = createBottomTabNavigator();

/**
 * The type of the React {@code Component} props of {@link WelcomePageTabs}.
 */
type Props = {

    /**
     * Renders the lists disabled.
     */
    disabled: boolean
};

const WelcomePageTabs = ({ disabled }: Props) => {
    const RecentListScreen = useCallback(() =>
        <RecentList disabled = { disabled } />
    );

    const calendarEnabled = useSelector(isCalendarEnabled);

    const CalendarListScreen = useCallback(() =>
        <CalendarList disabled = { disabled } />
    );

    return (
        <WelcomePage.Navigator
            tabBarOptions = { tabBarOptions }>
            <WelcomePage.Screen
                name = { screen.welcome.tabs.recent }
                options = { recentListTabBarOptions }>
                { RecentListScreen }
            </WelcomePage.Screen>
            {
                calendarEnabled
            && <WelcomePage.Screen
                name = { screen.welcome.tabs.calendar }
                options = { calendarListTabBarOptions }>
                { CalendarListScreen }
            </WelcomePage.Screen>
            }
        </WelcomePage.Navigator>
    );
};

export default WelcomePageTabs;
