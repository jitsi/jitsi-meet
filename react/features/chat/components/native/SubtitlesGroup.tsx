import React from 'react';
import { View, ViewStyle } from 'react-native';

import Avatar from '../../../base/avatar/components/Avatar';
import { ISubtitle } from '../../../subtitles/types';

import SubtitleMessage from './SubtitleMessage';
import { closedCaptionsStyles } from './styles';


interface IProps {
    messages: ISubtitle[];
    senderId: string;
}

export function SubtitlesGroup({ messages, senderId }: IProps) {
    if (!messages.length) {
        return null;
    }

    return (
        <View style = { closedCaptionsStyles.subtitlesGroupContainer as ViewStyle }>
            <View style = { closedCaptionsStyles.subtitlesGroupAvatar as ViewStyle }>
                <Avatar
                    participantId = { senderId }
                    size = { 32 } />
            </View>
            <View style = { closedCaptionsStyles.subtitlesGroupMessagesContainer as ViewStyle }>
                {
                    messages.map((message, index) => (
                        <SubtitleMessage
                            key = { `${message.timestamp}-${message.id}` }
                            showDisplayName = { index === 0 }
                            { ...message } />
                    ))
                }
            </View>
        </View>
    );
}
