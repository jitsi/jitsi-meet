import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View, ViewStyle } from 'react-native';

import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown } from '../../../base/icons/svg';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { ISubtitle } from '../../../subtitles/types';

import { SubtitlesGroup } from './SubtitlesGroup';
import { closedCaptionsStyles } from './styles';

/**
 * The threshold value used to determine if the user is at the bottom of the scroll view.
 */
const SCROLL_THRESHOLD = 50;

interface IProps {
    groups: Array<{
        messages: ISubtitle[];
        senderId: string;
    }>;
    messages: ISubtitle[];
}

export function SubtitlesMessagesContainer({ messages, groups }: IProps) {
    const [ hasNewMessages, setHasNewMessages ] = useState(false);
    const [ isScrolledToBottom, setIsScrolledToBottom ] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);
    const previousMessages = useRef(messages);

    const scrollToBottom = useCallback((withAnimation: boolean) => {
        scrollViewRef.current?.scrollToEnd({ animated: withAnimation });
    }, []);

    const handleNewMessagesClick = useCallback(() => {
        scrollToBottom(true);
    }, [ scrollToBottom ]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - SCROLL_THRESHOLD;

        setIsScrolledToBottom(isAtBottom);
        if (isAtBottom) {
            setHasNewMessages(false);
        }
    }, []);

    useEffect(() => {
        scrollToBottom(false);
    }, [ scrollToBottom ]);

    useEffect(() => {
        const newMessages = messages.filter(message => !previousMessages.current.includes(message));

        if (newMessages.length > 0) {
            if (isScrolledToBottom) {
                scrollToBottom(false);
            } else {
                setHasNewMessages(true);
            }
        }

        previousMessages.current = messages;
    }, [ messages, scrollToBottom ]);

    return (
        <View style = { closedCaptionsStyles.subtitlesMessagesContainer as ViewStyle }>
            <ScrollView
                contentContainerStyle = { closedCaptionsStyles.subtitlesMessagesList as ViewStyle }
                onScroll = { handleScroll }
                ref = { scrollViewRef }
                scrollEventThrottle = { 16 }>
                {
                    groups.map(group => (
                        <SubtitlesGroup
                            key = { `${group.senderId}-${group.messages[0]?.timestamp}` }
                            messages = { group.messages }
                            senderId = { group.senderId } />
                    ))
                }
            </ScrollView>
            {
                !isScrolledToBottom && hasNewMessages && (
                    <View style = { closedCaptionsStyles.newMessagesButtonContainer as ViewStyle }>
                        <Button
                            accessibilityLabel = 'chat.newMessages'
                            // eslint-disable-next-line react/jsx-no-bind
                            icon = { () => (
                                <Icon
                                    color = { BaseTheme.palette.icon04 }
                                    size = { 20 }
                                    src = { IconArrowDown } />
                            ) }
                            labelKey = 'chat.newMessages'
                            onClick = { handleNewMessagesClick }
                            type = { BUTTON_TYPES.SECONDARY } />
                    </View>
                )
            }
        </View>
    );
}
