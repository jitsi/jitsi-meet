/* eslint-disable react-native/no-color-literals */
// @flow

import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

import { BUTTON_MODES } from '../../../chat/constants';
import AbstractPollsPane from '../AbstractPollsPane';
import type { AbstractProps } from '../AbstractPollsPane';

import PollCreate from './PollCreate';
import PollsList from './PollsList';
import { chatStyles } from './styles';

const PollsPane = (props: AbstractProps) => {

    const { createMode, onCreate, setCreateMode, t } = props;

    return (
        <View style = { chatStyles.PollPane }>
            { createMode
                ? <PollCreate setCreateMode = { setCreateMode } />
                : <View style = { chatStyles.PollPaneContent }>
                    {/* <View /> */}
                    <PollsList />
                    <Button
                        color = '#17a0db'
                        mode = { BUTTON_MODES.CONTAINED }
                        onPress = { onCreate }
                        style = { chatStyles.createPollButton } >
                        {t('polls.create.create')}
                    </Button>
                </View>}
        </View>
    );
};


/*
 * We apply AbstractPollsPane to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollsPane(PollsPane);
