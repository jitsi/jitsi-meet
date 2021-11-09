// @flow

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import {
    dialInSummaryScreenOptions,
    drawerNavigatorScreenOptions,
    navigationContainerTheme
}
    from '../../conference/components/native/ConferenceNavigatorScreenOptions';
import { screen } from '../../conference/components/native/routes';
import { DialInSummary } from '../../invite';
import { isWelcomePageAppEnabled } from '../functions';

import BlankPage from './BlankPage';
import { rootNavigationRef } from './RootNavigationContainerRef';

import { WelcomePageNavigationContainer } from './';

const RootStack = createStackNavigator();


const RootNavigationContainer = () => {
    const isWelcomePageAvailable = useSelector(isWelcomePageAppEnabled);

    return (
        <SafeAreaProvider>
            <NavigationContainer
                independent = { true }
                ref = { rootNavigationRef }
                theme = { navigationContainerTheme }>
                <RootStack.Navigator
                    initialRouteName = { screen.welcome.main }>
                    {
                        isWelcomePageAvailable
                            ? <RootStack.Screen
                                component = { WelcomePageNavigationContainer }
                                name = { screen.welcome.main }
                                options = { drawerNavigatorScreenOptions } />
                            : <RootStack.Screen
                                component = { BlankPage }
                                name = { screen.blank } />
                    }
                    <RootStack.Screen
                        component = { DialInSummary }
                        name = { screen.dialInSummary }
                        options = { dialInSummaryScreenOptions } />
                </RootStack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default RootNavigationContainer;

