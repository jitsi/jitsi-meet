/* eslint-disable react-native/no-color-literals */

import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
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

    const activePollsNr = !isPollsScreenFocused && nbUnreadPolls > 0;

    let activePollsElement;

    const tabBarLabel = () => {
        if (activePollsNr) {
            activePollsElement = (
                <View style = { chatStyles.unreadPollsCounterCircle }>
                    <Text style = { chatStyles.unreadPollsCounter }>
                        { nbUnreadPolls }
                    </Text>
                </View>
            );
        } else {
            activePollsElement = null;
        }

        return (
            <View style = { chatStyles.unreadPollsCounterContainer }>
                <Text style = { chatStyles.unreadPollsCounterDescription }>
                    { t('chat.tabs.polls') }
                </Text>
                { activePollsElement }
            </View>
        );
    };

    useEffect(() => {
        navigation.setOptions({
            tabBarLabel
        });
    }, [ activePollsNr ]);

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
