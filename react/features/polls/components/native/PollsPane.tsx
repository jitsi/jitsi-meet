/* eslint-disable react-native/no-color-literals */

import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.any';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { TabBarLabelCounter }
    from '../../../mobile/navigation/components/TabBarLabelCounter';
import AbstractPollsPane from '../AbstractPollsPane';
import type { AbstractProps } from '../AbstractPollsPane';

import PollCreate from './PollCreate';
import PollsList from './PollsList';
import { pollsStyles } from './styles';

const PollsPane = (props: AbstractProps) => {
    const { createMode, isCreatePollsDisabled, onCreate, setCreateMode, t } = props;
    const navigation = useNavigation();
    const { isPollsTabFocused } = useSelector((state: IReduxState) => state['features/chat']);
    const { nbUnreadPolls } = useSelector((state: IReduxState) => state['features/polls']);

    useEffect(() => {
        const activeUnreadPollsNr = !isPollsTabFocused && nbUnreadPolls > 0;

        navigation.setOptions({
            // eslint-disable-next-line react/no-multi-comp
            tabBarLabel: () => (
                <TabBarLabelCounter
                    activeUnreadNr = { activeUnreadPollsNr }
                    isFocused = { isPollsTabFocused }
                    label = { t('chat.tabs.polls') }
                    nbUnread = { nbUnreadPolls } />
            )
        });

    }, [ isPollsTabFocused, nbUnreadPolls ]);

    const createPollButtonStyles = Platform.OS === 'android'
        ? pollsStyles.createPollButtonAndroid : pollsStyles.createPollButtonIos;

    return (
        <JitsiScreen
            contentContainerStyle = { pollsStyles.pollPane as StyleType }
            disableForcedKeyboardDismiss = { true }
            hasExtraHeaderHeight = { true }
            style = { pollsStyles.pollPaneContainer as StyleType }>
            {
                createMode
                    ? <PollCreate setCreateMode = { setCreateMode } />
                    : <>
                        <PollsList setCreateMode = { setCreateMode } />
                        <Button
                            accessibilityLabel = 'polls.create.create'
                            disabled = { isCreatePollsDisabled }
                            id = { t('polls.create.create') }
                            labelKey = 'polls.create.create'
                            onClick = { onCreate }
                            style = { createPollButtonStyles }
                            type = { BUTTON_TYPES.PRIMARY } />
                    </>
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
