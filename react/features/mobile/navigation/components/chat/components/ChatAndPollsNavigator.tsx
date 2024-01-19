/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../../../app/types';
import {
    getClientHeight,
    getClientWidth
} from '../../../../../base/modal/components/functions';
import { setIsPollsTabFocused } from '../../../../../chat/actions.native';
// @ts-ignore
import Chat from '../../../../../chat/components/native/Chat';
import { resetNbUnreadPollsMessages } from '../../../../../polls/actions';
import PollsPane from '../../../../../polls/components/native/PollsPane';
import { screen } from '../../../routes';
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();

const ChatAndPolls = () => {
    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);
    const dispatch = useDispatch();
    const { isPollsTabFocused } = useSelector((state: IReduxState) => state['features/chat']);
    const initialRouteName = isPollsTabFocused
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
                        dispatch(setIsPollsTabFocused(false));
                    }
                }}
                name = { screen.conference.chatandpolls.tab.chat } />
            <ChatTab.Screen
                component = { PollsPane }
                listeners = {{
                    tabPress: () => {
                        dispatch(setIsPollsTabFocused(true));
                        dispatch(resetNbUnreadPollsMessages);
                    }
                }}
                name = { screen.conference.chatandpolls.tab.polls } />
        </ChatTab.Navigator>
    );
};

export default ChatAndPolls;
