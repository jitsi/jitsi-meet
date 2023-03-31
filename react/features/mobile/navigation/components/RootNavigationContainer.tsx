/* eslint-disable lines-around-comment */

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
// @ts-ignore
import DialInSummary from '../../../invite/components/dial-in-summary/native/DialInSummary';
import Prejoin from '../../../prejoin/components/native/Prejoin';
// @ts-ignore
import WelcomePage from '../../../welcome/components/WelcomePage';
import { isWelcomePageEnabled } from '../../../welcome/functions';
// @ts-ignore
import { _ROOT_NAVIGATION_READY } from '../actionTypes';
// @ts-ignore
import { rootNavigationRef } from '../rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../routes';
// @ts-ignore
import {
    conferenceNavigationContainerScreenOptions,
    connectingScreenOptions,
    dialInSummaryScreenOptions,
    navigationContainerTheme,
    preJoinScreenOptions,
    welcomeScreenOptions
    // @ts-ignore
} from '../screenOptions';

import ConnectingPage from './ConnectingPage';
import ConferenceNavigationContainer
    from './conference/components/ConferenceNavigationContainer';

const RootStack = createStackNavigator();


interface IProps {

    /**
     * Redux dispatch function.
     */
    dispatch: Function;

    /**
    * Is welcome page available?
    */
    isWelcomePageAvailable: boolean;
}


const RootNavigationContainer = ({ dispatch, isWelcomePageAvailable }: IProps) => {
    const initialRouteName = isWelcomePageAvailable
        ? screen.welcome.main : screen.connecting;
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
            <StatusBar
                animated = { true }
                backgroundColor = 'transparent'
                barStyle = { 'light-content' }
                translucent = { true } />
            <RootStack.Navigator
                initialRouteName = { initialRouteName }>
                {
                    isWelcomePageAvailable
                        && <>
                            <RootStack.Screen
                                component = { WelcomePage }
                                name = { screen.welcome.main }
                                options = { welcomeScreenOptions } />
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
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    return {
        isWelcomePageAvailable: isWelcomePageEnabled(state)
    };
}

export default connect(mapStateToProps)(RootNavigationContainer);
