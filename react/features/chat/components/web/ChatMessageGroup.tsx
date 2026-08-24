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
            listStyleType: 'none',
            margin: 0,
            maxWidth: '100%',
            padding: 0,

            '&.remote, &.file': {
                maxWidth: 'calc(100% - 40px)' // 100% - avatar and margin
            }
        },

        groupContainer: {
            display: 'flex',
            listStyleType: 'none',
            margin: 0,
            padding: 0,

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
        <li className = { clsx(classes.groupContainer, className) }>
            <Avatar
                className = { clsx(classes.avatar, 'avatar') }
                participantId = { messages[0].participantId }
                size = { 32 } />
            <ul className = { `${classes.messageGroup} chat-message-group ${className}` }>
                {messages.map((message, i) => (
                    <ChatMessage
                        className = { className }
                        key = { i }
                        message = { message }
                        showDisplayName = { i === 0 }
                        showTimestamp = { i === messages.length - 1 } />
                ))}
            </ul>
        </li>
    );
};

export default ChatMessageGroup;
