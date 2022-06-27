// @flow

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useSelector } from 'react-redux';

import { Chat } from '../..';
import {
    getClientHeight,
    getClientWidth
} from '../../../base/modal/components/functions.native';
import { screen } from '../../../mobile/navigation/routes';
import { chatTabBarOptions } from '../../../mobile/navigation/screenOptions';
import { PollsPane } from '../../../polls/components';

const ChatTab = createMaterialTopTabNavigator();

const ChatAndPolls = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);

    return (
        <ChatTab.Navigator
            backBehavior = 'none'
            initialLayout = {{
                height: clientHeight,
                width: clientWidth
            }}
            screenOptions = { chatTabBarOptions }>
            <ChatTab.Screen
                component = { Chat }
                name = { screen.conference.chatandpolls.tab.chat } />
            <ChatTab.Screen
                component = { PollsPane }
                name = { screen.conference.chatandpolls.tab.polls } />
        </ChatTab.Navigator>
    );
};

export default ChatAndPolls;
