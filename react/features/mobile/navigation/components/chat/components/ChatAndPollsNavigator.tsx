/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// @ts-ignore
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    getClientHeight,
    getClientWidth
    // @ts-ignore
} from '../../../../../base/modal/components/functions';
// @ts-ignore
import { Chat } from '../../../../../chat';
import { setIsPollsTabFocused } from '../../../../../chat/actions.native';
import { resetNbUnreadPollsMessages } from '../../../../../polls/actions';
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
    const dispatch = useDispatch();

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
