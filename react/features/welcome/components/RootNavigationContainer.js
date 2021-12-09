// @flow

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { connect } from '../../base/redux';
import {
    dialInSummaryScreenOptions,
    drawerNavigatorScreenOptions,
    navigationContainerTheme
} from '../../conference/components/native/ConferenceNavigatorScreenOptions';
import { screen } from '../../conference/components/native/routes';
import { DialInSummary } from '../../invite';
import { isWelcomePageAppEnabled } from '../functions.native';

import BlankPage from './BlankPage';
import { rootNavigationRef } from './RootNavigationContainerRef';
import WelcomePageNavigationContainer from './WelcomePageNavigationContainer';

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
                initialRouteName = { screen.welcome.main }>
                {
                    isWelcomePageAvailable
                        ? <RootStack.Screen
                            component = { WelcomePageNavigationContainer }
                            name = { screen.welcome.main }
                            options = { drawerNavigatorScreenOptions } />
                        : <RootStack.Screen
                            component = { BlankPage }
                            name = { screen.welcome.main } />
                }
                <RootStack.Screen
                    component = { DialInSummary }
                    name = { screen.dialInSummary }
                    options = { dialInSummaryScreenOptions } />
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

