// @flow

import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    helpScreenOptions,
    settingsScreenOptions,
    termsAndPrivacyScreenOptions,
    welcomeScreenOptions
} from '../../conference/components/native/ConferenceNavigatorScreenOptions';
import { screen } from '../../conference/components/native/routes';
import HelpView from '../components/help/components/HelpView';
import PrivacyView from '../components/privacy/components/PrivacyView';
import SettingsView from '../components/settings/components/SettingsView';
import TermsView from '../components/terms/components/TermsView';

import CustomDrawerContent from './CustomDrawerContent';
import WelcomePage from './WelcomePage.native';
import { drawerContentOptions } from './constants';
import styles from './styles';

const DrawerStack = createDrawerNavigator();


const WelcomePageNavigationContainer = () => {
    const { t } = useTranslation();

    return (
        <DrawerStack.Navigator
            /* eslint-disable-next-line react/jsx-no-bind */
            drawerContent = { props => <CustomDrawerContent { ...props } /> }
            drawerContentOptions = { drawerContentOptions }
            drawerStyle = { styles.drawerStyle }>
            <DrawerStack.Screen
                component = { WelcomePage }
                name = { screen.welcome.main }
                options = { welcomeScreenOptions } />
            <DrawerStack.Screen
                component = { SettingsView }
                name = { screen.welcome.settings }
                options = {{
                    ...settingsScreenOptions,
                    title: t('settingsView.header')
                }} />
            <DrawerStack.Screen
                component = { TermsView }
                name = { screen.welcome.terms }
                options = {{
                    ...termsAndPrivacyScreenOptions,
                    title: t('termsView.header')
                }} />
            <DrawerStack.Screen
                component = { PrivacyView }
                name = { screen.welcome.privacy }
                options = {{
                    ...termsAndPrivacyScreenOptions,
                    title: t('privacyView.header')
                }} />
            <DrawerStack.Screen
                component = { HelpView }
                name = { screen.welcome.help }
                options = {{
                    ...helpScreenOptions,
                    title: t('helpView.header')
                }} />
        </DrawerStack.Navigator>
    );
};

export default WelcomePageNavigationContainer;

