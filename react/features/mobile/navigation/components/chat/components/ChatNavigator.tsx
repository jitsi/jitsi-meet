/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    getClientHeight,
    getClientWidth
} from '../../../../../base/modal/components/functions.native';
import { setFocusedTab } from '../../../../../chat/actions.any';
import Chat from '../../../../../chat/components/native/Chat';
import { ChatTabs } from '../../../../../chat/constants';
import { getFocusedTab } from '../../../../../chat/functions';
import { resetUnreadPollsCount } from '../../../../../polls/actions';
import PollsPane from '../../../../../polls/components/native/PollsPane';
import { screen } from '../../../routes';
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();

const ChatNavigator = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);
    const dispatch = useDispatch();
    const currentFocusedTab = useSelector(getFocusedTab);
    const initialRouteName = currentFocusedTab === ChatTabs.POLLS
        ? screen.conference.chatTabs.tab.polls
        : screen.conference.chatTabs.tab.chat;

    return (
        // @ts-ignore
        <ChatTab.Navigator
            backBehavior = 'none'
            initialLayout = {{
                height: clientHeight,
                width: clientWidth
            }}
            initialRouteName = { initialRouteName }
            screenOptions = { chatTabBarOptions }>
            <ChatTab.Screen
                component = { Chat }
                listeners = {{
                    tabPress: () => {
                        dispatch(setFocusedTab(ChatTabs.CHAT));
                    }
                }}
                name = { screen.conference.chatTabs.tab.chat } />
            <ChatTab.Screen
                component = { PollsPane }
                listeners = {{
                    tabPress: () => {
                        dispatch(setFocusedTab(ChatTabs.POLLS));
                        dispatch(resetUnreadPollsCount);
                    }
                }}
                name = { screen.conference.chatTabs.tab.polls } />
        </ChatTab.Navigator>
    );
};

export default ChatNavigator;
