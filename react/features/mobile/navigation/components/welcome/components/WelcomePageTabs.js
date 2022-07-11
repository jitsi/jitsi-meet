// @flow

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { CalendarList, isCalendarEnabled } from '../../../../../calendar-sync';
import { RecentList } from '../../../../../recent-list';
import {
    calendarListTabBarOptions,
    recentListTabBarOptions, settingsTabBarOptions,
    tabBarOptions
} from '../../../../../welcome/constants';
import { screen } from '../../../routes';
import SettingsView
    from '../../../../../welcome/components/native/settings/components/SettingsView';
import { useNavigationState } from '@react-navigation/native';

const WelcomePage = createBottomTabNavigator();

/**
 * The type of the React {@code Component} props of {@link WelcomePageTabs}.
 */
type Props = {

    /**
     * Renders the lists disabled.
     */
    disabled: boolean,

    /**
     * Callback to be invoked when pressing the list container.
     */
    onListContainerPress?: Function,

    /**
     * Displays room name input.
     */
    showRoomNameInput: boolean
};

const WelcomePageTabs = ({ disabled, onListContainerPress }: Props) => {
    const RecentListScreen = useCallback(() =>
        (
            <RecentList
                disabled = { disabled }
                onListContainerPress = { onListContainerPress } />
        )
    );

    const calendarEnabled = useSelector(isCalendarEnabled);

    const CalendarListScreen = useCallback(() =>
        (
            <CalendarList
                disabled = { disabled } />
        )
    );

    const SettingsViewScreen = useCallback(() =>
        (
            <SettingsView/>
        )
    );



    return (
        <WelcomePage.Navigator
            screenOptions = {{
                headerShown: false,
                ...tabBarOptions
            }}>
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
            <WelcomePage.Screen
                name = { screen.welcome.settings }
                options = { settingsTabBarOptions}>
                { SettingsViewScreen }
            </WelcomePage.Screen>
        </WelcomePage.Navigator>
    );
};

export default WelcomePageTabs;
