// @flow

import React from 'react';
import { Text, View } from 'react-native';

import AbstractPollResultsMessage from '../AbstractPollResultsMessage';
import type { AbstractProps } from '../AbstractPollResultsMessage';

import { chatStyles } from './styles';

const PollResultsMessage = ({ children, detailsText, noticeText, showDetails }: AbstractProps) => (
    <View>
        { children }
        <View style = { chatStyles.messageFooter }>
            <Text>{ noticeText }</Text>
            <Text
                onPress = { showDetails }
                style = { chatStyles.showDetails }>
                { detailsText }
            </Text>
        </View>
    </View>
);

/*
 * We apply AbstractPollResultsMessage to fill in the AbstractProps common
 * to both the web and native implementations.
 */
// eslint-disable-next-line new-cap
export default AbstractPollResultsMessage(PollResultsMessage);
