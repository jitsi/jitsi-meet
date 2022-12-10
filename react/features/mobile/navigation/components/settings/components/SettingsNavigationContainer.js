import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import HelpView from '../../../../../settings/components/native/HelpView';
import PrivacyView from '../../../../../settings/components/native/PrivacyView';
import SettingsView
    from '../../../../../settings/components/native/SettingsView';
import TermsView from '../../../../../settings/components/native/TermsView';
import { screen } from '../../../routes';
import {
    linkScreenOptions,
    navigationContainerTheme,
    settingsScreenOptions,
    welcomeScreenOptions
} from '../../../screenOptions';
import {
    settingsNavigationContainerRef
} from '../SettingsNavigationContainerRef';

const SettingsStack = createStackNavigator();


/**
 * The type of the React {@code Component} props of {@link SettingsNavigationContainer}.
 */
type Props = {

    /**
     * Is the navigator part of Welcome page?
     */
    isInWelcomePage: boolean
};


const SettingsNavigationContainer = ({ isInWelcomePage }: Props) => {
    const baseSettingsScreenOptions = isInWelcomePage ? welcomeScreenOptions : settingsScreenOptions;
    const { t } = useTranslation();

    const SettingsScreen = useCallback(() =>
        (
            <SettingsView
                addBottomInset = { !isInWelcomePage }
                scrollBounces = { isInWelcomePage } />
        )
    );

    return (
        <NavigationContainer
            independent = { true }
            ref = { settingsNavigationContainerRef }
            theme = { navigationContainerTheme }>
            <SettingsStack.Navigator
                initialRouteName = { screen.settings.main }>
                <SettingsStack.Screen
                    name = { screen.settings.main }
                    options = {{
                        ...baseSettingsScreenOptions,
                        title: t('settings.title')
                    }}>
                    { SettingsScreen }
                </SettingsStack.Screen>
                <SettingsStack.Screen
                    component = { HelpView }
                    name = { screen.settings.links.help }
                    options = {{
                        ...linkScreenOptions,
                        title: t('helpView.title')
                    }} />
                <SettingsStack.Screen
                    component = { TermsView }
                    name = { screen.settings.links.terms }
                    options = {{
                        ...linkScreenOptions,
                        title: t('termsView.title')
                    }} />
                <SettingsStack.Screen
                    component = { PrivacyView }
                    name = { screen.settings.links.privacy }
                    options = {{
                        ...linkScreenOptions,
                        title: t('privacyView.title')
                    }} />
            </SettingsStack.Navigator>
        </NavigationContainer>
    );
};

export default SettingsNavigationContainer;
