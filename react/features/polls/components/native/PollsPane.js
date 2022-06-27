/* eslint-disable react-native/no-color-literals */
// @flow

import { useNavigation, useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Button, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { BUTTON_MODES } from '../../../chat/constants';
import { getUnreadPollCount } from '../../functions';
import AbstractPollsPane from '../AbstractPollsPane';
import type { AbstractProps } from '../AbstractPollsPane';

import PollCreate from './PollCreate';
import PollsList from './PollsList';
import { chatStyles } from './styles';


const PollsPane = (props: AbstractProps) => {
    const { createMode, onCreate, setCreateMode, t } = props;
    const isPollsScreenFocused = useIsFocused();
    const navigation = useNavigation();
    const nbUnreadPolls = useSelector(getUnreadPollCount);
    const { palette } = useTheme();

    const nrUnreadPolls = !isPollsScreenFocused && nbUnreadPolls > 0
        ? `(${nbUnreadPolls})`
        : '';

    useEffect(() => {
        navigation.setOptions({
            tabBarLabel: `${t('chat.tabs.polls')} ${nrUnreadPolls}`
        });
    }, [ nrUnreadPolls ]);

    return (
        <JitsiScreen
            contentContainerStyle = { chatStyles.pollPane }
            hasTabNavigator = { true }
            style = { chatStyles.pollPaneContainer }>
            {
                createMode
                    ? <PollCreate setCreateMode = { setCreateMode } />
                    : <PollsList />

            }
            {
                !createMode && <Button
                    color = { palette.action01 }
                    labelStyle = { chatStyles.pollButtonLabel }
                    mode = { BUTTON_MODES.CONTAINED }
                    onPress = { onCreate }
                    style = { chatStyles.createPollButton } >
                    {t('polls.create.create')}
                </Button>
            }
        </JitsiScreen>
    );
};


/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
