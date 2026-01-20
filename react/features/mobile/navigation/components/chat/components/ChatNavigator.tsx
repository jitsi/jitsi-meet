/* eslint-disable lines-around-comment */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    getClientHeight,
    getClientWidth
} from '../../../../../base/modal/components/functions.native';
import { setFocusedTab } from '../../../../../chat/actions.native';
import Chat from '../../../../../chat/components/native/Chat';
import ClosedCaptions from '../../../../../chat/components/native/ClosedCaptions';
import { ChatTabs } from '../../../../../chat/constants';
import { getFocusedTab, isChatDisabled } from '../../../../../chat/functions';
import { arePollsDisabled } from '../../../../../conference/functions.native';
import { resetUnreadPollsCount } from '../../../../../polls/actions';
import PollsPane from '../../../../../polls/components/native/PollsPane';
import { isCCTabEnabled } from '../../../../../subtitles/functions.any';
import { screen } from '../../../routes';
import { chatTabBarOptions } from '../../../screenOptions';

const ChatTab = createMaterialTopTabNavigator();

const ChatNavigator = () => {
    const dispatch = useDispatch();

    const clientHeight = useSelector(getClientHeight);
    const clientWidth = useSelector(getClientWidth);
    const currentFocusedTab = useSelector(getFocusedTab);
    const isPollsTabDisabled = useSelector(arePollsDisabled);
    const isChatTabDisabled = useSelector(isChatDisabled);
    const isCCTabDisabled = !useSelector(isCCTabEnabled);

    const initialRouteName
    = currentFocusedTab === ChatTabs.POLLS ? screen.conference.chatTabs.tab.polls
        : currentFocusedTab === ChatTabs.CLOSED_CAPTIONS ? screen.conference.chatTabs.tab.closedCaptions
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
            {
                !isChatTabDisabled
                && <ChatTab.Screen
                    component = { Chat }
                    listeners = {{
                        tabPress: () => {
                            dispatch(setFocusedTab(ChatTabs.CHAT));
                        }
                    }}
                    name = { screen.conference.chatTabs.tab.chat } />
            }
            {
                !isPollsTabDisabled
                && <ChatTab.Screen
                    component = { PollsPane }
                    listeners = {{
                        tabPress: () => {
                            dispatch(setFocusedTab(ChatTabs.POLLS));
                            dispatch(resetUnreadPollsCount);
                        }
                    }}
                    name = { screen.conference.chatTabs.tab.polls } />
            }
            {
                !isCCTabDisabled
                && <ChatTab.Screen
                    component = { ClosedCaptions }
                    listeners = {{
                        tabPress: () => {
                            dispatch(setFocusedTab(ChatTabs.CLOSED_CAPTIONS));
                        }
                    }}
                    name = { screen.conference.chatTabs.tab.closedCaptions } />
            }
        </ChatTab.Navigator>
    );
};

export default ChatNavigator;
