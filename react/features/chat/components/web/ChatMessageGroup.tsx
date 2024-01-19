import clsx from 'clsx';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Avatar from '../../../base/avatar/components/Avatar';
import { IMessage } from '../../types';

import ChatMessage from './ChatMessage';

interface IProps {

    /**
     * Additional CSS classes to apply to the root element.
     */
    className: string;

    /**
     * The messages to display as a group.
     */
    messages: Array<IMessage>;
}

const useStyles = makeStyles()(theme => {
    return {
        messageGroup: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',

            '&.remote': {
                maxWidth: 'calc(100% - 40px)' // 100% - avatar and margin
            }
        },

        groupContainer: {
            display: 'flex',

            '&.local': {
                justifyContent: 'flex-end',

                '& .avatar': {
                    display: 'none'
                }
            }
        },

        avatar: {
            margin: `${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(3)} 0`,
            position: 'sticky',
            flexShrink: 0,
            top: 0
        }
    };
});


const ChatMessageGroup = ({ className = '', messages }: IProps) => {
    const { classes } = useStyles();
    const messagesLength = messages.length;

    if (!messagesLength) {
        return null;
    }

    return (
        <div className = { clsx(classes.groupContainer, className) }>
            <Avatar
                className = { clsx(classes.avatar, 'avatar') }
                participantId = { messages[0].id }
                size = { 32 } />
            <div className = { `${classes.messageGroup} chat-message-group ${className}` }>
                {messages.map((message, i) => (
                    <ChatMessage
                        key = { i }
                        message = { message }
                        showDisplayName = { i === 0 }
                        showTimestamp = { i === messages.length - 1 }
                        type = { className } />
                ))}
            </div>
        </div>
    );
};

export default ChatMessageGroup;
