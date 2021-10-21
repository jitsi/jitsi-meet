// @flow

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Chat, ChatAndPolls } from '../../../chat';
import { SharedDocument } from '../../../etherpad';
import AddPeopleDialog
    from '../../../invite/components/add-people-dialog/native/AddPeopleDialog';
import LobbyScreen from '../../../lobby/components/native/LobbyScreen';
import { ParticipantsPane } from '../../../participants-pane/components/native';
import { getDisablePolls } from '../../functions';

import Conference from './Conference';
import {
    conferenceNavigationRef
} from './ConferenceNavigationContainerRef';
import {
    chatScreenOptions,
    conferenceScreenOptions,
    inviteScreenOptions,
    lobbyScreenOptions,
    participantsScreenOptions,
    sharedDocumentScreenOptions
} from './ConferenceNavigatorScreenOptions';
import { screen } from './routes';

const ConferenceStack = createStackNavigator();

const ConferenceNavigationContainer = () => {
    const isPollsDisabled = useSelector(getDisablePolls);
    const ChatScreen
        = isPollsDisabled
            ? Chat
            : ChatAndPolls;
    const chatScreenName
        = isPollsDisabled
            ? screen.conference.chat
            : screen.conference.chatandpolls.main;

    return (
        <SafeAreaProvider>
            <NavigationContainer
                independent = { true }
                ref = { conferenceNavigationRef }
                theme = {{
                    colors: {
                        background: '#fff'
                    }
                }}>
                <ConferenceStack.Navigator
                    initialRouteName = { screen.conference.main }
                    mode = 'modal'>
                    <ConferenceStack.Screen
                        component = { Conference }
                        name = { screen.conference.main }
                        options = {{
                            ...conferenceScreenOptions
                        }} />
                    <ConferenceStack.Screen
                        /* eslint-disable-next-line react/jsx-no-bind */
                        component = { ChatScreen }
                        name = { chatScreenName }
                        options = {{
                            ...chatScreenOptions
                        }} />
                    <ConferenceStack.Screen
                        component = { ParticipantsPane }
                        name = { screen.conference.participants }
                        options = {{
                            ...participantsScreenOptions
                        }} />
                    <ConferenceStack.Screen
                        component = { LobbyScreen }
                        name = { screen.lobby }
                        options = {{
                            ...lobbyScreenOptions
                        }} />
                    <ConferenceStack.Screen
                        component = { AddPeopleDialog }
                        name = { screen.conference.invite }
                        options = {{
                            ...inviteScreenOptions
                        }} />
                    <ConferenceStack.Screen
                        component = { SharedDocument }
                        name = { screen.conference.sharedDocument }
                        options = {{
                            ...sharedDocumentScreenOptions
                        }} />
                </ConferenceStack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default ConferenceNavigationContainer;
