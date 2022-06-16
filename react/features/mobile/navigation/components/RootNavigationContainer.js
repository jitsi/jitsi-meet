import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';

import { connect } from '../../../base/redux';
import { DialInSummary } from '../../../invite';
import Prejoin from '../../../prejoin/components/Prejoin.native';
import { isWelcomePageEnabled } from '../../../welcome/functions';
import { _ROOT_NAVIGATION_READY } from '../actionTypes';
import { rootNavigationRef } from '../rootNavigationContainerRef';
import { screen } from '../routes';
import {
    conferenceNavigationContainerScreenOptions,
    connectingScreenOptions,
    dialInSummaryScreenOptions,
    drawerNavigatorScreenOptions,
    navigationContainerTheme,
    preJoinScreenOptions
} from '../screenOptions';

import ConnectingPage from './ConnectingPage';
import ConferenceNavigationContainer
    from './conference/components/ConferenceNavigationContainer';
import WelcomePageNavigationContainer
    from './welcome/components/WelcomePageNavigationContainer';

const RootStack = createNativeStackNavigator();


type Props = {

    /**
     * Redux dispatch function.
     */
    dispatch: Function,

    /**
    * Is welcome page available?
    */
    isWelcomePageAvailable: boolean
}


const RootNavigationContainer = ({ dispatch, isWelcomePageAvailable }: Props) => {
    const initialRouteName = isWelcomePageAvailable
        ? screen.root : screen.connecting;
    const onReady = useCallback(() => {
        dispatch({
            type: _ROOT_NAVIGATION_READY,
            ready: true
        });
    }, [ dispatch ]);

    return (
        <NavigationContainer
            independent = { true }
            onReady = { onReady }
            ref = { rootNavigationRef }
            theme = { navigationContainerTheme }>
            <RootStack.Navigator
                initialRouteName = { initialRouteName }>
                {
                    isWelcomePageAvailable
                        && <>
                            <RootStack.Screen
                                component = { WelcomePageNavigationContainer }
                                name = { screen.root }
                                options = { drawerNavigatorScreenOptions } />
                            <RootStack.Screen
                                component = { DialInSummary }
                                name = { screen.dialInSummary }
                                options = { dialInSummaryScreenOptions } />
                        </>
                }
                <RootStack.Screen
                    component = { ConnectingPage }
                    name = { screen.connecting }
                    options = { connectingScreenOptions } />
                <RootStack.Screen
                    component = { Prejoin }
                    name = { screen.preJoin }
                    options = { preJoinScreenOptions } />
                <RootStack.Screen
                    component = { ConferenceNavigationContainer }
                    name = { screen.conference.root }
                    options = { conferenceNavigationContainerScreenOptions } />
            </RootStack.Navigator>
        </NavigationContainer>
    );
};

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state: Object) {
    return {
        isWelcomePageAvailable: isWelcomePageEnabled(state)
    };
}

export default connect(mapStateToProps)(RootNavigationContainer);
