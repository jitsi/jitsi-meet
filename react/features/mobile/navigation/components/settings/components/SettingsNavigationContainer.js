import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import SettingsView
    from '../../../../../welcome/components/native/settings/components/SettingsView';
import { screen } from '../../../routes';
import {
    navigationContainerTheme,
    settingsScreenOptions
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
                        ...settingsScreenOptions,
                        headerShown: !onSettingsScreenFocused,
                        title: t('settings.title')
                    }} />
            </SettingsStack.Navigator>
        </NavigationContainer>
    );
};

export default SettingsNavigationContainer;
