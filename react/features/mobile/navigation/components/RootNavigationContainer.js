import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { connect } from '../../../base/redux';
import { DialInSummary } from '../../../invite';
import Prejoin from '../../../prejoin/components/Prejoin.native';
import WelcomePage from '../../../welcome/components/WelcomePage';
import HelpView from '../../../welcome/components/native/HelpView';
import PrivacyView from '../../../welcome/components/native/PrivacyView';
import TermsView from '../../../welcome/components/native/TermsView';
import { isWelcomePageEnabled } from '../../../welcome/functions';
import { _ROOT_NAVIGATION_READY } from '../actionTypes';
import { rootNavigationRef } from '../rootNavigationContainerRef';
import { screen } from '../routes';
import {
    conferenceNavigationContainerScreenOptions,
    connectingScreenOptions,
    dialInSummaryScreenOptions,
    linksScreenOptions,
    navigationContainerTheme,
    preJoinScreenOptions,
    welcomeScreenOptions
} from '../screenOptions';

import ConnectingPage from './ConnectingPage';
import ConferenceNavigationContainer
    from './conference/components/ConferenceNavigationContainer';

const RootStack = createStackNavigator();


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
    const { t } = useTranslation();
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
                    component = { HelpView }
                    name = { screen.welcome.help }
                    options = {{
                        ...linksScreenOptions,
                        title: t('helpView.header')
                    }} />
                <RootStack.Screen
                    component = { TermsView }
                    name = { screen.welcome.terms }
                    options = {{
                        ...linksScreenOptions,
                        title: t('termsView.header')
                    }} />
                <RootStack.Screen
                    component = { PrivacyView }
                    name = { screen.welcome.privacy }
                    options = {{
                        ...linksScreenOptions,
                        title: t('privacyView.header')
                    }} />
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
