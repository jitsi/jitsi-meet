// @flow

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { connect } from '../../../base/redux';
import { DialInSummary } from '../../../invite';
import BlankPage from '../../../welcome/components/BlankPage';
import { rootNavigationRef } from '../rootNavigationContainerRef';
import { screen } from '../routes';
import {
    dialInSummaryScreenOptions,
    drawerNavigatorScreenOptions,
    navigationContainerTheme
} from '../screenOptions';

import ConferenceNavigationContainer
    from './conference/components/ConferenceNavigationContainer';
import WelcomePageNavigationContainer from './welcome/components/WelcomePageNavigationContainer';
import { isWelcomePageAppEnabled } from './welcome/functions';

const RootStack = createStackNavigator();


type Props = {

    /**
    * Is welcome page available?
    */
    isWelcomePageAvailable: boolean
}


const RootNavigationContainer = ({ isWelcomePageAvailable }: Props) => (
    <SafeAreaProvider>
        <NavigationContainer
            independent = { true }
            ref = { rootNavigationRef }
            theme = { navigationContainerTheme }>
            <RootStack.Navigator
                initialRouteName = { screen.root }>
                {
                    isWelcomePageAvailable
                        ? <RootStack.Screen
                            component = { WelcomePageNavigationContainer }
                            name = { screen.root }
                            options = { drawerNavigatorScreenOptions } />
                        : <RootStack.Screen
                            component = { BlankPage }
                            name = { screen.root } />
                }
                <RootStack.Screen
                    component = { DialInSummary }
                    name = { screen.dialInSummary }
                    options = { dialInSummaryScreenOptions } />
                <RootStack.Screen
                    component = { ConferenceNavigationContainer }
                    name = { screen.conference.root }
                    options = {{
                        gestureEnabled: false,
                        headerShown: false
                    }} />
            </RootStack.Navigator>
        </NavigationContainer>
    </SafeAreaProvider>
);

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state: Object) {
    return {
        isWelcomePageAvailable: isWelcomePageAppEnabled(state)
    };
}

export default connect(mapStateToProps)(RootNavigationContainer);

