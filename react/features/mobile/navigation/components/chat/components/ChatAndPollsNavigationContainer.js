// @flow

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useSelector } from 'react-redux';

import {
    getClientHeight,
    getClientWidth
} from '../../../../../base/modal/components/functions.native';
import { Chat } from '../../../../../chat';
import { PollsPane } from '../../../../../polls/components';
import { screen } from '../../../routes';
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();


const ChatAndPollsNavigationContainer = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);

    return (
        <ChatTab.Navigator
            backBehavior = 'none'
            initialLayout = {{
                height: clientHeight,
                width: clientWidth
            }}
            screenOptions = {{
                ...chatTabBarOptions
            }}>
            <ChatTab.Screen
                component = { Chat }
                name = { screen.conference.chatandpolls.tab.chat } />
            <ChatTab.Screen
                component = { PollsPane }
                name = { screen.conference.chatandpolls.tab.polls } />
        </ChatTab.Navigator>
    );
};

export default ChatAndPollsNavigationContainer;
