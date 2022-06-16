import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DialInSummary } from '../../../invite';
import { screen } from '../routes';
import {
    dialInSummaryScreenOptions,
    drawerNavigatorScreenOptions,
    navigationContainerTheme
} from '../screenOptions';

import WelcomePageNavigationContainer
    from './welcome/components/WelcomePageNavigationContainer';

const SDKStack = createNativeStackNavigator();


const SDKNavigationContainer = () => (
    <NavigationContainer
        independent = { true }
        theme = { navigationContainerTheme }>
        <SDKStack.Navigator>
            <SDKStack.Screen
                component = { WelcomePageNavigationContainer }
                name = { screen.root }
                options = { drawerNavigatorScreenOptions } />
            <SDKStack.Screen
                component = { DialInSummary }
                name = { screen.dialInSummary }
                options = { dialInSummaryScreenOptions } />
        </SDKStack.Navigator>
    </NavigationContainer>
);

export default SDKNavigationContainer;
