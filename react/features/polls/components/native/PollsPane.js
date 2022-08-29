/* eslint-disable react-native/no-color-literals */
// @flow

import { useNavigation, useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants';
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
            disableForcedKeyboardDismiss = { !createMode }
            hasTabNavigator = { true }
            style = { chatStyles.pollPaneContainer }>
            {
                createMode
                    ? <PollCreate setCreateMode = { setCreateMode } />
                    : <PollsList />

            }
            {
                !createMode && <Button
                    accessibilityLabel = 'polls.create.create'
                    labelKey = 'polls.create.create'
                    onClick = { onCreate }
                    style = { chatStyles.createPollButton }
                    type = { BUTTON_TYPES.PRIMARY } />
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
