/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../../../app/types';
import {
    getClientHeight,
    getClientWidth
} from '../../../../../base/modal/components/functions';
import { setFocusedTab } from '../../../../../chat/actions.any';
import Chat from '../../../../../chat/components/native/Chat';
import { ChatTabs } from '../../../../../chat/constants';
import { resetNbUnreadPollsMessages } from '../../../../../polls/actions';
import PollsPane from '../../../../../polls/components/native/PollsPane';
import { screen } from '../../../routes';
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();

const ChatAndPolls = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);
    const dispatch = useDispatch();
    const { focusedTab } = useSelector((state: IReduxState) => state['features/chat']);
    const initialRouteName = focusedTab === ChatTabs.POLLS
        ? screen.conference.chatandpolls.tab.polls
        : screen.conference.chatandpolls.tab.chat;

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
                name = { screen.conference.chatandpolls.tab.chat } />
            <ChatTab.Screen
                component = { PollsPane }
                listeners = {{
                    tabPress: () => {
                        dispatch(setFocusedTab(ChatTabs.POLLS));
                        dispatch(resetNbUnreadPollsMessages);
                    }
                }}
                name = { screen.conference.chatandpolls.tab.polls } />
        </ChatTab.Navigator>
    );
};

export default ChatAndPolls;
