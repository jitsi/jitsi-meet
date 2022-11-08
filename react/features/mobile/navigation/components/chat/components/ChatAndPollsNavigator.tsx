/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useSelector } from 'react-redux';

import {
    getClientHeight,
    getClientWidth
    // @ts-ignore
} from '../../../../../base/modal/components/functions';
// @ts-ignore
import { Chat } from '../../../../../chat';
// @ts-ignore
import { PollsPane } from '../../../../../polls/components';
// @ts-ignore
import { screen } from '../../../routes';
// @ts-ignore
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();

const ChatAndPolls = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);

    return (
        // @ts-ignore
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
