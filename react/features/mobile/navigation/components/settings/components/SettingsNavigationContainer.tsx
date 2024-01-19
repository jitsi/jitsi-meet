import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import LanguageSelectView from '../../../../../settings/components/native/LanguageSelectView';
import ProfileView from '../../../../../settings/components/native/ProfileView';
import SettingsView
    from '../../../../../settings/components/native/SettingsView';
import { screen } from '../../../routes';
import {
    languageSelectScreenOptions,
    navigationContainerTheme,
    profileSettingsScreenOptions,
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
interface IProps {

    /**
     * Is the navigator part of Welcome page?
     */
    isInWelcomePage?: boolean | undefined;
}


const SettingsNavigationContainer = ({ isInWelcomePage }: IProps) => {
    const baseSettingsScreenOptions = isInWelcomePage ? welcomeScreenOptions : settingsScreenOptions;
    const { t } = useTranslation();

    const SettingsScreen = useCallback(() =>
        (
            <SettingsView
                isInWelcomePage = { isInWelcomePage } />
        ), []);

    const ProfileScreen = useCallback(() =>
        (<ProfileView
            isInWelcomePage = { isInWelcomePage } />)
    , []);

    const LanguageSelectScreen = useCallback(() =>
        (<LanguageSelectView
            isInWelcomePage = { isInWelcomePage } />)
    , []);

    return (
        <NavigationContainer
            independent = { true }
            ref = { settingsNavigationContainerRef }
            theme = { navigationContainerTheme as Theme }>
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
                    component = { ProfileScreen }
                    name = { screen.settings.profile }
                    options = {{
                        ...profileSettingsScreenOptions,
                        title: t('settingsView.profileSection')
                    }} />
                <SettingsStack.Screen
                    component = { LanguageSelectScreen }
                    name = { screen.settings.language }
                    options = {{
                        ...languageSelectScreenOptions,
                        title: t('settings.language')
                    }} />
            </SettingsStack.Navigator>
        </NavigationContainer>
    );
};

export default SettingsNavigationContainer;
