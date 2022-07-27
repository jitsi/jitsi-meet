import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import HelpView from '../../../../../settings/components/native/HelpView';
import PrivacyView from '../../../../../settings/components/native/PrivacyView';
import TermsView from '../../../../../settings/components/native/TermsView';
import SettingsView
    from '../../../../../settings/components/native/SettingsView';
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
     * Callback to be invoked when settings screen is focused.
     */
    onSettingsScreenFocused: Function
};


const SettingsNavigationContainer = ({ onSettingsScreenFocused }: Props) => {
    const isInsideWelcomePage = Boolean(onSettingsScreenFocused);
    const baseSettingsScreenOptions = isInsideWelcomePage ? welcomeScreenOptions : settingsScreenOptions;
    const { t } = useTranslation();

    return (
        <NavigationContainer
            independent = { true }
            ref = { settingsNavigationContainerRef }
            theme = { navigationContainerTheme }>
            <SettingsStack.Navigator
                initialRouteName = { screen.settings.main }>
                <SettingsStack.Screen
                    component = { SettingsView }
                    name = { screen.settings.main }
                    options = {{
                        ...baseSettingsScreenOptions,
                        title: t('settings.title')
                    }} />
                <SettingsStack.Screen
                    component = { HelpView }
                    name = { screen.settings.links.help }
                    options = {{
                        ...linkScreenOptions,
                        title: t('helpView.header')
                    }} />
                <SettingsStack.Screen
                    component = { TermsView }
                    name = { screen.settings.links.terms }
                    options = {{
                        ...linkScreenOptions,
                        title: t('termsView.header')
                    }} />
                <SettingsStack.Screen
                    component = { PrivacyView }
                    name = { screen.settings.links.privacy }
                    options = {{
                        ...linkScreenOptions,
                        title: t('privacyView.header')
                    }} />
            </SettingsStack.Navigator>
        </NavigationContainer>
    );
};

export default SettingsNavigationContainer;
