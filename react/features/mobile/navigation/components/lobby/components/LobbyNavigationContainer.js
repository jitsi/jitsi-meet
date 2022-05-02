import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { useSelector } from 'react-redux';

import { LobbyChatScreen, LobbyScreen } from '../../../../../lobby';
import { screen } from '../../../routes';
import {
    lobbyChatScreenOptions,
    lobbyScreenOptions,
    navigationContainerTheme
} from '../../../screenOptions';
import { lobbyNavigationContainerRef } from '../LobbyNavigationContainerRef';

const LobbyStack = createStackNavigator();


const LobbyNavigationContainer = () => {
    const { isLobbyChatActive }
        = useSelector(state => state['features/chat']);

    return (
        <NavigationContainer
            independent = { true }
            ref = { lobbyNavigationContainerRef }
            theme = { navigationContainerTheme }>
            <LobbyStack.Navigator
                screenOptions = {{
                    presentation: 'modal'
                }}>
                <LobbyStack.Screen
                    component = { LobbyScreen }
                    name = { screen.lobby.main }
                    options = { lobbyScreenOptions } />
                {
                    isLobbyChatActive
                    && <LobbyStack.Screen
                        component = { LobbyChatScreen }
                        name = { screen.lobby.chat }
                        options = { lobbyChatScreenOptions } />
                }
            </LobbyStack.Navigator>
        </NavigationContainer>
    );

};

export default LobbyNavigationContainer;
