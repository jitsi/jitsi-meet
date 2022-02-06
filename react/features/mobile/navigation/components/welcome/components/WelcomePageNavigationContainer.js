// @flow

import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { useTranslation } from 'react-i18next';

import WelcomePage from '../../../../../welcome/components/WelcomePage';
import HelpView from '../../../../../welcome/components/native/HelpView';
import PrivacyView from '../../../../../welcome/components/native/PrivacyView';
import TermsView from '../../../../../welcome/components/native/TermsView';
import SettingsView
    from '../../../../../welcome/components/native/settings/components/SettingsView';
import { screen } from '../../../routes';
import {
    drawerContentOptions,
    helpScreenOptions,
    settingsScreenOptions,
    termsAndPrivacyScreenOptions,
    welcomeScreenOptions
} from '../../../screenOptions';

import CustomDrawerContent from './CustomDrawerContent';


const DrawerStack = createDrawerNavigator();


const WelcomePageNavigationContainer = () => {
    const { t } = useTranslation();

    return (
        <DrawerStack.Navigator
            /* eslint-disable-next-line react/jsx-no-bind */
            drawerContent = { props => <CustomDrawerContent { ...props } /> }
            screenOptions = { drawerContentOptions }>
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

